import type { Id } from '@/lib/convex/dataModel';

export interface ChatRequest {
  message: string;
  conversationId: Id<'conversations'>;
  modelName?: string;
  provider?: string;
}

export interface ChatResponse {
  success: boolean;
  content?: string;
  error?: string;
}

export interface IChatService {
  sendMessage(request: ChatRequest): Promise<ReadableStream<Uint8Array> | null>;
  generateTitle(message: string): Promise<string | null>;
}
