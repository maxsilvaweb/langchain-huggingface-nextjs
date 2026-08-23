import { queryGeneric } from 'convex/server';
import { getExistingUserId } from './auth';

export const me = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const userId = await getExistingUserId(ctx);
    return userId ? await ctx.db.get(userId) : null;
  },
});
