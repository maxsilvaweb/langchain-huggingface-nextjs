'use client';

import { Loader2, Bot } from 'lucide-react';
import { MessageBubble } from '../message-bubble';

interface ChatMessageLike {
  _id: string;
  _creationTime: number;
  body: string;
  author: 'user' | 'ai';
}

interface ChatMessageListProps {
  messages: ChatMessageLike[];
  streamingMessage: string;
  isSending: boolean;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  onScroll: () => void;
  /** Body of the human prompt that failed (shows Retry on that bubble). */
  failedPromptBody?: string | null;
  onRetryFailedPrompt?: () => void;
}

export function ChatMessageList({
  messages,
  streamingMessage,
  isSending,
  scrollRef,
  onScroll,
  failedPromptBody,
  onRetryFailedPrompt,
}: ChatMessageListProps) {
  // Prefer the last matching user message (the one that failed after send).
  const failedMessageId = (() => {
    if (!failedPromptBody) return null;
    for (let i = messages.length - 1; i >= 0; i -= 1) {
      const msg = messages[i];
      if (msg.author === 'user' && msg.body === failedPromptBody) {
        return msg._id;
      }
    }
    return null;
  })();

  return (
    <div
      ref={scrollRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto w-full px-4 md:px-0 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 dark:hover:scrollbar-thumb-zinc-600"
    >
      <div className="max-w-3xl mx-auto w-full py-8 pb-56 space-y-6">
        {messages.length === 0 && !isSending && (
          <div className="text-center text-zinc-500 pt-8">
            Start a conversation with the AI!
          </div>
        )}

        {messages.map((message) => (
          <MessageBubble
            key={message._id}
            message={message}
            showRetry={message._id === failedMessageId}
            isRetrying={isSending && message._id === failedMessageId}
            onRetry={onRetryFailedPrompt}
          />
        ))}

        {streamingMessage && (
          <MessageBubble
            message={{
              _id: 'streaming-msg',
              _creationTime: Date.now(),
              body: streamingMessage,
              author: 'ai',
            }}
          />
        )}

        {isSending && !streamingMessage && (
          <div className="flex w-full mb-6 justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex max-w-[85%] gap-3 flex-row">
              <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200 bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset]">
                <Bot className="h-4 w-4" />
              </div>
              <div className="flex flex-col gap-1 items-start">
                <div className="rounded-2xl px-4 py-2.5 ring-1 ring-inset backdrop-blur-sm transition-all duration-200 bg-emerald-50/90 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100 ring-emerald-600/8 dark:ring-emerald-500/12 rounded-tl-md border border-emerald-100/60 dark:border-emerald-800/20 flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm">AI is thinking...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
