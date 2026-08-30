'use client';

import { useAuth } from '@clerk/nextjs';
import { useLayoutEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RouteLoader } from '@/components/route-loader';
import { useChatSession } from '@/hooks/use-chat-session';
import { CHAT_SESSION_STORAGE_KEY } from '@/lib/globals';

export default function ChatIndexPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { conversationId, isReady, startNewSession } = useChatSession({
    autoCreate: false,
  });

  // Skip the blank /chat stub before paint when we already know the thread.
  useLayoutEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    const pendingPrompt = sessionStorage.getItem('chat-pending-prompt');
    if (pendingPrompt) return;

    const storedId = localStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (storedId) {
      router.replace(`/chat/${storedId}`);
    }
  }, [authLoaded, isSignedIn, router]);

  useLayoutEffect(() => {
    if (!authLoaded || !isSignedIn || !isReady) return;

    const pendingPrompt = sessionStorage.getItem('chat-pending-prompt');
    if (pendingPrompt) {
      void (async () => {
        const newId = await startNewSession();
        router.replace(`/chat/${newId}`);
      })();
      return;
    }

    if (conversationId) {
      router.replace(`/chat/${conversationId}`);
      return;
    }

    // First visit with no stored session — create one.
    void (async () => {
      const newId = await startNewSession();
      router.replace(`/chat/${newId}`);
    })();
  }, [
    authLoaded,
    conversationId,
    isReady,
    isSignedIn,
    router,
    startNewSession,
  ]);

  return <RouteLoader label="Opening chat" variant="chat" />;
}
