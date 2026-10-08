package ticketdb

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/go-sql-driver/mysql"
	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	_ "github.com/jackc/pgx/v5/stdlib"

	"github.com/komi/komi/backend-go/internal/encryption"
)

var (
	ErrNotFound = errors.New("connector not found")
	ErrInvalid  = errors.New("invalid connector data")
)

var identifierPattern = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_$]*$`)

type Connector struct {
	ID                 uuid.UUID         `json:"id"`
	Name               string            `json:"name"`
	Engine             string            `json:"engine"`
	Host               string            `json:"host"`
	Port               int               `json:"port"`
	Database           string            `json:"database"`
	Username           string            `json:"username"`
	Enabled            bool              `json:"enabled"`
	AllowedTables      []string          `json:"allowed_tables"`
	MaskedColumns      []string          `json:"masked_columns"`
	RowScope           map[string]string `json:"row_scope"`
	RowScopeKey        string            `json:"row_scope_key"`
	MaxRows            int               `json:"max_rows"`
	StatementTimeoutMS int               `json:"statement_timeout_ms"`
	SSHEnabled         bool              `json:"ssh_enabled"`
	SSHHost            *string           `json:"ssh_host"`
	SSHPort            int               `json:"ssh_port"`
	SSHUsername        *string           `json:"ssh_username"`
	LastTestAt         *time.Time        `json:"last_test_at"`
	LastTestOK         *bool             `json:"last_test_ok"`
	CreatedAt          *time.Time        `json:"created_at"`
}

type DiscoverRequest struct {
	Engine                  string  `json:"engine"`
	Host                    string  `json:"host"`
	Port                    int     `json:"port"`
	Database                string  `json:"database"`
	Username                string  `json:"username"`
	Password                string  `json:"password"`
	SSHEnabled              bool    `json:"ssh_enabled"`
	SSHHost                 *string `json:"ssh_host"`
	SSHPort                 int     `json:"ssh_port"`
	SSHUsername             *string `json:"ssh_username"`
	SSHPassword             *string `json:"ssh_password"`
	SSHPrivateKey           *string `json:"ssh_private_key"`
	SSHPrivateKeyPassphrase *string `json:"ssh_private_key_passphrase"`
}

type CreateInput struct {
	Name                    string
	Engine                  string
	Host                    string
	Port                    int
	Database                string
	Username                string
	Password                string
	Enabled                 bool
	AllowedTables           []string
	MaskedColumns           []string
	RowScope                map[string]string
	RowScopeKey             string
	MaxRows                 int
	StatementTimeoutMS      int
	SSHEnabled              bool
	SSHHost                 *string
	SSHPort                 int
	SSHUsername             *string
	SSHPassword             *string
	SSHPrivateKey           *string
	SSHPrivateKeyPassphrase *string
}

type UpdateInput struct {
	Name                    *string
	Engine                  *string
	Host                    *string
	Port                    *int
	Database                *string
	Username                *string
	Password                *string
	Enabled                 *bool
	AllowedTables           *[]string
	MaskedColumns           *[]string
	RowScope                *map[string]string
	RowScopeKey             *string
	MaxRows                 *int
	StatementTimeoutMS      *int
	SSHEnabled              *bool
	SSHHost                 *string
	SSHPort                 *int
	SSHUsername             *string
	SSHPassword             *string
	SSHPrivateKey           *string
	SSHPrivateKeyPassphrase *string
}

type Column struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

type Table struct {
	Schema  string   `json:"schema"`
	Table   string   `json:"table"`
	Columns []Column `json:"columns"`
}

type DiscoverResponse struct {
	OK     bool    `json:"ok"`
	Error  *string `json:"error,omitempty"`
	Tables []Table `json:"tables"`
}

type Store interface {
	List(context.Context, uuid.UUID) ([]Connector, error)
	Create(context.Context, uuid.UUID, CreateInput) (*Connector, error)
	Get(context.Context, uuid.UUID, uuid.UUID) (*Connector, error)
	Update(context.Context, uuid.UUID, uuid.UUID, UpdateInput) (*Connector, error)
	Delete(context.Context, uuid.UUID, uuid.UUID) error
	Discover(context.Context, uuid.UUID, DiscoverRequest) DiscoverResponse
	Test(context.Context, uuid.UUID, uuid.UUID) DiscoverResponse
}

type Repository struct{ pool *pgxpool.Pool }

func NewRepository(pool *pgxpool.Pool) *Repository {
	if pool == nil {
		return nil
	}
	return &Repository{pool: pool}
}

func validateCommon(engine, host, databaseName, username string, port int) error {
	engine = strings.ToLower(strings.TrimSpace(engine))
	if engine != "postgresql" && engine != "mysql" || strings.TrimSpace(host) == "" || strings.TrimSpace(databaseName) == "" || strings.TrimSpace(username) == "" || port < 1 || port > 65535 {
		return ErrInvalid
	}
	return nil
}

func validateLists(allowed, masked []string, rowScope map[string]string, rowScopeKey string, maxRows, timeout int) error {
	if len(allowed) > 500 || len(masked) > 500 || len(rowScope) > 500 || maxRows < 1 || maxRows > 1000 || timeout < 100 || timeout > 30000 {
		return ErrInvalid
	}
	if rowScopeKey == "" {
		rowScopeKey = "email"
	}
	if rowScopeKey != "email" && rowScopeKey != "phone" {
		return ErrInvalid
	}
	for table, column := range rowScope {
		if !validTableRef(table) || !identifierPattern.MatchString(strings.TrimSpace(column)) {
			return ErrInvalid
		}
	}
	return nil
}

func validTableRef(value string) bool {
	parts := strings.Split(strings.TrimSpace(value), ".")
	if len(parts) > 2 || len(parts) == 0 {
		return false
	}
	for _, part := range parts {
		if !identifierPattern.MatchString(part) {
			return false
		}
	}
	return true
}

func (r *Repository) List(ctx context.Context, organizationID uuid.UUID) ([]Connector, error) {
	rows, err := r.pool.Query(ctx, connectorSelect+` WHERE organization_id = $1 ORDER BY created_at`, organizationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	result := make([]Connector, 0)
	for rows.Next() {
		value, err := scanConnector(rows)
		if err != nil {
			return nil, err
		}
		result = append(result, *value)
	}
	return result, rows.Err()
}

func (r *Repository) Get(ctx context.Context, organizationID, id uuid.UUID) (*Connector, error) {
	value, err := scanConnector(r.pool.QueryRow(ctx, connectorSelect+` WHERE id = $1 AND organization_id = $2`, id, organizationID))
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, ErrNotFound
	}
	return value, err
}

func (r *Repository) Create(ctx context.Context, organizationID uuid.UUID, input CreateInput) (*Connector, error) {
	if err := validateCommon(input.Engine, input.Host, input.Database, input.Username, input.Port); err != nil || strings.TrimSpace(input.Name) == "" || strings.TrimSpace(input.Password) == "" {
		return nil, ErrInvalid
	}
	if err := validateLists(input.AllowedTables, input.MaskedColumns, input.RowScope, input.RowScopeKey, input.MaxRows, input.StatementTimeoutMS); err != nil {
		return nil, err
	}
	password, err := encryption.Encrypt(input.Password)
	if err != nil {
		return nil, err
	}
	allowed, _ := json.Marshal(input.AllowedTables)
	masked, _ := json.Marshal(input.MaskedColumns)
	scope, _ := json.Marshal(input.RowScope)
	sshPassword, sshKey, sshPassphrase, err := encryptSSHSecrets(input.SSHPassword, input.SSHPrivateKey, input.SSHPrivateKeyPassphrase)
	if err != nil {
		return nil, err
	}
	id := uuid.New()
	_, err = r.pool.Exec(ctx, `
INSERT INTO ticket_db_connectors
 (id, organization_id, name, engine, host, port, database, username, encrypted_password,
  enabled, allowed_tables, masked_columns, row_scope, row_scope_key, max_rows, statement_timeout_ms,
  ssh_enabled, ssh_host, ssh_port, ssh_username, encrypted_ssh_password, encrypted_ssh_private_key,
  encrypted_ssh_key_passphrase, created_at, updated_at)
VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,NOW(),NOW())`,
		id, organizationID, strings.TrimSpace(input.Name), strings.ToLower(input.Engine), input.Host, input.Port,
		input.Database, input.Username, password, input.Enabled, allowed, masked, scope,
		defaultString(input.RowScopeKey, "email"), input.MaxRows, input.StatementTimeoutMS, input.SSHEnabled,
		input.SSHHost, defaultInt(input.SSHPort, 22), input.SSHUsername, sshPassword, sshKey, sshPassphrase)
	if err != nil {
		return nil, err
	}
	return r.Get(ctx, organizationID, id)
}

func (r *Repository) Update(ctx context.Context, organizationID, id uuid.UUID, input UpdateInput) (*Connector, error) {
	if _, err := r.Get(ctx, organizationID, id); err != nil {
		return nil, err
	}
	sets := make([]string, 0)
	args := []any{id, organizationID}
	add := func(column string, value any) {
		args = append(args, value)
		sets = append(sets, fmt.Sprintf("%s = $%d", column, len(args)))
	}
	if input.Name != nil {
		if strings.TrimSpace(*input.Name) == "" {
			return nil, ErrInvalid
		}
		add("name", strings.TrimSpace(*input.Name))
	}
	if input.Engine != nil {
		if *input.Engine != "postgresql" && *input.Engine != "mysql" {
			return nil, ErrInvalid
		}
		add("engine", *input.Engine)
	}
	if input.Host != nil {
		if strings.TrimSpace(*input.Host) == "" {
			return nil, ErrInvalid
		}
		add("host", *input.Host)
	}
	if input.Port != nil {
		if *input.Port < 1 || *input.Port > 65535 {
			return nil, ErrInvalid
		}
		add("port", *input.Port)
	}
	if input.Database != nil {
		if strings.TrimSpace(*input.Database) == "" {
			return nil, ErrInvalid
		}
		add("database", *input.Database)
	}
	if input.Username != nil {
		if strings.TrimSpace(*input.Username) == "" {
			return nil, ErrInvalid
		}
		add("username", *input.Username)
	}
	if input.Password != nil && strings.TrimSpace(*input.Password) != "" {
		encrypted, err := encryption.Encrypt(*input.Password)
		if err != nil {
			return nil, err
		}
		add("encrypted_password", encrypted)
	}
	if input.Enabled != nil {
		add("enabled", *input.Enabled)
	}
	if input.AllowedTables != nil {
		add("allowed_tables", mustJSON(*input.AllowedTables))
	}
	if input.MaskedColumns != nil {
		add("masked_columns", mustJSON(*input.MaskedColumns))
	}
	if input.RowScope != nil {
		add("row_scope", mustJSON(*input.RowScope))
	}
	if input.RowScopeKey != nil {
		if *input.RowScopeKey != "email" && *input.RowScopeKey != "phone" {
			return nil, ErrInvalid
		}
		add("row_scope_key", *input.RowScopeKey)
	}
	if input.MaxRows != nil {
		if *input.MaxRows < 1 || *input.MaxRows > 1000 {
			return nil, ErrInvalid
		}
		add("max_rows", *input.MaxRows)
	}
	if input.StatementTimeoutMS != nil {
		if *input.StatementTimeoutMS < 100 || *input.StatementTimeoutMS > 30000 {
			return nil, ErrInvalid
		}
		add("statement_timeout_ms", *input.StatementTimeoutMS)
	}
	if input.SSHEnabled != nil {
		add("ssh_enabled", *input.SSHEnabled)
	}
	if input.SSHHost != nil {
		add("ssh_host", input.SSHHost)
	}
	if input.SSHPort != nil {
		if *input.SSHPort < 1 || *input.SSHPort > 65535 {
			return nil, ErrInvalid
		}
		add("ssh_port", *input.SSHPort)
	}
	if input.SSHUsername != nil {
		add("ssh_username", input.SSHUsername)
	}
	if input.SSHPassword != nil && strings.TrimSpace(*input.SSHPassword) != "" {
		value, err := encryption.Encrypt(*input.SSHPassword)
		if err != nil {
			return nil, err
		}
		add("encrypted_ssh_password", value)
	}
	if input.SSHPrivateKey != nil && strings.TrimSpace(*input.SSHPrivateKey) != "" {
		value, err := encryption.Encrypt(*input.SSHPrivateKey)
		if err != nil {
			return nil, err
		}
		add("encrypted_ssh_private_key", value)
	}
	if input.SSHPrivateKeyPassphrase != nil && strings.TrimSpace(*input.SSHPrivateKeyPassphrase) != "" {
		value, err := encryption.Encrypt(*input.SSHPrivateKeyPassphrase)
		if err != nil {
			return nil, err
		}
		add("encrypted_ssh_key_passphrase", value)
	}
	if len(sets) > 0 {
		sets = append(sets, "updated_at = NOW()")
		_, err := r.pool.Exec(ctx, "UPDATE ticket_db_connectors SET "+strings.Join(sets, ", ")+" WHERE id = $1 AND organization_id = $2", args...)
		if err != nil {
			return nil, err
		}
	}
	return r.Get(ctx, organizationID, id)
}

func (r *Repository) Delete(ctx context.Context, organizationID, id uuid.UUID) error {
	result, err := r.pool.Exec(ctx, `DELETE FROM ticket_db_connectors WHERE id = $1 AND organization_id = $2`, id, organizationID)
	if err != nil {
		return err
	}
	if result.RowsAffected() == 0 {
		return ErrNotFound
	}
	return nil
}

func (r *Repository) Discover(ctx context.Context, organizationID uuid.UUID, input DiscoverRequest) DiscoverResponse {
	if err := validateCommon(input.Engine, input.Host, input.Database, input.Username, input.Port); err != nil || strings.TrimSpace(input.Password) == "" {
		return failedResponse(ErrInvalid)
	}
	return discover(ctx, discoverConfig{organizationID: organizationID, engine: strings.ToLower(input.Engine), host: input.Host, port: input.Port, database: input.Database, username: input.Username, password: input.Password})
}

func (r *Repository) Test(ctx context.Context, organizationID, id uuid.UUID) DiscoverResponse {
	row := r.pool.QueryRow(ctx, `SELECT engine, host, port, database, username, encrypted_password, ssh_enabled, ssh_host, ssh_port, ssh_username, encrypted_ssh_password, encrypted_ssh_private_key, encrypted_ssh_key_passphrase FROM ticket_db_connectors WHERE id = $1 AND organization_id = $2`, id, organizationID)
	var engine, host, databaseName, username, encryptedPassword string
	var port, sshPort int
	var sshEnabled bool
	var sshHost, sshUsername, encryptedSSHPassword, encryptedSSHKey, encryptedSSHPassphrase *string
	if err := row.Scan(&engine, &host, &port, &databaseName, &username, &encryptedPassword, &sshEnabled, &sshHost, &sshPort, &sshUsername, &encryptedSSHPassword, &encryptedSSHKey, &encryptedSSHPassphrase); err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return failedResponse(ErrNotFound)
		}
		return failedResponse(err)
	}
	password, err := encryption.Decrypt(encryptedPassword)
	if err != nil {
		return failedResponse(err)
	}
	response := discover(ctx, discoverConfig{organizationID: organizationID, connectorID: id, engine: engine, host: host, port: port, database: databaseName, username: username, password: password, sshEnabled: sshEnabled, sshHost: sshHost, sshPort: sshPort, sshUsername: sshUsername, sshPassword: decryptOptional(encryptedSSHPassword), sshPrivateKey: decryptOptional(encryptedSSHKey), sshPrivateKeyPassphrase: decryptOptional(encryptedSSHPassphrase)})
	_, _ = r.pool.Exec(ctx, `UPDATE ticket_db_connectors SET last_test_at = NOW(), last_test_ok = $3, updated_at = NOW() WHERE id = $1 AND organization_id = $2`, id, organizationID, response.OK)
	return response
}

func encryptSSHSecrets(password, key, passphrase *string) (*string, *string, *string, error) {
	var result [3]*string
	for index, value := range []*string{password, key, passphrase} {
		if value == nil || strings.TrimSpace(*value) == "" {
			continue
		}
		encrypted, err := encryption.Encrypt(*value)
		if err != nil {
			return nil, nil, nil, err
		}
		result[index] = &encrypted
	}
	return result[0], result[1], result[2], nil
}

func decryptOptional(value *string) *string {
	if value == nil {
		return nil
	}
	decrypted, err := encryption.Decrypt(*value)
	if err != nil {
		return nil
	}
	return &decrypted
}

func defaultString(value, fallback string) string {
	if strings.TrimSpace(value) == "" {
		return fallback
	}
	return value
}
func defaultInt(value, fallback int) int {
	if value == 0 {
		return fallback
	}
	return value
}
func mustJSON(value any) []byte { encoded, _ := json.Marshal(value); return encoded }

const connectorSelect = `SELECT id, name, engine, host, port, database, username, enabled, allowed_tables, masked_columns, row_scope, row_scope_key, max_rows, statement_timeout_ms, ssh_enabled, ssh_host, ssh_port, ssh_username, last_test_at, last_test_ok, created_at FROM ticket_db_connectors`

type rowScanner interface{ Scan(...any) error }

func scanConnector(row rowScanner) (*Connector, error) {
	var result Connector
	var allowed, masked, scope []byte
	if err := row.Scan(&result.ID, &result.Name, &result.Engine, &result.Host, &result.Port, &result.Database, &result.Username, &result.Enabled, &allowed, &masked, &scope, &result.RowScopeKey, &result.MaxRows, &result.StatementTimeoutMS, &result.SSHEnabled, &result.SSHHost, &result.SSHPort, &result.SSHUsername, &result.LastTestAt, &result.LastTestOK, &result.CreatedAt); err != nil {
		return nil, err
	}
	result.AllowedTables = stringSlice(allowed)
	result.MaskedColumns = stringSlice(masked)
	result.RowScope = stringMap(scope)
	return &result, nil
}

func stringSlice(raw []byte) []string {
	var value []string
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &value)
	}
	if value == nil {
		value = []string{}
	}
	return value
}
func stringMap(raw []byte) map[string]string {
	var value map[string]string
	if len(raw) > 0 {
		_ = json.Unmarshal(raw, &value)
	}
	if value == nil {
		value = map[string]string{}
	}
	return value
}

type discoverConfig struct {
	organizationID                                                   uuid.UUID
	connectorID                                                      uuid.UUID
	engine, host, database, username, password                       string
	port                                                             int
	sshEnabled                                                       bool
	sshHost                                                          *string
	sshPort                                                          int
	sshUsername, sshPassword, sshPrivateKey, sshPrivateKeyPassphrase *string
}

func discover(ctx context.Context, cfg discoverConfig) DiscoverResponse {
	if cfg.sshEnabled {
		return failedResponse(errors.New("SSH tunnel discovery is not configured in the Go service"))
	}
	driver, dsn, err := connectorDSN(cfg)
	if err != nil {
		return failedResponse(err)
	}
	db, err := sql.Open(driver, dsn)
	if err != nil {
		return failedResponse(err)
	}
	defer db.Close()
	pingCtx, cancel := context.WithTimeout(ctx, 8*time.Second)
	defer cancel()
	if err := db.PingContext(pingCtx); err != nil {
		return failedResponse(err)
	}
	query, args := discoveryQuery(cfg.engine)
	rows, err := db.QueryContext(pingCtx, query, args...)
	if err != nil {
		return failedResponse(err)
	}
	defer rows.Close()
	groups := map[string]*Table{}
	for rows.Next() {
		var schema, table, column, dataType string
		if err := rows.Scan(&schema, &table, &column, &dataType); err != nil {
			return failedResponse(err)
		}
		key := schema + "." + table
		value := groups[key]
		if value == nil {
			value = &Table{Schema: schema, Table: table, Columns: []Column{}}
			groups[key] = value
		}
		value.Columns = append(value.Columns, Column{Name: column, Type: dataType})
	}
	if err := rows.Err(); err != nil {
		return failedResponse(err)
	}
	result := make([]Table, 0, len(groups))
	for _, value := range groups {
		result = append(result, *value)
	}
	sort.Slice(result, func(i, j int) bool {
		if result[i].Schema == result[j].Schema {
			return result[i].Table < result[j].Table
		}
		return result[i].Schema < result[j].Schema
	})
	return DiscoverResponse{OK: true, Tables: result}
}

func connectorDSN(cfg discoverConfig) (string, string, error) {
	if cfg.engine == "mysql" {
		return "mysql", (&mysql.Config{User: cfg.username, Passwd: cfg.password, Net: "tcp", Addr: fmt.Sprintf("%s:%d", cfg.host, cfg.port), DBName: cfg.database, Timeout: 8 * time.Second, ReadTimeout: 8 * time.Second, WriteTimeout: 8 * time.Second}).FormatDSN(), nil
	}
	return "pgx", fmt.Sprintf("postgres://%s:%s@%s:%d/%s?sslmode=prefer", urlQueryEscape(cfg.username), urlQueryEscape(cfg.password), cfg.host, cfg.port, urlQueryEscape(cfg.database)), nil
}

func urlQueryEscape(value string) string {
	return strings.ReplaceAll(strings.ReplaceAll(value, "@", "%40"), ":", "%3A")
}

func discoveryQuery(engine string) (string, []any) {
	if engine == "mysql" {
		return `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema NOT IN ('mysql','information_schema','performance_schema','sys') ORDER BY table_schema, table_name, ordinal_position`, nil
	}
	return `SELECT table_schema, table_name, column_name, data_type FROM information_schema.columns WHERE table_schema NOT IN ('pg_catalog','information_schema','pg_toast') ORDER BY table_schema, table_name, ordinal_position`, nil
}

func failedResponse(err error) DiscoverResponse {
	message := "connection failed"
	if err != nil {
		message = err.Error()
	}
	if len(message) > 500 {
		message = message[:500]
	}
	return DiscoverResponse{OK: false, Error: &message, Tables: []Table{}}
}
