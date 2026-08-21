'use client';

import { useCallback, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Doc, Id } from '../../convex/_generated/dataModel';
import { toast } from 'sonner';
import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';

type ChatMessage = Doc<'messages'>;

export function useChat(conversationId: Id<'conversations'>) {
  const messages = (useQuery(api.messages.list, { conversationId }) ??
    []) as ChatMessage[];
  const sendMessageMutation = useMutation(api.messages.send);
  const clearMessagesMutation = useMutation(api.messages.clear);
  const updateTitleMutation = useMutation(api.conversations.updateTitle);

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSubmittedMessage, setLastSubmittedMessage] = useState<
    string | null
  >(null);
  const [lastUsedModel, setLastUsedModel] = useState<string | undefined>();
  const [lastUsedProvider, setLastUsedProvider] = useState<
    string | undefined
  >();
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
        // Determine if this is the FIRST user message of a brand-new conversation.
        // We check messages.length BEFORE the insert (the `messages` variable
        // is the pre-existing state). This matches Claude/ChatGPT-style title-from-first-msg.
        const isFirstMessage = messages.length === 0;

        await sendMessageMutation({
          body: message,
          author: 'user',
          conversationId,
        });

        // Fire-and-forget title generation for the first user message.
        // Intentionally NOT awaited — we never want title latency to block chat.
        if (isFirstMessage) {
          void (async () => {
            // Client-side fallback title — used instantly if the HF API call
            // fails or times out. Truncates to ~35 chars (a line in the sidebar)
            // with a clean mid-word cut and ellipsis when needed.
            const buildFallbackTitle = (text: string): string => {
              const trimmed = text.replace(/\s+/g, ' ').trim();
              if (trimmed.length <= 35) return trimmed;
              const cut = trimmed.lastIndexOf(' ', 34);
              return trimmed.slice(0, cut > 0 ? cut : 35).trimEnd() + '…';
            };

            try {
              const res = await fetch('/api/chat/title', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message }),
              });
              if (!res.ok) throw new Error(`title HTTP ${res.status}`);
              const data = await res.json().catch(() => null);
              const title = data?.title?.trim();
              if (
                title &&
                title.toLowerCase() !== DEFAULT_CONVERSATION_TITLE.toLowerCase()
              ) {
                await updateTitleMutation({ conversationId, title });
                return;
              }
            } catch (err) {
              // Swallow and fall through to the fallback below.
              console.warn('Title generation failed, using fallback.', err);
            }

            // Always land on a human-readable title — either LLM summarization
            // worked above, or we use a clean truncation of the user's first message.
            try {
              await updateTitleMutation({
                conversationId,
                title: buildFallbackTitle(message),
              });
            } catch {
              // Final swallow — no visible failure from the user's perspective.
            }
          })();
        }

        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message,
            conversationId,
            modelName,
            provider,
          }),
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

        await sendMessageMutation({
          body: aiResponse,
          author: 'ai',
          conversationId,
        });

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
              // We intentionally do not await this so it fires in background
              void runChatRequest(rawMessage, modelName, provider);
            },
          },
        });
      } finally {
        setIsSending(false);
      }
    },
    [
      isSending,
      sendMessageMutation,
      updateTitleMutation,
      conversationId,
      messages.length,
    ],
  );

  const retryLastMessage = useCallback(async () => {
    if (!lastSubmittedMessage || isSending) return;
    await runChatRequest(lastSubmittedMessage, lastUsedModel, lastUsedProvider);
  }, [
    isSending,
    lastSubmittedMessage,
    lastUsedModel,
    lastUsedProvider,
    runChatRequest,
  ]);

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
