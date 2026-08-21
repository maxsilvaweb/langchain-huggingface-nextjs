'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageBubble } from './message-bubble';
import { Send, Loader2, Trash2, ChevronDown } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import type { Id } from '../../../convex/_generated/dataModel';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { ModelSelector } from './model-selector';
import { cn } from '@/lib/utils';

interface ChatWindowProps {
  conversationId: Id<'conversations'>;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasOverflow, setHasOverflow] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { messages, streamingMessage, isSending, sendMessage, clearMessages } =
    useChat(conversationId);

  const measureMetrics = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    setIsAtBottom(distanceFromBottom < 8);
    const overflowAmount = scrollHeight - clientHeight;
    setHasOverflow(overflowAmount > 80);
  };

  useEffect(() => {
    measureMetrics();
    let rafId: number;
    const nextFrame = () => {
      rafId = requestAnimationFrame(() => {
        measureMetrics();
      });
    };
    nextFrame();
    const timeout = window.setTimeout(measureMetrics, 150);
    return () => {
      cancelAnimationFrame(rafId);
      window.clearTimeout(timeout);
    };
  }, [messages, streamingMessage, isSending]);

  useEffect(() => {
    const onResize = () => measureMetrics();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isAtBottom]);

  const handleScroll = () => {
    measureMetrics();
  };

  const scrollToBottom = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    const selectedModelObj = AVAILABLE_MODELS.find(
      (m) => m.id === selectedModel,
    );
    await sendMessage(message, selectedModel, selectedModelObj?.provider);
    scrollToBottom();
  };

  return (
    <div className="w-full relative flex flex-col flex-1 min-h-0 bg-background">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto w-full px-4 md:px-0 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 dark:hover:scrollbar-thumb-zinc-600"
      >
        <div className="max-w-3xl mx-auto w-full py-8 pb-56 space-y-6">
          {messages.length === 0 && !isSending && (
            <div className="text-center text-zinc-500 pt-8">
              Start a conversation with the AI!
            </div>
          )}
          {messages.map((msg) => (
            <MessageBubble key={msg._id} message={msg} />
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

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 bg-gradient-to-t from-background via-background/90 to-transparent z-[5]" />

      <div className="sticky bottom-0 z-10 w-full px-4 md:px-0 pb-6 pt-3 bg-transparent backdrop-blur-md">
        <div className="relative max-w-3xl mx-auto w-full flex flex-col gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={scrollToBottom}
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
              onModelChange={setSelectedModel}
              disabled={isSending}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => void clearMessages()}
              title="Clear chat"
              aria-label="Clear chat history"
              disabled={isSending}
              className="cursor-pointer text-white/40 hover:text-white hover:bg-white/5"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg focus-within:ring-2 focus-within:ring-zinc-400/40 transition-all">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e as unknown as React.FormEvent);
                  }
                }}
                placeholder="Message..."
                disabled={isSending}
                rows={3}
                className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[100px] md:min-h-[120px] px-4 md:px-5 pt-3 pb-4 pr-[4.5rem] resize-y text-sm md:text-[15px] leading-relaxed rounded-2xl placeholder:text-zinc-500/80"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isSending || !input.trim()}
                className="group absolute right-3 bottom-3 h-10 w-10 rounded-xl cursor-pointer border border-emerald-700/40 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-700/70 hover:text-white hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 active:brightness-95 shadow-lg shadow-emerald-900/20 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:brightness-100"
                style={{
                  cursor: isSending || !input.trim() ? 'default' : 'pointer',
                }}
                aria-label="Send message"
                title="Send message"
              >
                {isSending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-active:translate-y-0 group-active:translate-x-0" />
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
