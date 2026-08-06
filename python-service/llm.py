from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser
import os
from dotenv import load_dotenv

load_dotenv()

def get_chain():
    model = ChatOpenAI(
        model="Qwen/Qwen2.5-7B-Instruct",
        openai_api_key=os.getenv("HUGGINGFACE_API_KEY"),
        openai_api_base="https://router.huggingface.co/v1",
        streaming=True,
        temperature=0.7,
    )
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful AI assistant."),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ])
    return prompt | model | StrOutputParser()
