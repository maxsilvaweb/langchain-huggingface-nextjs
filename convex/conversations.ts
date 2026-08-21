import { v } from 'convex/values';
import { queryGeneric, mutationGeneric } from 'convex/server';

export const create = mutationGeneric({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert('conversations', {
      title: args.title,
    });
  },
});

export const get = queryGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('conversations').order('desc').collect();
  },
});

export const updateTitle = mutationGeneric({
  args: {
    conversationId: v.id('conversations'),
    title: v.string(),
  },
  handler: async (ctx, args) => {
    // Guard against stale/phantom conversation IDs (e.g. IDs lingering in
    // localStorage after a schema reset). No-op instead of throwing so the
    // browser client doesn't see a mutation error on first-message titles.
    const existing = await ctx.db.get(args.conversationId);
    if (!existing) return;
    await ctx.db.patch(args.conversationId, { title: args.title });
  },
});

export const remove = mutationGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    // 1. Delete all messages associated with this conversation
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    // 2. Delete the conversation itself
    await ctx.db.delete(args.conversationId);
  },
});

export const getFirstEmpty = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const conversations = await ctx.db.query('conversations').order('desc').collect();
    for (const conv of conversations) {
      const messages = await ctx.db
        .query('messages')
        .withIndex('by_conversation', (q) => q.eq('conversationId', conv._id))
        .first();
      
      if (!messages) {
        return conv._id;
      }
    }
    return null;
  },
});
