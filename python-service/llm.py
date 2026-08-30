# This file sets up the Large Language Model (LLM) "chain".
# It configures which AI model (like GPT, Claude, or Gemini) to use and
# creates a prompt template for how the AI should behave.
#
# Architecture: Uses Factory Pattern via LLMProviderFactory for SOLID compliance.
# Open/Closed Principle: New providers can be added without modifying this file.

import os
from typing import Optional

from dotenv import load_dotenv
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_openai import ChatOpenAI

from providers import LLMProviderFactory

# Load environment variables (API keys)
load_dotenv()

# Base system prompt for the AI assistant
BASE_SYSTEM_PROMPT = """You are a helpful AI assistant."""

# RAG-enhanced system prompt template
RAG_SYSTEM_PROMPT = """You are a helpful AI assistant with access to a knowledge base.

When answering questions, use the following retrieved context to inform your response.
If the context is relevant, incorporate it naturally into your answer and cite the sources.
If the context is not relevant to the question, you may ignore it and answer based on your general knowledge.
If you don't know the answer and the context doesn't help, say so honestly.

=== RETRIEVED CONTEXT ===
{context}
=== END CONTEXT ===

Guidelines:
- Prioritize information from the context when relevant
- Cite sources when using specific information from the context (e.g., "According to [Source 1]...")
- Be concise but thorough
- If the context conflicts with your knowledge, prefer the context but note the discrepancy"""


def _build_system_prompt(
    rag_context: Optional[str],
    custom_instructions: Optional[str],
) -> str:
    if rag_context:
        prompt = RAG_SYSTEM_PROMPT.format(context=rag_context)
    else:
        prompt = BASE_SYSTEM_PROMPT

    instructions = (custom_instructions or "").strip()
    if instructions:
        prompt = f"{prompt}\n\n=== USER INSTRUCTIONS ===\n{instructions}"

    return prompt


def get_chain(
    model_name: str = None,
    provider: str = "huggingface",
    rag_context: Optional[str] = None,
    temperature: Optional[float] = 0.7,
    custom_instructions: Optional[str] = None,
):
    """
    Prepare the AI chain with the appropriate model and prompt.
    
    Uses LLMProviderFactory (Factory Pattern) to create model instances.
    This follows Open/Closed Principle - add new providers by creating
    new provider classes, not by modifying this function.
    
    Args:
        model_name: Specific model to use (or provider default)
        provider: LLM provider (huggingface, openai, anthropic, google)
        rag_context: Optional retrieved context to inject into the system prompt
        temperature: Optional sampling temperature
        custom_instructions: Optional user-defined system prompt additions
        
    Returns:
        A LangChain chain ready for streaming
    """
    print(
        f"DEBUG: Initializing LLM - Model: {model_name}, Provider: {provider}, "
        f"RAG: {bool(rag_context)}, Temp: {temperature}"
    )

    # Use factory pattern for supported providers
    if provider in LLMProviderFactory.get_available_providers():
        try:
            llm_provider = LLMProviderFactory.create(provider)
            model = llm_provider.get_model(model_name, temperature=temperature)
        except ValueError:
            # Fallback to HuggingFace router if provider key not configured
            print(f"DEBUG: Provider {provider} not configured, falling back to HuggingFace router")
            model = _get_huggingface_router_model(model_name, temperature=temperature)
    else:
        # Default: HuggingFace router (supports many models via API)
        model = _get_huggingface_router_model(model_name, temperature=temperature)

    system_prompt = _build_system_prompt(rag_context, custom_instructions)

    # Define the structure of the prompt:
    # 1. A system message sets the persona and includes RAG context if available
    # 2. A placeholder for past chat history
    # 3. The actual user input
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{input}"),
        ]
    )

    # Combine the prompt, the model, and an output parser
    return prompt | model | StrOutputParser()


def _get_huggingface_router_model(
    model_name: str | None,
    temperature: float | None = 0.7,
) -> ChatOpenAI:
    """
    Get a model via HuggingFace's router API.
    
    This is a special case that uses OpenAI-compatible API
    to access HuggingFace hosted models.
    """
    return ChatOpenAI(
        model=model_name or "Qwen/Qwen2.5-72B-Instruct",
        openai_api_key=os.getenv("HUGGINGFACE_API_KEY"),
        openai_api_base="https://router.huggingface.co/v1",
        streaming=True,
        temperature=0.7 if temperature is None else temperature,
    )
