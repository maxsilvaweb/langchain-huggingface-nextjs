import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from main import app

# Create a test client for our FastAPI app
client = TestClient(app)

# We use the pytest-asyncio decorator to handle asynchronous tests
@pytest.mark.asyncio
async def test_chat_endpoint():
    # We patch "main.chat_service" to replace it with a mock during testing.
    # This prevents the test from actually trying to connect to databases or LLM APIs.
    with patch("main.chat_service") as mock_chat:
        
        # Define a fake asynchronous generator to simulate the AI streaming response
        async def mock_async_gen():
            yield "Hello "
            yield "World"
        
        # Configure the mock to return our fake generator
        mock_chat.get_chat_stream.return_value = mock_async_gen()
        
        # Perform the POST request to the "/chat" endpoint
        response = client.post(
            "/chat",
            headers={"Authorization": "Bearer token-123"},
            json={
                "message": "hi",
                "conversationId": "test-id"
            }
        )
        
        # Assert the response status is 200 OK
        assert response.status_code == 200
        # Assert the content matches the joined streamed chunks
        assert response.content == b"Hello World"
        
        # Verify chat inference was invoked with correct parameters
        mock_chat.get_chat_stream.assert_called_once_with(
            "hi",
            "test-id",
            "token-123",
            None,
            "huggingface",
            use_rag=True,
            temperature=0.7,
            custom_instructions=None,
        )
        
        # NOTE: save_interaction is intentionally NOT called from the Python backend.
        # Message persistence is owned by the React client (use-chat.ts) to enable
        # optimistic UI updates and to avoid double-writing into Convex.
