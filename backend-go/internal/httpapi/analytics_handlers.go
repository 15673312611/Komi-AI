package httpapi

import (
	"errors"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/analytics"
)

func registerAnalyticsRoutes(r chi.Router, deps Dependencies) {
	guard := requireAllPermissions(deps, "view_analytics")
	r.With(guard).Get("/analytics/agent-performance", agentPerformance(deps))
	r.With(guard).Get("/analytics", analyticsOverview(deps))
	r.With(guard).Get("/analytics/customer-analytics", customerAnalytics(deps))
	r.With(guard).Get("/analytics/customer-details/{customer_id}", customerDetails(deps))
	r.With(guard).Get("/analytics/sentiment", sentimentAnalytics(deps))
	r.With(guard).Get("/analytics/session-sentiment/{session_id}", sessionSentiment(deps))
}

func analyticsStoreOrError(w http.ResponseWriter, deps Dependencies) analytics.Store {
	if deps.Analytics == nil {
		Error(w, http.StatusServiceUnavailable, "analytics storage is not configured")
		return nil
	}
	return deps.Analytics
}

func analyticsOrganization(r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func analyticsWindow(r *http.Request) (analytics.TimeRange, error) {
	return analytics.ParseTimeRange(r.URL.Query().Get("time_range"), time.Now().UTC())
}

func agentPerformance(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		window, err := analyticsWindow(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid time range")
			return
		}
		result, err := store.AgentPerformance(r.Context(), org, window)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error getting agent performance analytics")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func analyticsOverview(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		window, err := analyticsWindow(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid time range")
			return
		}
		result, err := store.Overview(r.Context(), org, window)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error getting analytics")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func customerAnalytics(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		window, err := analyticsWindow(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid time range")
			return
		}
		page, err := parseQueryInt(r.URL.Query().Get("page"), 1, 1, 0)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid page")
			return
		}
		pageSize, err := parseQueryInt(r.URL.Query().Get("page_size"), 10, 1, 100)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid page_size")
			return
		}
		result, err := store.CustomerAnalytics(r.Context(), org, window, page, pageSize)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error getting customer analytics")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func customerDetails(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		customerID, err := uuid.Parse(chi.URLParam(r, "customer_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid customer id")
			return
		}
		if _, err := analyticsWindow(r); err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid time range")
			return
		}
		result, err := store.CustomerDetails(r.Context(), org, customerID)
		if err != nil {
			writeAnalyticsError(w, err, "Error getting customer details")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func sentimentAnalytics(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		window, err := analyticsWindow(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid time range")
			return
		}
		result, err := store.Sentiment(r.Context(), org, window)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Error getting sentiment analytics")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func sessionSentiment(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := analyticsStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := analyticsOrganization(r)
		if !ok {
			Error(w, http.StatusUnauthorized, "Not authenticated")
			return
		}
		sessionID, err := uuid.Parse(chi.URLParam(r, "session_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid session id")
			return
		}
		result, err := store.SessionSentiment(r.Context(), org, sessionID)
		if err != nil {
			writeAnalyticsError(w, err, "Error getting session sentiment")
			return
		}
		JSON(w, http.StatusOK, result)
	}
}

func writeAnalyticsError(w http.ResponseWriter, err error, fallback string) {
	if errors.Is(err, analytics.ErrNotFound) {
		Error(w, http.StatusNotFound, "Customer or session not found")
		return
	}
	Error(w, http.StatusInternalServerError, fallback)
}
