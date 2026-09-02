# Komi AI Go backend

This directory is the Go implementation of the existing `backend` service.
The migration is deliberately incremental: both services use the existing
PostgreSQL schema and the Go service must pass the compatibility contract before
the Python service is retired.

## Development

```powershell
go run ./cmd/server
```

Useful environment variables:

- `PORT` or `HTTP_ADDR` (default `:8000`)
- `DATABASE_URL` (the existing PostgreSQL database URL)
- `REDIS_URL` and `REDIS_ENABLED`
- `JWT_SECRET_KEY`, `CONVERSATION_SECRET_KEY`
- `CORS_ORIGINS` (comma-separated or JSON array)
- `ENVIRONMENT` (`development` keeps the same local-only secret defaults as Python)

The Go service does not create or alter tables during startup. The current
Alembic history is the schema authority while the migration is in progress.
Database migrations will be ported only after each table's queries have a
compatibility test.

## Migration contract

`contracts/routes.json` is generated from the Python route registrations and
decorators. `scripts/extract_contract.py` is intentionally source-based so the
contract can be regenerated even when optional Python/ML dependencies are not
installed. REST paths, status codes, response models, and Socket.IO events are
tracked separately; a route is not considered migrated until its behavior has a
Go implementation and a parity test.

## Layout

```text
cmd/server          process entrypoint
internal/config     environment parsing and startup policy
internal/app        dependency container and lifecycle
internal/httpapi    HTTP router, middleware, and handlers
internal/auth       JWT and password primitives
internal/platform   PostgreSQL and Redis clients
contracts           generated compatibility inventory
scripts              migration tooling
```
