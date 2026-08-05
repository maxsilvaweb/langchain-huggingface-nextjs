import { v } from "convex/values";
import { queryGeneric, mutationGeneric } from "convex/server";

export const create = mutationGeneric({
  args: { title: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await ctx.db.insert("conversations", {
      title: args.title,
    });
  },
});

export const get = queryGeneric({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.conversationId);
  },
});
