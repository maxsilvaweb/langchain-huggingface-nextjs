import type { Id } from '@/lib/convex/dataModel';

export interface ChatMessage {
  _id: Id<'messages'>;
  _creationTime: number;
  body: string;
  author: 'user' | 'ai';
  conversationId: Id<'conversations'>;
  userId: Id<'users'>;
}

export interface NewMessage {
  body: string;
  author: 'user' | 'ai';
  conversationId: Id<'conversations'>;
}

export interface IMessageRepository {
  list(conversationId: Id<'conversations'>): ChatMessage[] | undefined;
  send(message: NewMessage): Promise<void>;
  clear(conversationId: Id<'conversations'>): Promise<void>;
}
