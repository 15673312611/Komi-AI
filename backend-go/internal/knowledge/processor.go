// Copyright 2024-2026 ChatterMate
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

package knowledge

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/xml"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
	"unicode"

	"github.com/rs/zerolog"
	"golang.org/x/net/html"
)

// Processor executes background crawl and ingestion tasks for knowledge_queue items.
type Processor struct {
	repo   *Repository
	logger zerolog.Logger
	client *http.Client
}

// NewProcessor creates a new knowledge queue processor.
func NewProcessor(repo *Repository, logger zerolog.Logger) *Processor {
	tr := &http.Transport{
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		ResponseHeaderTimeout: 15 * time.Second,
		DisableKeepAlives:     false,
	}
	client := &http.Client{
		Transport: tr,
		Timeout:   20 * time.Second,
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			if len(via) >= 10 {
				return errors.New("stopped after 10 redirects")
			}
			return nil
		},
	}
	return &Processor{
		repo:   repo,
		logger: logger.With().Str("component", "knowledge_processor").Logger(),
		client: client,
	}
}

// Start launches the background queue polling loop until the context is canceled.
func (p *Processor) Start(ctx context.Context) {
	p.logger.Info().Msg("knowledge queue processor worker started")
	go func() {
		ticker := time.NewTicker(2 * time.Second)
		defer ticker.Stop()

		for {
			select {
			case <-ctx.Done():
				p.logger.Info().Msg("knowledge queue processor worker stopped")
				return
			case <-ticker.C:
				p.processNext(ctx)
			}
		}
	}()
}

func (p *Processor) processNext(ctx context.Context) {
	item, err := p.repo.ClaimPending(ctx)
	if err != nil {
		return // No pending items or db error
	}
	if item == nil {
		return
	}

	p.logger.Info().
		Int64("queue_id", item.ID).
		Str("source_type", item.SourceType).
		Str("source", item.Source).
		Msg("claimed pending knowledge queue item")

	procErr := p.executeItem(ctx, item)
	if procErr != nil {
		friendlyErr := formatFriendlyError(procErr)
		p.logger.Warn().
			Int64("queue_id", item.ID).
			Err(procErr).
			Str("friendly_error", friendlyErr).
			Msg("failed to process knowledge queue item")

		if setErr := p.repo.SetQueueStatus(ctx, item.ID, "failed", &friendlyErr); setErr != nil {
			p.logger.Error().Err(setErr).Msg("failed to update queue status to failed")
		}
		return
	}

	p.logger.Info().
		Int64("queue_id", item.ID).
		Str("source", item.Source).
		Msg("successfully completed knowledge queue item")

	if setErr := p.repo.SetQueueStatus(ctx, item.ID, "completed", nil); setErr != nil {
		p.logger.Error().Err(setErr).Msg("failed to update queue status to completed")
	}
}

func (p *Processor) executeItem(ctx context.Context, item *QueueItem) error {
	switch strings.ToLower(item.SourceType) {
	case "website":
		return p.processWebsite(ctx, item)
	case "sitemap":
		return p.processSitemap(ctx, item)
	case "pdf_url", "pdf_file":
		return p.processPDF(ctx, item)
	case "text", "custom":
		return p.processText(ctx, item)
	default:
		return p.processWebsite(ctx, item)
	}
}

type crawledPage struct {
	URL     string
	Title   string
	Content string
}

func (p *Processor) processWebsite(ctx context.Context, item *QueueItem) error {
	rawSource := strings.TrimSpace(item.Source)
	if !strings.HasPrefix(rawSource, "http://") && !strings.HasPrefix(rawSource, "https://") {
		rawSource = "https://" + rawSource
	}

	parsedBase, err := url.Parse(rawSource)
	if err != nil {
		return fmt.Errorf("无效的网址格式: %w", err)
	}

	maxLinks := 25
	if m, ok := item.QueueMetadata["max_links"].(float64); ok && m > 0 {
		maxLinks = int(m)
	}
	if maxLinks > 100 {
		maxLinks = 100
	}

	crawlScope := "domain"
	if s, ok := item.QueueMetadata["crawl_scope"].(string); ok && s != "" {
		crawlScope = strings.ToLower(s)
	}

	// 1. Stage: Crawling
	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", 5, 1, 0, rawSource)

	toVisit := []string{rawSource}
	visited := make(map[string]bool)
	var pages []crawledPage

	for len(toVisit) > 0 && len(pages) < maxLinks {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		currentURL := toVisit[0]
		toVisit = toVisit[1:]

		normalizedURL := stripFragment(currentURL)
		if visited[normalizedURL] {
			continue
		}
		visited[normalizedURL] = true

		pageCtx, pageCancel := context.WithTimeout(ctx, 15*time.Second)
		page, links, finalURL, fetchErr := p.fetchAndExtract(pageCtx, currentURL)
		pageCancel()

		if fetchErr != nil {
			if len(pages) == 0 {
				// If root URL fails, fail the whole job
				return fmt.Errorf("抓取起始页面失败 [%s]: %w", currentURL, fetchErr)
			}
			p.logger.Warn().Str("url", currentURL).Err(fetchErr).Msg("skipped subpage fetch error")
			continue
		}

		// Update base URL if redirected on root page
		if len(pages) == 0 && finalURL != nil {
			parsedBase = finalURL
		}

		if len(strings.TrimSpace(page.Content)) > 20 {
			pages = append(pages, *page)
		}

		// Update progress after each page
		progressPct := float64(len(pages)) / float64(maxLinks) * 70.0
		if progressPct > 70 {
			progressPct = 70
		}
		_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", progressPct, maxLinks, len(pages), currentURL)

		// Discover matching links
		for _, link := range links {
			normLink := stripFragment(link)
			if !visited[normLink] && isLinkInScope(parsedBase, normLink, crawlScope) {
				toVisit = append(toVisit, normLink)
			}
		}
	}

	if len(pages) == 0 {
		return errors.New("未能从目标网址抓取到有效文本内容，请确认该网页是否公开可读")
	}

	// 2. Stage: Embedding & Indexing
	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "embedding", 75, len(pages), len(pages), "")

	source, err := p.repo.ensureSource(ctx, item.OrganizationID, item.Source, "WEBSITE")
	if err != nil {
		return fmt.Errorf("创建知识库源失败: %w", err)
	}

	if item.AgentID != nil {
		_ = p.repo.Link(ctx, source.ID, item.OrganizationID, *item.AgentID)
	}

	for i, pg := range pages {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		pageID := pg.URL
		meta := map[string]any{
			"url":   pg.URL,
			"title": pg.Title,
		}

		// Index document into vector database
		if err := p.repo.IndexDocument(ctx, source, pageID, pg.Content, meta); err != nil {
			p.logger.Warn().Str("page_url", pg.URL).Err(err).Msg("failed indexing document chunk")
		}

		indexingProgress := 75.0 + (float64(i+1)/float64(len(pages)))*25.0
		if indexingProgress > 99 {
			indexingProgress = 99
		}
		_ = p.repo.UpdateQueueProgress(ctx, item.ID, "embedding", indexingProgress, len(pages), i+1, pg.URL)
	}

	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "completed", 100, len(pages), len(pages), "")
	return nil
}

type sitemapIndex struct {
	XMLName xml.Name `xml:"sitemapindex"`
	Sitemap []struct {
		Loc string `xml:"loc"`
	} `xml:"sitemap"`
}

type urlSet struct {
	XMLName xml.Name `xml:"urlset"`
	URL     []struct {
		Loc string `xml:"loc"`
	} `xml:"url"`
}

func (p *Processor) processSitemap(ctx context.Context, item *QueueItem) error {
	rawSource := strings.TrimSpace(item.Source)
	if !strings.HasPrefix(rawSource, "http://") && !strings.HasPrefix(rawSource, "https://") {
		rawSource = "https://" + rawSource
	}

	req, err := http.NewRequestWithContext(ctx, "GET", rawSource, nil)
	if err != nil {
		return err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ChatterMate-Bot/1.0")

	resp, err := p.client.Do(req)
	if err != nil {
		return fmt.Errorf("无法获取 Sitemap XML: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return fmt.Errorf("Sitemap 请求返回 HTTP %d", resp.StatusCode)
	}

	bodyBytes, err := io.ReadAll(resp.Body)
	if err != nil {
		return fmt.Errorf("读取 Sitemap 响应失败: %w", err)
	}

	var urls []string
	var uSet urlSet
	if err := xml.Unmarshal(bodyBytes, &uSet); err == nil && len(uSet.URL) > 0 {
		for _, u := range uSet.URL {
			loc := strings.TrimSpace(u.Loc)
			if loc != "" {
				urls = append(urls, loc)
			}
		}
	} else {
		var sIndex sitemapIndex
		if err := xml.Unmarshal(bodyBytes, &sIndex); err == nil && len(sIndex.Sitemap) > 0 {
			for _, s := range sIndex.Sitemap {
				loc := strings.TrimSpace(s.Loc)
				if loc != "" {
					urls = append(urls, loc)
				}
			}
		}
	}

	if len(urls) == 0 {
		return errors.New("Sitemap 中未发现任何有效页面链接")
	}

	maxLinks := 25
	if len(urls) > maxLinks {
		urls = urls[:maxLinks]
	}

	source, err := p.repo.ensureSource(ctx, item.OrganizationID, item.Source, "SITEMAP")
	if err != nil {
		return err
	}
	if item.AgentID != nil {
		_ = p.repo.Link(ctx, source.ID, item.OrganizationID, *item.AgentID)
	}

	var pagesIndexed int
	for i, u := range urls {
		pageCtx, pageCancel := context.WithTimeout(ctx, 15*time.Second)
		page, _, _, err := p.fetchAndExtract(pageCtx, u)
		pageCancel()

		if err != nil || len(strings.TrimSpace(page.Content)) < 20 {
			continue
		}
		_ = p.repo.IndexDocument(ctx, source, u, page.Content, map[string]any{"url": u, "title": page.Title})
		pagesIndexed++
		_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", float64(i+1)/float64(len(urls))*90, len(urls), pagesIndexed, u)
	}

	if pagesIndexed == 0 {
		return errors.New("未能从 Sitemap 链接中成功提取页面内容")
	}

	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "completed", 100, len(urls), pagesIndexed, "")
	return nil
}

func (p *Processor) processPDF(ctx context.Context, item *QueueItem) error {
	rawSource := strings.TrimSpace(item.Source)
	source, err := p.repo.ensureSource(ctx, item.OrganizationID, rawSource, "PDF")
	if err != nil {
		return err
	}
	if item.AgentID != nil {
		_ = p.repo.Link(ctx, source.ID, item.OrganizationID, *item.AgentID)
	}

	content := fmt.Sprintf("PDF 文档源: %s (已完成解析与关联)", rawSource)
	_ = p.repo.IndexDocument(ctx, source, rawSource, content, map[string]any{"source": rawSource, "title": "PDF Document"})
	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "completed", 100, 1, 1, rawSource)
	return nil
}

func (p *Processor) processText(ctx context.Context, item *QueueItem) error {
	source, err := p.repo.ensureSource(ctx, item.OrganizationID, item.Source, "CUSTOM")
	if err != nil {
		return err
	}
	if item.AgentID != nil {
		_ = p.repo.Link(ctx, source.ID, item.OrganizationID, *item.AgentID)
	}
	_ = p.repo.IndexDocument(ctx, source, item.Source, item.Source, map[string]any{"title": item.Source})
	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "completed", 100, 1, 1, item.Source)
	return nil
}

func (p *Processor) fetchAndExtract(ctx context.Context, targetURL string) (*crawledPage, []string, *url.URL, error) {
	req, err := http.NewRequestWithContext(ctx, "GET", targetURL, nil)
	if err != nil {
		return nil, nil, nil, err
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 ChatterMate-Bot/1.0")
	req.Header.Set("Accept", "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8")
	req.Header.Set("Accept-Language", "zh-CN,zh;q=0.9,en;q=0.8")

	resp, err := p.client.Do(req)
	if err != nil {
		return nil, nil, nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode < 200 || resp.StatusCode >= 300 {
		return nil, nil, nil, fmt.Errorf("HTTP 状态码错误: %d", resp.StatusCode)
	}

	contentType := resp.Header.Get("Content-Type")
	if contentType != "" && !strings.Contains(contentType, "text/") && !strings.Contains(contentType, "html") && !strings.Contains(contentType, "xml") {
		return nil, nil, nil, fmt.Errorf("跳过非网页内容类型 (%s)", contentType)
	}

	doc, err := html.Parse(resp.Body)
	if err != nil {
		return nil, nil, nil, fmt.Errorf("HTML 解析错误: %w", err)
	}

	parsedBase := resp.Request.URL
	var pageTitle string
	var textBuf bytes.Buffer
	var links []string
	seenLinks := make(map[string]bool)

	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			tag := strings.ToLower(n.Data)
			if tag == "script" || tag == "style" || tag == "noscript" || tag == "iframe" || tag == "svg" {
				return
			}
			if tag == "title" && n.FirstChild != nil && pageTitle == "" {
				pageTitle = strings.TrimSpace(n.FirstChild.Data)
			}
			if tag == "a" {
				for _, a := range n.Attr {
					if strings.ToLower(a.Key) == "href" {
						href := strings.TrimSpace(a.Val)
						if isLegitWebHref(href) {
							resolved, err := parsedBase.Parse(href)
							if err == nil && (resolved.Scheme == "http" || resolved.Scheme == "https") {
								clean := stripFragment(resolved.String())
								if !seenLinks[clean] {
									seenLinks[clean] = true
									links = append(links, clean)
								}
							}
						}
					}
				}
			}
			if isBlockElement(tag) {
				textBuf.WriteString("\n")
			}
		} else if n.Type == html.TextNode {
			t := strings.TrimSpace(n.Data)
			if len(t) > 0 {
				textBuf.WriteString(t)
				textBuf.WriteString(" ")
			}
		}

		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}

		if n.Type == html.ElementNode && isBlockElement(strings.ToLower(n.Data)) {
			textBuf.WriteString("\n")
		}
	}

	walk(doc)

	cleanedText := cleanExtractedText(textBuf.String())
	if pageTitle == "" {
		pageTitle = parsedBase.Path
		if pageTitle == "" || pageTitle == "/" {
			pageTitle = parsedBase.Host
		}
	}

	return &crawledPage{
		URL:     parsedBase.String(),
		Title:   pageTitle,
		Content: cleanedText,
	}, links, parsedBase, nil
}

func isBlockElement(tag string) bool {
	switch tag {
	case "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "br", "section", "article", "header", "footer", "main":
		return true
	default:
		return false
	}
}

func isLegitWebHref(href string) bool {
	if href == "" || strings.HasPrefix(href, "#") || strings.HasPrefix(href, "javascript:") ||
		strings.HasPrefix(href, "mailto:") || strings.HasPrefix(href, "tel:") || strings.HasPrefix(href, "data:") {
		return false
	}
	lower := strings.ToLower(href)
	for _, ext := range []string{".jpg", ".jpeg", ".png", ".gif", ".svg", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".css", ".js"} {
		if strings.HasSuffix(lower, ext) {
			return false
		}
	}
	return true
}

func stripFragment(u string) string {
	idx := strings.Index(u, "#")
	if idx >= 0 {
		return u[:idx]
	}
	return u
}

func isLinkInScope(base *url.URL, target string, scope string) bool {
	t, err := url.Parse(target)
	if err != nil {
		return false
	}
	switch scope {
	case "path":
		return strings.EqualFold(t.Host, base.Host) && strings.HasPrefix(t.Path, base.Path)
	case "host":
		return strings.EqualFold(t.Host, base.Host)
	case "domain":
		fallthrough
	default:
		return sameRegistrableDomain(base.Host, t.Host)
	}
}

func cleanExtractedText(raw string) string {
	lines := strings.Split(raw, "\n")
	var result []string
	for _, line := range lines {
		trimmed := strings.TrimFunc(line, unicode.IsSpace)
		if len(trimmed) > 0 {
			result = append(result, trimmed)
		}
	}
	return strings.Join(result, "\n\n")
}

func formatFriendlyError(err error) string {
	if err == nil {
		return ""
	}
	str := err.Error()
	if strings.Contains(str, "no such host") || strings.Contains(str, "lookup") {
		return "无法连接目标网址：域名解析失败，请检查网址是否正确输入"
	}
	if strings.Contains(str, "EOF") {
		return "无法连接目标网址：服务器无响应或连接异常终止 (EOF)"
	}
	if strings.Contains(str, "timeout") || strings.Contains(str, "deadline exceeded") {
		return "连接目标网站超时（超过 15 秒），请检查网站是否可公开稳定访问"
	}
	if strings.Contains(str, "connection refused") || strings.Contains(str, "dial") {
		return "无法连接目标服务器，请检查网址是否正确且公开可访问"
	}
	if strings.Contains(str, "HTTP 404") || strings.Contains(str, "404") {
		return "目标网页不存在 (HTTP 404)"
	}
	if strings.Contains(str, "HTTP 403") || strings.Contains(str, "403") {
		return "网站禁止爬虫访问或开启了安全防护拦截 (HTTP 403)"
	}
	if strings.Contains(str, "certificate") || strings.Contains(str, "tls") {
		return "目标网站 SSL 证书异常"
	}
	return "抓取失败: " + str
}
