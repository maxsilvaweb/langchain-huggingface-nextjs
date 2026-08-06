import os
import config
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser as StringOutputParser
from langchain_core.messages import HumanMessage, AIMessage

def get_model(model_name: str = None, provider: str = 'huggingface'):
    # Use the key loaded by config.py
    api_key = config.HUGGINGFACE_API_KEY
    if not api_key:
        print("DEBUG: HUGGINGFACE_API_KEY not found in config.HUGGINGFACE_API_KEY")
        raise ValueError("Missing HUGGINGFACE_API_KEY")
        
    # We use ChatOpenAI to point to the Hugging Face router
    return ChatOpenAI(
        model=model_name or "Qwen/Qwen2.5-7B-Instruct",
        openai_api_key=api_key,
        openai_api_base="https://router.huggingface.co/v1",
        streaming=True,
        temperature=0.7,
    )

async def generate_chat_response(message: str, conversation_history: list, model_name: str = None):
    model = get_model(model_name)
    
    # Convert history to LangChain messages
    history = [
        HumanMessage(content=msg["body"]) if msg["author"] == "user" 
        else AIMessage(content=msg["body"]) 
        for msg in conversation_history
    ]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful AI assistant. Use the conversation history to answer follow-up questions consistently."),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ])
    
    # chain.astream returns an async iterator directly
    chain = prompt | model | StringOutputParser()
    return chain.astream({"input": message, "history": history})
