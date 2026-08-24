import { mutationGeneric, queryGeneric, actionGeneric } from 'convex/server';
import { v } from 'convex/values';
import { getAuthenticatedUser } from './auth';

/**
 * Store a document chunk with its embedding in the shared vector database.
 * Called by the Python RAG pipeline during document ingestion.
 *
 * Documents are shared across all authenticated users - any logged-in user
 * can ingest and retrieve from the knowledge base. The userId is stored
 * for audit purposes (who uploaded the document) but does not restrict access.
 */
export const store = mutationGeneric({
  args: {
    text: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const docId = await ctx.db.insert('documents', {
      text: args.text,
      embedding: args.embedding,
      metadata: args.metadata,
      userId,
    });

    return docId;
  },
});

/**
 * Perform vector similarity search across ALL documents in the knowledge base.
 * Used by the RAG pipeline to retrieve context for queries.
 *
 * Results are shared across all users - any authenticated user can query
 * the full knowledge base.
 */
export const vectorSearch = actionGeneric({
  args: {
    embedding: v.array(v.float64()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error('Unauthorized');
    }

    // Search all documents - no userId filter (shared knowledge base)
    const results = await ctx.vectorSearch('documents', 'by_embedding', {
      vector: args.embedding,
      limit: args.limit ?? 5,
    });

    // Fetch the full documents for each result
    const documents = await Promise.all(
      results.map(async (result: { _id: any; _score: number }) => {
        const doc = await ctx.runQuery('documents:getById' as any, {
          id: result._id,
        });
        return {
          ...doc,
          _score: result._score,
        };
      })
    );

    return documents.filter(Boolean);
  },
});

/**
 * Get a document by ID (internal helper for vector search).
 * Any authenticated user can read any document (shared knowledge base).
 */
export const getById = queryGeneric({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx);
    if (!userId) {
      return null;
    }

    const doc = await ctx.db.get(args.id);
    if (!doc) return null;

    return {
      _id: doc._id,
      text: doc.text,
      metadata: doc.metadata,
    };
  },
});

/**
 * List all documents in the shared knowledge base.
 * Any authenticated user can see all documents.
 * Returns full text for expandable UI display.
 */
export const list = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getAuthenticatedUser(ctx);
    if (!userId) {
      return [];
    }

    const docs = await ctx.db.query('documents').collect();

    return docs.map((doc) => ({
      _id: doc._id,
      text: doc.text,
      metadata: doc.metadata,
      _creationTime: doc._creationTime,
    }));
  },
});

/**
 * Delete a document by ID.
 * Any authenticated user can delete from the shared knowledge base.
 */
export const remove = mutationGeneric({
  args: { id: v.id('documents') },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedUser(ctx);
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const doc = await ctx.db.get(args.id);
    if (!doc) {
      throw new Error('Document not found');
    }

    await ctx.db.delete(args.id);
  },
});

/**
 * Get total document count in the shared knowledge base.
 */
export const count = queryGeneric({
  args: {},
  handler: async (ctx) => {
    const { userId } = await getAuthenticatedUser(ctx);
    if (!userId) {
      return 0;
    }

    const docs = await ctx.db.query('documents').collect();

    return docs.length;
  },
});

/**
 * Admin: Clear all documents (no auth - use via CLI only).
 * Used when switching embedding providers to wipe stale vectors.
 */
export const clearAll = mutationGeneric({
  args: {},
  handler: async (ctx) => {
    const docs = await ctx.db.query('documents').collect();
    for (const doc of docs) {
      await ctx.db.delete(doc._id);
    }
    return docs.length;
  },
});

/**
 * Admin: Store a document without auth (use via CLI only for re-ingestion).
 */
export const storePublic = mutationGeneric({
  args: {
    text: v.string(),
    embedding: v.array(v.float64()),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const docId = await ctx.db.insert('documents', {
      text: args.text,
      embedding: args.embedding,
      metadata: args.metadata,
    });
    return docId;
  },
});
