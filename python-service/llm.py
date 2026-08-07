import os

from dotenv import load_dotenv
from langchain_anthropic import ChatAnthropic
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI

load_dotenv()


def get_chain(model_name: str = None, provider: str = "huggingface"):
    print(f"DEBUG: Initializing LLM - Model: {model_name}, Provider: {provider}")

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
    else:  # huggingface
        model = ChatOpenAI(
            model=model_name or "Qwen/Qwen2.5-7B-Instruct",
            openai_api_key=os.getenv("HUGGINGFACE_API_KEY"),
            openai_api_base="https://router.huggingface.co/v1",
            streaming=True,
            temperature=0.7,
        )

    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", "You are a helpful AI assistant."),
            MessagesPlaceholder(variable_name="history"),
            ("user", "{input}"),
        ]
    )
    return prompt | model | StrOutputParser()
