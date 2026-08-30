'use client';

import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useConvexAuth, useQuery } from 'convex/react';
import { api } from '@/lib/convex/api';
import { ChatWindow } from '@/components/chat/chat-window';
import { SetupNotice } from '@/components/setup-notice';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-session';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import type { Id } from '@/lib/convex/dataModel';
import { CHAT_SESSION_STORAGE_KEY } from '@/lib/globals';
import { ModelSelector } from '@/components/chat/model-selector';
import { useSelectedModel } from '@/components/providers/ModelProvider';
import { RouteLoader } from '@/components/route-loader';
import { ConversationSwitchProgress } from '@/components/chat/conversation-switch-progress';
import { useChatChrome } from '@/components/chat/chat-shell';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/locale';
import { cn } from '@/lib/utils';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { requestDelete } = useChatChrome();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const targetConversationId = params.conversationId as Id<'conversations'>;
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  const {
    conversationId: sessionConversationId,
    startNewSession,
    isReady: sessionReady,
  } = useChatSession({ autoCreate: false });

  const {
    conversationId,
    messages,
    isColdLoading,
    isSwitching,
    sendMessage,
    retryFailedPrompt,
    failedPrompt,
    isSending,
    streamingMessage,
  } = useChat(targetConversationId);

  const {
    selectedModelId,
    setSelectedModelId,
  } = useSelectedModel();
  const [heroInput, setHeroInput] = useState('');

  const selectedModel =
    AVAILABLE_MODELS.find((m) => m.id === selectedModelId) ||
    AVAILABLE_MODELS[0];

  const conversation = useQuery(
    api.conversations.get,
    authLoading || !isAuthenticated
      ? 'skip'
      : { conversationId: targetConversationId },
  );
  const convExists = conversation !== null && conversation !== undefined;
  const convLoading = conversation === undefined;
  const redirectInFlight = React.useRef(false);

  useEffect(() => {
    if (authLoaded && !isSignedIn) {
      router.replace('/sign-in');
      return;
    }

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
      sessionConversationId !== targetConversationId &&
      typeof window !== 'undefined'
    ) {
      localStorage.setItem(CHAT_SESSION_STORAGE_KEY, targetConversationId);
    }
  }, [
    hasEnv,
    sessionReady,
    convLoading,
    conversation,
    convExists,
    sessionConversationId,
    targetConversationId,
    startNewSession,
    router,
    authLoaded,
    isSignedIn,
  ]);

  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('chat-pending-prompt');
    if (
      pendingPrompt &&
      !isSending &&
      !isSwitching &&
      messages.length === 0
    ) {
      setHeroInput(pendingPrompt);
      sessionStorage.removeItem('chat-pending-prompt');
    }
  }, [isSending, isSwitching, messages.length]);

  useEffect(() => {
    redirectInFlight.current = false;
  }, [targetConversationId]);

  if (!authLoaded || !isSignedIn) {
    return null;
  }

  if (!hasEnv) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24">
        <div className="z-10 w-full max-w-4xl">
          <SetupNotice />
        </div>
      </main>
    );
  }

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = heroInput.trim();
    if (!text || isSending || isSwitching) return;
    setHeroInput('');
    await sendMessage(text, selectedModel.id, selectedModel.provider);
  };

  // Cold start only — sidebar stays mounted via layout.
  if (isColdLoading) {
    return (
      <>
        <ConversationSwitchProgress />
        <RouteLoader
          className="min-h-0 flex-1"
          label="Loading conversation"
          variant="chat"
        />
      </>
    );
  }

  // Keep showing the committed thread while the URL target loads.
  const isEmptyThread = !isSwitching && !isSending && messages.length === 0;

  return (
    <>
      {isSwitching ? <ConversationSwitchProgress /> : null}
      <main
        className={cn(
          'flex flex-col bg-background',
          isEmptyThread
            ? 'flex-1 min-h-0 items-center justify-center p-4 md:p-24'
            : 'flex-1 min-h-0 overflow-hidden items-stretch justify-start p-0',
          isSwitching && 'pointer-events-none',
        )}
      >
        <div
          className={cn(
            'z-10 flex w-full flex-col',
            isEmptyThread ? 'max-w-4xl gap-8 md:gap-10' : 'h-full flex-1 min-h-0',
          )}
        >
          {isEmptyThread ? (
            <>
              <div className="w-full space-y-3 text-left md:space-y-4">
                <h1 className="text-3xl font-extrabold tracking-tight text-foreground md:text-4xl lg:text-5xl">
                  {APP_NAME}
                </h1>
                <p className="text-base leading-relaxed text-muted-foreground md:text-xl">
                  {APP_DESCRIPTION}
                </p>
              </div>

              <form onSubmit={handleHeroSubmit} className="w-full space-y-4">
                <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-sm transition-all focus-within:ring-2 focus-within:ring-zinc-400/40">
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
                    disabled={isSending || isSwitching}
                    rows={4}
                    className="min-h-35 resize-y rounded-2xl border-0 bg-transparent px-5 pb-5 pt-4 pr-18 text-base leading-relaxed placeholder:text-zinc-500/80 focus-visible:ring-0 focus-visible:ring-offset-0 md:min-h-45 md:px-6 md:text-[15px]"
                  />
                  <Button
                    type="submit"
                    size="icon"
                    disabled={isSending || isSwitching || !heroInput.trim()}
                    className="group absolute right-3 bottom-3 h-10 w-10 cursor-pointer rounded-xl border border-emerald-700/40 bg-emerald-900/50 text-emerald-200 shadow-lg shadow-emerald-900/20 backdrop-blur-sm transition-all duration-200 hover:border-emerald-500/60 hover:bg-emerald-700/70 hover:text-white hover:shadow-2xl hover:shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 active:brightness-95 disabled:pointer-events-none disabled:opacity-50"
                    aria-label="Send message"
                    title="Send message"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ArrowUp className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5" />
                    )}
                  </Button>
                </div>

                <div className="flex justify-start">
                  <ModelSelector
                    selectedModel={selectedModelId}
                    onModelChange={setSelectedModelId}
                    disabled={isSending || isSwitching}
                    triggerClassName="bg-white/5 border-white/10 backdrop-blur-sm"
                  />
                </div>
              </form>
            </>
          ) : (
            <ChatWindow
              conversationId={conversationId}
              messages={messages}
              isSending={isSending}
              streamingMessage={streamingMessage}
              failedPromptBody={failedPrompt?.body}
              onRetryFailedPrompt={() => {
                void retryFailedPrompt();
              }}
              onSendMessage={async (message, modelName, provider) => {
                await sendMessage(message, modelName, provider);
              }}
              onDeleteChat={() => requestDelete(conversationId)}
            />
          )}
        </div>
      </main>
    </>
  );
}
