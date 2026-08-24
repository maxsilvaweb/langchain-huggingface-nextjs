# This file acts as the bridge between our database and the AI model.
# It handles the logic for starting a chat stream (sending messages to AI
# and receiving the response), RAG retrieval, and saving messages.
#
# Architecture: Uses dependency injection for SOLID compliance.
# Retrieval and LLM access go through the ServiceContainer.

from typing import Optional

import db as convex
import llm
from langchain_core.messages import AIMessage, HumanMessage

from container import get_container


def get_chat_stream(
    message: str,
    conversation_id: str,
    convex_token: str,
    model_name: str | None = None,
    provider: str = "huggingface",
    use_rag: bool = True,
):
    """
    Initiate a streaming chat with optional RAG context retrieval.
    
    This function:
    1. Optionally retrieves relevant document chunks for the query (RAG)
    2. Fetches the conversation history from the database
    3. Builds the prompt with context and history
    4. Streams the AI response back to the user
    
    Uses dependency injection via ServiceContainer for:
    - Context retrieval (IContextRetriever)
    - LLM provider (ILLMProvider)
    
    Args:
        message: The user's current message
        conversation_id: The Convex conversation ID
        convex_token: Auth token for Convex
        model_name: Optional model name override
        provider: LLM provider (huggingface, openai, anthropic, google)
        use_rag: Whether to retrieve and inject document context
        
    Returns:
        An async generator yielding response chunks
    """
    # Get services from DI container
    container = get_container()
    
    # 1. RAG: Retrieve relevant context if enabled
    rag_context = ""
    retrieved_sources = []
    
    if use_rag:
        try:
            # Use the injected context retriever
            retriever = container.get_context_retriever(convex_token)
            config = container.config
            
            retrieved_docs = retriever.retrieve(
                query=message,
                top_k=config.retrieval_top_k,
                threshold=config.retrieval_threshold,
            )
            
            if retrieved_docs:
                rag_context = retriever.build_context(retrieved_docs)
                retrieved_sources = [
                    {
                        "source": doc.get("metadata", {}).get("source", "Unknown"),
                        "score": round(doc.get("_score", 0), 3),
                    }
                    for doc in retrieved_docs
                ]
                print(f"DEBUG: RAG retrieved {len(retrieved_docs)} relevant chunks")
            else:
                print(f"DEBUG: RAG retrieved 0 chunks (threshold={config.retrieval_threshold})")
        except Exception as e:
            # RAG failures shouldn't break the chat - log clearly and continue
            # This usually means the embedding API is unavailable (e.g. depleted credits)
            import traceback
            print(f"WARNING: RAG retrieval failed - AI will respond without knowledge base context")
            print(f"WARNING: Error: {e}")
            print(f"WARNING: To fix: set RAG_EMBEDDING_PROVIDER=openai and OPENAI_API_KEY in .env")
            traceback.print_exc()

    # 2. Fetch existing chat history from the database
    messages = convex.get_history(conversation_id, convex_token)

    # Convert the raw database messages into a format that LangChain understands
    history = [
        HumanMessage(content=m["body"])
        if m["author"] == "user"
        else AIMessage(content=m["body"])
        for m in sorted(messages, key=lambda x: x["_creationTime"])
    ]

    # 3. Initialize the AI model chain with RAG context
    # Note: llm.get_chain could also be refactored to use the LLM provider factory,
    # but keeping it for backward compatibility with model_name/provider params
    chain = llm.get_chain(
        model_name=model_name,
        provider=provider,
        rag_context=rag_context,
    )

    # 4. Return a stream of responses from the AI
    return chain.astream({"input": message, "history": history})


def save_interaction(
    conversation_id: str,
    message: str,
    author: str,
    convex_token: str,
) -> None:
    """Save a new message into the database."""
    convex.save_msg(conversation_id, message, author, convex_token)
