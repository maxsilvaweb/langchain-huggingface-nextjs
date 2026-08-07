import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, AsyncMock
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
            json={
                "message": "hi",
                "conversationId": "test-id"
            }
        )
        
        # Assert the response status is 200 OK
        assert response.status_code == 200
        # Assert the content matches the joined streamed chunks
        assert response.content == b"Hello World"
        
        # Verify that our chat service was called correctly to save messages
        # 1. First, the user's message
        mock_chat.save_interaction.assert_any_call("test-id", "hi", "user")
        
        # 2. Then, the fully accumulated AI response
        mock_chat.save_interaction.assert_any_call("test-id", "Hello World", "ai")
