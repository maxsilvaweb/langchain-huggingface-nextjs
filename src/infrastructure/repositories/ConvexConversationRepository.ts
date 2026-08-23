'use client';

import { useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex/api';
import type { Id } from '@/lib/convex/dataModel';
import type {
  IConversationRepository,
  Conversation,
} from '@/domain/repositories';

export function useConvexConversationRepository(): IConversationRepository {
  const conversations = useQuery(api.conversations.list);
  const emptyConversationId = useQuery(api.conversations.getFirstEmpty);
  const createMutation = useMutation(api.conversations.create);
  const ensureSingleEmptyMutation = useMutation(api.conversations.ensureSingleEmpty);
  const updateTitleMutation = useMutation(api.conversations.updateTitle);
  const deleteMutation = useMutation(api.conversations.remove);

  return {
    list(): Conversation[] | undefined {
      return conversations as Conversation[] | undefined;
    },

    getFirstEmpty(): Id<'conversations'> | undefined | null {
      return emptyConversationId;
    },

    async ensureSingleEmpty(): Promise<Id<'conversations'> | null> {
      return await ensureSingleEmptyMutation({});
    },

    async create(title?: string): Promise<Id<'conversations'>> {
      return await createMutation(title ? { title } : {});
    },

    async updateTitle(
      conversationId: Id<'conversations'>,
      title: string,
    ): Promise<void> {
      await updateTitleMutation({ conversationId, title });
    },

    async delete(conversationId: Id<'conversations'>): Promise<void> {
      await deleteMutation({ conversationId });
    },
  };
}
