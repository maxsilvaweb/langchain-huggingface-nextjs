'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatSession } from '@/hooks/use-chat-session';

export default function ChatIndexPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { conversationId, isReady, startNewSession } = useChatSession();

  useEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (!isReady) return;

    // If there's a pending prompt from the documents page, start a fresh
    // conversation so the hero input shows up pre-filled
    const pendingPrompt = sessionStorage.getItem('chat-pending-prompt');
    if (pendingPrompt) {
      void (async () => {
        const newId = await startNewSession();
        router.replace(`/chat/${newId}`);
      })();
      return;
    }

    // Normal flow: redirect to the active conversation
    if (conversationId) {
      router.replace(`/chat/${conversationId}`);
    }
  }, [authLoaded, conversationId, isReady, isSignedIn, router, startNewSession]);

  return null;
}
