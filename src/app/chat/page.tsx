'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChatSession } from '@/hooks/use-chat-session';

export default function ChatIndexPage() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { conversationId, isReady } = useChatSession();

  useEffect(() => {
    if (!authLoaded) return;

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (isReady && conversationId) {
      router.replace(`/chat/${conversationId}`);
    }
  }, [authLoaded, conversationId, isReady, isSignedIn, router]);

  return null;
}
