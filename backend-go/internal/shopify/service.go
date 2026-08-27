package shopify

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/config"
)

var ErrRemote = errors.New("Shopify API request failed")

const ShopifyScopes = "read_products,read_themes,write_themes,write_script_tags,read_script_tags,read_orders,write_orders,read_customers"

type Service struct {
	Repo       *Repository
	Config     config.Config
	HTTPClient *http.Client
}

func NewService(repo *Repository, cfg config.Config) *Service {
	return &Service{Repo: repo, Config: cfg, HTTPClient: &http.Client{Timeout: 20 * time.Second}}
}

func NormalizeDomain(value string) (string, error) {
	host := strings.TrimSpace(strings.ToLower(value))
	host = strings.TrimPrefix(host, "https://")
	host = strings.TrimPrefix(host, "http://")
	if index := strings.IndexByte(host, '/'); index >= 0 {
		host = host[:index]
	}
	if !strings.HasSuffix(host, ".myshopify.com") {
		return "", errors.New("Enter a valid *.myshopify.com shop domain")
	}
	handle := strings.TrimSuffix(host, ".myshopify.com")
	if handle == "" || !regexp.MustCompile(`^[a-z0-9-]+$`).MatchString(handle) {
		return "", errors.New("Enter a valid *.myshopify.com shop domain")
	}
	return host, nil
}

func (s *Service) OAuthURL(domain, state string) string {
	values := url.Values{}
	values.Set("client_id", s.Config.ShopifyAPIKey)
	values.Set("scope", ShopifyScopes)
	values.Set("redirect_uri", strings.TrimRight(s.Config.BackendURL, "/")+s.Config.APIBasePath+"/shopify/callback")
	values.Set("state", state)
	return "https://" + domain + "/admin/oauth/authorize?" + values.Encode()
}

func (s *Service) ValidateCallback(requestURL *url.URL, domain, signature string) bool {
	if requestURL == nil || signature == "" || s.Config.ShopifyAPISecret == "" {
		return false
	}
	query := requestURL.Query()
	query.Del("hmac")
	keys := make([]string, 0, len(query))
	for key := range query {
		keys = append(keys, key)
	}
	sort.Strings(keys)
	parts := make([]string, 0, len(keys))
	for _, key := range keys {
		values := query[key]
		for _, value := range values {
			parts = append(parts, url.QueryEscape(key)+"="+url.QueryEscape(value))
		}
	}
	message := strings.Join(parts, "&")
	digest := hmac.New(sha256.New, []byte(s.Config.ShopifyAPISecret))
	_, _ = digest.Write([]byte(message))
	decoded, err := base64.StdEncoding.DecodeString(signature)
	if err != nil {
		return hmac.Equal(digest.Sum(nil), []byte(signature))
	}
	return hmac.Equal(digest.Sum(nil), decoded)
}

// ValidWebhookSignature verifies Shopify's base64 HMAC over the raw request
// body. The body must be read before JSON decoding so no normalization changes
// the signed bytes.
func (s *Service) ValidWebhookSignature(body []byte, signature string) bool {
	if signature == "" || s.Config.ShopifyAPISecret == "" {
		return false
	}
	digest := hmac.New(sha256.New, []byte(s.Config.ShopifyAPISecret))
	_, _ = digest.Write(body)
	expected := base64.StdEncoding.EncodeToString(digest.Sum(nil))
	return hmac.Equal([]byte(expected), []byte(signature))
}

func (s *Service) ExchangeOAuthCode(ctx context.Context, domain, code string) (string, string, error) {
	return s.exchangeToken(ctx, "https://"+domain+"/admin/oauth/access_token", map[string]any{
		"client_id": s.Config.ShopifyAPIKey, "client_secret": s.Config.ShopifyAPISecret, "code": code,
	})
}

func (s *Service) ExchangeSessionToken(ctx context.Context, token string) (string, string, string, error) {
	claims, err := s.ValidateSessionToken(token)
	if err != nil {
		return "", "", "", err
	}
	dest, _ := claims["dest"].(string)
	domain, err := NormalizeDomain(dest)
	if err != nil {
		return "", "", "", errors.New("Invalid session token: bad shop domain")
	}
	access, scope, err := s.exchangeToken(ctx, "https://"+domain+"/admin/oauth/access_token", map[string]any{
		"client_id": s.Config.ShopifyAPIKey, "client_secret": s.Config.ShopifyAPISecret,
		"grant_type":    "urn:ietf:params:oauth:grant-type:token-exchange",
		"subject_token": token, "subject_token_type": "urn:ietf:params:oauth:token-type:id_token",
		"requested_token_type": "urn:shopify:params:oauth:token-type:offline-access-token",
	})
	return domain, access, scope, err
}

func (s *Service) ValidateSessionToken(token string) (jwt.MapClaims, error) {
	if strings.TrimSpace(token) == "" || s.Config.ShopifyAPISecret == "" {
		return nil, errors.New("session token is required")
	}
	parsed, err := jwt.Parse(token, func(token *jwt.Token) (any, error) {
		if token.Method != jwt.SigningMethodHS256 {
			return nil, errors.New("unexpected signing method")
		}
		return []byte(s.Config.ShopifyAPISecret), nil
	}, jwt.WithValidMethods([]string{"HS256"}))
	if err != nil || !parsed.Valid {
		return nil, errors.New("invalid Shopify session token")
	}
	claims, ok := parsed.Claims.(jwt.MapClaims)
	if !ok {
		return nil, errors.New("invalid Shopify session token claims")
	}
	if _, err := claims.GetExpirationTime(); err != nil {
		return nil, errors.New("invalid Shopify session token expiry")
	}
	return claims, nil
}

func (s *Service) exchangeToken(ctx context.Context, endpoint string, body map[string]any) (string, string, error) {
	encoded, _ := json.Marshal(body)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(encoded))
	if err != nil {
		return "", "", err
	}
	req.Header.Set("Content-Type", "application/json")
	response, err := s.client().Do(req)
	if err != nil {
		return "", "", err
	}
	defer response.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(response.Body, 1<<20))
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return "", "", fmt.Errorf("Shopify token exchange failed: HTTP %d", response.StatusCode)
	}
	var value map[string]any
	if err := json.Unmarshal(data, &value); err != nil {
		return "", "", err
	}
	access, _ := value["access_token"].(string)
	if access == "" {
		return "", "", errors.New("No access token received from Shopify")
	}
	scope, _ := value["scope"].(string)
	return access, scope, nil
}

func (s *Service) GraphQL(ctx context.Context, shop *Shop, query string, variables map[string]any) (map[string]any, error) {
	if shop == nil || !shop.IsInstalled || shop.AccessToken == "" {
		return nil, errors.New("Shop not connected or missing access token")
	}
	body := map[string]any{"query": query}
	if variables != nil {
		body["variables"] = variables
	}
	encoded, _ := json.Marshal(body)
	endpoint := fmt.Sprintf("https://%s/admin/api/%s/graphql.json", shop.ShopDomain, s.apiVersion())
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, bytes.NewReader(encoded))
	if err != nil {
		return nil, err
	}
	req.Header.Set("X-Shopify-Access-Token", shop.AccessToken)
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Accept", "application/json")
	response, err := s.client().Do(req)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()
	data, _ := io.ReadAll(io.LimitReader(response.Body, 8<<20))
	var result map[string]any
	if err := json.Unmarshal(data, &result); err != nil {
		return nil, err
	}
	if response.StatusCode < 200 || response.StatusCode >= 300 {
		return result, fmt.Errorf("Shopify API HTTP %d", response.StatusCode)
	}
	if errs, ok := result["errors"].([]any); ok && len(errs) > 0 {
		return result, errors.New("Shopify GraphQL returned errors")
	}
	return result, nil
}

func (s *Service) SearchOrders(ctx context.Context, shop *Shop, email, cursor string, limit int) (map[string]any, error) {
	if limit < 1 || limit > 50 {
		limit = 20
	}
	result, err := s.GraphQL(ctx, shop, shopifyOrderQuery, map[string]any{"query": "email:" + email, "limit": limit, "after": nullableValue(cursor)})
	if err != nil {
		return nil, err
	}
	orders := transformEdges(objects(objectPath(result, "data", "orders")["edges"]), transformOrder)
	page := objectPath(result, "data", "orders", "pageInfo")
	return map[string]any{"success": true, "orders": orders, "count": len(orders), "has_next_page": boolValue(page["hasNextPage"]), "end_cursor": page["endCursor"]}, nil
}

func (s *Service) Products(ctx context.Context, shop *Shop, limit int) (map[string]any, error) {
	if limit < 1 || limit > 20 {
		limit = 12
	}
	result, err := s.GraphQL(ctx, shop, shopifyProductQuery, map[string]any{"limit": limit, "after": nil})
	if err != nil {
		return nil, err
	}
	products := transformEdges(objects(objectPath(result, "data", "products")["edges"]), transformProduct)
	page := objectPath(result, "data", "products", "pageInfo")
	return map[string]any{"success": true, "products": products, "count": len(products), "has_next_page": boolValue(page["hasNextPage"]), "end_cursor": page["endCursor"]}, nil
}

// GetProduct returns the product projection used by the customer-facing
// Shopify tools. The HTTP commerce endpoints only need list/order methods,
// but the AI tool also needs a single-product lookup for recommendations and
// product-detail questions.
func (s *Service) GetProduct(ctx context.Context, shop *Shop, productID string) (map[string]any, error) {
	productID = strings.TrimSpace(strings.TrimPrefix(productID, "gid://shopify/Product/"))
	if productID == "" {
		return map[string]any{"success": false, "product": nil, "message": "Product ID is required"}, nil
	}
	result, err := s.GraphQL(ctx, shop, shopifyProductByIDQuery, map[string]any{"id": "gid://shopify/Product/" + productID})
	if err != nil {
		return nil, err
	}
	product := transformProduct(objectPath(result, "data", "product"))
	if stringValue(product["id"]) == "" {
		return map[string]any{"success": false, "product": nil, "message": "Product not found"}, nil
	}
	return map[string]any{"success": true, "product": product}, nil
}

// SearchProducts applies the same active/in-stock and optional filter rules
// as ShopifyTools.search_products in the Python backend.
func (s *Service) SearchProducts(ctx context.Context, shop *Shop, query, cursor string, limit int, minPrice, maxPrice *float64, vendor string) (map[string]any, error) {
	query = strings.TrimSpace(query)
	if query == "" {
		return map[string]any{"success": false, "message": "A product search query is required"}, nil
	}
	searchTerm := "(" + query + ") AND status:active AND inventory_total:>0"
	if minPrice != nil {
		searchTerm += fmt.Sprintf(" AND price:>=%g", *minPrice)
	}
	if maxPrice != nil {
		searchTerm += fmt.Sprintf(" AND price:<=%g", *maxPrice)
	}
	if vendor = strings.TrimSpace(vendor); vendor != "" {
		searchTerm += " AND vendor:'" + escapeShopifySearchValue(vendor) + "'"
	}
	return s.searchProducts(ctx, shop, searchTerm, cursor, limit, false, "", "")
}

// SearchOrdersByQuery is the AI-facing order search. SearchOrders remains the
// narrower email/cursor method used by the authenticated commerce endpoints.
func (s *Service) SearchOrdersByQuery(ctx context.Context, shop *Shop, query, customerEmail, orderNumber string, limit int) (map[string]any, error) {
	terms := make([]string, 0, 3)
	if value := strings.TrimSpace(query); value != "" {
		terms = append(terms, value)
	}
	if value := strings.TrimSpace(customerEmail); value != "" {
		terms = append(terms, "email:"+value)
	}
	if value := strings.TrimSpace(orderNumber); value != "" {
		terms = append(terms, "name:"+value)
	}
	if len(terms) == 0 {
		return map[string]any{"success": false, "requires_user_input": true, "message": "Please provide at least one search parameter: order number, email address, or search query."}, nil
	}
	if limit < 1 || limit > 50 {
		limit = 10
	}
	result, err := s.GraphQL(ctx, shop, shopifyAIOrderQuery, map[string]any{"query": strings.Join(terms, " AND "), "first": limit})
	if err != nil {
		return nil, err
	}
	ordersData := objectPath(result, "data", "orders")
	orders := make([]any, 0)
	for _, edge := range objects(ordersData["edges"]) {
		orders = append(orders, transformOrder(object(edge, "node")))
	}
	page := object(ordersData, "pageInfo")
	return map[string]any{"success": true, "orders": orders, "count": len(orders), "page_info": page, "shop_domain": shop.ShopDomain}, nil
}

// RecommendProducts mirrors the Python fallback behavior: use a reference
// product's type/tags when available, otherwise use explicit criteria, and
// finally fall back to recent active/in-stock products.
func (s *Service) RecommendProducts(ctx context.Context, shop *Shop, productID, productType, tags, cursor string, limit int, minPrice, maxPrice *float64, vendor string) (map[string]any, error) {
	if limit < 1 || limit > 20 {
		limit = 8
	}
	productID = strings.TrimSpace(strings.TrimPrefix(productID, "gid://shopify/Product/"))
	parts := make([]string, 0, 5)
	searchLimit := limit
	if productID != "" {
		if reference, err := s.GetProduct(ctx, shop, productID); err == nil && boolValue(reference["success"]) {
			if product, ok := reference["product"].(map[string]any); ok {
				if value := strings.TrimSpace(stringValue(product["product_type"])); value != "" {
					parts = append(parts, "product_type:'"+escapeShopifySearchValue(value)+"'")
				}
				if values, ok := product["tags"].([]any); ok {
					for _, value := range values {
						if tag := strings.TrimSpace(stringValue(value)); tag != "" && len(parts) < 4 {
							parts = append(parts, "tag:'"+escapeShopifySearchValue(tag)+"'")
						}
					}
				} else if values, ok := product["tags"].([]string); ok {
					for _, tag := range values {
						if tag = strings.TrimSpace(tag); tag != "" && len(parts) < 4 {
							parts = append(parts, "tag:'"+escapeShopifySearchValue(tag)+"'")
						}
					}
				}
			}
		}
		if len(parts) > 0 {
			parts = append(parts, "-id:"+productID)
			searchLimit = limit + 1
		}
	}
	if productID == "" || len(parts) == 0 {
		if value := strings.TrimSpace(productType); value != "" {
			parts = append(parts, "product_type:'"+escapeShopifySearchValue(value)+"'")
		}
		for _, value := range strings.Split(tags, ",") {
			if value = strings.TrimSpace(value); value != "" && len(parts) < 3 {
				parts = append(parts, "tag:'"+escapeShopifySearchValue(value)+"'")
			}
		}
	}

	searchType := "recommendations"
	searchTerm := ""
	if len(parts) == 0 {
		searchType = "recent products"
		searchTerm = "status:active AND inventory_total:>0"
	} else {
		searchTerm = "(" + strings.Join(parts, " OR ") + ") AND status:active AND inventory_total:>0"
	}
	if minPrice != nil {
		searchTerm += fmt.Sprintf(" AND price:>=%g", *minPrice)
	}
	if maxPrice != nil {
		searchTerm += fmt.Sprintf(" AND price:<=%g", *maxPrice)
	}
	if vendor = strings.TrimSpace(vendor); vendor != "" {
		searchTerm += " AND vendor:'" + escapeShopifySearchValue(vendor) + "'"
	}
	result, err := s.searchProducts(ctx, shop, searchTerm, cursor, searchLimit, searchType == "recent products", searchType, productID)
	if err != nil {
		return nil, err
	}
	products, _ := result["products"].([]any)
	if productID != "" && len(products) > limit {
		filtered := make([]any, 0, limit)
		for _, raw := range products {
			item, _ := raw.(map[string]any)
			if stringValue(item["id"]) == productID {
				continue
			}
			filtered = append(filtered, raw)
			if len(filtered) == limit {
				break
			}
		}
		result["products"] = filtered
		result["count"] = len(filtered)
	}
	result["search_type"] = searchType
	if len(products) == 0 {
		message := "Sorry, I couldn't find any product recommendations matching the criteria."
		if strings.TrimSpace(productType) != "" {
			message = "Sorry, I couldn't find recommendations in the " + strings.TrimSpace(productType) + " category."
		} else if strings.TrimSpace(tags) != "" {
			message = "Sorry, I couldn't find recommendations matching the tags: " + strings.TrimSpace(tags) + "."
		} else if productID != "" {
			message = "Sorry, I couldn't find similar products based on the reference product."
		}
		result["message"] = message
	}
	return result, nil
}

func (s *Service) searchProducts(ctx context.Context, shop *Shop, searchTerm, cursor string, limit int, reverse bool, searchType, excludeID string) (map[string]any, error) {
	if limit < 1 || limit > 50 {
		limit = 8
	}
	result, err := s.GraphQL(ctx, shop, shopifyProductSearchQuery, map[string]any{"searchTerm": searchTerm, "limit": limit, "cursor": nullableValue(cursor), "reverse": reverse})
	if err != nil {
		return nil, err
	}
	productsData := objectPath(result, "data", "products")
	products := make([]any, 0)
	for _, edge := range objects(productsData["edges"]) {
		product := transformProduct(object(edge, "node"))
		if excludeID != "" && stringValue(product["id"]) == excludeID {
			continue
		}
		products = append(products, product)
	}
	page := object(productsData, "pageInfo")
	message := fmt.Sprintf("Found %d product(s) matching your search.", len(products))
	if searchType == "recent products" {
		message = fmt.Sprintf("Found %d recent product(s).", len(products))
	}
	return map[string]any{"success": true, "message": message, "products": products, "count": len(products), "page_info": page, "shop_domain": shop.ShopDomain, "search_query": searchTerm}, nil
}

func (s *Service) GetOrder(ctx context.Context, shop *Shop, orderID string) (map[string]any, error) {
	result, err := s.GraphQL(ctx, shop, shopifyOrderByIDQuery, map[string]any{"id": "gid://shopify/Order/" + orderID})
	if err != nil {
		return nil, err
	}
	order := transformOrder(objectPath(result, "data", "order"))
	if order["id"] == nil {
		return map[string]any{"success": false, "order": nil}, nil
	}
	return map[string]any{"success": true, "order": order}, nil
}

func (s *Service) CustomerSummary(ctx context.Context, shop *Shop, email string) (map[string]any, error) {
	result, err := s.GraphQL(ctx, shop, `query CustomerCommerceSummary($query: String!) { customers(first: 1, query: $query) { edges { node { email numberOfOrders amountSpent { amount currencyCode } } } } }`, map[string]any{"query": "email:" + email})
	if err != nil {
		return nil, err
	}
	edges := objects(objectPath(result, "data", "customers")["edges"])
	if len(edges) == 0 {
		return map[string]any{"success": true, "customer_found": false}, nil
	}
	node := object(edges[0], "node")
	if !strings.EqualFold(stringValue(node["email"]), email) {
		return map[string]any{"success": true, "customer_found": false}, nil
	}
	spent := object(node, "amountSpent")
	return map[string]any{"success": true, "customer_found": true, "order_count": node["numberOfOrders"], "total_spend": spent["amount"], "currency": spent["currencyCode"]}, nil
}

func (s *Service) RefundPreview(ctx context.Context, shop *Shop, orderID string) (map[string]any, error) {
	result, err := s.GraphQL(ctx, shop, `query FullRefundPreview($id: ID!) { order(id: $id) { id name suggestedRefund { maximumRefundableSet { shopMoney { amount currencyCode } } refundLineItems { lineItem { id } quantity restockType location { id } } suggestedTransactions { amount kind gateway parentTransaction { id } } } } }`, map[string]any{"id": "gid://shopify/Order/" + orderID})
	if err != nil {
		return nil, err
	}
	order := objectPath(result, "data", "order")
	suggested := object(order, "suggestedRefund")
	money := objectPath(suggested, "maximumRefundableSet", "shopMoney")
	transactions := make([]any, 0)
	for _, raw := range objects(suggested["suggestedTransactions"]) {
		parent := object(raw, "parentTransaction")
		if stringValue(parent["id"]) == "" || stringValue(raw["amount"]) == "" {
			continue
		}
		transactions = append(transactions, map[string]any{"amount": stringValue(raw["amount"]), "kind": firstNonEmpty(stringValue(raw["kind"]), "REFUND"), "gateway": raw["gateway"], "parentId": parent["id"]})
	}
	lines := make([]any, 0)
	for _, raw := range objects(suggested["refundLineItems"]) {
		line := object(raw, "lineItem")
		if stringValue(line["id"]) == "" || numberValue(raw["quantity"]) == 0 {
			continue
		}
		item := map[string]any{"lineItemId": line["id"], "quantity": int(numberValue(raw["quantity"])), "restockType": firstNonEmpty(stringValue(raw["restockType"]), "NO_RESTOCK")}
		if location := object(raw, "location"); stringValue(location["id"]) != "" {
			item["locationId"] = location["id"]
		}
		lines = append(lines, item)
	}
	return map[string]any{"success": true, "order_name": order["name"], "amount": money["amount"], "currency": money["currencyCode"], "transactions": transactions, "refund_line_items": lines}, nil
}

func (s *Service) Refund(ctx context.Context, shop *Shop, orderID, note string) (map[string]any, error) {
	preview, err := s.RefundPreview(ctx, shop, orderID)
	if err != nil {
		return nil, err
	}
	if len(objects(preview["transactions"])) == 0 || stringValue(preview["amount"]) == "" {
		return map[string]any{"success": false, "message": "Shopify reports no refundable balance for this order"}, nil
	}
	input := map[string]any{"orderId": "gid://shopify/Order/" + orderID, "transactions": preview["transactions"], "refundLineItems": preview["refund_line_items"]}
	if strings.TrimSpace(note) != "" {
		input["note"] = note[:min(len(note), 2000)]
	}
	result, err := s.GraphQL(ctx, shop, `mutation RefundOrder($input: RefundInput!) { refundCreate(input: $input) { refund { id totalRefundedSet { shopMoney { amount currencyCode } } } userErrors { field message } } }`, map[string]any{"input": input})
	if err != nil {
		return nil, err
	}
	if message := userError(result, "refundCreate"); message != "" {
		return map[string]any{"success": false, "message": message}, nil
	}
	refund := objectPath(result, "data", "refundCreate", "refund")
	total := objectPath(refund, "totalRefundedSet", "shopMoney")
	return map[string]any{"success": stringValue(refund["id"]) != "", "refund_id": refund["id"], "amount": firstNonEmpty(stringValue(total["amount"]), stringValue(preview["amount"])), "currency": firstNonEmpty(stringValue(total["currencyCode"]), stringValue(preview["currency"]))}, nil
}

func (s *Service) UpdateShipping(ctx context.Context, shop *Shop, orderID string, address map[string]any) (map[string]any, error) {
	recipient := strings.Fields(stringValue(address["recipient_name"]))
	first, last := "", ""
	if len(recipient) > 0 {
		first = recipient[0]
	}
	if len(recipient) > 1 {
		last = strings.Join(recipient[1:], " ")
	}
	shipping := map[string]any{"firstName": first, "lastName": last, "address1": address["address1"], "city": address["city"], "country": address["country"], "zip": address["zip"]}
	for _, key := range []string{"address2", "province", "phone"} {
		if value := stringValue(address[key]); value != "" {
			shipping[map[string]string{"address2": "address2", "province": "province", "phone": "phone"}[key]] = value
		}
	}
	result, err := s.GraphQL(ctx, shop, `mutation UpdateOrderShippingAddress($input: OrderInput!) { orderUpdate(input: $input) { order { id name shippingAddress { firstName lastName address1 address2 city province country zip phone } } userErrors { field message } } }`, map[string]any{"input": map[string]any{"id": "gid://shopify/Order/" + orderID, "shippingAddress": shipping}})
	if err != nil {
		return nil, err
	}
	if message := userError(result, "orderUpdate"); message != "" {
		return map[string]any{"success": false, "message": message}, nil
	}
	order := objectPath(result, "data", "orderUpdate", "order")
	updated := object(order, "shippingAddress")
	if updated != nil {
		name := strings.TrimSpace(strings.Join(nonEmpty(stringValue(updated["firstName"]), stringValue(updated["lastName"])), " "))
		if name != "" {
			updated["name"] = name
		}
	}
	return map[string]any{"success": stringValue(order["id"]) != "", "order_name": order["name"], "shipping_address": updated}, nil
}

func (s *Service) SendInvoice(ctx context.Context, shop *Shop, orderID, email string) (map[string]any, error) {
	result, err := s.GraphQL(ctx, shop, `mutation SendOrderInvoice($id: ID!, $email: EmailInput!) { orderInvoiceSend(id: $id, email: $email) { order { id name } userErrors { field message } } }`, map[string]any{"id": "gid://shopify/Order/" + orderID, "email": map[string]any{"to": email}})
	if err != nil {
		return nil, err
	}
	if message := userError(result, "orderInvoiceSend"); message != "" {
		return map[string]any{"success": false, "message": message}, nil
	}
	order := objectPath(result, "data", "orderInvoiceSend", "order")
	return map[string]any{"success": stringValue(order["id"]) != "", "order_name": order["name"]}, nil
}

func (s *Service) client() *http.Client {
	if s.HTTPClient != nil {
		return s.HTTPClient
	}
	return http.DefaultClient
}

func (s *Service) apiVersion() string {
	if strings.TrimSpace(s.Config.ShopifyAPIVersion) == "" {
		return "2025-10"
	}
	return s.Config.ShopifyAPIVersion
}

func objectPath(value map[string]any, keys ...string) map[string]any {
	current := value
	for _, key := range keys {
		current = object(current, key)
	}
	return current
}

func object(value any, key string) map[string]any {
	if found, ok := value.(map[string]any); ok {
		if result, ok := found[key].(map[string]any); ok {
			return result
		}
	}
	return map[string]any{}
}

func objects(value any) []map[string]any {
	items, ok := value.([]any)
	if !ok {
		return nil
	}
	result := make([]map[string]any, 0, len(items))
	for _, item := range items {
		if found, ok := item.(map[string]any); ok {
			result = append(result, found)
		}
	}
	return result
}

func transformEdges(edges []map[string]any, transform func(map[string]any) map[string]any) []any {
	result := make([]any, 0, len(edges))
	for _, edge := range edges {
		result = append(result, transform(object(edge, "node")))
	}
	return result
}

func transformProduct(node map[string]any) map[string]any {
	priceRange := object(node, "priceRangeV2")
	if len(priceRange) == 0 {
		priceRange = object(node, "priceRange")
	}
	price := object(priceRange, "minVariantPrice")
	priceMax := object(priceRange, "maxVariantPrice")
	image := any(nil)
	if edges := objects(object(node, "images")["edges"]); len(edges) > 0 {
		imageNode := object(edges[0], "node")
		if stringValue(imageNode["url"]) != "" {
			image = map[string]any{"src": imageNode["url"], "alt": imageNode["altText"]}
		}
	}
	return map[string]any{"id": gidID(node["id"]), "title": node["title"], "description": node["description"], "handle": node["handle"], "status": node["status"], "vendor": node["vendor"], "product_type": node["productType"], "total_inventory": node["totalInventory"], "price": price["amount"], "price_max": priceMax["amount"], "currency": price["currencyCode"], "image": image, "tags": node["tags"], "created_at": node["createdAt"], "updated_at": node["updatedAt"]}
}

func transformOrder(node map[string]any) map[string]any {
	if node == nil {
		return map[string]any{}
	}
	customer := object(node, "customer")
	customerView := any(nil)
	if len(customer) > 0 {
		customerView = map[string]any{"id": gidID(customer["id"]), "first_name": customer["firstName"], "last_name": customer["lastName"], "email": customer["email"], "phone": customer["phone"]}
	}
	money := objectPath(node, "currentTotalPriceSet", "shopMoney")
	original := objectPath(node, "originalTotalPriceSet", "shopMoney")
	lines := make([]any, 0)
	for _, edge := range objects(objectPath(node, "lineItems")["edges"]) {
		line := object(edge, "node")
		variant := object(line, "variant")
		lineMoney := objectPath(line, "originalUnitPriceSet", "shopMoney")
		lineName := line["name"]
		if stringValue(lineName) == "" {
			lineName = line["title"]
		}
		lineImage := object(variant, "image")
		lines = append(lines, map[string]any{"id": gidID(line["id"]), "name": lineName, "title": line["title"], "quantity": line["quantity"], "price": lineMoney["amount"], "currency": lineMoney["currencyCode"], "variant_id": gidID(variant["id"]), "variant_title": variant["title"], "sku": variant["sku"], "image_url": lineImage["url"]})
	}
	fulfillments := make([]any, 0)
	for _, fulfillment := range objects(node["fulfillments"]) {
		tracking := make([]any, 0)
		companies, numbers, urls := make([]any, 0), make([]any, 0), make([]any, 0)
		for _, item := range objects(fulfillment["trackingInfo"]) {
			tracking = append(tracking, map[string]any{"company": item["company"], "number": item["number"], "url": item["url"]})
			if stringValue(item["company"]) != "" {
				companies = append(companies, item["company"])
			}
			if stringValue(item["number"]) != "" {
				numbers = append(numbers, item["number"])
			}
			if stringValue(item["url"]) != "" {
				urls = append(urls, item["url"])
			}
		}
		var company any
		if len(companies) > 0 {
			company = companies[0]
		}
		fulfillments = append(fulfillments, map[string]any{"status": fulfillment["status"], "tracking_company": company, "tracking_numbers": numbers, "tracking_urls": urls, "tracking_info": tracking})
	}
	trackingInfo := make([]any, 0)
	for _, fulfillment := range fulfillments {
		if value, ok := fulfillment.(map[string]any); ok {
			if values, ok := value["tracking_info"].([]any); ok {
				trackingInfo = append(trackingInfo, values...)
			}
		}
	}
	return map[string]any{"id": gidID(node["id"]), "name": node["name"], "email": node["email"], "phone": node["phone"], "processed_at": node["processedAt"], "created_at": node["createdAt"], "updated_at": node["updatedAt"], "cancelled_at": node["cancelledAt"], "cancel_reason": node["cancelReason"], "financial_status": node["displayFinancialStatus"], "fulfillment_status": node["displayFulfillmentStatus"], "total_items": node["subtotalLineItemsQuantity"], "subtotal": objectPath(node, "currentSubtotalPriceSet", "shopMoney")["amount"], "customer": customerView, "total_price": money["amount"], "current_total": money["amount"], "currency": money["currencyCode"], "original_total_price": original["amount"], "shipping_address": object(node, "shippingAddress"), "fulfillments": fulfillments, "tracking_info": trackingInfo, "line_items": lines}
}

func gidID(value any) any {
	text := stringValue(value)
	if text == "" {
		return nil
	}
	if index := strings.LastIndexByte(text, '/'); index >= 0 {
		return text[index+1:]
	}
	return text
}

func userError(result map[string]any, mutation string) string {
	errors := objects(objectPath(result, "data", mutation)["userErrors"])
	parts := make([]string, 0, len(errors))
	for _, item := range errors {
		if value := stringValue(item["message"]); value != "" {
			parts = append(parts, value)
		}
	}
	return strings.Join(parts, "; ")
}

func stringValue(value any) string {
	switch found := value.(type) {
	case string:
		return found
	case fmt.Stringer:
		return found.String()
	case float64:
		return fmt.Sprintf("%g", found)
	case json.Number:
		return found.String()
	default:
		return ""
	}
}
func boolValue(value any) bool      { found, _ := value.(bool); return found }
func numberValue(value any) float64 { found, _ := value.(float64); return found }
func nullableValue(value string) any {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return value
}
func firstNonEmpty(values ...string) string {
	for _, value := range values {
		if value != "" {
			return value
		}
	}
	return ""
}

func escapeShopifySearchValue(value string) string {
	return strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(value), `\`, `\\`), `'`, `\\'`)
}
func nonEmpty(values ...string) []string {
	result := make([]string, 0, len(values))
	for _, value := range values {
		if value != "" {
			result = append(result, value)
		}
	}
	return result
}
func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

const shopifyProductQuery = `query Products($limit: Int!, $after: String) { products(first: $limit, after: $after, query: "status:active") { edges { node { id title description handle status vendor productType totalInventory priceRange { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } images(first: 1) { edges { node { url altText } } } tags createdAt updatedAt } } pageInfo { hasNextPage endCursor } } }`

const shopifyProductByIDQuery = `query GetProduct($id: ID!) { product(id: $id) { id title description handle status vendor productType totalInventory priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } images(first: 1) { edges { node { url altText } } } tags createdAt updatedAt } }`

const shopifyProductSearchQuery = `query SearchProducts($searchTerm: String!, $limit: Int!, $cursor: String, $reverse: Boolean!) { products(first: $limit, query: $searchTerm, after: $cursor, sortKey: CREATED_AT, reverse: $reverse) { edges { node { id title description handle status vendor productType totalInventory priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } } images(first: 1) { edges { node { url altText } } } tags createdAt updatedAt } } pageInfo { hasNextPage endCursor } } }`

const shopifyOrderQuery = `query SearchOrders($query: String!, $limit: Int!, $after: String) { orders(first: $limit, after: $after, query: $query) { edges { node { id name email processedAt createdAt updatedAt cancelledAt cancelReason displayFinancialStatus displayFulfillmentStatus customer { id firstName lastName email phone } currentTotalPriceSet { shopMoney { amount currencyCode } } originalTotalPriceSet { shopMoney { amount currencyCode } } shippingAddress { address1 address2 city country zip phone name } fulfillments { status trackingInfo { company number url } } lineItems(first: 50) { edges { node { id name quantity originalUnitPriceSet { shopMoney { amount currencyCode } } variant { id title sku } } } } } } pageInfo { hasNextPage endCursor } } }`

const shopifyOrderByIDQuery = `query GetOrder($id: ID!) { order(id: $id) { id name email processedAt createdAt updatedAt cancelledAt cancelReason displayFinancialStatus displayFulfillmentStatus customer { id firstName lastName email phone } currentTotalPriceSet { shopMoney { amount currencyCode } } originalTotalPriceSet { shopMoney { amount currencyCode } } shippingAddress { address1 address2 city country zip phone name } fulfillments { status trackingInfo { company number url } } lineItems(first: 50) { edges { node { id name quantity originalUnitPriceSet { shopMoney { amount currencyCode } } variant { id title sku } } } } } }`

const shopifyAIOrderQuery = `query SearchOrders($query: String, $first: Int!) { orders(first: $first, query: $query, sortKey: CREATED_AT, reverse: true) { edges { node { id name email phone createdAt processedAt displayFinancialStatus displayFulfillmentStatus subtotalLineItemsQuantity currentSubtotalPriceSet { shopMoney { amount currencyCode } } currentTotalPriceSet { shopMoney { amount currencyCode } } originalTotalPriceSet { shopMoney { amount currencyCode } } customer { id firstName lastName email phone } lineItems(first: 5) { edges { node { id title name quantity originalUnitPriceSet { shopMoney { amount currencyCode } } variant { id title sku image { url } } } } } shippingAddress { address1 address2 city province provinceCode zip country phone name } fulfillments { trackingInfo { company number url } status } } } pageInfo { hasNextPage endCursor } } }`

var _ = uuid.Nil
