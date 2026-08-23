'use client';

import React, { useEffect, useState } from 'react';
import type { Id } from '@/lib/convex/dataModel';
import { CHAT_SESSION_STORAGE_KEY } from '@/lib/globals';
import { useConvexConversationRepository } from '@/infrastructure/repositories';

type UseChatSessionOptions = {
  /**
   * When true (default for legacy callers that don't pass options),
   * create a conversation + persist to localStorage if none exists yet.
   * When false (chat-detail pages that already have a URL id), never create.
   */
  autoCreate?: boolean;
};

export function useChatSession(options: UseChatSessionOptions = {}) {
  const { autoCreate = true } = options;

  const [conversationId, setConversationId] =
    useState<Id<'conversations'> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const conversationRepository = useConvexConversationRepository();
  const initRef = React.useRef(false);
  const pendingSessionRef = React.useRef<Promise<Id<'conversations'>> | null>(
    null,
  );

  const startNewSession = React.useCallback(async (): Promise<
    Id<'conversations'>
  > => {
    if (pendingSessionRef.current) {
      return pendingSessionRef.current;
    }

    const pendingSession = conversationRepository
      .create()
      .then((newId) => {
        localStorage.setItem(CHAT_SESSION_STORAGE_KEY, newId);
        setConversationId(newId);
        return newId;
      })
      .finally(() => {
        pendingSessionRef.current = null;
      });

    pendingSessionRef.current = pendingSession;

    return pendingSession;
  }, [conversationRepository]);

  const clearSession = React.useCallback(() => {
    localStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    setConversationId(null);
  }, []);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const initSession = async () => {
      const storedId = localStorage.getItem(
        CHAT_SESSION_STORAGE_KEY,
      ) as Id<'conversations'> | null;

      if (storedId) {
        setConversationId(storedId);
        setIsReady(true);
        return;
      }

      if (!autoCreate) {
        // Chat-detail pages without a stored id don't auto-create — they let
        // the page's own stale-id guard or a user-initiated action handle it.
        setIsReady(true);
        return;
      }

      try {
        const newId = await startNewSession();
        setConversationId(newId);
      } catch (err) {
        console.error('Failed to create conversation:', err);
      } finally {
        setIsReady(true);
      }
    };

    void initSession();
  }, [autoCreate, startNewSession]);

  return { conversationId, isReady, startNewSession, clearSession };
}
