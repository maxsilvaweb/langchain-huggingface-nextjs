export const HUGGINGFACE_MODELS = {
  default:
    process.env.HUGGINGFACE_CHAT_MODEL ?? 'mistralai/Mistral-7B-Instruct-v0.2',
  embeddings:
    process.env.HUGGINGFACE_EMBEDDING_MODEL ??
    'sentence-transformers/all-MiniLM-L6-v2',
};

export const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2 is 384
