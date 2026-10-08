# Backend tests

```bash
cd backend && ./venv/bin/python -m pytest tests/ -v
```

Use the **project venv** (`./venv/bin/python`), not a system or conda Python —
dependencies from `requirements.txt` such as `paramiko` are only installed
there, and a wrong interpreter shows up as unrelated `ModuleNotFoundError`
failures.

## Matching CI locally: `NO_ENTERPRISE=1`

CI checks out with `actions/checkout@v3` and **no `submodules: recursive`**, so
`app/enterprise` is empty there and the app runs in community mode. A local
checkout usually has the submodule populated, which switches on plan and
subscription gating — and around 30 API tests then return a `403` they never
see in CI.

Those failures are environmental, not real. To get a result comparable to CI:

```bash
cd backend && NO_ENTERPRISE=1 ./venv/bin/python -m pytest tests/ -v
```

This installs an import blocker (see the top of `conftest.py`) that makes
`app.enterprise` raise `ModuleNotFoundError`, exactly as an un-checked-out
submodule does, so the `try: import app.enterprise` guards and
`pytest.importorskip` fall back to community mode the same way.

Run **without** the flag when you are working on enterprise code and want the
gating active.

## Live agent tests

`tests_live/` runs the chat agent against the real model and local Postgres to
catch prompt-effectiveness regressions the unit suite cannot see. It sits
outside `testpaths`, so it is never collected here or in CI. See
[tests_live/README.md](../tests_live/README.md).
