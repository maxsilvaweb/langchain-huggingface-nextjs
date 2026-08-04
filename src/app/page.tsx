'use client';

import { useState, useEffect } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';
import { SetupNotice } from '@/components/setup-notice';

export default function Home() {
  // Use localStorage to persist the session ID
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    // Only run on the client
    const storedId = localStorage.getItem('chat_session_id');
    if (storedId) {
      setSessionId(storedId);
    } else {
      const newId = crypto.randomUUID();
      localStorage.setItem('chat_session_id', newId);
      setSessionId(newId);
    }
  }, []);

  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-background">
      <div className="z-10 w-full max-w-4xl flex flex-col gap-10">
        <div className="text-left space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
            LangChain + Hugging Face AI
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Modern real-time AI infrastructure with Convex.
          </p>
        </div>

        {!hasEnv ? (
          <SetupNotice />
        ) : sessionId ? (
          <ChatWindow sessionId={sessionId} />
        ) : (
          <div className="w-full h-[700px] bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 animate-pulse" />
        )}
      </div>
    </main>
  );
}
