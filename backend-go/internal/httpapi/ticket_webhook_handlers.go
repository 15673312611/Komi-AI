package httpapi

import (
	"crypto/subtle"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/chattermate/chattermate/backend-go/internal/ticketing"
)

const alertDedupSimilarity = 0.95

func registerTicketWebhookRoutes(r chi.Router, deps Dependencies) {
	r.Post("/tickets/webhooks/alerts/{org_id}/{secret}", alertIntake(deps))
}

func alertIntake(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		organizationID, err := uuid.Parse(chi.URLParam(r, "org_id"))
		if err != nil || organizationID == uuid.Nil || deps.Tickets == nil {
			Error(w, http.StatusNotFound, "Not found")
			return
		}
		settings, err := deps.Tickets.GetSettings(r.Context(), organizationID)
		if err != nil || !settings.AlertWebhookEnabled || settings.AlertWebhookSecret == nil ||
			subtle.ConstantTimeCompare([]byte(*settings.AlertWebhookSecret), []byte(chi.URLParam(r, "secret"))) != 1 {
			Error(w, http.StatusNotFound, "Not found")
			return
		}

		payload, err := decodeAlertPayload(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		title, description, severity := parseAlert(payload)
		priority := alertPriority(severity)
		alerts, ok := deps.Tickets.(ticketing.AlertStore)
		if !ok {
			Error(w, http.StatusServiceUnavailable, "ticket storage is not configured")
			return
		}

		embedding := ticketing.AlertEmbedding("[ALERT] "+title, description)
		duplicates, err := alerts.FindSimilarOpenAlerts(r.Context(), organizationID, embedding, alertDedupSimilarity)
		if err != nil {
			// Similarity is an optimization. A provider outage or an older schema
			// must not drop an alert that should become a ticket.
			deps.Logger.Warn().Err(err).Msg("alert similarity lookup failed")
		}
		if len(duplicates) > 0 {
			duplicate := duplicates[0]
			if err := alerts.AddSystemComment(r.Context(), organizationID, duplicate.TicketID, "Alert fired again: "+title, duplicate.Similarity); err != nil {
				deps.Logger.Error().Err(err).Msg("append duplicate alert activity failed")
				Error(w, http.StatusInternalServerError, "Failed to update ticket")
				return
			}
			if deps.Realtime != nil {
				deps.Realtime.EmitTicketUpdate(organizationID, duplicate.TicketID, "comment", nil)
			}
			JSON(w, http.StatusAccepted, map[string]any{"deduplicated": true, "ticket": duplicate.DisplayNumber})
			return
		}

		var descriptionValue *string
		if description != "" {
			descriptionValue = &description
		}
		created, err := alerts.CreateAlert(r.Context(), organizationID, ticketing.CreateInput{
			Title: "[ALERT] " + title, Description: descriptionValue, Priority: priority, Source: "api", Embedding: &embedding,
		})
		if err != nil {
			deps.Logger.Error().Err(err).Str("organization_id", organizationID.String()).Msg("alert intake failed")
			Error(w, http.StatusInternalServerError, "Failed to create ticket")
			return
		}
		if deps.Realtime != nil {
			deps.Realtime.EmitTicketUpdate(organizationID, created.Ticket.ID, "created", nil)
		}
		JSON(w, http.StatusAccepted, map[string]any{"deduplicated": false, "ticket": created.Ticket.DisplayNumber})
	}
}

func decodeAlertPayload(r *http.Request) (map[string]any, error) {
	decoder := json.NewDecoder(io.LimitReader(r.Body, 1<<20))
	var payload map[string]any
	if err := decoder.Decode(&payload); err != nil {
		return nil, errors.New("Invalid JSON body")
	}
	if payload == nil {
		return nil, errors.New("JSON body must be an object")
	}
	return payload, nil
}

func parseAlert(payload map[string]any) (string, string, string) {
	annotations := alertObject(payload["commonAnnotations"])
	labels := alertObject(payload["commonLabels"])
	title := firstAlertValue(payload, "title", "ruleName", "alert_name")
	if title == "" {
		title = firstAlertValue(annotations, "summary")
	}
	if title == "" {
		title = firstAlertValue(labels, "alertname")
	}
	if title == "" {
		title = "Infrastructure alert"
	}
	description := firstAlertValue(payload, "description", "message", "body")
	if description == "" {
		description = firstAlertValue(annotations, "description")
	}
	severity := strings.ToLower(firstAlertValue(payload, "severity", "priority"))
	if severity == "" {
		severity = strings.ToLower(firstAlertValue(labels, "severity"))
	}
	return truncateAlert(title, 500), truncateAlert(description, 20000), severity
}

func alertPriority(severity string) string {
	switch strings.ToLower(strings.TrimSpace(severity)) {
	case "critical", "disaster":
		return "urgent"
	case "error":
		return "high"
	case "warning":
		return "medium"
	case "info":
		return "low"
	default:
		return "high"
	}
}

func alertObject(value any) map[string]any {
	if object, ok := value.(map[string]any); ok {
		return object
	}
	return map[string]any{}
}

func firstAlertValue(values map[string]any, keys ...string) string {
	for _, key := range keys {
		if value, ok := values[key]; ok && value != nil {
			text := alertValueString(value)
			if text != "" {
				return text
			}
		}
	}
	return ""
}

func alertValueString(value any) string {
	if text, ok := value.(string); ok {
		return text
	}
	if number, ok := value.(json.Number); ok {
		return number.String()
	}
	encoded, err := json.Marshal(value)
	if err != nil {
		return fmt.Sprint(value)
	}
	return string(encoded)
}

func truncateAlert(value string, max int) string {
	runes := []rune(value)
	if len(runes) > max {
		return string(runes[:max])
	}
	return value
}
