'use client';

import { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { anyApi } from 'convex/server';
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

interface ChatWindowProps {
  sessionId: string;
}

export function ChatWindow({ sessionId }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // We use anyApi since we don't have generated code yet
  const messages = useQuery(anyApi.messages.list, { sessionId }) || [];
  const sendMessage = useMutation(anyApi.messages.send);
  const clearMessages = useMutation(anyApi.messages.clear);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // 1. Save user message to Convex
      await sendMessage({
        body: userMessage,
        author: 'user',
        sessionId,
      });

      // 2. Call API for streaming response
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage, sessionId }),
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Failed to fetch AI response' }));
        throw new Error(errorData.error || 'Failed to fetch AI response');
      }

      const reader = response.body?.getReader();
      let aiResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = new TextDecoder().decode(value);
          aiResponse += chunk;
        }
      }

      // 3. Save AI message to Convex
      await sendMessage({
        body: aiResponse,
        author: 'ai',
        sessionId,
      });
    } catch (error) {
      console.error('Error in chat:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full h-[700px] flex flex-col shadow-xl border-white/5 bg-black/20 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-xl font-bold">LangChain Chat</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => clearMessages({ sessionId })}
          title="Clear chat"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-2 p-6 scroll-smooth scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40"
      >
        {messages.length === 0 && !isLoading && (
          <div className="text-center text-muted-foreground pt-8">
            Start a conversation with the Hugging Face AI!
          </div>
        )}
        {messages.map((msg: any) => (
          <MessageBubble key={msg._id} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted p-3 rounded-lg flex items-center gap-2">
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
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            {isLoading ? (
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
