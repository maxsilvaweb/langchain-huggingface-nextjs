'use client';

import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { ChatWindow } from '@/components/chat/chat-window';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SetupNotice } from '@/components/setup-notice';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-session';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { Id } from '../../../../convex/_generated/dataModel';
import { ModelSelector } from '@/components/chat/model-selector';

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

  // Detect stale / phantom conversation IDs (e.g. lingering in URL/localStorage
  // after a Convex schema reset or env switch).
  //
  // Key guards (prevents spurious creates during boot:
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
        <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
          <div className="z-10 w-full max-w-4xl flex flex-col gap-10">
            {isEmptyThread ? (
              <>
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

                <form onSubmit={handleHeroSubmit} className="w-full space-y-4">
                  <div className="relative flex w-full items-center rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm shadow-xl focus-within:ring-2 focus-within:ring-zinc-400/40 transition-all">
                    <Input
                      value={heroInput}
                      onChange={(e) => setHeroInput(e.target.value)}
                      placeholder="Send a message to start a new conversation..."
                      disabled={isSending}
                      className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 h-16 px-6 pr-16 text-base rounded-2xl"
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={isSending || !heroInput.trim()}
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl"
                      aria-label="Send message"
                    >
                      {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowUp className="h-4 w-4" />
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
                <div className="text-left space-y-4">
                  <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                    LangChain + Hugging Face AI
                  </h1>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Modern real-time AI infrastructure with Convex.
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
