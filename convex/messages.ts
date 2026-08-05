import { v } from "convex/values";
import { queryGeneric, mutationGeneric, actionGeneric } from "convex/server";

export const list = queryGeneric({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
  },
});

export const send = mutationGeneric({
  args: { 
    body: v.string(), 
    author: v.union(v.literal("user"), v.literal("ai")),
    conversationId: v.id("conversations") 
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      body: args.body,
      author: args.author,
      conversationId: args.conversationId,
    });
  },
});

export const clear = mutationGeneric({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
  },
});
