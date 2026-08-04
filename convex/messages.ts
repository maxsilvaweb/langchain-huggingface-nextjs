import { v } from "convex/values";
import { queryGeneric, mutationGeneric, actionGeneric } from "convex/server";

export const list = queryGeneric({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
  },
});

export const send = mutationGeneric({
  args: { 
    body: v.string(), 
    author: v.union(v.literal("user"), v.literal("ai")),
    sessionId: v.string() 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.body,
      author: args.author,
      sessionId: args.sessionId,
    });
  },
});

export const clear = mutationGeneric({
  args: { sessionId: v.string() },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});
