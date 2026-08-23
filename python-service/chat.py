# This file acts as the bridge between our database and the AI model.
# It handles the logic for starting a chat stream (sending messages to AI
# and receiving the response) and saving messages.

import db as convex
import llm
from langchain_core.messages import AIMessage, HumanMessage


# This function initiates a streaming chat.
# It fetches the previous messages from the database to give the AI context (history),
# gets the AI chain ready, and then starts streaming the response back to the user.
def get_chat_stream(
    message: str,
    conversation_id: str,
    convex_token: str,
    model_name: str | None = None,
    provider: str = "huggingface",
):
    # Fetch existing chat history from the database
    messages = convex.get_history(conversation_id, convex_token)

    # Convert the raw database messages into a format that LangChain understands
    # (HumanMessage for user messages, AIMessage for AI responses)
    history = [
        HumanMessage(content=m["body"])
        if m["author"] == "user"
        else AIMessage(content=m["body"])
        for m in sorted(messages, key=lambda x: x["_creationTime"])
    ]

    # Initialize the AI model chain with the requested model/provider
    chain = llm.get_chain(model_name, provider)

    # Return a stream of responses from the AI, including the current input and the history
    return chain.astream({"input": message, "history": history})


# This function simply saves a new message into the database.
def save_interaction(conversation_id: str, message: str, author: str, convex_token: str):
    convex.save_msg(conversation_id, message, author, convex_token)
