'use client';

import { useAuth } from '@clerk/nextjs';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { useConvexAuth, useMutation, useQuery } from 'convex/react';
import { api } from '@/lib/convex/api';
import { ChatWindow } from '@/components/chat/chat-window';
import { AppSidebar } from '@/components/chat/app-sidebar';
import { SetupNotice } from '@/components/setup-notice';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, Loader2, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import { useChatSession } from '@/hooks/use-chat-session';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import type { Id } from '@/lib/convex/dataModel';
import { CHAT_SESSION_STORAGE_KEY } from '@/lib/globals';
import { ModelSelector } from '@/components/chat/model-selector';
import { useSelectedModel } from '@/components/providers/ModelProvider';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/locale';
import { cn } from '@/lib/utils';
import { AppDialog, AppDialogFooter } from '@/components/ui/app-dialog';
import { toast } from 'sonner';

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const conversationId = params.conversationId as Id<'conversations'>;
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  const {
    conversationId: sessionConversationId,
    startNewSession,
    isReady: sessionReady,
  } = useChatSession({ autoCreate: false });

  const { messages, sendMessage, isSending, streamingMessage } = useChat(conversationId);
  const { selectedModelId: selectedModelId, setSelectedModelId: setSelectedModelId } = useSelectedModel();
  const [heroInput, setHeroInput] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const removeConversation = useMutation(api.conversations.remove);

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
  const conversation = useQuery(
    api.conversations.get,
    authLoading || !isAuthenticated ? 'skip' : { conversationId },
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
      sessionConversationId !== conversationId &&
      typeof window !== 'undefined'
    ) {
      // Valid id, just not yet the active session → promote to localStorage.
      localStorage.setItem(CHAT_SESSION_STORAGE_KEY, conversationId);
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
    authLoaded,
    isSignedIn,
  ]);

  // Pre-fill hero input from sessionStorage (e.g. from Documents page)
  useEffect(() => {
    const pendingPrompt = sessionStorage.getItem('chat-pending-prompt');
    if (pendingPrompt && !isSending && messages.length === 0) {
      setHeroInput(pendingPrompt);
      sessionStorage.removeItem('chat-pending-prompt');
    }
  }, [isSending, messages.length]);

  if (!authLoaded || !isSignedIn) {
    return null;
  }

  const handleHeroSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = heroInput.trim();
    if (!text || isSending) return;
    setHeroInput('');
    await sendMessage(text, selectedModel.id, selectedModel.provider);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const idToDelete = deletingId;
      await removeConversation({
        conversationId: idToDelete as Id<'conversations'>,
      });
      if (conversationId === idToDelete) {
        router.push('/');
      }
      setDeletingId(null);
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error('Failed to delete conversation');
    }
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
      <AppSidebar deletingId={deletingId} setDeletingId={setDeletingId} />
      <SidebarInset
        className={cn(
          'bg-transparent',
          isEmptyThread
            ? 'min-h-screen'
            : 'h-screen flex flex-col overflow-hidden',
        )}
      >
        <header className="md:hidden shrink-0 z-[60] flex h-14 items-center justify-between gap-2 border-b border-white/10 bg-background/95 px-3 backdrop-blur-xl">
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
        </header>
        <main
          className={cn(
            'flex flex-col bg-background',
            isEmptyThread
              ? 'min-h-screen items-center justify-center p-4 md:p-24'
              : 'flex-1 min-h-0 overflow-hidden items-stretch justify-start p-0 md:p-0',
          )}
        >
          <div
            className={cn(
              'z-10 w-full flex flex-col',
              isEmptyThread
                ? 'max-w-4xl gap-8 md:gap-10'
                : 'h-full flex-1 min-h-0',
            )}
          >
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
              <ChatWindow
                conversationId={conversationId}
                onDeleteChat={() => setDeletingId(conversationId)}
                externalIsSending={isSending}
                externalStreamingMessage={streamingMessage}
              />
            )}
          </div>
        </main>
      </SidebarInset>

      <AppDialog
        open={!!deletingId}
        onOpenChange={(open) => !open && setDeletingId(null)}
        title="Delete Conversation"
        description="Are you sure you want to delete this conversation? This action cannot be undone."
        footer={
          <AppDialogFooter
            cancelText="Cancel"
            confirmText="Delete"
            confirmTheme="danger"
            confirmIcon={Trash2}
            onCancel={() => setDeletingId(null)}
            onConfirm={confirmDelete}
          />
        }
      />
    </SidebarProvider>
  );
}
