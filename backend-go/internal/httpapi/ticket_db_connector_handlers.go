package httpapi

import (
	"errors"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"

	"github.com/komi/komi/backend-go/internal/ticketdb"
)

type ticketDBCreateRequest struct {
	Name                    string            `json:"name"`
	Engine                  string            `json:"engine"`
	Host                    string            `json:"host"`
	Port                    int               `json:"port"`
	Database                string            `json:"database"`
	Username                string            `json:"username"`
	Password                string            `json:"password"`
	Enabled                 *bool             `json:"enabled"`
	AllowedTables           []string          `json:"allowed_tables"`
	MaskedColumns           []string          `json:"masked_columns"`
	RowScope                map[string]string `json:"row_scope"`
	RowScopeKey             string            `json:"row_scope_key"`
	MaxRows                 int               `json:"max_rows"`
	StatementTimeoutMS      int               `json:"statement_timeout_ms"`
	SSHEnabled              bool              `json:"ssh_enabled"`
	SSHHost                 *string           `json:"ssh_host"`
	SSHPort                 int               `json:"ssh_port"`
	SSHUsername             *string           `json:"ssh_username"`
	SSHPassword             *string           `json:"ssh_password"`
	SSHPrivateKey           *string           `json:"ssh_private_key"`
	SSHPrivateKeyPassphrase *string           `json:"ssh_private_key_passphrase"`
}

type ticketDBUpdateRequest struct {
	Name                    *string            `json:"name"`
	Host                    *string            `json:"host"`
	Port                    *int               `json:"port"`
	Database                *string            `json:"database"`
	Username                *string            `json:"username"`
	Password                *string            `json:"password"`
	Enabled                 *bool              `json:"enabled"`
	AllowedTables           *[]string          `json:"allowed_tables"`
	MaskedColumns           *[]string          `json:"masked_columns"`
	RowScope                *map[string]string `json:"row_scope"`
	RowScopeKey             *string            `json:"row_scope_key"`
	MaxRows                 *int               `json:"max_rows"`
	StatementTimeoutMS      *int               `json:"statement_timeout_ms"`
	SSHEnabled              *bool              `json:"ssh_enabled"`
	SSHHost                 *string            `json:"ssh_host"`
	SSHPort                 *int               `json:"ssh_port"`
	SSHUsername             *string            `json:"ssh_username"`
	SSHPassword             *string            `json:"ssh_password"`
	SSHPrivateKey           *string            `json:"ssh_private_key"`
	SSHPrivateKeyPassphrase *string            `json:"ssh_private_key_passphrase"`
}

type ticketDBDiscoverRequest struct {
	ticketDBCreateRequest
}

func registerTicketDBConnectorRoutes(r chi.Router, deps Dependencies) {
	guard := requireAnyPermissions(deps, "manage_ticket_connectors", "manage_organization")
	r.With(guard).Get("/ticket-db-connectors", listTicketDBConnectors(deps))
	r.With(guard).Post("/ticket-db-connectors/discover", discoverTicketDBConnector(deps))
	r.With(guard).Post("/ticket-db-connectors", createTicketDBConnector(deps))
	r.With(guard).Patch("/ticket-db-connectors/{connector_id}", updateTicketDBConnector(deps))
	r.With(guard).Delete("/ticket-db-connectors/{connector_id}", deleteTicketDBConnector(deps))
	r.With(guard).Post("/ticket-db-connectors/{connector_id}/test", testTicketDBConnector(deps))
}

func ticketDBStoreOrError(w http.ResponseWriter, deps Dependencies) ticketdb.Store {
	if deps.TicketDB == nil {
		Error(w, http.StatusServiceUnavailable, "ticket connector storage is not configured")
		return nil
	}
	return deps.TicketDB
}

func ticketDBOrganization(w http.ResponseWriter, r *http.Request) (uuid.UUID, bool) {
	current, ok := currentUserFromContext(r)
	if !ok || current.OrganizationID == nil {
		Error(w, http.StatusForbidden, "User is not associated with any organization")
		return uuid.Nil, false
	}
	return *current.OrganizationID, true
}

func listTicketDBConnectors(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		items, err := store.List(r.Context(), org)
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to fetch connectors")
			return
		}
		JSON(w, http.StatusOK, items)
	}
}

func discoverTicketDBConnector(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		var body ticketDBDiscoverRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		response := store.Discover(r.Context(), org, ticketdb.DiscoverRequest{
			Engine: body.Engine, Host: body.Host, Port: body.Port, Database: body.Database,
			Username: body.Username, Password: body.Password, SSHEnabled: body.SSHEnabled,
			SSHHost: body.SSHHost, SSHPort: body.SSHPort, SSHUsername: body.SSHUsername,
			SSHPassword: body.SSHPassword, SSHPrivateKey: body.SSHPrivateKey,
			SSHPrivateKeyPassphrase: body.SSHPrivateKeyPassphrase,
		})
		JSON(w, http.StatusOK, response)
	}
}

func createTicketDBConnector(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		var body ticketDBCreateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		input := ticketdb.CreateInput{
			Name: body.Name, Engine: body.Engine, Host: body.Host, Port: body.Port, Database: body.Database,
			Username: body.Username, Password: body.Password, Enabled: boolDefault(body.Enabled, true),
			AllowedTables: body.AllowedTables, MaskedColumns: body.MaskedColumns, RowScope: body.RowScope,
			RowScopeKey: body.RowScopeKey, MaxRows: body.MaxRows, StatementTimeoutMS: body.StatementTimeoutMS,
			SSHEnabled: body.SSHEnabled, SSHHost: body.SSHHost, SSHPort: body.SSHPort, SSHUsername: body.SSHUsername,
			SSHPassword: body.SSHPassword, SSHPrivateKey: body.SSHPrivateKey, SSHPrivateKeyPassphrase: body.SSHPrivateKeyPassphrase,
		}
		if input.SSHPort == 0 {
			input.SSHPort = 22
		}
		if input.MaxRows == 0 {
			input.MaxRows = 100
		}
		if input.StatementTimeoutMS == 0 {
			input.StatementTimeoutMS = 5000
		}
		if input.RowScopeKey == "" {
			input.RowScopeKey = "email"
		}
		item, err := store.Create(r.Context(), org, input)
		if errors.Is(err, ticketdb.ErrInvalid) {
			Error(w, http.StatusUnprocessableEntity, "Invalid connector data")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to create connector")
			return
		}
		JSON(w, http.StatusCreated, item)
	}
}

func updateTicketDBConnector(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "connector_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid connector ID")
			return
		}
		var body ticketDBUpdateRequest
		if err := decodeJSON(r, &body); err != nil {
			Error(w, http.StatusUnprocessableEntity, err.Error())
			return
		}
		item, err := store.Update(r.Context(), org, id, ticketdb.UpdateInput{
			Name: body.Name, Host: body.Host, Port: body.Port, Database: body.Database, Username: body.Username,
			Password: body.Password, Enabled: body.Enabled, AllowedTables: body.AllowedTables, MaskedColumns: body.MaskedColumns,
			RowScope: body.RowScope, RowScopeKey: body.RowScopeKey, MaxRows: body.MaxRows, StatementTimeoutMS: body.StatementTimeoutMS,
			SSHEnabled: body.SSHEnabled, SSHHost: body.SSHHost, SSHPort: body.SSHPort, SSHUsername: body.SSHUsername,
			SSHPassword: body.SSHPassword, SSHPrivateKey: body.SSHPrivateKey, SSHPrivateKeyPassphrase: body.SSHPrivateKeyPassphrase,
		})
		if errors.Is(err, ticketdb.ErrNotFound) {
			Error(w, http.StatusNotFound, "Connector not found")
			return
		}
		if errors.Is(err, ticketdb.ErrInvalid) {
			Error(w, http.StatusUnprocessableEntity, "Invalid connector data")
			return
		}
		if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to update connector")
			return
		}
		JSON(w, http.StatusOK, item)
	}
}

func deleteTicketDBConnector(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "connector_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid connector ID")
			return
		}
		if err := store.Delete(r.Context(), org, id); errors.Is(err, ticketdb.ErrNotFound) {
			Error(w, http.StatusNotFound, "Connector not found")
			return
		} else if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to delete connector")
			return
		}
		NoContent(w)
	}
}

func testTicketDBConnector(deps Dependencies) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		store := ticketDBStoreOrError(w, deps)
		if store == nil {
			return
		}
		org, ok := ticketDBOrganization(w, r)
		if !ok {
			return
		}
		id, err := uuid.Parse(chi.URLParam(r, "connector_id"))
		if err != nil {
			Error(w, http.StatusUnprocessableEntity, "Invalid connector ID")
			return
		}
		if _, err := store.Get(r.Context(), org, id); errors.Is(err, ticketdb.ErrNotFound) {
			Error(w, http.StatusNotFound, "Connector not found")
			return
		} else if err != nil {
			Error(w, http.StatusInternalServerError, "Failed to load connector")
			return
		}
		JSON(w, http.StatusOK, store.Test(r.Context(), org, id))
	}
}
