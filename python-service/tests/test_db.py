import pytest
from unittest.mock import patch, MagicMock

# We need to mock environment variables before importing 'db'
# because 'db.py' initializes the client at the top level.
with patch.dict("os.environ", {"NEXT_PUBLIC_CONVEX_URL": "http://fake-url"}):
    import db

@pytest.mark.asyncio
async def test_save_msg():
    # Patch the 'client' object that is initialized in db.py
    with patch("db.client") as mock_client:
        db.save_msg("conv1", "hello", "user")
        
        # Verify mutation was called with correct arguments
        mock_client.mutation.assert_called_once_with(
            "messages:send",
            {"conversationId": "conv1", "body": "hello", "author": "user"},
        )

@pytest.mark.asyncio
async def test_get_history():
    # Patch the 'client' object that is initialized in db.py
    with patch("db.client") as mock_client:
        # Define return value for the query
        mock_client.query.return_value = [{"body": "hi", "author": "user"}]
        
        result = db.get_history("conv1")
        
        # Verify query was called with correct arguments
        mock_client.query.assert_called_once_with(
            "messages:list",
            {"conversationId": "conv1"},
        )
        assert result == [{"body": "hi", "author": "user"}]
