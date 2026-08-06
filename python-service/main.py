from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from chat import generate_chat_response
import os

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    conversationId: str
    modelName: str = None
    provider: str = 'huggingface'

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/chat")
async def chat(request: ChatRequest):
    # For now, we are stubbing the history fetch (Phase 2)
    # We will pass an empty list, and implement Convex fetching next
    try:
        # Use Astream directly which returns an async generator
        async def stream_generator():
            async for chunk in await generate_chat_response(request.message, [], request.modelName):
                yield chunk

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
