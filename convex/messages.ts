import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import {
  ensureConversationOwner,
  getConversationOwner,
} from './auth';

async function updateConversationMessageCount(
  ctx: any,
  conversationId: Id<'conversations'>,
  delta: number,
) {
  const conversation = await ctx.db.get(conversationId);
  if (!conversation) return;

  const nextCount = Math.max(0, (conversation.messageCount ?? 0) + delta);
  await ctx.db.patch(conversationId, { messageCount: nextCount });
}

export const list = queryGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId, conversation } = await getConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation) return [];

    const rows = await ctx.db
      .query('messages')
      .withIndex('by_user_conversation', (q: any) =>
        q.eq('userId', userId).eq('conversationId', args.conversationId),
      )
      .collect();

    return rows.filter((message) => message.userId === userId);
  },
});

export const hasAny = queryGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId, conversation } = await getConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation) return false;

    const firstMessage = await ctx.db
      .query('messages')
      .withIndex('by_user_conversation', (q: any) =>
        q.eq('userId', userId).eq('conversationId', args.conversationId),
      )
      .first();

    if (!firstMessage) return false;
    return firstMessage.userId === userId;
  },
});

export const send = mutationGeneric({
  args: {
    body: v.string(),
    author: v.union(v.literal('user'), v.literal('ai')),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    const { userId, conversation } = await ensureConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation || !userId) {
      throw new Error('Conversation not found');
    }

    await ctx.db.insert('messages', {
      body: args.body,
      author: args.author,
      conversationId: args.conversationId,
      userId,
    });

    await updateConversationMessageCount(ctx, args.conversationId, 1);
  },
});

export const clear = mutationGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId, conversation } = await ensureConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation || !userId) return;

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_user_conversation', (q: any) =>
        q.eq('userId', userId).eq('conversationId', args.conversationId),
      )
      .collect();

    for (const message of messages) {
      if (message.userId === userId) {
        await ctx.db.delete(message._id);
      }
    }

    await ctx.db.patch(args.conversationId, { messageCount: 0 });
  },
});
