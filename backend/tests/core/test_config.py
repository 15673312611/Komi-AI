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

from app.core.config import Settings, check_secret_configuration

# The key that used to ship as the ENCRYPTION_KEY default and in .env.example. It
# is public, so a deployment still using it must be flagged.
LEGACY_PUBLIC_KEY = "RFQ4SzhyRTVYdGtsLUxsc25SaDB0QlZpbTdQRmlVRlpsZUlCaFRlU2Vxbz0="
GOOD = {
    "SECRET_KEY": "a-real-secret",
    "CONVERSATION_SECRET_KEY": "another-real-secret",
    "ENCRYPTION_KEY": "a-real-key",
}


def _config(**overrides) -> Settings:
    return Settings(ENVIRONMENT="production", **{**GOOD, **overrides})


def test_configured_secrets_are_not_flagged():
    assert check_secret_configuration(_config()) == []


def test_unset_encryption_key_is_flagged():
    """ENCRYPTION_KEY no longer carries a default, so unset is the common case."""
    assert check_secret_configuration(_config(ENCRYPTION_KEY="")) == ["ENCRYPTION_KEY"]


def test_legacy_public_encryption_key_is_still_flagged():
    """Removing the default does not help deployments that already copied it."""
    assert check_secret_configuration(
        _config(ENCRYPTION_KEY=LEGACY_PUBLIC_KEY)
    ) == ["ENCRYPTION_KEY"]


def test_env_example_placeholder_is_flagged():
    assert check_secret_configuration(
        _config(ENCRYPTION_KEY="your_fernet_encryption_key_here")
    ) == ["ENCRYPTION_KEY"]


def test_default_jwt_secret_is_flagged():
    assert check_secret_configuration(
        _config(SECRET_KEY="your-secret-key")
    ) == ["SECRET_KEY"]


def test_development_is_exempt():
    """Local development runs on the defaults on purpose."""
    config = Settings(ENVIRONMENT="development", SECRET_KEY="your-secret-key",
                      ENCRYPTION_KEY="")
    assert check_secret_configuration(config) == []
