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
    # Providers are constructed via LLMProviderFactory -> providers.* classes
    with patch("providers.ChatOpenAI") as mock_openai:
        get_chain(provider="openai")
        mock_openai.assert_called_once()
        assert mock_openai.call_args.kwargs.get("temperature") == 0.7

    with patch("providers.ChatAnthropic") as mock_anthropic:
        get_chain(provider="anthropic", temperature=0.2)
        mock_anthropic.assert_called_once()
        assert mock_anthropic.call_args.kwargs.get("temperature") == 0.2

    with patch("providers.ChatGoogleGenerativeAI") as mock_google:
        get_chain(provider="google")
        mock_google.assert_called_once()

    with patch("providers.HuggingFaceEndpoint") as mock_hf_endpoint, patch(
        "providers.ChatHuggingFace"
    ) as mock_hf:
        get_chain(provider="huggingface")
        mock_hf_endpoint.assert_called_once()
        mock_hf.assert_called_once()
