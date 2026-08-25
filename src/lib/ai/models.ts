export type Provider = 'huggingface' | 'openai' | 'anthropic' | 'google';

export interface ModelOption {
  id: string;
  name: string;
  provider: Provider;
  disabled?: boolean;
  disabledReason?: string;
}

export const AVAILABLE_MODELS: ModelOption[] = [
  // Hugging Face
  {
    id: 'Qwen/Qwen2.5-72B-Instruct',
    name: 'Qwen 2.5 72B Instruct',
    provider: 'huggingface',
  },
  {
    id: 'meta-llama/Llama-3.1-8B-Instruct',
    name: 'Llama 3.1 8B Instruct',
    provider: 'huggingface',
  },
  {
    id: 'deepseek-ai/DeepSeek-V3',
    name: 'DeepSeek V3',
    provider: 'huggingface',
  },
  {
    id: 'google/gemma-3-12b-it',
    name: 'Gemma 3 12B',
    provider: 'huggingface',
  },
  {
    id: 'Qwen/Qwen2.5-7B-Instruct',
    name: 'Qwen 2.5 7B Instruct',
    provider: 'huggingface',
  },

  // OpenAI
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai' },

  // Anthropic (disabled - no credits)
  {
    id: 'claude-fable-5',
    name: 'Claude Fable 5',
    provider: 'anthropic',
    disabled: true,
    disabledReason: 'No credits available',
  },
  {
    id: 'claude-opus-5',
    name: 'Claude Opus 5',
    provider: 'anthropic',
    disabled: true,
    disabledReason: 'No credits available',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    provider: 'anthropic',
    disabled: true,
    disabledReason: 'No credits available',
  },
  {
    id: 'claude-3-5-sonnet-latest',
    name: 'Claude 3.5 Sonnet',
    provider: 'anthropic',
    disabled: true,
    disabledReason: 'No credits available',
  },
  {
    id: 'claude-3-haiku-20240307',
    name: 'Claude 3 Haiku',
    provider: 'anthropic',
    disabled: true,
    disabledReason: 'No credits available',
  },

  // Google
  {
    id: 'gemini-3.5-flash',
    name: 'Gemini 3.5 Flash',
    provider: 'google',
  },
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    provider: 'google',
  },
];

export const PROVIDER_FALLBACK_MODELS: Record<Provider, string> = {
  huggingface:
    AVAILABLE_MODELS.find((m) => m.provider === 'huggingface')?.id ??
    'Qwen/Qwen2.5-72B-Instruct',
  openai:
    AVAILABLE_MODELS.find((m) => m.provider === 'openai')?.id ?? 'gpt-4o-mini',
  anthropic:
    AVAILABLE_MODELS.find((m) => m.provider === 'anthropic')?.id ??
    'claude-opus-5',
  google:
    AVAILABLE_MODELS.find((m) => m.provider === 'google')?.id ??
    'gemini-3.5-flash',
};

export const HUGGINGFACE_MODELS = {
  default:
    process.env.HUGGINGFACE_CHAT_MODEL ?? PROVIDER_FALLBACK_MODELS.huggingface,
  embeddings:
    process.env.HUGGINGFACE_EMBEDDING_MODEL ??
    'sentence-transformers/all-MiniLM-L6-v2',
};

export const EMBEDDING_DIMENSIONS = 384; // all-MiniLM-L6-v2 is 384
