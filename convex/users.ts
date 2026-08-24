import { queryGeneric } from 'convex/server';
import { v } from 'convex/values';
import { getExistingUserId } from './auth';

export const me = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getExistingUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
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
