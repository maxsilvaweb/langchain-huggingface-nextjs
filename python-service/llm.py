# This file sets up the Large Language Model (LLM) "chain".
# It configures which AI model (like GPT, Claude, or Gemini) to use and
# creates a prompt template for how the AI should behave.

import os

from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

# Load environment variables (API keys)
load_dotenv()


# This function prepares the AI chain. It picks the right AI provider,
# sets up the system prompt, and makes sure the AI understands chat history.
def get_chain(model_name: str = None, provider: str = "huggingface"):
    print(f"DEBUG: Initializing LLM - Model: {model_name}, Provider: {provider}")

    # Choose the correct AI model based on the provider
    if provider == "openai":
        model = ChatOpenAI(
            model=model_name or "gpt-4o-mini", api_key=os.getenv("OPENAI_API_KEY")
        )
    elif provider == "anthropic":
        model = ChatAnthropic(
            model=model_name or "claude-3-5-sonnet-latest",
            api_key=os.getenv("ANTHROPIC_API_KEY"),
        )
    elif provider == "google":
        model = ChatGoogleGenerativeAI(
            model=model_name or "gemini-1.5-flash", api_key=os.getenv("GOOGLE_API_KEY")
        )
    else:  # huggingface (default)
        model = ChatOpenAI(
            model=model_name or "Qwen/Qwen2.5-7B-Instruct",
            openai_api_key=os.getenv("HUGGINGFACE_API_KEY"),
            openai_api_base="https://router.huggingface.co/v1",
            streaming=True,
            temperature=0.7,
        )

    # Define the structure of the prompt:
    # 1. A system message sets the persona (a helpful AI).
    # 2. A placeholder for past chat history.
    # 3. The actual user input.
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful AI assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{input}"),
        ]
    )

    # Combine the prompt, the model, and an output parser (which turns the AI result into a simple string)
    return prompt | model | StrOutputParser()
