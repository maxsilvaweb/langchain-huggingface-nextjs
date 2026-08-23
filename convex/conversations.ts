import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import type { Id } from './_generated/dataModel';
import {
  ensureConversationOwner,
  ensureUserId,
  getConversationOwner,
  getExistingUserId,
} from './auth';

async function isPlaceholderConversation(
  ctx: any,
  conversation: {
    _id: Id<'conversations'>;
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

async function listPlaceholderConversations(ctx: any, userId: Id<'users'>) {
  const conversations = await ctx.db
    .query('conversations')
    .withIndex('by_user', (q: any) => q.eq('userId', userId))
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

async function keepSinglePlaceholder(ctx: any, userId: Id<'users'>) {
  const placeholders = await listPlaceholderConversations(ctx, userId);
  const [canonical, ...duplicates] = placeholders;

  for (const duplicate of duplicates) {
    await ctx.db.delete(duplicate._id);
  }

  return canonical ?? null;
}

export const create = mutationGeneric({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const trimmedTitle = args.title?.trim();

    if (trimmedTitle) {
      return await ctx.db.insert('conversations', {
        title: trimmedTitle,
        messageCount: 0,
        userId,
      });
    }

    const existingPlaceholder = await keepSinglePlaceholder(ctx, userId);
    if (existingPlaceholder) {
      return existingPlaceholder._id;
    }

    return await ctx.db.insert('conversations', {
      messageCount: 0,
      userId,
    });
  },
});

export const get = queryGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { conversation } = await getConversationOwner(
      ctx,
      args.conversationId,
    );
    return conversation;
  },
});

export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getExistingUserId(ctx);
    if (!userId) return [];
    const conversations = await ctx.db
      .query('conversations')
      .withIndex('by_user', (q: any) => q.eq('userId', userId))
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
    const { conversation } = await ensureConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation) return;
    await ctx.db.patch(args.conversationId, { title: args.title.trim() });
  },
});

export const remove = mutationGeneric({
  args: { conversationId: v.id('conversations') },
  handler: async (ctx, args) => {
    const { userId, conversation } = await ensureConversationOwner(
      ctx,
      args.conversationId,
    );
    if (!conversation) return;

    const messages = await ctx.db
      .query('messages')
      .withIndex('by_user_conversation', (q: any) =>
        q.eq('userId', userId).eq('conversationId', args.conversationId),
      )
      .collect();

    for (const message of messages) {
      await ctx.db.delete(message._id);
    }

    await ctx.db.delete(args.conversationId);
  },
});

export const getFirstEmpty = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getExistingUserId(ctx);
    if (!userId) return null;
    const placeholders = await listPlaceholderConversations(ctx, userId);
    return placeholders[0]?._id ?? null;
  },
});

export const ensureSingleEmpty = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await ensureUserId(ctx);
    const placeholder = await keepSinglePlaceholder(ctx, userId);
    return placeholder?._id ?? null;
  },
});
