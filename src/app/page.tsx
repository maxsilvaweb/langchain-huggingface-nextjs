'use client';

import { useState } from 'react';
import { ChatWindow } from '@/components/chat/chat-window';
import { SetupNotice } from '@/components/setup-notice';

export default function Home() {
  // Simple session ID for the demo
  const [sessionId] = useState(() => Math.random().toString(36).substring(7));

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

        {!hasEnv ? <SetupNotice /> : <ChatWindow sessionId={sessionId} />}
      </div>
    </main>
  );
}
