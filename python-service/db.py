from convex import ConvexClient
import os
from dotenv import load_dotenv

load_dotenv()
client = ConvexClient(os.getenv("NEXT_PUBLIC_CONVEX_URL"))

def get_history(conversation_id: str):
    return client.query("messages:list", {"conversationId": conversation_id})

def save_msg(conversation_id: str, body: str, author: str):
    client.mutation("messages:send", {
        "conversationId": conversation_id,
        "body": body,
        "author": author
    })
