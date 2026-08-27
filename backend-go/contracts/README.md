# Compatibility contracts

`routes.json` is generated from the Python service. It is a migration inventory,
not permission to remove or change an endpoint. Every entry must eventually have:

1. a Go handler with the same method/path and authentication surface;
2. request validation and response/status behavior matching the Python handler;
3. a parity test against the Python behavior using the same database fixtures;
4. an explicit entry in the migration ledger showing the cutover state.

The current ledger is `migration_ledger.json`. It is intentionally checked in
alongside the generated inventory so a partial Go implementation cannot be
mistaken for a complete cutover.

The inventory includes REST routes and Socket.IO events because both are part of
the public frontend/widget contract.
