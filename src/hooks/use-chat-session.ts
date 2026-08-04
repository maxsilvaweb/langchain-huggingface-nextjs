'use client';

import { useEffect, useState } from 'react';

const CHAT_SESSION_STORAGE_KEY = 'chat_session_id';

export function useChatSession() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const storedId = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);

    if (storedId) {
      setSessionId(storedId);
      setIsReady(true);
      return;
    }

    const newId = crypto.randomUUID();
    localStorage.setItem(CHAT_SESSION_STORAGE_KEY, newId);
    setSessionId(newId);
    setIsReady(true);
  }, []);

  return { sessionId, isReady };
}
