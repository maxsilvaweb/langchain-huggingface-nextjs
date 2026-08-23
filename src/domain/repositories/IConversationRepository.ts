import type { Id } from '@/lib/convex/dataModel';

export interface Conversation {
  _id: Id<'conversations'>;
  _creationTime: number;
  title?: string;
  messageCount?: number;
}

export interface IConversationRepository {
  list(): Conversation[] | undefined;
  getFirstEmpty(): Id<'conversations'> | undefined | null;
  ensureSingleEmpty(): Promise<Id<'conversations'> | null>;
  updateTitle(conversationId: Id<'conversations'>, title: string): Promise<void>;
  create(title?: string): Promise<Id<'conversations'>>;
  delete(conversationId: Id<'conversations'>): Promise<void>;
}
