'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';

type ChatMessage = Doc<'messages'>;

export function useChat(conversationId: Id<'conversations'>) {
  const messages = (useQuery(api.messages.list, { conversationId }) ?? []) as ChatMessage[];
  const sendMessageMutation = useMutation(api.messages.send);
  const clearMessagesMutation = useMutation(api.messages.clear);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<string | null>(null);
  const [lastUsedModel, setLastUsedModel] = useState<string | undefined>();
  const [lastUsedProvider, setLastUsedProvider] = useState<string | undefined>();
  const [streamingMessage, setStreamingMessage] = useState<string>('');

  const runChatRequest = useCallback(
    async (rawMessage: string, modelName?: string, provider?: string) => {
      const message = rawMessage.trim();
      if (!message || isSending) return;

      setIsSending(true);
      setError(null);
      setLastSubmittedMessage(message);
      setLastUsedModel(modelName);
      setLastUsedProvider(provider);
      setStreamingMessage('');

      try {
        // Backend now handles saving the user message as the single source of truth
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message, conversationId, modelName, provider }),
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

        // Frontend no longer saves AI response - backend does this
        // await sendMessageMutation({
        //   body: aiResponse,
        //   author: 'ai',
        //   conversationId,
        // });

        setLastSubmittedMessage(null);
        setStreamingMessage('');
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown chat error';
        setError(message);
        
        toast.error('Message failed', {
          description: message,
          action: {
            label: 'Retry',
            onClick: () => {
              void runChatRequest(rawMessage, modelName, provider);
            },
          },
        });
      } finally {
        setIsSending(false);
      }
    },
    [isSending, conversationId],
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastSubmittedMessage || isSending) return;
    await runChatRequest(lastSubmittedMessage, lastUsedModel, lastUsedProvider);
  }, [isSending, lastSubmittedMessage, lastUsedModel, lastUsedProvider, runChatRequest]);

  const clearMessages = useCallback(async () => {
    setError(null);
    setLastSubmittedMessage(null);
    await clearMessagesMutation({ conversationId });
  }, [clearMessagesMutation, conversationId]);

  return {
    messages,
    streamingMessage,
    isSending,
    error,
    sendMessage: runChatRequest,
    clearMessages,
  };
}
