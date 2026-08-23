'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChatWindow } from '@/components/chat/chat-window';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SetupNotice } from '@/components/setup-notice';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { useChatSession } from '@/hooks/use-chat-session';
import {
  APP_DESCRIPTION,
  APP_NAME,
  SIDEBAR_LABEL_CONVERSATIONS,
} from '@/lib/locale';

export default function Home() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { conversationId, isReady } = useChatSession();
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (hasEnv && isReady && conversationId) {
      router.replace(`/chat/${conversationId}`);
    }
  }, [authLoaded, conversationId, hasEnv, isReady, isSignedIn, router]);

  if (!authLoaded || !isSignedIn) {
    return null;
  }

  if (!hasEnv) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-background">
        <div className="z-10 w-full max-w-4xl flex flex-col gap-10">
          <div className="flex flex-row justify-between items-start gap-4">
            <div className="text-left space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                {APP_NAME}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {APP_DESCRIPTION}
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
        <header className="md:hidden sticky top-0 z-[60] flex h-14 items-center justify-between gap-2 border-b border-white/10 bg-background/95 px-3 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <SidebarTrigger
              className="size-8 cursor-pointer hover:bg-white/10"
              title="Open conversation history"
              aria-label="Open conversation history"
            />
            <span className="text-sm font-semibold tracking-tight text-foreground">
              {SIDEBAR_LABEL_CONVERSATIONS}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-background">
          <div className="z-10 w-full max-w-4xl flex flex-col gap-8 md:gap-10">
            <div className="w-full text-left space-y-3 md:space-y-4">
              <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                {APP_NAME}
              </h1>
              <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                {APP_DESCRIPTION}
              </p>
            </div>

            {isReady && conversationId ? (
              <ChatWindow conversationId={conversationId} />
            ) : (
              <div className="w-full h-[600px] md:h-[700px] bg-black/20 backdrop-blur-sm rounded-xl border border-white/5 animate-pulse" />
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
