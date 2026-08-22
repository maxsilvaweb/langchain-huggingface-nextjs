import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  conversations: defineTable({
    title: v.optional(v.string()),
    messageCount: v.optional(v.float64()),
    // We can add userId here later when auth is added
  }),

  messages: defineTable({
    body: v.string(),
    author: v.union(v.literal('user'), v.literal('ai')),
    conversationId: v.optional(v.id('conversations')),
  }).index('by_conversation', ['conversationId']),

  documents: defineTable({
    text: v.string(),
    metadata: v.any(),
    embedding: v.array(v.float64()),
  }).vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 384, // Matches sentence-transformers/all-MiniLM-L6-v2
  }),
});
