import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  users: defineTable({
    externalId: v.string(),
    provider: v.literal('clerk'),
    email: v.optional(v.string()),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    lastSeenAt: v.optional(v.float64()),
    preferences: v.optional(
      v.object({
        defaultModelId: v.optional(v.string()),
        useRag: v.optional(v.boolean()),
        temperature: v.optional(v.number()),
        customInstructions: v.optional(v.string()),
      }),
    ),
  }).index('by_external_id', ['externalId']),

  conversations: defineTable({
    title: v.optional(v.string()),
    messageCount: v.optional(v.float64()),
    userId: v.optional(v.id('users')),
  }).index('by_user', ['userId']),

  messages: defineTable({
    body: v.string(),
    author: v.union(v.literal('user'), v.literal('ai')),
    conversationId: v.optional(v.id('conversations')),
    userId: v.optional(v.id('users')),
  })
    .index('by_conversation', ['conversationId'])
    .index('by_user_conversation', ['userId', 'conversationId']),

  documents: defineTable({
    text: v.string(),
    metadata: v.any(),
    embedding: v.array(v.float64()),
    userId: v.optional(v.id('users')),
  })
    .index('by_user', ['userId'])
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 384, // Matches sentence-transformers/all-MiniLM-L6-v2
      filterFields: ['userId'],
    }),
});
