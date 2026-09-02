package httpapi

import (
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/organization"
	"github.com/komi/komi/backend-go/internal/shopify"
)

const shopifyWebhookMaxBody = 4 << 20

func registerShopifyRoutes(r chi.Router, deps Dependencies) {
	manage := requireAllPermissions(deps, "manage_organization")
	r.With(manage).Get("/shopify/auth", beginShopifyOAuth(deps))
	r.Get("/shopify/callback", completeShopifyOAuth(deps))
	r.Post("/shopify/exchange-token", exchangeShopifySessionToken(deps))
	r.With(requireAuthenticated(deps)).Post("/shopify/link-organization", linkShopToOrganization(deps))
	r.With(manage).Get("/shopify/shops", listShopifyShops(deps))
	r.With(manage).Get("/shopify/shops/{shop_id}", getShopifyShop(deps))
	r.With(manage).Delete("/shopify/shops/{shop_id}", deleteShopifyShop(deps))
	r.With(manage).Post("/shopify/link-shop/{shop_id}", linkShopToCurrentOrganization(deps))
	r.With(manage).Get("/shopify/status", shopifyStatus(deps))
	r.Get("/shopify/shop-config-status", shopConfigStatus(deps))
	r.Get("/shopify/organization-domain", shopifyOrganizationDomain(deps))
	r.Put("/shopify/update-domain", updateShopifyOrganizationDomain(deps))
	r.Get("/shopify/connected-agents", connectedShopifyAgents(deps))
	r.Get("/shopify/agent-config/{agent_id}", getShopifyAgentConfig(deps))
	r.Post("/shopify/agent-config/{agent_id}", saveShopifyAgentConfig(deps))
	r.Post("/shopify/webhooks/app-uninstalled", shopifyAppUninstalled(deps))
	r.Post("/shopify/webhooks/customers/data_request", shopifyCustomerDataRequest(deps))
	r.Post("/shopify/webhooks/customers/redact", shopifyCustomerRedact(deps))
	r.Post("/shopify/webhooks/shop/redact", shopifyShopRedact(deps))
}

func configuredShopify(deps Dependencies, w http.ResponseWriter) (*shopify.Service, bool) {
	if deps.Shopify == nil || deps.Shopify.Repo == nil {
		Error(w, http.StatusInternalServerError, "Shopify service is not configured")
		return nil, false
	}
	return deps.Shopify, true
}

func beginShopifyOAuth(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		if service.Config.ShopifyAPIKey == "" || service.Config.ShopifyAPISecret == "" {
			Error(w, http.StatusServiceUnavailable, "Shopify OAuth is not configured")
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		domain, err := shopify.NormalizeDomain(r.URL.Query().Get("shop"))
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		found, err := service.Repo.GetByDomain(r.Context(), domain)
		if err != nil && !errors.Is(err, shopify.ErrNotFound) {
			Error(w, http.StatusInternalServerError, "Failed to load Shopify shop")
			return
		}
		if found != nil && found.OrganizationID != nil && *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		if found == nil {
			found, err = service.Repo.Create(r.Context(), domain, &organizationID, false)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to create Shopify shop")
				return
			}
		}
		state, err := newCRMState()
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to start Shopify authorization")
			return
		}
		if err := service.Repo.SetOAuthState(r.Context(), found.ID, state, time.Now().UTC().Add(10*time.Minute)); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Shopify authorization state")
			return
		}
		http.Redirect(w, r, service.OAuthURL(domain, state), http.StatusFound)
	}
}

func completeShopifyOAuth(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		domain, err := shopify.NormalizeDomain(r.URL.Query().Get("shop"))
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		if !service.ValidateCallback(r.URL, domain, r.URL.Query().Get("hmac")) {
			Error(w, http.StatusUnauthorized, "Invalid Shopify OAuth callback")
			return
		}
		found, err := service.Repo.GetByDomain(r.Context(), domain)
		if errors.Is(err, shopify.ErrNotFound) || found == nil || found.OAuthState == "" || found.OAuthState != r.URL.Query().Get("state") || found.OAuthStateExp == nil || found.OAuthStateExp.Before(time.Now()) {
			if found != nil {
				_ = service.Repo.ClearOAuthState(r.Context(), found.ID)
			}
			Error(w, http.StatusBadRequest, "Shopify OAuth state is invalid or expired")
			return
		}
		accessToken, grantedScope, err := service.ExchangeOAuthCode(r.Context(), domain, r.URL.Query().Get("code"))
		if err != nil {
			Error(w, http.StatusBadRequest, "Failed to obtain access token")
			return
		}
		if _, err := service.Repo.SaveOAuth(r.Context(), domain, accessToken, grantedScope, found.OrganizationID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Shopify connection")
			return
		}
		http.Redirect(w, r, strings.TrimRight(deps.Config.FrontendURL, "/")+"/settings/integrations?shopify=connected", http.StatusFound)
	}
}

func exchangeShopifySessionToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		token := shopifySessionToken(r)
		if token == "" {
			Error(w, http.StatusUnauthorized, "Session token required")
			return
		}
		domain, accessToken, scope, err := service.ExchangeSessionToken(r.Context(), token)
		if err != nil {
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		found, err := service.Repo.GetByDomain(r.Context(), domain)
		if errors.Is(err, shopify.ErrNotFound) {
			found, err = service.Repo.Create(r.Context(), domain, nil, true)
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Shopify shop")
			return
		}
		found, err = service.Repo.SaveOAuth(r.Context(), domain, accessToken, scope, found.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Shopify shop")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"shop_id": found.ID, "shop_domain": found.ShopDomain, "organization_id": found.OrganizationID, "is_installed": true})
	}
}

func linkShopToOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		current, err := currentUser(r, deps)
		if err != nil {
			Error(w, http.StatusUnauthorized, err.Error())
			return
		}
		if !hasAllPermissions(current, "manage_organization") {
			Error(w, http.StatusForbidden, "Insufficient permissions")
			return
		}
		if current.OrganizationID == nil {
			Error(w, http.StatusBadRequest, "User not associated with an organization")
			return
		}
		var body struct {
			ShopID string `json:"shop_id"`
		}
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.ShopID) == "" {
			Error(w, http.StatusBadRequest, "shop_id is required")
			return
		}
		found, err := service.Repo.Get(r.Context(), body.ShopID)
		if errors.Is(err, shopify.ErrNotFound) || found == nil || (found.OrganizationID != nil && *found.OrganizationID != *current.OrganizationID) {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		found, err = service.Repo.LinkOrganization(r.Context(), body.ShopID, *current.OrganizationID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to link organization: "+err.Error())
			return
		}
		_ = service.Repo.UpdateDomainOrganization(r.Context(), *current.OrganizationID, found.ShopDomain)
		JSON(w, http.StatusOK, map[string]any{"success": true, "shop_id": found.ID, "organization_id": current.OrganizationID})
	}
}

func listShopifyShops(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		offset, limit, valid := shopifyPagination(r)
		if !valid {
			Error(w, http.StatusBadRequest, "Invalid pagination")
			return
		}
		values, err := service.Repo.ListByOrganization(r.Context(), organizationID, offset, limit)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch Shopify shops")
			return
		}
		JSON(w, http.StatusOK, values)
	}
}

func getShopifyShop(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		found, err := service.Repo.Get(r.Context(), chi.URLParam(r, "shop_id"))
		if errors.Is(err, shopify.ErrNotFound) || found == nil {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		if found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusForbidden, "This shop does not belong to your organization")
			return
		}
		JSON(w, http.StatusOK, found)
	}
}

func deleteShopifyShop(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		shopID := chi.URLParam(r, "shop_id")
		found, err := service.Repo.Get(r.Context(), shopID)
		if errors.Is(err, shopify.ErrNotFound) || found == nil {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		if found.OrganizationID == nil || *found.OrganizationID != organizationID {
			Error(w, http.StatusForbidden, "This shop does not belong to your organization")
			return
		}
		if err := service.Repo.Delete(r.Context(), shopID, organizationID); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to delete shop")
			return
		}
		JSON(w, http.StatusOK, map[string]string{"status": "success", "message": "Shop successfully disconnected"})
	}
}

func linkShopToCurrentOrganization(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		shopID := chi.URLParam(r, "shop_id")
		found, err := service.Repo.Get(r.Context(), shopID)
		if errors.Is(err, shopify.ErrNotFound) || found == nil {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		if found.OrganizationID != nil && *found.OrganizationID != organizationID {
			Error(w, http.StatusNotFound, "Shop not found")
			return
		}
		if found.OrganizationID == nil {
			found, err = service.Repo.LinkOrganization(r.Context(), shopID, organizationID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Error linking shop to organization")
				return
			}
		}
		JSON(w, http.StatusOK, map[string]any{"success": true, "shop_id": found.ID, "shop_domain": found.ShopDomain, "organization_id": found.OrganizationID})
	}
}

func shopifyStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := jiraOrganization(w, r)
		if !ok {
			return
		}
		values, err := service.Repo.ListByOrganization(r.Context(), organizationID, 0, 100)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error checking Shopify connection status")
			return
		}
		for _, value := range values {
			if value.IsInstalled {
				JSON(w, http.StatusOK, map[string]any{"connected": true, "shop_domain": value.ShopDomain})
				return
			}
		}
		JSON(w, http.StatusOK, map[string]bool{"connected": false})
	}
}

func shopConfigStatus(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		found, ok := requireShopifySessionShop(service, r, w)
		if !ok {
			return
		}
		configs, err := service.Repo.EnabledConfigsByShop(r.Context(), found.ID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error getting shop config status")
			return
		}
		var widgetID *string
		if len(configs) > 0 && deps.Widgets != nil {
			organizationID := uuid.Nil
			if found.OrganizationID != nil {
				organizationID = *found.OrganizationID
			}
			widgets, widgetErr := deps.Widgets.ListByAgent(r.Context(), organizationID, configs[0].AgentID)
			if widgetErr == nil && len(widgets) > 0 {
				value := widgets[0].ID
				widgetID = &value
			}
		}
		JSON(w, http.StatusOK, map[string]any{"shop_id": found.ID, "shop_domain": found.ShopDomain, "is_installed": found.IsInstalled, "agents_connected": len(configs), "widget_id": widgetID, "organization_id": found.OrganizationID})
	}
}

func shopifyOrganizationDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		found, ok := requireShopifySessionShop(service, r, w)
		if !ok {
			return
		}
		if found.OrganizationID == nil {
			Error(w, http.StatusBadRequest, "Shop not linked to organization")
			return
		}
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Organization service is not configured")
			return
		}
		org, err := deps.Organizations.Get(r.Context(), *found.OrganizationID)
		if errors.Is(err, pgx.ErrNoRows) || org == nil {
			Error(w, http.StatusNotFound, "Organization not found")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error retrieving organization domain")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"organization_id": org.ID, "domain": org.Domain, "name": org.Name})
	}
}

func updateShopifyOrganizationDomain(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		found, ok := requireShopifySessionShop(service, r, w)
		if !ok {
			return
		}
		if found.OrganizationID == nil {
			Error(w, http.StatusBadRequest, "Shop not linked to organization")
			return
		}
		var body struct {
			Domain string `json:"domain"`
		}
		if err := decodeJSON(r, &body); err != nil || strings.TrimSpace(body.Domain) == "" {
			Error(w, http.StatusBadRequest, "domain is required")
			return
		}
		if deps.Organizations == nil {
			Error(w, http.StatusInternalServerError, "Organization service is not configured")
			return
		}
		encoded, _ := json.Marshal(strings.TrimSpace(body.Domain))
		org, err := deps.Organizations.Update(r.Context(), *found.OrganizationID, organization.UpdateInput{"domain": encoded})
		if err != nil {
			if strings.Contains(strings.ToLower(err.Error()), "duplicate") || strings.Contains(strings.ToLower(err.Error()), "unique") {
				Error(w, http.StatusBadRequest, "Domain is already connected to another organization")
				return
			}
			Error(w, http.StatusInternalServerError, "Error updating organization domain")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"success": true, "domain": org.Domain, "organization_id": org.ID})
	}
}

func connectedShopifyAgents(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		found, ok := requireShopifySessionShop(service, r, w)
		if !ok {
			return
		}
		if r.URL.Query().Get("shop_id") != found.ID {
			Error(w, http.StatusForbidden, "Shop ID mismatch")
			return
		}
		configs, err := service.Repo.EnabledConfigsByShop(r.Context(), found.ID)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error retrieving connected agents")
			return
		}
		result := make([]map[string]any, 0, len(configs))
		for _, config := range configs {
			if deps.Agents == nil || found.OrganizationID == nil {
				continue
			}
			agent, agentErr := deps.Agents.Get(r.Context(), config.AgentID, *found.OrganizationID)
			if agentErr != nil || agent == nil {
				continue
			}
			result = append(result, map[string]any{"id": agent.ID, "name": agent.Name, "display_name": agent.DisplayName, "description": agent.Description, "is_active": agent.IsActive, "organization_id": agent.OrganizationID})
		}
		JSON(w, http.StatusOK, result)
	}
}

type shopifyAgentConfigRequest struct {
	Enabled bool `json:"enabled"`
}

func getShopifyAgentConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := shopifyHybridOrganization(deps, r, w)
		if !ok {
			return
		}
		agentID, err := parsePathUUID(r, "agent_id")
		if err != nil || !shopifyAgentBelongsToOrg(r, deps, agentID, organizationID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		value, err := service.Repo.AgentConfig(r.Context(), agentID)
		if errors.Is(err, shopify.ErrNotFound) {
			Error(w, http.StatusNotFound, "Shopify configuration not found for this agent")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to get Shopify agent configuration")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}

func saveShopifyAgentConfig(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		organizationID, ok := shopifyHybridOrganization(deps, r, w)
		if !ok {
			return
		}
		agentID, err := parsePathUUID(r, "agent_id")
		if err != nil || !shopifyAgentBelongsToOrg(r, deps, agentID, organizationID) {
			Error(w, http.StatusNotFound, "Agent not found")
			return
		}
		var input shopifyAgentConfigRequest
		if err := decodeJSON(r, &input); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		shops, err := service.Repo.ListByOrganization(r.Context(), organizationID, 0, 100)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load Shopify shops")
			return
		}
		var target *shopify.Shop
		for index := range shops {
			if shops[index].IsInstalled {
				target = &shops[index]
				break
			}
		}
		if input.Enabled && target == nil {
			Error(w, http.StatusBadRequest, "Cannot enable Shopify integration: No installed Shopify shops found for this organization.")
			return
		}
		var shopID *string
		if target != nil && input.Enabled {
			shopID = &target.ID
		}
		value, err := service.Repo.UpsertAgentConfig(r.Context(), agentID, shopID, input.Enabled)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to save Shopify configuration to database.")
			return
		}
		JSON(w, http.StatusOK, value)
	}
}

func shopifyAppUninstalled(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		body, valid := shopifyWebhookBody(service, r)
		if !valid {
			Error(w, http.StatusUnauthorized, "Invalid webhook signature")
			return
		}
		payload, err := decodeShopifyWebhook(body)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}
		domain := firstString(payload, "domain", "myshopify_domain", "shop_domain")
		if domain == "" {
			Error(w, http.StatusBadRequest, "Missing shop domain in payload")
			return
		}
		domain, err = shopify.NormalizeDomain(domain)
		if err != nil {
			Error(w, http.StatusBadRequest, "Missing shop domain in payload")
			return
		}
		found, _ := service.Repo.GetByDomain(r.Context(), domain)
		if err := service.Repo.DeleteByDomain(r.Context(), domain); err != nil {
			deps.Logger.Error().Err(err).Msg("Shopify uninstall cleanup failed")
			JSON(w, http.StatusOK, map[string]any{"success": false, "message": "An internal error occurred while processing the uninstall webhook."})
			return
		}
		if found == nil {
			JSON(w, http.StatusOK, map[string]any{"success": true, "message": "Shop not found, no action needed"})
			return
		}
		JSON(w, http.StatusOK, map[string]any{"success": true, "message": "App uninstalled successfully for " + domain, "shop_domain": domain})
	}
}

func shopifyCustomerDataRequest(deps Dependencies) http.HandlerFunc {
	return shopifyPrivacyWebhook(deps, "Customer data request received and logged")
}

func shopifyCustomerRedact(deps Dependencies) http.HandlerFunc {
	return shopifyPrivacyWebhook(deps, "Customer data redaction request received and logged")
}

func shopifyPrivacyWebhook(deps Dependencies, message string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		body, valid := shopifyWebhookBody(service, r)
		if !valid {
			Error(w, http.StatusUnauthorized, "Invalid webhook signature")
			return
		}
		payload, err := decodeShopifyWebhook(body)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"success": true, "message": message, "shop_domain": firstString(payload, "shop_domain", "domain"), "customer_email": firstNestedString(payload, "customer", "email")})
	}
}

func shopifyShopRedact(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		service, ok := configuredShopify(deps, w)
		if !ok {
			return
		}
		body, valid := shopifyWebhookBody(service, r)
		if !valid {
			Error(w, http.StatusUnauthorized, "Invalid webhook signature")
			return
		}
		payload, err := decodeShopifyWebhook(body)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid JSON payload")
			return
		}
		domain, err := shopify.NormalizeDomain(firstString(payload, "shop_domain", "domain"))
		if err == nil {
			_ = service.Repo.DeleteByDomain(r.Context(), domain)
		}
		JSON(w, http.StatusOK, map[string]any{"success": true, "message": "Shop data redacted successfully", "shop_domain": firstString(payload, "shop_domain", "domain")})
	}
}

func requireShopifySessionShop(service *shopify.Service, r *http.Request, w http.ResponseWriter) (*shopify.Shop, bool) {
	token := shopifySessionToken(r)
	if token == "" {
		Error(w, http.StatusUnauthorized, "Session token required for embedded app")
		return nil, false
	}
	claims, err := service.ValidateSessionToken(token)
	if err != nil {
		w.Header().Set("X-Shopify-Retry-Invalid-Session-Request", "1")
		Error(w, http.StatusUnauthorized, err.Error())
		return nil, false
	}
	dest, _ := claims["dest"].(string)
	domain, err := shopify.NormalizeDomain(dest)
	if err != nil {
		Error(w, http.StatusBadRequest, "Invalid session token: bad shop domain")
		return nil, false
	}
	found, err := service.Repo.GetByDomain(r.Context(), domain)
	if errors.Is(err, shopify.ErrNotFound) || found == nil || !found.IsInstalled {
		Error(w, http.StatusForbidden, "Shop not installed or not found")
		return nil, false
	}
	return found, true
}

func shopifyHybridOrganization(deps Dependencies, r *http.Request, w http.ResponseWriter) (uuid.UUID, bool) {
	if deps.Shopify != nil && shopifySessionToken(r) != "" {
		if found, ok := requireShopifySessionShop(deps.Shopify, r, w); ok && found.OrganizationID != nil {
			return *found.OrganizationID, true
		}
		return uuid.Nil, false
	}
	current, err := currentUser(r, deps)
	if err != nil {
		Error(w, http.StatusUnauthorized, err.Error())
		return uuid.Nil, false
	}
	if !hasAllPermissions(current, "manage_organization") || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "Insufficient permissions")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func shopifyAgentBelongsToOrg(r *http.Request, deps Dependencies, agentID, organizationID uuid.UUID) bool {
	if deps.Agents == nil {
		return false
	}
	found, err := deps.Agents.Get(r.Context(), agentID, organizationID)
	return err == nil && found != nil
}

func shopifySessionToken(r *http.Request) string {
	if value := strings.TrimSpace(r.URL.Query().Get("id_token")); value != "" {
		return value
	}
	parts := strings.SplitN(strings.TrimSpace(r.Header.Get("Authorization")), " ", 2)
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		return strings.TrimSpace(parts[1])
	}
	return ""
}

func shopifyPagination(r *http.Request) (int, int, bool) {
	offset, err := strconv.Atoi(firstNonEmptyString(r.URL.Query().Get("skip"), "0"))
	limit, limitErr := strconv.Atoi(firstNonEmptyString(r.URL.Query().Get("limit"), "100"))
	return offset, limit, err == nil && limitErr == nil && offset >= 0 && limit >= 1 && limit <= 1000
}

func shopifyWebhookBody(service *shopify.Service, r *http.Request) ([]byte, bool) {
	body, err := io.ReadAll(io.LimitReader(r.Body, shopifyWebhookMaxBody))
	return body, err == nil && service.ValidWebhookSignature(body, r.Header.Get("X-Shopify-Hmac-Sha256"))
}

func decodeShopifyWebhook(body []byte) (map[string]any, error) {
	var payload map[string]any
	err := json.Unmarshal(body, &payload)
	return payload, err
}

func firstString(value map[string]any, keys ...string) string {
	for _, key := range keys {
		if text, ok := value[key].(string); ok {
			return text
		}
		if number, ok := value[key].(float64); ok {
			return strconv.FormatFloat(number, 'f', -1, 64)
		}
	}
	return ""
}

func firstNestedString(value map[string]any, objectKey, key string) string {
	if nested, ok := value[objectKey].(map[string]any); ok {
		return firstString(nested, key)
	}
	return ""
}
