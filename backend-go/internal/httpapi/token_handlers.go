package httpapi

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/jackc/pgx/v5"

	"github.com/komi/komi/backend-go/internal/auth"
	"github.com/komi/komi/backend-go/internal/customer"
	"github.com/komi/komi/backend-go/internal/widgetapp"
)

const (
	customDataMaxKeys  = 20
	customDataMaxBytes = 4096
)

type generateTokenRequest struct {
	WidgetID      string         `json:"widget_id"`
	CustomerEmail string         `json:"customer_email"`
	CustomerName  string         `json:"customer_name"`
	CustomData    map[string]any `json:"custom_data"`
	TTLSeconds    *int           `json:"ttl_seconds"`
}

type revokeTokenRequest struct {
	Token  string `json:"token"`
	Reason string `json:"reason"`
}

func registerTokenRoutes(r chi.Router, deps Dependencies) {
	r.Post("/generate-token", generateWidgetToken(deps))
	r.Post("/verify-token", verifyWidgetToken(deps))
	r.Post("/revoke-token", revokeWidgetToken(deps))
}

func generateWidgetToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		app, status, detail := validateWidgetAPIKey(r, deps)
		if app == nil {
			Error(w, status, detail)
			return
		}
		var body generateTokenRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if strings.TrimSpace(body.WidgetID) == "" {
			Error(w, http.StatusUnprocessableEntity, "widget_id is required")
			return
		}
		if len(body.CustomData) > customDataMaxKeys {
			Error(w, http.StatusUnprocessableEntity, fmt.Sprintf("custom_data supports at most %d keys", customDataMaxKeys))
			return
		}
		if len(body.CustomData) > 0 {
			encoded, err := json.Marshal(body.CustomData)
			if err != nil || len(encoded) > customDataMaxBytes {
				Error(w, http.StatusUnprocessableEntity, fmt.Sprintf("custom_data must be at most %d bytes when serialized", customDataMaxBytes))
				return
			}
		}
		ttl := 3600
		if body.TTLSeconds != nil && *body.TTLSeconds != 0 {
			ttl = *body.TTLSeconds
		}
		if ttl < 60 || ttl > 86400 {
			Error(w, http.StatusBadRequest, "ttl_seconds must be between 60 and 86400 (1 minute to 24 hours) for security and performance reasons")
			return
		}
		if deps.Widgets == nil || deps.Customers == nil || deps.Auth == nil {
			Error(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}
		foundWidget, err := deps.Widgets.Get(r.Context(), body.WidgetID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("widget lookup for token failed")
			Error(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}
		if foundWidget == nil || foundWidget.OrganizationID != app.OrganizationID {
			Error(w, http.StatusNotFound, fmt.Sprintf("Widget '%s' not found", body.WidgetID))
			return
		}

		var foundCustomer *customer.Customer
		customerEmail := strings.TrimSpace(body.CustomerEmail)
		if customerEmail != "" {
			foundCustomer, err = deps.Customers.GetByEmail(r.Context(), customerEmail, foundWidget.OrganizationID)
			if err != nil {
				Error(w, http.StatusInternalServerError, "Failed to generate token")
				return
			}
			if foundCustomer == nil {
				name := optionalString(body.CustomerName)
				foundCustomer, err = deps.Customers.Create(r.Context(), customerEmail, name, foundWidget.OrganizationID, body.CustomData, true)
			} else {
				name := optionalString(body.CustomerName)
				foundCustomer, err = deps.Customers.UpdateIdentity(r.Context(), foundCustomer.ID, name, true)
				if err == nil && len(body.CustomData) > 0 {
					foundCustomer, err = deps.Customers.UpdateMetaData(r.Context(), foundCustomer.ID, body.CustomData)
				}
			}
		} else {
			name := body.CustomerName
			if strings.TrimSpace(name) == "" {
				name = "Anonymous"
			}
			anonymousEmail := fmt.Sprintf("anonymous-%d@%s.local", time.Now().UnixMilli(), foundWidget.OrganizationID.String())
			foundCustomer, err = deps.Customers.Create(r.Context(), anonymousEmail, &name, foundWidget.OrganizationID, body.CustomData, false)
		}
		if err != nil || foundCustomer == nil {
			Error(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}
		if customerEmail == "" {
			customerEmail = foundCustomer.Email
		}
		customerName := body.CustomerName
		if strings.TrimSpace(customerName) == "" && foundCustomer.FullName != nil {
			customerName = *foundCustomer.FullName
		}
		extra := map[string]any{
			"widget_id":      body.WidgetID,
			"customer_email": customerEmail,
			"customer_name":  customerName,
			"customer_id":    foundCustomer.ID.String(),
		}
		if len(body.CustomData) > 0 {
			extra["custom_data"] = body.CustomData
		}
		now := time.Now().UTC()
		token, _, err := deps.Auth.CreateConversationTokenWithTTL(body.WidgetID, foundCustomer.ID.String(), "", extra, time.Duration(ttl)*time.Second)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to generate token")
			return
		}
		JSON(w, http.StatusCreated, map[string]any{
			"success": true,
			"data": map[string]any{
				"token":      token,
				"widget_id":  body.WidgetID,
				"expires_in": ttl,
				"expires_at": formatPythonTime(now.Add(time.Duration(ttl) * time.Second)),
				"created_at": formatPythonTime(now),
			},
			"message": fmt.Sprintf("Token generated successfully. Expires in %d seconds.", ttl),
		})
	}
}

func verifyWidgetToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if app, status, detail := validateWidgetAPIKey(r, deps); app == nil {
			Error(w, status, detail)
			return
		}
		token := r.URL.Query().Get("token")
		widgetID := r.URL.Query().Get("widget_id")
		if deps.Auth == nil {
			Error(w, http.StatusInternalServerError, "Failed to verify token")
			return
		}
		claims, err := deps.Auth.VerifyConversationToken(token)
		if err != nil {
			Error(w, http.StatusBadRequest, "Token is invalid or has been revoked")
			return
		}
		if claims.WidgetID != widgetID {
			Error(w, http.StatusBadRequest, "Token widget_id does not match provided widget_id")
			return
		}
		JSON(w, http.StatusOK, map[string]any{"valid": true, "token_data": tokenClaimsMap(claims)})
	}
}

func revokeWidgetToken(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		if app, status, detail := validateWidgetAPIKey(r, deps); app == nil {
			Error(w, status, detail)
			return
		}
		var body revokeTokenRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if strings.TrimSpace(body.Token) == "" {
			Error(w, http.StatusBadRequest, "Token cannot be empty")
			return
		}
		if deps.Auth == nil {
			Error(w, http.StatusInternalServerError, "Failed to revoke token")
			return
		}
		claims, err := deps.Auth.DecodeConversationTokenForRevocation(body.Token)
		if err != nil {
			Error(w, http.StatusBadRequest, "Invalid token format")
			return
		}
		if strings.TrimSpace(claims.JTI) == "" {
			Error(w, http.StatusBadRequest, "Token does not support revocation (missing JTI claim)")
			return
		}
		if err := deps.Auth.RevokeConversationToken(claims.JTI); err != nil {
			Error(w, http.StatusInternalServerError, "Failed to revoke token")
			return
		}
		reason := body.Reason
		if strings.TrimSpace(reason) == "" {
			reason = "Manual revocation via API"
		}
		now := time.Now().UTC()
		JSON(w, http.StatusOK, map[string]any{
			"success":    true,
			"message":    fmt.Sprintf("Token revoked successfully. Reason: %s", reason),
			"revoked_at": formatPythonTime(now),
		})
	}
}

func validateWidgetAPIKey(r *http.Request, deps Dependencies) (*widgetapp.App, int, string) {
	header := r.Header.Get("Authorization")
	if !strings.HasPrefix(header, "Bearer ") {
		return nil, http.StatusUnauthorized, "Missing or invalid Authorization header. Use 'Bearer YOUR_API_KEY'"
	}
	apiKey := strings.TrimPrefix(header, "Bearer ")
	if apiKey == "" {
		return nil, http.StatusUnauthorized, "API key cannot be empty"
	}
	if deps.WidgetApps == nil {
		return nil, http.StatusInternalServerError, "Failed to validate API key"
	}
	app, err := deps.WidgetApps.ValidateAPIKey(r.Context(), apiKey)
	if errors.Is(err, pgx.ErrNoRows) || app == nil {
		return nil, http.StatusUnauthorized, "Invalid API key"
	}
	if err != nil {
		return nil, http.StatusInternalServerError, "Failed to validate API key"
	}
	return app, 0, ""
}

func tokenClaimsMap(claims auth.Claims) map[string]any {
	result := map[string]any{
		"type":      claims.TokenType,
		"widget_id": claims.WidgetID,
		"jti":       claims.JTI,
	}
	if claims.Subject != "" {
		result["sub"] = claims.Subject
	}
	if claims.Email != "" {
		result["email"] = claims.Email
	}
	if claims.CustomerID != "" {
		result["customer_id"] = claims.CustomerID
	}
	if claims.CustomerEmail != "" {
		result["customer_email"] = claims.CustomerEmail
	}
	if claims.CustomerName != "" {
		result["customer_name"] = claims.CustomerName
	}
	if claims.Source != "" {
		result["source"] = claims.Source
	}
	if claims.CustomData != nil {
		result["custom_data"] = claims.CustomData
	}
	if claims.IssuedAt != nil {
		result["iat"] = claims.IssuedAt.Unix()
	}
	if claims.ExpiresAt != nil {
		result["exp"] = claims.ExpiresAt.Unix()
	}
	return result
}

func optionalString(value string) *string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	return &value
}

func formatPythonTime(value time.Time) string {
	return value.Format("2006-01-02T15:04:05.999999-07:00")
}
