"""
Copyright 2024-2026 ChatterMate

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
"""

"""Central catalog of BYO-key AI model providers and their suggested models.

Single source of truth consumed by:
  - the ``GET /ai/providers`` endpoint (which populates the frontend selectors), and
  - ``validate_model_selection`` in ``app.api.ai_setup``.

The listed models are *suggestions*, not a hard allowlist: every provider here has
``custom_allowed=True``, so an organization may type any model ID the provider
supports. Validation only checks that the provider is known and the model name is
non-empty — the live API-key test is what actually rejects a bad model ID.

Provider model IDs churn and several have near-term shutdowns (see notes). Verify
against each provider's live ``GET /v1/models`` before relying on an ID long-term.

Every provider key MUST match a value in ``app.models.ai_config.AIModelType`` and a
branch in ``app.utils.agno_utils.create_model``.
"""

from typing import Dict, List
from typing_extensions import TypedDict


class CatalogModel(TypedDict):
    value: str  # exact model ID passed to the provider API
    label: str  # human-readable display name


class CatalogProvider(TypedDict):
    label: str
    requires_api_key: bool
    custom_allowed: bool
    # Console URL where the user creates/copies their API key for this provider.
    api_key_url: str
    models: List[CatalogModel]


def _m(value: str, label: str) -> CatalogModel:
    return {"value": value, "label": label}


# Keyed by AIModelType value. CHATTERMATE (managed) is intentionally excluded — it
# is handled as a special case in the setup flow and is not user-selectable here.
MODEL_CATALOG: Dict[str, CatalogProvider] = {
    "OPENAI": {
        "label": "OpenAI",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://platform.openai.com/api-keys",
        "models": [
            _m("gpt-5.6-sol", "GPT-5.6 Sol (旗舰推理与编程)"),
            _m("gpt-5.6-terra", "GPT-5.6 Terra (智能与成本平衡)"),
            _m("gpt-5.6-luna", "GPT-5.6 Luna (高并发低成本)"),
        ],
    },
    "ANTHROPIC": {
        "label": "Anthropic (Claude)",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://console.anthropic.com/settings/keys",
        # Current-gen Claude IDs are complete stable strings — do NOT append a date.
        "models": [
            _m("claude-opus-5", "Claude Opus 5"),
            _m("claude-sonnet-5", "Claude Sonnet 5"),
            _m("claude-fable-5", "Claude Fable 5"),
            _m("claude-haiku-4-5-20251001", "Claude Haiku 4.5"),
        ],
    },
    "GOOGLE": {
        "label": "Google Gemini",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://aistudio.google.com/app/apikey",
        "models": [
            _m("gemini-3.7-flash", "Gemini 3.7 Flash (最新通用)"),
            _m("gemini-3.6-flash", "Gemini 3.6 Flash"),
            _m("gemini-3.5-flash", "Gemini 3.5 Flash"),
            _m("gemini-3.1-pro", "Gemini 3.1 Pro (高级推理)"),
        ],
    },
    "MISTRAL": {
        "label": "Mistral",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://console.mistral.ai/api-keys",
        # -latest aliases auto-advance to the current dated snapshot.
        "models": [
            _m("mistral-medium-3.5-26.04", "Mistral Medium 3.5 (旗舰多模态)"),
            _m("mistral-large-3-25-12", "Mistral Large 3"),
            _m("mistral-small-4-0-26-03", "Mistral Small 4"),
            _m("devstral-2512", "Devstral 2 (代码)"),
        ],
    },
    "XAI": {
        "label": "xAI (Grok)",
        "requires_api_key": True,
        "custom_allowed": True,
        # The Grok inference API uses a single xai-... key from console.x.ai — NOT the
        # X/Twitter OAuth app credentials (consumer key / access token / bearer token).
        "api_key_url": "https://console.x.ai",
        "models": [
            _m("grok-4.20", "Grok 4.20 (最新旗舰)"),
            _m("grok-4.20-reasoning", "Grok 4.20 Reasoning"),
            _m("grok-4.20-non-reasoning", "Grok 4.20 Non-Reasoning"),
            _m("grok-code-fast-1", "Grok Code Fast 1"),
        ],
    },
    "DEEPSEEK": {
        "label": "DeepSeek",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://platform.deepseek.com/api_keys",
        "models": [
            _m("deepseek-v4-pro", "DeepSeek-V4 Pro (旗舰推理)"),
            _m("deepseek-v4-flash", "DeepSeek-V4 Flash (快速通用)"),
        ],
    },
    "GROQ": {
        "label": "Groq",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://console.groq.com/keys",
        # gpt-oss-120b is the durable pick. gpt-oss-20b is intentionally NOT listed: the
        # smaller model leaks OpenAI "harmony" formatting (calls the response tool as
        # `functions/json`), which Groq rejects, making structured output unreliable.
        # llama-3.3-70b-versatile is kept for continuity but is deprecated (EOL
        # 2026-08-16). Org-prefixed IDs must be passed exactly.
        "models": [
            _m("qwen/qwen3.8-27b", "Qwen 3.8 27B"),
            _m("qwen/qwen3.6-27b", "Qwen 3.6 27B"),
            _m("meta-llama/llama-4-maverick-17b-128e-instruct", "Llama 4 Maverick 17B"),
            _m("meta-llama/llama-4-scout-17b-16e-instruct", "Llama 4 Scout 17B"),
            _m("openai/gpt-oss-120b", "GPT-OSS 120B"),
        ],
    },
    "ZHIPU": {
        "label": "智谱 AI (GLM)",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://open.bigmodel.cn/usercenter/apikeys",
        "models": [
            _m("glm-5.3", "GLM-5.3 (最新旗舰)"),
            _m("glm-5.3-flash", "GLM-5.3-Flash (高速)"),
            _m("glm-5.2", "GLM-5.2"),
        ],
    },
    "KIMI": {
        "label": "Kimi (Moonshot AI)",
        "requires_api_key": True,
        "custom_allowed": True,
        "api_key_url": "https://platform.moonshot.cn/console/api-keys",
        "models": [
            _m("kimi-k3", "Kimi K3 (最新旗舰)"),
            _m("kimi-k2.7-code-highspeed", "Kimi K2.7 Code Highspeed"),
            _m("kimi-k2.6", "Kimi K2.6"),
            _m("kimi-k2.5", "Kimi K2.5"),
        ],
    },
}


def is_known_provider(provider: str) -> bool:
    """Return True if the provider is a selectable BYO-key provider in the catalog."""
    return bool(provider) and provider.upper() in MODEL_CATALOG


def list_providers() -> List[dict]:
    """Return the catalog as a serializable list for the /ai/providers endpoint."""
    return [
        {
            "value": provider_value,
            "label": entry["label"],
            "requires_api_key": entry["requires_api_key"],
            "custom_allowed": entry["custom_allowed"],
            "api_key_url": entry["api_key_url"],
            "models": entry["models"],
        }
        for provider_value, entry in MODEL_CATALOG.items()
    ]
