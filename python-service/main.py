# This is the main file for our Python backend service.
# It uses FastAPI to create an API endpoint that handles incoming chat requests.

import chat as chat_service
from fastapi import FastAPI, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

# Initialize the FastAPI application
app = FastAPI()


# This class defines the structure of the data the client sends to the /chat endpoint.
# It ensures that the incoming request is valid and has all necessary fields.
class ChatRequest(BaseModel):
    message: str # The user's message text
    conversationId: str # The ID of the current conversation
    modelName: str = None # Optional: Name of the AI model to use
    provider: str = "huggingface" # Optional: The AI provider (default is huggingface)


# Define a POST route at "/chat" to receive chat messages
@app.post("/chat")
async def chat(request: ChatRequest):
    # Wrap the logic in a try-except block to handle and catch any errors gracefully
    try:
        # 1. First, save the user's message to our database
        chat_service.save_interaction(request.conversationId, request.message, "user")

        # 2. Get the stream generator from the chat service
        # This function starts the interaction with the AI and prepares to stream the response
        async_gen = chat_service.get_chat_stream(
            request.message, request.conversationId, request.modelName, request.provider
        )

        # 3. Define a helper function to handle the streaming of the AI response
        # This is an asynchronous generator function
        async def stream_generator():
            full_response = "" # Variable to accumulate the full response for saving later
            
            # Iterate over the stream as it produces chunks of text
            async for chunk in async_gen:
                full_response += chunk # Build the full response string as we receive chunks
                
                # Send the chunk back to the client immediately (encoded as bytes)
                yield chunk.encode("utf-8")
            
            # 4. Once the stream is finished, save the full completed AI response to the database
            chat_service.save_interaction(request.conversationId, full_response, "ai")

        # 5. Return a StreamingResponse to the client
        # This tells the client to expect a continuous stream of data
        return StreamingResponse(stream_generator(), media_type="text/event-stream")
    
    # Error handling block
    except Exception as e:
        # Print the error details to the server logs for debugging
        print(f"DEBUG: Error in chat endpoint: {e}")
        # Return a 500 Internal Server Error to the client with the error message
        raise HTTPException(status_code=500, detail=str(e))
