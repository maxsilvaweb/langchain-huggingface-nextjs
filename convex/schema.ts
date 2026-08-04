import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    author: v.union(v.literal('user'), v.literal('ai')),
    sessionId: v.string(),
  }).index('by_session', ['sessionId']),

  documents: defineTable({
    text: v.string(),
    metadata: v.any(),
    embedding: v.array(v.float64()),
  }).vectorIndex('by_embedding', {
    vectorField: 'embedding',
    dimensions: 384, // Matches sentence-transformers/all-MiniLM-L6-v2
  }),
});
