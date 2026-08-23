import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';
import type { ISearchable } from '@/lib/search';
import type { Conversation } from '@/domain/repositories';

export type ConversationListItem = Conversation;

export function toConversationSearchable(
  conversation: ConversationListItem,
): ISearchable<ConversationListItem> {
  return {
    id: conversation._id,
    item: conversation,
    getHaystack: () =>
      [conversation.title ?? DEFAULT_CONVERSATION_TITLE, conversation._id]
        .join(' ')
        .trim(),
  };
}

export function isPlaceholderConversation(
  conversation: ConversationListItem,
): boolean {
  return !conversation.title?.trim() && (conversation.messageCount ?? 0) === 0;
}
