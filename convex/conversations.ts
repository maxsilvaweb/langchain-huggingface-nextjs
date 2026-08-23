import { v } from 'convex/values';
import { queryGeneric, mutationGeneric } from 'convex/server';

async function isPlaceholderConversation(
  ctx: any,
  conversation: {
    _id: string;
    title?: string;
    messageCount?: number;
  },
) {
  if (conversation.title?.trim()) return false;
  if ((conversation.messageCount ?? 0) > 0) return false;

  const firstMessage = await ctx.db
    .query('messages')
    .withIndex('by_conversation', (q: any) =>
      q.eq('conversationId', conversation._id),
    )
    .first();

  return firstMessage === null;
}

async function listPlaceholderConversations(ctx: any) {
  const conversations = await ctx.db
    .query('conversations')
    .order('desc')
    .collect();
  const placeholders = [];

  for (const conversation of conversations) {
    if (await isPlaceholderConversation(ctx, conversation)) {
      placeholders.push(conversation);
    }
  }

  return placeholders;
}

async function keepSinglePlaceholder(ctx: any) {
  const placeholders = await listPlaceholderConversations(ctx);
  const [canonical, ...duplicates] = placeholders;

  for (const duplicate of duplicates) {
    await ctx.db.delete(duplicate._id);
  }

  return canonical ?? null;
}

export const create = mutationGeneric({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const trimmedTitle = args.title?.trim();

    if (trimmedTitle) {
      return await ctx.db.insert('conversations', {
        title: trimmedTitle,
        messageCount: 0,
      });
    }

    const existingPlaceholder = await keepSinglePlaceholder(ctx);
    if (existingPlaceholder) {
      return existingPlaceholder._id;
    }

    return await ctx.db.insert('conversations', {
      messageCount: 0,
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
    const conversations = await ctx.db
      .query('conversations')
      .order('desc')
      .collect();
    return conversations.map((conv) => ({
      ...conv,
      messageCount: conv.messageCount ?? 0,
    }));
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
      .withIndex('by_conversation', (q) =>
        q.eq('conversationId', args.conversationId),
      )
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    const conversation = await ctx.db.get(args.conversationId);
    if (conversation) {
      await ctx.db.patch(conversation._id, { messageCount: 0 });
    }

    // 2. Delete the conversation itself
    await ctx.db.delete(args.conversationId);
  },
});

export const getFirstEmpty = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const placeholders = await listPlaceholderConversations(ctx);
    return placeholders[0]?._id ?? null;
  },
});

export const ensureSingleEmpty = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const placeholder = await keepSinglePlaceholder(ctx);
    return placeholder?._id ?? null;
  },
});
