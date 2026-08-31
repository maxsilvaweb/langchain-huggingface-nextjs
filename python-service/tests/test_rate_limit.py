from unittest.mock import patch

from fastapi.testclient import TestClient

import main
from rate_limit import _rate_limit_enabled, limiter

AUTH_HEADERS = {
    "Authorization": "Bearer token-123",
    "X-Convex-Token": "token-123",
    "X-Internal-Api-Key": "test-internal-api-key",
}


def test_limiter_disabled_under_pytest():
    assert _rate_limit_enabled() is False
    assert limiter.enabled is False


def test_chat_still_works_with_limiter_attached():
    client = TestClient(main.app)
    with patch("main.chat_service") as mock_chat:

        async def mock_async_gen():
            yield "ok"

        mock_chat.get_chat_stream.return_value = mock_async_gen()
        response = client.post(
            "/chat",
            headers=AUTH_HEADERS,
            json={"message": "hi", "conversationId": "test-id"},
        )
        assert response.status_code == 200


def test_rejects_missing_internal_api_key():
    client = TestClient(main.app)
    response = client.post(
        "/chat",
        headers={
            "Authorization": "Bearer token-123",
            "X-Convex-Token": "token-123",
        },
        json={"message": "hi", "conversationId": "test-id"},
    )
    assert response.status_code == 401


def test_health_is_public():
    client = TestClient(main.app)
    response = client.get("/health")
    assert response.status_code == 200
