import asyncio
import os
from main import generate_chat_response

async def test_logic():
    print("Testing generate_chat_response...")
    try:
        # Using the exact conversationId from the curl request
        conv_id = "jd744024cd4bh502rk87zycgph8bzfz7"
        message = "Hello again!"
        
        print("Calling generate_chat_response...")
        result = await generate_chat_response(message, conv_id)
        
        print(f"Result type: {type(result)}")
        
        # Try to iterate it
        async for chunk in result:
            print(f"Chunk: {chunk}")
            break
        print("Success: Generated a response.")
        
    except Exception as e:
        print(f"FAILED with error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_logic())
