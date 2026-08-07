import pytest
from unittest.mock import patch, MagicMock
from llm import get_chain
from langchain_core.runnables import Runnable

# Mock environment variables to ensure initialization doesn't fail
@patch.dict("os.environ", {
    "OPENAI_API_KEY": "fake-openai-key",
    "ANTHROPIC_API_KEY": "fake-anthropic-key",
    "GOOGLE_API_KEY": "fake-google-key",
    "HUGGINGFACE_API_KEY": "fake-hf-key"
})
def test_get_chain_returns_runnable():
    chain = get_chain()
    assert isinstance(chain, Runnable)

@patch.dict("os.environ", {
    "OPENAI_API_KEY": "fake-openai-key",
    "ANTHROPIC_API_KEY": "fake-anthropic-key",
    "GOOGLE_API_KEY": "fake-google-key",
    "HUGGINGFACE_API_KEY": "fake-hf-key"
})
def test_get_chain_providers():
    # Verify different providers initiate successfully
    
    # Test OpenAI
    with patch("llm.ChatOpenAI") as mock_openai:
        get_chain(provider="openai")
        mock_openai.assert_called_once()
        
    # Test Anthropic
    with patch("llm.ChatAnthropic") as mock_anthropic:
        get_chain(provider="anthropic")
        mock_anthropic.assert_called_once()
        
    # Test Google
    with patch("llm.ChatGoogleGenerativeAI") as mock_google:
        get_chain(provider="google")
        mock_google.assert_called_once()
        
    # Test Default (Huggingface)
    with patch("llm.ChatOpenAI") as mock_hf:
        get_chain(provider="huggingface")
        mock_hf.assert_called()
