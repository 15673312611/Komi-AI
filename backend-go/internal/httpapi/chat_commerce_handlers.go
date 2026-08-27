package httpapi

import (
	"context"
	"errors"
	"net/http"
	"regexp"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/chat"
	"github.com/chattermate/chattermate/backend-go/internal/shopify"
	"github.com/chattermate/chattermate/backend-go/internal/user"
)

var shopifyOrderIDPattern = regexp.MustCompile(`^[A-Za-z0-9_-]{1,80}$`)

func registerChatCommerceRoutes(r chi.Router, deps Dependencies, guard func(http.Handler) http.Handler) {
	r.With(guard).Get("/chats/{session_id}/shopify", getChatDetail(deps))
	r.With(guard).Get("/chats/{session_id}/shopify/orders", chatShopifyOrders(deps))
	r.With(guard).Get("/chats/{session_id}/customer-summary", chatCustomerSummary(deps))
	r.With(guard).Get("/chats/{session_id}/shopify/products", chatShopifyProducts(deps))
	r.With(guard).Get("/chats/{session_id}/shopify/orders/{order_id}", chatShopifyOrder(deps))
	r.With(guard).Get("/chats/{session_id}/shopify/orders/{order_id}/refund-preview", chatShopifyRefundPreview(deps))
	r.With(guard).Post("/chats/{session_id}/shopify/orders/{order_id}/refund", chatShopifyRefund(deps))
	r.With(guard).Put("/chats/{session_id}/shopify/orders/{order_id}/shipping-address", chatShopifyShippingAddress(deps))
	r.With(guard).Post("/chats/{session_id}/shopify/orders/{order_id}/invoice", chatShopifyInvoice(deps))
}

func loadCommerceChat(w http.ResponseWriter, r *http.Request, deps Dependencies) (*user.User, chat.Visibility, *chat.Detail, bool) {
	if deps.Chats == nil {
		Error(w, http.StatusInternalServerError, "Chat service is not configured")
		return nil, chat.Visibility{}, nil, false
	}
	current, ok := currentUserFromContext(r)
	visibility, visibilityOK := chatVisibilityFromContext(r)
	if !ok || current.OrganizationID == nil || !visibilityOK {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, chat.Visibility{}, nil, false
	}
	sessionID, err := parsePathUUID(r, "session_id")
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session ID format")
		return nil, chat.Visibility{}, nil, false
	}
	allowed, err := deps.Chats.CheckAccess(r.Context(), sessionID, *current.OrganizationID, visibility)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to fetch chat details")
		return nil, chat.Visibility{}, nil, false
	}
	if !allowed {
		Error(w, http.StatusNotFound, "Chat session not found")
		return nil, chat.Visibility{}, nil, false
	}
	detail, err := deps.Chats.GetDetail(r.Context(), sessionID, *current.OrganizationID)
	if err != nil {
		Error(w, http.StatusInternalServerError, "Failed to fetch chat details")
		return nil, chat.Visibility{}, nil, false
	}
	if detail == nil {
		Error(w, http.StatusNotFound, "Chat session not found")
		return nil, chat.Visibility{}, nil, false
	}
	return current, visibility, detail, true
}

func configuredChatShop(r *http.Request, deps Dependencies, detail *chat.Detail, organizationID uuid.UUID) (*shopify.Shop, string) {
	if deps.Shopify == nil || deps.Shopify.Repo == nil || detail == nil {
		return nil, "shopify_not_configured"
	}
	config, err := deps.Shopify.Repo.AgentConfig(r.Context(), detail.Agent.ID)
	if err != nil || config == nil || !config.Enabled || config.ShopID == nil || deps.Shopify.Repo == nil {
		return nil, "shopify_not_configured"
	}
	found, err := deps.Shopify.Repo.Get(r.Context(), *config.ShopID)
	if err != nil || found == nil || !found.IsInstalled || found.AccessToken == "" || found.OrganizationID == nil || organizationID != *found.OrganizationID {
		return nil, "shopify_not_configured"
	}
	return found, ""
}

func customerEmailForCommerce(value string) string {
	value = strings.ToLower(strings.TrimSpace(value))
	if value == "" || strings.Contains(value, "@noemail.com") || strings.HasSuffix(value, ".channel") {
		return ""
	}
	return value
}

func chatShopifyOrders(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		email := customerEmailForCommerce(detail.Customer.Email)
		if email == "" {
			JSON(w, http.StatusOK, map[string]any{"status": "customer_email_missing", "orders": []any{}, "count": 0})
			return
		}
		shop, state := configuredChatShop(r, deps, detail, *current.OrganizationID)
		if state != "" {
			JSON(w, http.StatusOK, map[string]any{"status": state, "orders": []any{}, "count": 0})
			return
		}
		limit := 20
		if value := r.URL.Query().Get("limit"); value != "" {
			if parsed, err := strconv.Atoi(value); err == nil && parsed >= 1 && parsed <= 50 {
				limit = parsed
			}
		}
		result, err := deps.Shopify.SearchOrders(r.Context(), shop, email, r.URL.Query().Get("cursor"), limit)
		if err != nil || !boolValue(result["success"]) {
			JSON(w, http.StatusOK, map[string]any{"status": "shopify_unavailable", "orders": []any{}, "count": 0})
			return
		}
		orders := filterShopifyOrders(result["orders"], email)
		status := "no_orders"
		if len(orders) > 0 {
			status = "ok"
		}
		JSON(w, http.StatusOK, map[string]any{"status": status, "orders": orders, "count": len(orders), "shop_domain": shop.ShopDomain, "has_next_page": result["has_next_page"], "end_cursor": result["end_cursor"], "write_orders_enabled": shopifyHasScope(shop, "write_orders")})
	}
}

func chatCustomerSummary(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		response := map[string]any{"status": "customer_email_missing", "order_count": nil, "total_spend": nil, "currency": nil, "satisfaction_score": nil, "rating_count": 0}
		if deps.DB != nil {
			var average *float64
			var count int64
			if err := deps.DB.QueryRow(r.Context(), `SELECT AVG(rating)::float8, COUNT(*) FROM ratings WHERE organization_id=$1 AND customer_id=$2`, *current.OrganizationID, detail.Customer.ID).Scan(&average, &count); err == nil {
				response["satisfaction_score"] = average
				response["rating_count"] = count
			}
		}
		email := customerEmailForCommerce(detail.Customer.Email)
		if email == "" {
			JSON(w, http.StatusOK, response)
			return
		}
		shop, state := configuredChatShop(r, deps, detail, *current.OrganizationID)
		if state != "" {
			response["status"] = state
			JSON(w, http.StatusOK, response)
			return
		}
		result, err := deps.Shopify.CustomerSummary(r.Context(), shop, email)
		if err != nil || !boolValue(result["success"]) {
			response["status"] = "shopify_unavailable"
			JSON(w, http.StatusOK, response)
			return
		}
		if !boolValue(result["customer_found"]) {
			response["status"] = "no_orders"
			response["order_count"] = 0
			JSON(w, http.StatusOK, response)
			return
		}
		response["status"] = "ok"
		response["order_count"] = result["order_count"]
		response["total_spend"] = result["total_spend"]
		response["currency"] = result["currency"]
		JSON(w, http.StatusOK, response)
	}
}

func chatShopifyProducts(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		shop, state := configuredChatShop(r, deps, detail, *current.OrganizationID)
		if state != "" {
			JSON(w, http.StatusOK, map[string]any{"status": state, "products": []any{}, "count": 0})
			return
		}
		limit := 12
		if value := r.URL.Query().Get("limit"); value != "" {
			if parsed, err := strconv.Atoi(value); err == nil && parsed >= 1 && parsed <= 20 {
				limit = parsed
			}
		}
		result, err := deps.Shopify.Products(r.Context(), shop, limit)
		if err != nil || !boolValue(result["success"]) {
			JSON(w, http.StatusOK, map[string]any{"status": "shopify_unavailable", "products": []any{}, "count": 0})
			return
		}
		JSON(w, http.StatusOK, map[string]any{"status": "ok", "products": result["products"], "count": result["count"], "shop_domain": shop.ShopDomain, "has_next_page": result["has_next_page"]})
	}
}

func chatShopifyOrder(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		orderID := chi.URLParam(r, "order_id")
		if !shopifyOrderIDPattern.MatchString(orderID) {
			Error(w, http.StatusNotFound, "Order not found")
			return
		}
		email := customerEmailForCommerce(detail.Customer.Email)
		if email == "" {
			Error(w, http.StatusNotFound, "Order not found")
			return
		}
		shop, state := configuredChatShop(r, deps, detail, *current.OrganizationID)
		if state != "" {
			Error(w, http.StatusNotFound, "Order not found")
			return
		}
		order, err := verifiedShopifyOrder(r.Context(), deps.Shopify, shop, orderID, email)
		if errors.Is(err, errShopifyOrderNotFound) {
			Error(w, http.StatusNotFound, "Order not found")
			return
		}
		if err != nil {
			Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"status": "ok", "order": order, "shop_domain": shop.ShopDomain})
	}
}

func chatShopifyRefundPreview(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		_, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		shop, order, ok := manageableShopifyOrder(w, r, deps, detail)
		if !ok {
			return
		}
		result, err := deps.Shopify.RefundPreview(r.Context(), shop, chi.URLParam(r, "order_id"))
		if err != nil {
			Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
			return
		}
		if !boolValue(result["success"]) {
			Error(w, http.StatusUnprocessableEntity, stringValue(result["message"]))
			return
		}
		JSON(w, http.StatusOK, map[string]any{"status": "ok", "order_name": result["order_name"], "amount": result["amount"], "currency": result["currency"], "refundable": len(anySlice(result["transactions"])) > 0 && stringValue(result["amount"]) != ""})
		_ = order
	}
}

type shopifyActionRequest struct {
	Confirmed      bool   `json:"confirmed"`
	IdempotencyKey string `json:"idempotency_key"`
}

type shopifyRefundRequest struct {
	shopifyActionRequest
	Note string `json:"note"`
}

type shopifyShippingRequest struct {
	shopifyActionRequest
	RecipientName string `json:"recipient_name"`
	Address1      string `json:"address1"`
	Address2      string `json:"address2"`
	City          string `json:"city"`
	Province      string `json:"province"`
	Country       string `json:"country"`
	Zip           string `json:"zip"`
	Phone         string `json:"phone"`
}

func chatShopifyRefund(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if !shopifyWriteAction(w, r, "Confirm the full refund before submitting it") {
			return
		}
		var body shopifyRefundRequest
		if err := decodeJSON(r, &body); err != nil || !body.Confirmed || !validIdempotency(body.IdempotencyKey) {
			Error(w, http.StatusBadRequest, "Confirm the full refund before submitting it")
			return
		}
		_, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		shop, order, ok := manageableShopifyOrder(w, r, deps, detail)
		if !ok {
			return
		}
		if replay, err := reserveShopifyAction(r.Context(), deps, detail.SessionID, body.IdempotencyKey, "full_refund", chi.URLParam(r, "order_id")); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reserve Shopify action")
			return
		} else if replay {
			JSON(w, http.StatusOK, map[string]any{"status": "ok", "replayed": true})
			return
		}
		result, err := deps.Shopify.Refund(r.Context(), shop, chi.URLParam(r, "order_id"), strings.TrimSpace(body.Note))
		if err != nil {
			Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
			return
		}
		if !boolValue(result["success"]) {
			Error(w, http.StatusUnprocessableEntity, stringValue(result["message"]))
			return
		}
		JSON(w, http.StatusOK, map[string]any{"status": "ok", "refund_id": result["refund_id"], "amount": result["amount"], "currency": result["currency"], "order": order})
	}
}

func chatShopifyShippingAddress(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body shopifyShippingRequest
		if err := decodeJSON(r, &body); err != nil || !body.Confirmed || !validIdempotency(body.IdempotencyKey) {
			Error(w, http.StatusBadRequest, "Confirm the address update before submitting it")
			return
		}
		if strings.TrimSpace(body.Address1) == "" || strings.TrimSpace(body.City) == "" || strings.TrimSpace(body.Country) == "" || strings.TrimSpace(body.Zip) == "" {
			Error(w, http.StatusUnprocessableEntity, "Shipping address is incomplete")
			return
		}
		_, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		shop, _, ok := manageableShopifyOrder(w, r, deps, detail)
		if !ok {
			return
		}
		if replay, err := reserveShopifyAction(r.Context(), deps, detail.SessionID, body.IdempotencyKey, "shipping_address_update", chi.URLParam(r, "order_id")); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reserve Shopify action")
			return
		} else if replay {
			JSON(w, http.StatusOK, map[string]any{"status": "ok", "replayed": true})
			return
		}
		address := map[string]any{"recipient_name": body.RecipientName, "address1": body.Address1, "address2": body.Address2, "city": body.City, "province": body.Province, "country": body.Country, "zip": body.Zip, "phone": body.Phone}
		result, err := deps.Shopify.UpdateShipping(r.Context(), shop, chi.URLParam(r, "order_id"), address)
		if err != nil {
			Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
			return
		}
		if !boolValue(result["success"]) {
			Error(w, http.StatusUnprocessableEntity, stringValue(result["message"]))
			return
		}
		JSON(w, http.StatusOK, map[string]any{"status": "ok", "shipping_address": result["shipping_address"]})
	}
}

func chatShopifyInvoice(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		var body shopifyActionRequest
		if err := decodeJSON(r, &body); err != nil || !body.Confirmed || !validIdempotency(body.IdempotencyKey) {
			Error(w, http.StatusBadRequest, "Confirm resending the invoice before submitting it")
			return
		}
		_, _, detail, ok := loadCommerceChat(w, r, deps)
		if !ok {
			return
		}
		shop, order, ok := manageableShopifyOrder(w, r, deps, detail)
		if !ok {
			return
		}
		email := customerEmailForCommerce(stringValue(order["email"]))
		if email == "" {
			if customer, ok := order["customer"].(map[string]any); ok {
				email = customerEmailForCommerce(stringValue(customer["email"]))
			}
		}
		if email == "" {
			Error(w, http.StatusNotFound, "Order not found")
			return
		}
		if replay, err := reserveShopifyAction(r.Context(), deps, detail.SessionID, body.IdempotencyKey, "invoice_resend", chi.URLParam(r, "order_id")); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to reserve Shopify action")
			return
		} else if replay {
			JSON(w, http.StatusOK, map[string]any{"status": "ok", "replayed": true})
			return
		}
		result, err := deps.Shopify.SendInvoice(r.Context(), shop, chi.URLParam(r, "order_id"), email)
		if err != nil {
			Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
			return
		}
		if !boolValue(result["success"]) {
			Error(w, http.StatusUnprocessableEntity, stringValue(result["message"]))
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "ok"})
	}
}

var errShopifyOrderNotFound = errors.New("shopify order not found")

func verifiedShopifyOrder(ctx context.Context, service *shopify.Service, found *shopify.Shop, orderID, email string) (map[string]any, error) {
	if !shopifyOrderIDPattern.MatchString(orderID) {
		return nil, errShopifyOrderNotFound
	}
	result, err := service.GetOrder(ctx, found, orderID)
	if err != nil {
		return nil, err
	}
	order, _ := result["order"].(map[string]any)
	if !boolValue(result["success"]) || order == nil || !strings.EqualFold(customerEmailForCommerce(stringValue(order["email"])), email) {
		return nil, errShopifyOrderNotFound
	}
	return order, nil
}

func manageableShopifyOrder(w http.ResponseWriter, r *http.Request, deps Dependencies, detail *chat.Detail) (*shopify.Shop, map[string]any, bool) {
	if deps.Sessions == nil {
		Error(w, http.StatusServiceUnavailable, "Session management service is not configured")
		return nil, nil, false
	}
	current, visibility, _, managed, ok := loadActionSession(w, r, deps)
	if !ok || current == nil || managed == nil {
		return nil, nil, false
	}
	if !visibility.CanManageAll && (!visibility.CanManageAssigned || managed.UserID == nil || *managed.UserID != current.ID) {
		Error(w, http.StatusForbidden, "Not enough permissions")
		return nil, nil, false
	}
	shop, state := configuredChatShop(r, deps, detail, *current.OrganizationID)
	if state != "" {
		Error(w, http.StatusNotFound, "Order not found")
		return nil, nil, false
	}
	email := customerEmailForCommerce(detail.Customer.Email)
	if email == "" {
		Error(w, http.StatusNotFound, "Order not found")
		return nil, nil, false
	}
	if !shopifyOrderIDPattern.MatchString(chi.URLParam(r, "order_id")) {
		Error(w, http.StatusNotFound, "Order not found")
		return nil, nil, false
	}
	if !shopifyHasScope(shop, "write_orders") {
		Error(w, http.StatusConflict, "Shopify needs the write_orders permission for this action. Ask an organization administrator to reconnect Shopify from Integrations.")
		return nil, nil, false
	}
	order, err := verifiedShopifyOrder(r.Context(), deps.Shopify, shop, chi.URLParam(r, "order_id"), email)
	if errors.Is(err, errShopifyOrderNotFound) {
		Error(w, http.StatusNotFound, "Order not found")
		return nil, nil, false
	}
	if err != nil {
		Error(w, http.StatusServiceUnavailable, "Shopify is temporarily unavailable")
		return nil, nil, false
	}
	return shop, order, true
}

func reserveShopifyAction(ctx context.Context, deps Dependencies, sessionID uuid.UUID, key, action, orderID string) (bool, error) {
	store, ok := deps.Chats.(chat.ActionStore)
	if !ok || store == nil {
		return false, errors.New("chat message persistence is not configured")
	}
	exists, err := store.FindMessageByClientID(ctx, sessionID, key)
	if err != nil || exists {
		return exists, err
	}
	_, err = store.CreateMessage(ctx, chat.MessageInput{Message: "Shopify action reserved: " + action + " for order " + orderID, MessageType: "private_note", SessionID: sessionID, Attributes: map[string]any{"client_message_id": key, "shopify_action": action, "order_id": orderID}})
	return false, err
}

func shopifyWriteAction(w http.ResponseWriter, r *http.Request, message string) bool {
	if r.Method == http.MethodPost && r.Body == nil {
		Error(w, http.StatusBadRequest, message)
		return false
	}
	return true
}

func validIdempotency(value string) bool {
	if len(value) < 16 || len(value) > 128 {
		return false
	}
	for _, char := range value {
		if !(char >= 'A' && char <= 'Z' || char >= 'a' && char <= 'z' || char >= '0' && char <= '9' || char == '_' || char == '-') {
			return false
		}
	}
	return true
}

func shopifyHasScope(found *shopify.Shop, required string) bool {
	if found == nil || found.Scope == nil {
		return false
	}
	for _, value := range strings.Split(*found.Scope, ",") {
		if strings.TrimSpace(value) == required {
			return true
		}
	}
	return false
}

func filterShopifyOrders(value any, email string) []any {
	items := anySlice(value)
	result := make([]any, 0, len(items))
	for _, item := range items {
		order, ok := item.(map[string]any)
		if !ok {
			continue
		}
		orderEmail := customerEmailForCommerce(stringValue(order["email"]))
		if orderEmail == "" {
			if customer, ok := order["customer"].(map[string]any); ok {
				orderEmail = customerEmailForCommerce(stringValue(customer["email"]))
			}
		}
		if strings.EqualFold(orderEmail, email) {
			result = append(result, order)
		}
	}
	return result
}

func anySlice(value any) []any {
	if values, ok := value.([]any); ok {
		return values
	}
	return nil
}

func boolValue(value any) bool {
	result, _ := value.(bool)
	return result
}

func stringValue(value any) string {
	if result, ok := value.(string); ok {
		return result
	}
	return ""
}
