"""Extract a source-level compatibility inventory from the Python backend.

The production app imports optional ML/integration packages, so importing the
FastAPI app is not a reliable build step. This script uses Python's AST and the
router registration map from app/main.py instead. It intentionally reports
route metadata, not implementation status; the Go parity tests consume the
generated JSON and fail when a registered route is missing from Go.
"""

from __future__ import annotations

import ast
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[2]
PYTHON_API = ROOT / "backend" / "app" / "api"
MAIN = ROOT / "backend" / "app" / "main.py"
OUTPUT = Path(__file__).resolve().parents[1] / "contracts" / "routes.json"


MAIN_PREFIXES = {
    "chat": "/api/v1/chats",
    "channels": "/api/v1/channels",
    "tickets": "/api/v1/tickets",
    "crm": "/api/v1/crm",
    "ticket_db_connectors": "/api/v1/ticket-db-connectors",
    "ticket_webhooks": "/api/v1/tickets/webhooks",
    "webhooks": "/api/v1/webhooks",
    "organizations": "/api/v1/organizations",
    "users": "/api/v1/users",
    "help_center": "/api/v1/help-center",
    "help_center_images": "/api/v1/help-center",
    "knowledge": "/api/v1/knowledge",
    "ai_setup": "/api/v1/ai",
    "agent": "/api/v1/agent",
    "lead_capture": "/api/v1/agent",
    "people": "/api/v1/people",
    "canned_responses": "/api/v1/canned-responses",
    "mcp_tool": "/api/v1/mcp-tools",
    "notification": "/api/v1/notifications",
    "widget": "/api/v1/widgets",
    "user_groups": "/api/v1/groups",
    "roles": "/api/v1/roles",
    "session_to_agent": "/api/v1/sessions",
    "analytics": "/api/v1/analytics",
    "jira": "/api/v1/jira",
    "token": "/api/v1",
    "widget_apps": "/api/v1/widget-apps",
    "shopify": "/api/v1/shopify",
    "workflow": "/api/v1/workflow",
    "workflow_node": "/api/v1/workflow",
    "file_upload": "/api/v1/files",
}


NESTED_PREFIXES = {
    "channels.accounts": "",
    "channels.telegram": "/telegram",
    "channels.meta": "/meta",
    "channels.whatsapp_messaging": "/meta",
    "channels.slack": "/slack",
    "channels.email": "/email",
    "channels.sms": "/sms",
    "channels.line": "/line",
    "channels.agent_config": "/agent-config",
    "webhooks.telegram": "/telegram",
    "webhooks.slack": "/slack",
    "webhooks.email": "/email",
    "webhooks.sms": "/sms",
    "webhooks.line": "/line",
    "webhooks.meta": "/meta",
    "help_center.branding": "/branding",
    "help_center.domain": "/domain",
    "help_center.faqs": "/faqs",
    "help_center.generation": "/generation",
}


def literal(node: ast.AST | None) -> str | None:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    if isinstance(node, ast.JoinedStr):
        parts = []
        for value in node.values:
            if isinstance(value, ast.Constant) and isinstance(value.value, str):
                parts.append(value.value)
            elif isinstance(value, ast.FormattedValue):
                parts.append("{dynamic}")
            else:
                return None
        return "".join(parts)
    return None


def route_entries(path: Path, module: str, prefix: str, scope: str = "api") -> list[dict]:
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    entries = []
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for decorator in node.decorator_list:
            if not isinstance(decorator, ast.Call) or not isinstance(decorator.func, ast.Attribute):
                continue
            if not isinstance(decorator.func.value, ast.Name):
                continue
            router_name = decorator.func.value.id
            method_name = decorator.func.attr.lower()
            if router_name not in {"router", "app", "public_app"}:
                continue
            if method_name == "api_route":
                methods = []
                if decorator.args:
                    _ = literal(decorator.args[0])
                for keyword in decorator.keywords:
                    if keyword.arg == "methods" and isinstance(keyword.value, (ast.List, ast.Tuple)):
                        methods = [str(ast.literal_eval(item)).upper() for item in keyword.value.elts]
                if not methods:
                    methods = ["GET"]
            elif method_name in {"get", "post", "put", "patch", "delete", "head", "options"}:
                methods = [method_name.upper()]
            else:
                continue
            route = literal(decorator.args[0]) if decorator.args else ""
            if route is None:
                route = "{dynamic}"
            if router_name == "public_app":
                full_path = route
                route_scope = "public"
            else:
                if route == "":
                    full_path = prefix
                elif route == "/":
                    full_path = prefix.rstrip("/") + "/"
                else:
                    full_path = prefix.rstrip("/") + "/" + route.lstrip("/")
                if not full_path.startswith("/"):
                    full_path = "/" + full_path
                route_scope = scope
            status_code = None
            for keyword in decorator.keywords:
                if keyword.arg == "status_code":
                    try:
                        status_code = ast.literal_eval(keyword.value)
                    except (ValueError, SyntaxError):
                        status_code = None
            entries.append({
                "scope": route_scope,
                "module": module,
                "handler": node.name,
                "methods": methods,
                "path": full_path,
                "status_code": status_code,
            })
    return entries


def socket_events() -> list[dict]:
    entries = []
    path = PYTHON_API / "widget_chat.py"
    tree = ast.parse(path.read_text(encoding="utf-8"), filename=str(path))
    for node in ast.walk(tree):
        if not isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
            continue
        for decorator in node.decorator_list:
            if not isinstance(decorator, ast.Call) or not isinstance(decorator.func, ast.Attribute):
                continue
            if not (isinstance(decorator.func.value, ast.Name) and decorator.func.value.id == "sio"):
                continue
            if decorator.func.attr != "on" or not decorator.args:
                continue
            event = literal(decorator.args[0])
            namespace = "/widget"
            for keyword in decorator.keywords:
                if keyword.arg == "namespace":
                    namespace = literal(keyword.value) or namespace
            entries.append({"namespace": namespace, "event": event, "handler": node.name})
    return entries


def main() -> None:
    entries = [
        {"scope": "api", "module": "main", "handler": "root", "methods": ["GET"], "path": "/", "status_code": None},
        {"scope": "api", "module": "main", "handler": "get_health_check", "methods": ["GET"], "path": "/health", "status_code": None},
        {"scope": "api", "module": "main", "handler": "head_health_check", "methods": ["HEAD"], "path": "/health", "status_code": None},
        {"scope": "api", "module": "main", "handler": "help_center_domain_tls_check", "methods": ["GET"], "path": "/health/help-center-domain", "status_code": None},
    ]
    for path in PYTHON_API.rglob("*.py"):
        if "__pycache__" in path.parts or path.name == "__init__.py":
            continue
        relative = path.relative_to(PYTHON_API).with_suffix("")
        parts = list(relative.parts)
        module = ".".join(parts)
        base_module = parts[0]
        prefix = MAIN_PREFIXES.get(base_module)
        if base_module == "help_center_public":
            entries.extend(route_entries(path, module, "", scope="public"))
            continue
        if prefix is None:
            continue
        prefix += NESTED_PREFIXES.get(".".join(parts), "")
        entries.extend(route_entries(path, module, prefix))
    for index, entry in enumerate(entries, start=1):
        entry["registration_id"] = f"rest-{index:04d}"
    entries.sort(key=lambda item: (item.get("path", ""), item.get("methods", []), item.get("handler", "")))
    result = {"source": "backend/app", "rest": entries, "socketio": sorted(socket_events(), key=lambda x: (x["namespace"], x["event"] or ""))}
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, indent=2, sort_keys=True) + "\n", encoding="utf-8")
    print(f"wrote {len(entries)} REST entries and {len(result['socketio'])} Socket.IO events to {OUTPUT}")


if __name__ == "__main__":
    main()
