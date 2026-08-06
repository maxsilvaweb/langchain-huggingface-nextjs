from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import os
from convex import ConvexClient
from langchain_openai import ChatOpenAI
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.output_parsers import StrOutputParser as StringOutputParser
from langchain_core.messages import HumanMessage, AIMessage
from dotenv import load_dotenv

# Load env vars
load_dotenv()
CONVEX_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")
HUGGINGFACE_API_KEY = os.getenv("HUGGINGFACE_API_KEY")

# Initialize Convex Client
convex = ConvexClient(CONVEX_URL)

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    conversationId: str
    modelName: str = None
    provider: str = 'huggingface'

def get_model(model_name: str = None):
    if not HUGGINGFACE_API_KEY:
        raise ValueError("Missing HUGGINGFACE_API_KEY")
    return ChatOpenAI(
        model=model_name or "Qwen/Qwen2.5-7B-Instruct",
        openai_api_key=HUGGINGFACE_API_KEY,
        openai_api_base="https://router.huggingface.co/v1",
        streaming=True,
        temperature=0.7,
    )

async def generate_chat_response(message: str, conversation_id: str, model_name: str = None):
    # Fetch History
    try:
        # Client 0.7.0 uses synchronous calls
        stored_messages = convex.query("messages:list", {"conversationId": conversation_id})
        history = [
            HumanMessage(content=msg["body"]) if msg["author"] == "user" 
            else AIMessage(content=msg["body"]) 
            for msg in sorted(stored_messages, key=lambda x: x["_creationTime"])
        ]
    except Exception as e:
        print(f"DEBUG: Query failed: {e}")
        history = []
    
    # Setup Prompt
    model = get_model(model_name)
    prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful AI assistant."),
        MessagesPlaceholder(variable_name="history"),
        ("user", "{input}"),
    ])
    
    chain = prompt | model | StringOutputParser()
    return chain.astream({"input": message, "history": history})

async def save_message(conversation_id: str, body: str, author: str):
    try:
        # Client 0.7.0 uses synchronous calls
        convex.mutation("messages:send", {
            "conversationId": conversation_id,
            "body": body,
            "author": author
        })
    except Exception as e:
        print(f"DEBUG: Mutation failed: {e}")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Save user message
        await save_message(request.conversationId, request.message, "user")
        
        # Get generator
        async_gen = await generate_chat_response(request.message, request.conversationId, request.modelName)
            
        async def stream_generator():
            full_response = ""
            async for chunk in async_gen:
                full_response += chunk
                yield chunk.encode("utf-8")
            # Save AI response
            await save_message(request.conversationId, full_response, "ai")
                
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    except Exception as e:
        print(f"DEBUG: Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
