import { CHAT_SESSION_STORAGE_KEY } from '@/lib/globals';

/** Path to the user's current chat thread, falling back to the chat index. */
export function getActiveChatHref(): string {
  if (typeof window === 'undefined') {
    return '/chat';
  }

  const conversationId = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
  return conversationId ? `/chat/${conversationId}` : '/chat';
}
