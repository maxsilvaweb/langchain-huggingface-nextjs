'use client';

import { useEffect, useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const CHAT_SESSION_STORAGE_KEY = 'chat_conversation_id';

export function useChatSession() {
  const [conversationId, setConversationId] = useState<Id<'conversations'> | null>(null);
  const [isReady, setIsReady] = useState(false);
  const createConversation = useMutation(api.conversations.create);

  useEffect(() => {
    const initSession = async () => {
      const storedId = localStorage.getItem(CHAT_SESSION_STORAGE_KEY) as Id<'conversations'> | null;

      if (storedId) {
        setConversationId(storedId);
        setIsReady(true);
        return;
      }

      try {
        const newId = await createConversation({});
        localStorage.setItem(CHAT_SESSION_STORAGE_KEY, newId);
        setConversationId(newId);
      } catch (err) {
        console.error("Failed to create conversation:", err);
      } finally {
        setIsReady(true);
      }
    };

    void initSession();
  }, [createConversation]);

  return { conversationId, isReady };
}
