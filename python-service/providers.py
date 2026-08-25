"""
LLM Provider implementations using Factory Pattern.

Open/Closed Principle: Add new providers by creating new classes,
not by modifying existing code.

Factory Pattern: Centralized creation of provider instances.
"""

import os
from typing import Any

from langchain_anthropic import ChatAnthropic
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_huggingface import ChatHuggingFace, HuggingFaceEndpoint
from langchain_openai import ChatOpenAI

from constants import (
    ANTHROPIC_LLM_MODEL,
    GOOGLE_LLM_MODEL,
    HUGGINGFACE_LLM_MODEL,
    OPENAI_LLM_MODEL,
)
from interfaces import ILLMProvider


class OpenAIProvider(ILLMProvider):
    """OpenAI LLM provider implementation."""

    DEFAULT_MODEL = OPENAI_LLM_MODEL
    
    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self._api_key:
            raise ValueError("OpenAI API key not configured")
    
    def get_model(self, model_name: str | None = None) -> ChatOpenAI:
        return ChatOpenAI(
            model=model_name or self.DEFAULT_MODEL,
            api_key=self._api_key,
            streaming=True,
        )
    
    @property
    def provider_name(self) -> str:
        return "openai"


class AnthropicProvider(ILLMProvider):
    """Anthropic Claude LLM provider implementation."""
    
    DEFAULT_MODEL = ANTHROPIC_LLM_MODEL
    
    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        if not self._api_key:
            raise ValueError("Anthropic API key not configured")
    
    def get_model(self, model_name: str | None = None) -> ChatAnthropic:
        return ChatAnthropic(
            model=model_name or self.DEFAULT_MODEL,
            api_key=self._api_key,
            streaming=True,
        )
    
    @property
    def provider_name(self) -> str:
        return "anthropic"


class GoogleProvider(ILLMProvider):
    """Google Gemini LLM provider implementation."""
    
    DEFAULT_MODEL = GOOGLE_LLM_MODEL
    
    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if not self._api_key:
            raise ValueError("Google API key not configured")
    
    def get_model(self, model_name: str | None = None) -> ChatGoogleGenerativeAI:
        return ChatGoogleGenerativeAI(
            model=model_name or self.DEFAULT_MODEL,
            google_api_key=self._api_key,
            streaming=True,
        )
    
    @property
    def provider_name(self) -> str:
        return "google"


class HuggingFaceProvider(ILLMProvider):
    """HuggingFace LLM provider implementation."""
    
    DEFAULT_MODEL = HUGGINGFACE_LLM_MODEL
    
    def __init__(self, api_key: str | None = None):
        self._api_key = api_key or os.getenv("HUGGINGFACE_API_KEY")
        if not self._api_key:
            raise ValueError("HuggingFace API key not configured")
    
    def get_model(self, model_name: str | None = None) -> ChatHuggingFace:
        endpoint = HuggingFaceEndpoint(
            repo_id=model_name or self.DEFAULT_MODEL,
            huggingfacehub_api_token=self._api_key,
            task="text-generation",
        )
        return ChatHuggingFace(llm=endpoint)
    
    @property
    def provider_name(self) -> str:
        return "huggingface"


class LLMProviderFactory:
    """
    Factory for creating LLM provider instances.
    
    Factory Pattern: Centralizes provider creation logic.
    Open/Closed: Register new providers without modifying factory code.
    """
    
    _providers: dict[str, type[ILLMProvider]] = {
        "openai": OpenAIProvider,
        "anthropic": AnthropicProvider,
        "google": GoogleProvider,
        "huggingface": HuggingFaceProvider,
    }
    
    @classmethod
    def register(cls, name: str, provider_class: type[ILLMProvider]) -> None:
        """Register a new provider type (Open/Closed principle)."""
        cls._providers[name] = provider_class
    
    @classmethod
    def create(cls, provider_name: str, api_key: str | None = None) -> ILLMProvider:
        """Create a provider instance by name."""
        provider_class = cls._providers.get(provider_name)
        if not provider_class:
            available = ", ".join(cls._providers.keys())
            raise ValueError(
                f"Unknown provider: {provider_name}. Available: {available}"
            )
        return provider_class(api_key=api_key)
    
    @classmethod
    def get_available_providers(cls) -> list[str]:
        """List all registered provider names."""
        return list(cls._providers.keys())
    
    @classmethod
    def create_from_env(cls) -> ILLMProvider:
        """
        Create provider based on LLM_PROVIDER environment variable.
        Falls back to checking which API keys are available.
        """
        provider_name = os.getenv("LLM_PROVIDER", "").lower()
        
        if provider_name and provider_name in cls._providers:
            return cls.create(provider_name)
        
        # Fallback: try providers in order based on available keys
        key_priority = [
            ("OPENAI_API_KEY", "openai"),
            ("ANTHROPIC_API_KEY", "anthropic"),
            ("GOOGLE_API_KEY", "google"),
            ("HUGGINGFACE_API_KEY", "huggingface"),
        ]
        
        for env_var, provider in key_priority:
            if os.getenv(env_var):
                return cls.create(provider)
        
        raise ValueError(
            "No LLM provider configured. Set LLM_PROVIDER or provide an API key."
        )
