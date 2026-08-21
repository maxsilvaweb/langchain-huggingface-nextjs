'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SetupNotice } from '@/components/setup-notice';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { useChatSession } from '@/hooks/use-chat-session';

export default function Home() {
  const router = useRouter();
  const { conversationId, isReady } = useChatSession();
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  useEffect(() => {
    if (hasEnv && isReady && conversationId) {
      router.replace(`/chat/${conversationId}`);
    }
  }, [hasEnv, isReady, conversationId, router]);

  if (!hasEnv) {
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
          <SetupNotice />
        </div>
      </main>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <AppSidebar />
      <SidebarInset className="bg-transparent">
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

            {isReady && conversationId ? (
              <ChatWindow conversationId={conversationId} />
            ) : (
              <div className="w-full h-[700px] bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 animate-pulse" />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
