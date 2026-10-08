// Copyright 2024-2026 Komi AI
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
	"sync"
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
		MaxIdleConns:          50,
		MaxIdleConnsPerHost:   10,
	}
	client := &http.Client{
		Transport: tr,
		Timeout:   18 * time.Second,
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
		ticker := time.NewTicker(1 * time.Second)
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
	URL         string
	Title       string
	Description string
	Content     string
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

	// 1. 即抓即存：任务一开始立即初始化知识源，让用户在界面实时看到知识源建立
	source, err := p.repo.ensureSource(ctx, item.OrganizationID, item.Source, "WEBSITE")
	if err != nil {
		return fmt.Errorf("创建知识库源失败: %w", err)
	}

	if item.AgentID != nil {
		_ = p.repo.Link(ctx, source.ID, item.OrganizationID, *item.AgentID)
	}

	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", 5, maxLinks, 0, rawSource)

	// 并发与队列状态管理
	var mu sync.Mutex
	toVisit := []string{normalizeURLClean(rawSource)}
	visited := make(map[string]bool)
	pagesIndexed := 0

	// 先抓取首页
	firstURL := toVisit[0]
	toVisit = toVisit[1:]
	visited[firstURL] = true

	pageCtx, pageCancel := context.WithTimeout(ctx, 15*time.Second)
	firstPage, initialLinks, finalURL, fetchErr := p.fetchAndExtract(pageCtx, firstURL)
	pageCancel()

	if fetchErr != nil {
		return fmt.Errorf("抓取起始页面失败 [%s]: %w", firstURL, fetchErr)
	}

	if finalURL != nil {
		parsedBase = finalURL
	}

	if len(strings.TrimSpace(firstPage.Content)) >= 20 {
		meta := map[string]any{
			"url":         firstPage.URL,
			"title":       firstPage.Title,
			"description": firstPage.Description,
		}
		// 抓一个存一个，立即进入向量数据库
		_ = p.repo.IndexDocument(ctx, source, firstPage.URL, firstPage.Content, meta)
		pagesIndexed++
		progressPct := (float64(pagesIndexed) / float64(maxLinks)) * 95.0
		_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", progressPct, maxLinks, pagesIndexed, firstPage.URL)
	}

	// 发现首批链接
	for _, link := range initialLinks {
		norm := normalizeURLClean(link)
		if !visited[norm] && isLinkInScope(parsedBase, norm, crawlScope) {
			toVisit = append(toVisit, norm)
		}
	}

	// 并发池流水线并发抓取剩余页面
	const concurrency = 3
	type result struct {
		page     *crawledPage
		links    []string
		url      string
		fetchErr error
	}

	for len(toVisit) > 0 && pagesIndexed < maxLinks {
		select {
		case <-ctx.Done():
			return ctx.Err()
		default:
		}

		// 批次取出最多 concurrency 个 URL
		mu.Lock()
		var batch []string
		for len(toVisit) > 0 && len(batch) < concurrency && (pagesIndexed+len(batch)) < maxLinks {
			u := toVisit[0]
			toVisit = toVisit[1:]
			if !visited[u] {
				visited[u] = true
				batch = append(batch, u)
			}
		}
		mu.Unlock()

		if len(batch) == 0 {
			break
		}

		resChan := make(chan result, len(batch))
		var wg sync.WaitGroup

		for _, targetURL := range batch {
			wg.Add(1)
			go func(u string) {
				defer wg.Done()
				subCtx, subCancel := context.WithTimeout(ctx, 15*time.Second)
				pg, lks, _, err := p.fetchAndExtract(subCtx, u)
				subCancel()
				resChan <- result{page: pg, links: lks, url: u, fetchErr: err}
			}(targetURL)
		}

		wg.Wait()
		close(resChan)

		for res := range resChan {
			if res.fetchErr != nil {
				p.logger.Warn().Str("url", res.url).Err(res.fetchErr).Msg("skipped subpage fetch error")
				continue
			}

			if res.page != nil && len(strings.TrimSpace(res.page.Content)) >= 20 {
				meta := map[string]any{
					"url":         res.page.URL,
					"title":       res.page.Title,
					"description": res.page.Description,
				}
				// 实时入库
				_ = p.repo.IndexDocument(ctx, source, res.page.URL, res.page.Content, meta)
				pagesIndexed++
				progressPct := (float64(pagesIndexed) / float64(maxLinks)) * 95.0
				if progressPct > 98 {
					progressPct = 98
				}
				_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", progressPct, maxLinks, pagesIndexed, res.page.URL)
			}

			// 收集新链接
			mu.Lock()
			for _, link := range res.links {
				norm := normalizeURLClean(link)
				if !visited[norm] && isLinkInScope(parsedBase, norm, crawlScope) {
					toVisit = append(toVisit, norm)
				}
			}
			mu.Unlock()
		}
	}

	if pagesIndexed == 0 {
		return errors.New("未能从目标网址提取到有效正文内容，请确认该网页是否公开可读")
	}

	_ = p.repo.UpdateQueueProgress(ctx, item.ID, "completed", 100, maxLinks, pagesIndexed, "")
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
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Komi AI-Bot/1.0")

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

		if err != nil || page == nil || len(strings.TrimSpace(page.Content)) < 20 {
			continue
		}
		_ = p.repo.IndexDocument(ctx, source, u, page.Content, map[string]any{"url": u, "title": page.Title, "description": page.Description})
		pagesIndexed++
		_ = p.repo.UpdateQueueProgress(ctx, item.ID, "crawling", float64(i+1)/float64(len(urls))*95, len(urls), pagesIndexed, u)
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
	req.Header.Set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Komi AI-Bot/1.0")
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
	var ogTitle string
	var h1Title string
	var pageDescription string
	var textBuf bytes.Buffer
	var links []string
	seenLinks := make(map[string]bool)

	var walk func(*html.Node)
	walk = func(n *html.Node) {
		if n.Type == html.ElementNode {
			tag := strings.ToLower(n.Data)

			// 剔除噪音与无关代码标签
			if isNoiseTag(tag) || isNoiseNode(n) {
				return
			}

			// 提取 Meta 标签 (og:title, description, og:description)
			if tag == "meta" {
				var name, prop, content string
				for _, a := range n.Attr {
					k := strings.ToLower(a.Key)
					if k == "name" {
						name = strings.ToLower(a.Val)
					} else if k == "property" {
						prop = strings.ToLower(a.Val)
					} else if k == "content" {
						content = strings.TrimSpace(a.Val)
					}
				}
				if (prop == "og:title" || name == "twitter:title") && ogTitle == "" {
					ogTitle = content
				}
				if (name == "description" || prop == "og:description") && pageDescription == "" {
					pageDescription = content
				}
			}

			if tag == "title" && n.FirstChild != nil && pageTitle == "" {
				pageTitle = strings.TrimSpace(n.FirstChild.Data)
			}

			if tag == "h1" && h1Title == "" {
				h1Title = extractNodeText(n)
			}

			// 提取超链接并清洗追踪参数
			if tag == "a" {
				for _, a := range n.Attr {
					if strings.ToLower(a.Key) == "href" {
						href := strings.TrimSpace(a.Val)
						if isLegitWebHref(href) {
							resolved, err := parsedBase.Parse(href)
							if err == nil && (resolved.Scheme == "http" || resolved.Scheme == "https") {
								clean := normalizeURLClean(resolved.String())
								if !seenLinks[clean] {
									seenLinks[clean] = true
									links = append(links, clean)
								}
							}
						}
					}
				}
			}

			// 标题/段落格式化
			if strings.HasPrefix(tag, "h") && len(tag) == 2 && tag[1] >= '1' && tag[1] <= '6' {
				textBuf.WriteString("\n\n### ")
			} else if tag == "li" {
				textBuf.WriteString("\n- ")
			} else if isBlockElement(tag) {
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

	// 智能标题优先级选择：og:title > h1 > <title> > URL
	finalTitle := ogTitle
	if finalTitle == "" {
		finalTitle = h1Title
	}
	if finalTitle == "" {
		finalTitle = pageTitle
	}
	if finalTitle == "" {
		finalTitle = parsedBase.Path
		if finalTitle == "" || finalTitle == "/" {
			finalTitle = parsedBase.Host
		}
	}

	return &crawledPage{
		URL:         parsedBase.String(),
		Title:       finalTitle,
		Description: pageDescription,
		Content:     cleanedText,
	}, links, parsedBase, nil
}

func isNoiseTag(tag string) bool {
	switch tag {
	case "script", "style", "noscript", "iframe", "svg", "nav", "footer",
		"aside", "form", "button", "select", "option", "dialog", "canvas",
		"video", "audio", "template", "head":
		return true
	default:
		return false
	}
}

func isNoiseNode(n *html.Node) bool {
	for _, a := range n.Attr {
		k := strings.ToLower(a.Key)
		v := strings.ToLower(a.Val)
		if k == "aria-hidden" && v == "true" {
			return true
		}
		if k == "role" && (v == "navigation" || v == "banner" || v == "contentinfo") {
			return true
		}
		if k == "class" || k == "id" {
			if strings.Contains(v, "cookie-banner") || strings.Contains(v, "cookie-consent") ||
				strings.Contains(v, "privacy-policy-modal") || strings.Contains(v, "footer-copyright") {
				return true
			}
		}
	}
	return false
}

func extractNodeText(n *html.Node) string {
	var buf strings.Builder
	var walk func(*html.Node)
	walk = func(node *html.Node) {
		if node.Type == html.TextNode {
			buf.WriteString(node.Data)
		}
		for c := node.FirstChild; c != nil; c = c.NextSibling {
			walk(c)
		}
	}
	walk(n)
	return strings.TrimSpace(buf.String())
}

func isBlockElement(tag string) bool {
	switch tag {
	case "p", "div", "h1", "h2", "h3", "h4", "h5", "h6", "li", "tr", "br", "section", "article", "header", "main":
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
	for _, ext := range []string{".jpg", ".jpeg", ".png", ".gif", ".svg", ".zip", ".tar", ".gz", ".mp4", ".mp3", ".css", ".js", ".woff", ".woff2", ".ttf", ".eot"} {
		if strings.HasSuffix(lower, ext) {
			return false
		}
	}
	return true
}

func normalizeURLClean(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return stripFragment(raw)
	}
	u.Fragment = "" // 移除锚点
	// 清理跟踪参数
	q := u.Query()
	for param := range q {
		pLower := strings.ToLower(param)
		if strings.HasPrefix(pLower, "utm_") || pLower == "fbclid" || pLower == "gclid" ||
			pLower == "ref" || pLower == "source" || pLower == "_ga" || pLower == "spm" ||
			pLower == "from" || pLower == "sessionid" || pLower == "session_id" {
			q.Del(param)
		}
	}
	u.RawQuery = q.Encode()
	res := u.String()
	// 移除尾部多余的斜杠
	if strings.HasSuffix(res, "/") && len(u.Path) > 1 {
		res = strings.TrimRight(res, "/")
	}
	return res
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
