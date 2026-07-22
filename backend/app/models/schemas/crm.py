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

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


class CrmConnectionOut(BaseModel):
    """A connected CRM as shown on the integrations page. Never exposes
    credentials — only identity and health."""
    model_config = ConfigDict(from_attributes=True)

    provider: str
    status: str
    display_name: Optional[str] = None
    external_account_id: str
    last_error: Optional[str] = None
    created_at: Optional[datetime] = None
    recent_failures: int = 0


class CrmTestResult(BaseModel):
    ok: bool
    account_name: Optional[str] = None
    error: Optional[str] = None
