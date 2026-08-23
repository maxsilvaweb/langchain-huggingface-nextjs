import pytest
from unittest.mock import patch, MagicMock

# We need to mock environment variables before importing 'db'
# because 'db.py' initializes the client at the top level.
with patch.dict("os.environ", {"NEXT_PUBLIC_CONVEX_URL": "http://fake-url"}):
    import db

@pytest.mark.asyncio
async def test_save_msg():
    with patch("db.get_client") as mock_get_client:
        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        db.save_msg("conv1", "hello", "user", "token-123")
        
        mock_get_client.assert_called_once_with("token-123")
        mock_client.mutation.assert_called_once_with(
            "messages:send",
            {"conversationId": "conv1", "body": "hello", "author": "user"},
        )

@pytest.mark.asyncio
async def test_get_history():
    with patch("db.get_client") as mock_get_client:
        mock_client = MagicMock()
        mock_client.query.return_value = [{"body": "hi", "author": "user"}]
        mock_get_client.return_value = mock_client
        
        result = db.get_history("conv1", "token-123")
        
        mock_get_client.assert_called_once_with("token-123")
        mock_client.query.assert_called_once_with(
            "messages:list",
            {"conversationId": "conv1"},
        )
        assert result == [{"body": "hi", "author": "user"}]
