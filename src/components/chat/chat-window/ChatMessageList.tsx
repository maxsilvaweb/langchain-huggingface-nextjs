'use client';

import { Loader2 } from 'lucide-react';
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
}

export function ChatMessageList({
  messages,
  streamingMessage,
  isSending,
  scrollRef,
  onScroll,
}: ChatMessageListProps) {
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
          <MessageBubble key={message._id} message={message} />
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
          <div className="flex justify-start">
            <div className="bg-zinc-100 dark:bg-zinc-900 p-3 rounded-lg flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">AI is thinking...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
