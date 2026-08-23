import pytest
from unittest.mock import patch, MagicMock
from chat import get_chat_stream, save_interaction
from langchain_core.messages import HumanMessage, AIMessage

@pytest.mark.asyncio
async def test_save_interaction():
    # Patch the "convex" alias imported as "convex" in chat.py
    with patch("chat.convex") as mock_db:
        save_interaction("conv1", "hello", "user", "token-123")
        mock_db.save_msg.assert_called_once_with("conv1", "hello", "user", "token-123")

@pytest.mark.asyncio
async def test_get_chat_stream():
    # Patch the imports in chat.py
    with patch("chat.convex") as mock_db, patch("chat.llm") as mock_llm:
        # 1. Mock DB history
        # Note: Ensure these return the expected structure for chat.py's sorting
        mock_db.get_history.return_value = [
            {"body": "hi", "author": "user", "_creationTime": 100},
            {"body": "hello", "author": "ai", "_creationTime": 200},
        ]
        
        # 2. Mock LLM chain
        mock_chain = MagicMock()
        # astream is an async generator
        mock_chain.astream = MagicMock(return_value="stream_iterator")
        mock_llm.get_chain.return_value = mock_chain

        # 3. Call the function
        result = get_chat_stream("new msg", "conv1", "token-123")

        # 4. Assertions
        assert result == "stream_iterator"
        
        # Verify dependencies were called
        mock_db.get_history.assert_called_once_with("conv1", "token-123")
        mock_llm.get_chain.assert_called_once_with(None, "huggingface")

        # Verify history conversion logic in chat.py
        args, _ = mock_chain.astream.call_args
        stream_input = args[0]
        
        assert stream_input["input"] == "new msg"
        
        history = stream_input["history"]
        assert len(history) == 2
        
        # Verify correct types and content
        assert isinstance(history[0], HumanMessage)
        assert history[0].content == "hi"
        
        assert isinstance(history[1], AIMessage)
        assert history[1].content == "hello"
