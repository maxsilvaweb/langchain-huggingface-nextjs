'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MessageBubble } from './message-bubble';
import { Send, Loader2, Trash2 } from 'lucide-react';
import { useChat } from '@/hooks/use-chat';
import type { Id } from '../../../convex/_generated/dataModel';

interface ChatWindowProps {
  conversationId: Id<'conversations'>;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    streamingMessage,
    isSending,
    sendMessage,
    clearMessages,
  } = useChat(conversationId);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    await sendMessage(message);
  };

  return (
    <Card className="w-full h-[700px] flex flex-col shadow-xl bg-white/60 border-zinc-200 dark:border-white/5 dark:bg-black/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">LangChain Chat</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void clearMessages()}
          title="Clear chat"
          disabled={isSending}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 p-6 scroll-smooth scrollbar-thin scrollbar-thumb-zinc-300 hover:scrollbar-thumb-zinc-400 dark:scrollbar-thumb-zinc-700 dark:hover:scrollbar-thumb-zinc-600"
      >
        {messages.length === 0 && !isSending && (
          <div className="text-center text-zinc-500 pt-8">
            Start a conversation with the Hugging Face AI!
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
              author: 'ai' 
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
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <form onSubmit={handleSubmit} className="flex w-full gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1"
          />
          <Button type="submit" disabled={isSending || !input.trim()}>
            {isSending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
}
