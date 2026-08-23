import type { Id } from './_generated/dataModel';

type Ctx = any;

type IdentityRecord = {
  subject: string;
  email?: string;
  name?: string;
  pictureUrl?: string;
};

async function getIdentity(ctx: Ctx): Promise<IdentityRecord> {
  const identity = await ctx.auth.getUserIdentity();

  if (!identity) {
    throw new Error('Unauthorized');
  }

  return {
    subject: identity.subject,
    email: identity.email,
    name: identity.name,
    pictureUrl: identity.pictureUrl,
  };
}

async function findUserByIdentity(ctx: Ctx, subject: string) {
  return await ctx.db
    .query('users')
    .withIndex('by_external_id', (q: any) => q.eq('externalId', subject))
    .first();
}

export async function getExistingUserId(ctx: Ctx): Promise<Id<'users'> | null> {
  const identity = await getIdentity(ctx);
  const existingUser = await findUserByIdentity(ctx, identity.subject);
  return existingUser?._id ?? null;
}

export async function ensureUserId(ctx: Ctx): Promise<Id<'users'>> {
  const identity = await getIdentity(ctx);
  const existingUser = await findUserByIdentity(ctx, identity.subject);

  if (existingUser) {
    await ctx.db.patch(existingUser._id, {
      email: identity.email,
      name: identity.name,
      imageUrl: identity.pictureUrl,
      lastSeenAt: Date.now(),
    });
    return existingUser._id;
  }

  return await ctx.db.insert('users', {
    externalId: identity.subject,
    provider: 'clerk',
    email: identity.email,
    name: identity.name,
    imageUrl: identity.pictureUrl,
    lastSeenAt: Date.now(),
  });
}

export async function getConversationOwner(
  ctx: Ctx,
  conversationId: Id<'conversations'>,
) {
  const userId = await getExistingUserId(ctx);
  if (!userId) {
    return { userId: null, conversation: null };
  }

  const conversation = await ctx.db.get(conversationId);
  if (!conversation || conversation.userId !== userId) {
    return { userId, conversation: null };
  }

  return { userId, conversation };
}

export async function ensureConversationOwner(
  ctx: Ctx,
  conversationId: Id<'conversations'>,
) {
  const userId = await ensureUserId(ctx);
  const conversation = await ctx.db.get(conversationId);

  if (!conversation || conversation.userId !== userId) {
    return { userId, conversation: null };
  }

  return { userId, conversation };
}

export function assertOwnedConversationMessage(
  message: { userId?: Id<'users'> | null },
  ownerId: Id<'users'>,
): boolean {
  return Boolean(message.userId && message.userId === ownerId);
}
