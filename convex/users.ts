import { mutationGeneric, queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { ensureUserId, getExistingUserId } from './auth';

const preferencesValidator = v.object({
  defaultModelId: v.optional(v.string()),
  useRag: v.optional(v.boolean()),
  temperature: v.optional(v.number()),
  customInstructions: v.optional(v.string()),
});

export const me = queryGeneric({
  args: {},
  handler: async (ctx) => {
    try {
      const userId = await getExistingUserId(ctx);
      return userId ? await ctx.db.get(userId) : null;
    } catch {
      return null;
    }
  },
});

/**
 * Get a user by their external (Clerk) ID.
 * Used by the documents vector search action.
 */
export const getByExternalId = queryGeneric({
  args: { externalId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_external_id', (q: any) => q.eq('externalId', args.externalId))
      .first();
  },
});

/**
 * Upsert chat/RAG preferences for the signed-in user.
 */
export const updatePreferences = mutationGeneric({
  args: {
    preferences: preferencesValidator,
  },
  handler: async (ctx, args) => {
    const userId = await ensureUserId(ctx);
    const user = await ctx.db.get(userId);
    const next = {
      ...(user?.preferences ?? {}),
      ...args.preferences,
    };

    // Clamp temperature to a safe range for LLM providers
    if (typeof next.temperature === 'number') {
      next.temperature = Math.min(2, Math.max(0, next.temperature));
    }

    if (typeof next.customInstructions === 'string') {
      next.customInstructions = next.customInstructions.slice(0, 2000);
    }

    await ctx.db.patch(userId, { preferences: next });
    return await ctx.db.get(userId);
  },
});
