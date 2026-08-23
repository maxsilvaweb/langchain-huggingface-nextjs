# This file handles all interactions with our database, which is Convex.
# It sets up the connection and provides functions to read and write messages.

import os

from dotenv import load_dotenv

from convex import ConvexClient

# Load environment variables from a .env file (like database URLs)
load_dotenv()

DEPLOYMENT_URL = os.getenv("NEXT_PUBLIC_CONVEX_URL")


def get_client(token: str) -> ConvexClient:
    client = ConvexClient(DEPLOYMENT_URL)
    client.set_auth(token)
    return client


# This function fetches the chat history for a specific conversation from the database.
def get_history(conversation_id: str, token: str):
    client = get_client(token)
    return client.query("messages:list", {"conversationId": conversation_id})


# This function saves a new message to the database for a specific conversation.
def save_msg(conversation_id: str, body: str, author: str, token: str):
    client = get_client(token)
    client.mutation(
        "messages:send",
        {"conversationId": conversation_id, "body": body, "author": author},
    )
