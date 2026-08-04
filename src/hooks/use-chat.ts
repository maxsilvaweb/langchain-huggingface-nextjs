'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc } from '../../convex/_generated/dataModel';

type ChatMessage = Doc<'messages'>;

export function useChat(sessionId: string) {
  const messages = (useQuery(api.messages.list, { sessionId }) ?? []) as ChatMessage[];
  const sendMessageMutation = useMutation(api.messages.send);
  const clearMessagesMutation = useMutation(api.messages.clear);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(null);

  const runChatRequest = useCallback(
    async (rawMessage: string) => {
      const message = rawMessage.trim();
      if (!message || isSending) return;

      setIsSending(true);
      setError(null);
      setLastSubmittedMessage(message);

      try {
        await sendMessageMutation({
          body: message,
          author: 'user',
          sessionId,
        });

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, sessionId }),
        });

        if (!response.ok) {
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Failed to fetch AI response' }));

          throw new Error(errorData.error || 'Failed to fetch AI response');
        }

        if (!response.body) {
          throw new Error('AI response stream was empty');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let aiResponse = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          aiResponse += decoder.decode(value, { stream: true });
        }

        aiResponse += decoder.decode();

        if (!aiResponse.trim()) {
          throw new Error('AI returned an empty response');
        }

        await sendMessageMutation({
          body: aiResponse,
          author: 'ai',
          sessionId,
        });

        setLastSubmittedMessage(null);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown chat error';
        setError(message);
      } finally {
        setIsSending(false);
      }
    },
    [isSending, sendMessageMutation, sessionId],
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastSubmittedMessage || isSending) return;
    await runChatRequest(lastSubmittedMessage);
  }, [isSending, lastSubmittedMessage, runChatRequest]);

  const clearMessages = useCallback(async () => {
    setError(null);
    setLastSubmittedMessage(null);
    await clearMessagesMutation({ sessionId });
  }, [clearMessagesMutation, sessionId]);

  return {
    messages,
    isSending,
    error,
    sendMessage: runChatRequest,
    retryLastMessage,
    clearMessages,
    canRetry: !!lastSubmittedMessage && !isSending,
  };
}
