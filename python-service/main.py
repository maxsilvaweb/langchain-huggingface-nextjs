from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
import chat as chat_service

app = FastAPI()

class ChatRequest(BaseModel):
    message: str
    conversationId: str
    modelName: str = None
    provider: str = 'huggingface'

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        # Get generator
        async_gen = chat_service.get_chat_stream(request.message, request.conversationId)
            
        async def stream_generator():
            full_response = ""
            async for chunk in async_gen:
                full_response += chunk
                yield chunk.encode("utf-8")
            # Save AI response
            chat_service.save_interaction(request.conversationId, full_response, "ai")
                
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    except Exception as e:
        print(f"DEBUG: Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))
