import type { ChatRequest, IChatService } from '@/domain/repositories';
import { CHAT_API_PATH, CHAT_TITLE_API_PATH } from '@/lib/globals';

export class ApiChatService implements IChatService {
  private readonly baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async sendMessage(
    request: ChatRequest,
  ): Promise<ReadableStream<Uint8Array> | null> {
    const response = await fetch(`${this.baseUrl}${CHAT_API_PATH}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: request.message,
        conversationId: request.conversationId,
        modelName: request.modelName,
        provider: request.provider,
      }),
    });

    if (!response.ok) {
      const errorData = await response
        .json()
        .catch(() => ({ error: 'Failed to fetch AI response' }));
      throw new Error(errorData.error || 'Failed to fetch AI response');
    }

    return response.body;
  }

  async generateTitle(message: string): Promise<string | null> {
    try {
      const response = await fetch(`${this.baseUrl}${CHAT_TITLE_API_PATH}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) {
        throw new Error(`title HTTP ${response.status}`);
      }

      const data = await response.json().catch(() => null);
      return data?.title?.trim() || null;
    } catch {
      return null;
    }
  }
}
