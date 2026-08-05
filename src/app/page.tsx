'use client';

import { ChatWindow } from '@/components/chat/chat-window';
import { SetupNotice } from '@/components/setup-notice';
import { ThemeToggle } from '@/components/theme-toggle';
import { useChatSession } from '@/hooks/use-chat-session';

export default function Home() {
  const { conversationId, isReady } = useChatSession();
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-background">
      <div className="z-10 w-full max-w-4xl flex flex-col gap-10">
        <div className="flex flex-row justify-between items-start gap-4">
          <div className="text-left space-y-4">
            <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
              LangChain + Hugging Face AI
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Modern real-time AI infrastructure with Convex.
            </p>
          </div>
          <ThemeToggle />
        </div>

        {!hasEnv ? (
          <SetupNotice />
        ) : isReady && conversationId ? (
          <ChatWindow conversationId={conversationId} />
        ) : (
          <div className="w-full h-[700px] bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 animate-pulse" />
        )}
      </div>
    </main>
  );
}
