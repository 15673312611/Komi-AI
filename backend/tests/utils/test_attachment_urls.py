from urllib.parse import parse_qs, urlparse

from app.utils.attachment_urls import (
    is_valid_local_attachment_signature,
    local_attachment_download_url,
)


def test_local_attachment_download_url_is_valid_for_its_exact_key(monkeypatch):
    monkeypatch.setattr("app.utils.attachment_urls.time.time", lambda: 1_000)
    storage_key = "chat_attachments/11111111-1111-1111-1111-111111111111/file.png"

    url = local_attachment_download_url(storage_key, expires_in=60)
    parsed = urlparse(url)
    query = parse_qs(parsed.query)

    assert parsed.path.endswith(storage_key)
    assert is_valid_local_attachment_signature(
        storage_key, int(query["expires"][0]), query["signature"][0]
    )
    assert not is_valid_local_attachment_signature(
        storage_key.replace("file.png", "other.png"),
        int(query["expires"][0]),
        query["signature"][0],
    )


def test_local_attachment_download_url_rejects_expired_signatures(monkeypatch):
    monkeypatch.setattr("app.utils.attachment_urls.time.time", lambda: 1_000)
    storage_key = "chat_attachments/11111111-1111-1111-1111-111111111111/file.png"
    url = local_attachment_download_url(storage_key, expires_in=1)
    query = parse_qs(urlparse(url).query)

    monkeypatch.setattr("app.utils.attachment_urls.time.time", lambda: 1_002)
    assert not is_valid_local_attachment_signature(
        storage_key, int(query["expires"][0]), query["signature"][0]
    )
