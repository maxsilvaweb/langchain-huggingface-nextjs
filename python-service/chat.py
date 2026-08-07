from langchain_core.messages import HumanMessage, AIMessage
import db as convex
import llm

def get_chat_stream(message: str, conversation_id: str, model_name: str = None, provider: str = 'huggingface'):
    # Fetch history
    messages = convex.get_history(conversation_id)
    history = [
        HumanMessage(content=m["body"]) if m["author"]=="user" else AIMessage(content=m["body"])
        for m in sorted(messages, key=lambda x: x["_creationTime"])
    ]
    
    # Get chain and stream with dynamic provider
    chain = llm.get_chain(model_name, provider)
    return chain.astream({"input": message, "history": history})

def save_interaction(conversation_id: str, message: str, author: str):
    convex.save_msg(conversation_id, message, author)
