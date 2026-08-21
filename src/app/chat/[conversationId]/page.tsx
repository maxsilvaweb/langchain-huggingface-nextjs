'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ChatWindow } from '@/components/chat/chat-window';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SetupNotice } from '@/components/setup-notice';
import { ThemeToggle } from '@/components/theme-toggle';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-session';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { Id } from '../../../../convex/_generated/dataModel';
import { ModelSelector } from '@/components/chat/model-selector';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/locale';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const conversationId = params.conversationId as Id<'conversations'>;
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  // Chat-detail pages already have a conversation id in the URL — do NOT auto-create
  // a session row on mount. The page validates the URL id instead.
  const {
    conversationId: sessionConversationId,
    startNewSession,
    isReady: sessionReady,
  } = useChatSession({ autoCreate: false });

  const { messages, sendMessage, isSending } = useChat(conversationId);
  const [heroInput, setHeroInput] = useState('');
  const [selectedModelId, setSelectedModelId] = useState(
    AVAILABLE_MODELS[0].id,
  );

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS[0];

  // Detect stale / phantom conversation IDs (e.g. lingering in URL/localStorage
  // after a Convex schema reset or env switch).
  //
  // Key guards (prevents spurious creates during mount):
  //   conversation === undefined → Convex is still loading → do NOTHING.
  //   conversation === null    → Convex confirmed row absent → redirect to new.
  //   sessionReady          → useChatSession mount done, startNewSession is safe.
  const conversation = useQuery(api.conversations.get, { conversationId });
  const convExists = conversation !== null && conversation !== undefined;
  const convLoading = conversation === undefined;

  const redirectInFlight = React.useRef(false);

  useEffect(() => {
    if (!hasEnv || !sessionReady) return;
    if (redirectInFlight.current) return;

    if (!convLoading && conversation === null) {
      redirectInFlight.current = true;
      void (async () => {
        const newId = await startNewSession();
        router.replace(`/chat/${newId}`);
      })();
      return;
    }

    if (
      convExists &&
      sessionConversationId !== conversationId &&
      typeof window !== 'undefined'
    ) {
      // Valid id, just not yet the active session → promote to localStorage.
      localStorage.setItem('chat_conversation_id', conversationId);
    }
  }, [
    hasEnv,
    sessionReady,
    convLoading,
    conversation,
    convExists,
    sessionConversationId,
    conversationId,
    startNewSession,
    router,
  ]);

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = heroInput.trim();
    if (!text || isSending) return;
    setHeroInput('');
    await sendMessage(text, selectedModel.id, selectedModel.provider);
  };

  if (!hasEnv) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
        <div className="z-10 w-full max-w-4xl">
          <SetupNotice />
        </div>
      </main>
    );
  }

  const isEmptyThread = !isSending && messages.length === 0;

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
            <span className="text-sm font-semibold tracking-tight text-foreground truncate">
              {APP_NAME}
            </span>
          </div>
          <ThemeToggle />
        </header>
        <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-24 bg-background">
          <div className="z-10 w-full max-w-4xl flex flex-col gap-8 md:gap-10">
            {isEmptyThread ? (
              <>
                <div className="w-full text-left space-y-3 md:space-y-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    {APP_NAME}
                  </h1>
                  <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                    {APP_DESCRIPTION}
                  </p>
                </div>

                <form onSubmit={handleHeroSubmit} className="w-full space-y-4">
                  <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl focus-within:ring-2 focus-within:ring-zinc-400/40 transition-all">
                    <Textarea
                      value={heroInput}
                      onChange={(e) => setHeroInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleHeroSubmit(e as unknown as React.FormEvent);
                        }
                      }}
                      placeholder="How can I help you today?"
                      disabled={isSending}
                      rows={4}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[140px] md:min-h-[180px] px-5 md:px-6 pt-4 pb-5 pr-[4.5rem] resize-y text-base md:text-[15px] leading-relaxed rounded-2xl placeholder:text-zinc-500/80"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || !heroInput.trim()}
                      className="group absolute right-3 bottom-3 h-10 w-10 rounded-xl cursor-pointer border border-emerald-700/40 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-700/70 hover:text-white hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 active:brightness-95 shadow-lg shadow-emerald-900/20 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:brightness-100"
                      style={{
                        cursor:
                          isSending || !heroInput.trim()
                            ? 'default'
                            : 'pointer',
                      }}
                      aria-label="Send message"
                      title="Send message"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-active:translate-y-0" />
                      )}
                    </Button>
                  </div>

                  <div className="flex justify-start">
                    <ModelSelector
                      selectedModel={selectedModelId}
                      onModelChange={setSelectedModelId}
                      disabled={isSending}
                      triggerClassName="bg-white/5 border-white/10 backdrop-blur-sm"
                    />
                  </div>
                </form>
              </>
            ) : (
              <>
                <div className="w-full text-left space-y-3 md:space-y-4">
                  <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    {APP_NAME}
                  </h1>
                  <p className="text-base md:text-xl text-muted-foreground leading-relaxed">
                    {APP_DESCRIPTION}
                  </p>
                </div>

                <ChatWindow conversationId={conversationId} />
              </>
            )}
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
