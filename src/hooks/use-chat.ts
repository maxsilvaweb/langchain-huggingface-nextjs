'use client';

import { useCallback, useState } from 'react';
import type { Id } from '@/lib/convex/dataModel';
import { MessageContent } from '@/domain/value-objects';
import {
  useConvexConversationRepository,
  useConvexMessageRepository,
} from '@/infrastructure/repositories';
import { useMessageSender, useTitleGenerator } from '@/hooks/chat';
import { toast } from 'sonner';

export function useChat(conversationId: Id<'conversations'>) {
  const messageRepository = useConvexMessageRepository(conversationId);
  const conversationRepository = useConvexConversationRepository();
  const messages = messageRepository.list(conversationId) ?? [];
  const {
    isSending,
    error: senderError,
    streamingMessage,
    sendMessage: streamMessage,
  } = useMessageSender();
  const { generateTitle } = useTitleGenerator(
    async ({ conversationId, title }) => {
      await conversationRepository.updateTitle(conversationId, title);
    },
  );

  const [error, setError] = useState<string | null>(null);

  const runChatRequest = useCallback(
    async (rawMessage: string, modelName?: string, provider?: string) => {
      if (isSending) return;

      let message: string;
      try {
        message = new MessageContent(rawMessage).getValue();
      } catch (chatError) {
        const validationMessage =
          chatError instanceof Error ? chatError.message : 'Invalid message';
        setError(validationMessage);
        return;
      }

      setError(null);

      try {
        const isFirstMessage = messages.length === 0;

        await messageRepository.send({
          body: message,
          author: 'user',
          conversationId,
        });

        if (isFirstMessage) {
          void generateTitle(message, conversationId);
        }

        const aiResponse = await streamMessage(message, conversationId, {
          modelName,
          provider,
        });

        if (!aiResponse) {
          throw new Error(senderError || 'Failed to fetch AI response');
        }

        await messageRepository.send({
          body: aiResponse,
          author: 'ai',
          conversationId,
        });
      } catch (chatError) {
        const message =
          chatError instanceof Error ? chatError.message : 'Unknown chat error';
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
      }
    },
    [
      conversationId,
      generateTitle,
      isSending,
      messageRepository,
      messages.length,
      senderError,
      streamMessage,
    ],
  );

  const clearMessages = useCallback(async () => {
    setError(null);
    await messageRepository.clear(conversationId);
  }, [conversationId, messageRepository]);

  return {
    messages,
    streamingMessage,
    isSending,
    error: error ?? senderError,
    sendMessage: runChatRequest,
    clearMessages,
  };
}
