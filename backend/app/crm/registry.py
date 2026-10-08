"""
Copyright 2024-2026 Komi AI

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

from typing import Dict, Optional

from app.crm.base import CrmAdapter

_adapters: Dict[str, CrmAdapter] = {}


def register_adapter(adapter: CrmAdapter) -> CrmAdapter:
    """Register a stateless adapter singleton for its provider."""
    _adapters[adapter.provider] = adapter
    return adapter


def get_adapter(provider: str) -> Optional[CrmAdapter]:
    """Adapter for a CRM provider, or None for unknown providers."""
    _ensure_loaded()
    return _adapters.get(provider)


_loaded = False


def _ensure_loaded() -> None:
    """Import adapter modules on first use (each registers itself).
    Lazy so importing app.crm never pulls every adapter's deps."""
    global _loaded
    if _loaded:
        return
    _loaded = True
    from app.crm import hubspot  # noqa: F401
    from app.crm import pipedrive  # noqa: F401
