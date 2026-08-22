import { v } from 'convex/values';
import { queryGeneric, mutationGeneric } from 'convex/server';

async function updateConversationMessageCount(
  ctx: Parameters<(typeof mutationGeneric)>[0] extends never ? never : any,
  conversationId: string,
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
    return await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .collect();
  },
});

export const hasAny = queryGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const firstMessage = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .first();

    return firstMessage !== null;
  },
});

export const send = mutationGeneric({
  args: { 
    body: v.string(),
    author: v.union(v.literal('user'), v.literal('ai')),
    conversationId: v.id('conversations'),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert('messages', {
      body: args.body,
      author: args.author,
      conversationId: args.conversationId,
    });

    await updateConversationMessageCount(ctx, args.conversationId, 1);
  },
});

export const clear = mutationGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(args.conversationId, { messageCount: 0 });
    }
  },
});
