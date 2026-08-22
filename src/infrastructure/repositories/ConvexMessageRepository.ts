'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex/api';
import type { Id } from '@/lib/convex/dataModel';
import type {
  IMessageRepository,
  ChatMessage,
  NewMessage,
} from '@/domain/repositories';

export function useConvexMessageRepository(
  conversationId: Id<'conversations'>,
): IMessageRepository {
  const messages = useQuery(api.messages.list, { conversationId }) ?? [];
  const sendMutation = useMutation(api.messages.send);
  const clearMutation = useMutation(api.messages.clear);

  return {
    list(_conversationId: Id<'conversations'>) {
      return messages as ChatMessage[];
    },

    async send(message: NewMessage): Promise<void> {
      await sendMutation({
        body: message.body,
        author: message.author,
        conversationId: message.conversationId,
      });
    },

    async clear(conversationId: Id<'conversations'>): Promise<void> {
      await clearMutation({ conversationId });
    },
  };
}
