'use client';

import { useCallback, useMemo, useState } from 'react';
import { ApiChatService } from '@/services/chat/ApiChatService';
import type { Id } from '@/lib/convex/dataModel';

export interface MessageSendOptions {
  modelName?: string;
  provider?: string;
}

export interface UseMessageSenderReturn {
  isSending: boolean;
  error: string | null;
  streamingMessage: string;
  sendMessage: (
    message: string,
    conversationId: Id<'conversations'>,
    options?: MessageSendOptions
  ) => Promise<string | null>;
  reset: () => void;
}

export function useMessageSender(): UseMessageSenderReturn {
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const chatService = useMemo(() => new ApiChatService(), []);

  const reset = useCallback(() => {
    setIsSending(false);
    setError(null);
    setStreamingMessage('');
  }, []);

  const sendMessage = useCallback(
    async (
      message: string,
      conversationId: Id<'conversations'>,
      options: MessageSendOptions = {}
    ): Promise<string | null> => {
      const trimmedMessage = message.trim();
      if (!trimmedMessage || isSending) return null;

      setIsSending(true);
      setError(null);
      setStreamingMessage('');

      try {
        const stream = await chatService.sendMessage({
          message: trimmedMessage,
          conversationId,
          modelName: options.modelName,
          provider: options.provider,
        });

        if (!stream) {
          throw new Error('AI response stream was empty');
        }

        const reader = stream.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          aiResponse += chunk;
          setStreamingMessage(aiResponse);
        }

        const lastChunk = decoder.decode();
        if (lastChunk) {
          aiResponse += lastChunk;
          setStreamingMessage(aiResponse);
        }

        if (!aiResponse.trim()) {
          throw new Error('AI returned an empty response');
        }

        return aiResponse;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown chat error';
        setError(message);
        throw err;
      } finally {
        setIsSending(false);
      }
    },
    [isSending, chatService]
  );

  return {
    isSending,
    error,
    streamingMessage,
    sendMessage,
    reset,
  };
}
