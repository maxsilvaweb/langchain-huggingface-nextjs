export type Provider = 'huggingface' | 'openai' | 'anthropic' | 'google';

export const AVAILABLE_MODELS = [
  // Hugging Face
  { id: 'Qwen/Qwen2.5-7B-Instruct', name: 'Qwen 2.5 7B Instruct', provider: 'huggingface' as Provider },
  { id: 'meta-llama/Llama-3.1-8B-Instruct', name: 'Llama 3.1 8B Instruct', provider: 'huggingface' as Provider },
  { id: 'deepseek-ai/DeepSeek-V3', name: 'DeepSeek V3', provider: 'huggingface' as Provider },
  { id: 'google/gemma-3-12b-it', name: 'Gemma 3 12B', provider: 'huggingface' as Provider },
  { id: 'Qwen/Qwen2.5-72B-Instruct', name: 'Qwen 2.5 72B Instruct', provider: 'huggingface' as Provider },
  
  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' as Provider },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' as Provider },
  
  // Anthropic
  { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', provider: 'anthropic' as Provider },
  { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', provider: 'anthropic' as Provider },
  
  // Google
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'google' as Provider },
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash', provider: 'google' as Provider },
];

export const HUGGINGFACE_MODELS = {
  default:
    process.env.HUGGINGFACE_CHAT_MODEL ?? AVAILABLE_MODELS[0].id,
  embeddings:
    process.env.HUGGINGFACE_EMBEDDING_MODEL ??
    'sentence-transformers/all-MiniLM-L6-v2',
};

export const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2 is 384
