'use client';

import type React from 'react';
import { ChevronDown, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ModelSelector } from '../model-selector';
import { cn } from '@/lib/utils';
import { ChatInput } from './ChatInput';

interface ChatFooterProps {
  input: string;
  selectedModel: string;
  isSending: boolean;
  hasOverflow: boolean;
  isAtBottom: boolean;
  onInputChange: (value: string) => void;
  onModelChange: (modelId: string) => void;
  onDeleteChat?: () => void;
  onScrollToBottom: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => Promise<void>;
  onSubmitMessage: () => Promise<void>;
}

export function ChatFooter({
  input,
  selectedModel,
  isSending,
  hasOverflow,
  isAtBottom,
  onInputChange,
  onModelChange,
  onDeleteChat,
  onScrollToBottom,
  onSubmit,
  onSubmitMessage,
}: ChatFooterProps) {
  return (
    <>
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-background via-background/90 to-transparent z-[5]" />

      <div className="sticky bottom-0 z-10 w-full px-4 md:px-0 pb-6 pt-3 bg-transparent backdrop-blur-md">
        <div className="relative max-w-3xl mx-auto w-full flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => onScrollToBottom()}
            aria-label="Scroll to latest message"
            title="Scroll to bottom"
            className={cn(
              'absolute left-1/2 -translate-x-1/2 z-20 h-11 w-11 md:h-12 md:w-12 rounded-full cursor-pointer transition-all duration-300 ease-out shadow-[0_0_0_1px_rgba(255,255,255,0.08)]',
              'bg-zinc-900/80 backdrop-blur-xl border border-white/10',
              'text-white/80 hover:bg-zinc-800 hover:text-white hover:border-white/20 hover:scale-105 active:scale-[0.97]',
              'top-[-54px] md:top-[-60px]',
              hasOverflow && !isAtBottom
                ? 'opacity-100 translate-y-0 pointer-events-auto'
                : 'opacity-0 translate-y-6 pointer-events-none',
            )}
          >
            <ChevronDown className="h-5 w-5 md:h-[22px] md:w-[22px]" />
          </Button>

          <div className="flex items-center justify-between">
            <ModelSelector
              selectedModel={selectedModel}
              onModelChange={onModelChange}
              disabled={isSending}
            />

            <Button
              variant="ghost"
              size="icon"
              onClick={onDeleteChat}
              title="Delete conversation"
              aria-label="Delete conversation"
              disabled={isSending || !onDeleteChat}
              className="cursor-pointer text-white/40 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={onSubmit} className="w-full">
            <ChatInput
              input={input}
              disabled={isSending}
              onInputChange={onInputChange}
              onSubmit={onSubmitMessage}
            />
          </form>
        </div>
      </div>
    </>
  );
}
