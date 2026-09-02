package httpapi

import (
	"errors"
	"net/http"
	"strconv"
	"strings"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/people"
	"github.com/komi/komi/backend-go/internal/user"
)

func registerPeopleRoutes(r chi.Router, deps Dependencies) {
	readPermissions := []string{"view_people", "view_all_chats", "view_assigned_chats", "view_unassigned_chats", "manage_all_chats", "manage_assigned_chats"}
	r.With(requireAnyPermissions(deps, readPermissions...)).Get("/people", listPeople(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Get("/people/stats", peopleStats(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Get("/people/{customer_id}", getPerson(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Get("/people/{customer_id}/crm", getPersonCRM(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Post("/people/{customer_id}/mark-customer", markPersonCustomer(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Patch("/people/{customer_id}", updatePerson(deps))
	r.With(requireAnyPermissions(deps, readPermissions...)).Post("/people/{customer_id}/crm-sync", syncPersonCRM(deps))
}

func listPeople(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		filter, err := parsePeopleFilter(r)
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		items, total, err := deps.People.List(r.Context(), *current.OrganizationID, filter)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("list people failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch people")
			return
		}
		JSON(w, http.StatusOK, people.ListResponse{Items: items, Total: total, Page: filter.Page, PageSize: filter.PageSize})
	}
}

func peopleStats(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, ok := currentUserFromContext(r)
		if !ok || current.OrganizationID == nil {
			Error(w, http.StatusForbidden, "User is not associated with any organization")
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		stats, err := deps.People.Stats(r.Context(), *current.OrganizationID)
		if err != nil {
			deps.Logger.Error().Err(err).Msg("people stats failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch people statistics")
			return
		}
		JSON(w, http.StatusOK, stats)
	}
}

func getPerson(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, customerID, ok := peopleTarget(w, r)
		if !ok {
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		detail, err := deps.People.Detail(r.Context(), *current.OrganizationID, customerID)
		if errors.Is(err, people.ErrNotFound) {
			Error(w, http.StatusNotFound, "Person not found")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get person failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch person")
			return
		}
		JSON(w, http.StatusOK, detail)
	}
}

func markPersonCustomer(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, customerID, ok := peopleTarget(w, r)
		if !ok {
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		detail, err := deps.People.MarkCustomer(r.Context(), *current.OrganizationID, customerID)
		switch {
		case errors.Is(err, people.ErrNotFound):
			Error(w, http.StatusNotFound, "Person not found")
		case errors.Is(err, people.ErrAnonymous):
			Error(w, http.StatusBadRequest, "Add an email or phone first - this person is anonymous")
		case err != nil:
			deps.Logger.Error().Err(err).Msg("mark person as customer failed")
			Error(w, http.StatusInternalServerError, "Failed to update person")
		default:
			JSON(w, http.StatusOK, detail)
		}
	}
}

type personUpdateRequest struct {
	FullName *string `json:"full_name"`
	Phone    *string `json:"phone"`
}

func updatePerson(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, customerID, ok := peopleTarget(w, r)
		if !ok {
			return
		}
		var body personUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		detail, err := deps.People.UpdatePerson(r.Context(), *current.OrganizationID, customerID, people.UpdateInput{FullName: body.FullName, Phone: body.Phone})
		switch {
		case errors.Is(err, people.ErrNotFound):
			Error(w, http.StatusNotFound, "Person not found")
		case errors.Is(err, people.ErrInvalidPhone), errors.Is(err, people.ErrPhoneConflict), errors.Is(err, people.ErrPhoneIdentity):
			Error(w, http.StatusBadRequest, err.Error())
		case err != nil:
			deps.Logger.Error().Err(err).Msg("update person failed")
			Error(w, http.StatusInternalServerError, "Failed to update person")
		default:
			JSON(w, http.StatusOK, detail)
		}
	}
}

func getPersonCRM(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, customerID, ok := peopleTarget(w, r)
		if !ok {
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		status, err := deps.People.CRMStatus(r.Context(), *current.OrganizationID, customerID)
		if errors.Is(err, people.ErrNotFound) {
			Error(w, http.StatusNotFound, "Person not found")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("get person CRM status failed")
			Error(w, http.StatusInternalServerError, "Failed to fetch CRM status")
			return
		}
		JSON(w, http.StatusOK, status)
	}
}

func syncPersonCRM(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		current, customerID, ok := peopleTarget(w, r)
		if !ok {
			return
		}
		if deps.People == nil {
			Error(w, http.StatusInternalServerError, "People service is not configured")
			return
		}
		status, err := deps.People.SyncCRM(r.Context(), *current.OrganizationID, customerID)
		if errors.Is(err, people.ErrNotFound) {
			Error(w, http.StatusNotFound, "Person not found")
			return
		}
		if err != nil {
			deps.Logger.Error().Err(err).Msg("sync person CRM failed")
			Error(w, http.StatusBadRequest, err.Error())
			return
		}
		JSON(w, http.StatusOK, status)
	}
}

func peopleTarget(w http.ResponseWriter, r *http.Request) (*user.User, uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return nil, uuid.Nil, false
	}
	customerID, err := parsePathUUID(r, "customer_id")
	if err != nil {
		Error(w, http.StatusUnprocessableEntity, "Invalid customer ID")
		return nil, uuid.Nil, false
	}
	return current, customerID, true
}

func parsePeopleFilter(r *http.Request) (people.ListFilter, error) {
	page := 1
	if value := strings.TrimSpace(r.URL.Query().Get("page")); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 {
			return people.ListFilter{}, errors.New("page must be greater than or equal to 1")
		}
		page = parsed
	}
	pageSize := 20
	if value := strings.TrimSpace(r.URL.Query().Get("page_size")); value != "" {
		parsed, err := strconv.Atoi(value)
		if err != nil || parsed < 1 || parsed > 100 {
			return people.ListFilter{}, errors.New("page_size must be between 1 and 100")
		}
		pageSize = parsed
	}
	view := r.URL.Query().Get("view")
	if view == "" {
		view = "identified"
	}
	if view != "identified" && view != "anonymous" {
		return people.ListFilter{}, errors.New("view must be identified or anonymous")
	}
	return people.ListFilter{Stage: r.URL.Query().Get("stage"), Search: r.URL.Query().Get("search"), Page: page, PageSize: pageSize, View: view}, nil
}
