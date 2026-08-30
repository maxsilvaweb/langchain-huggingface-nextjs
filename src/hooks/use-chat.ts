'use client';

import { useCallback, useEffect, useState } from 'react';
import type { Id } from '@/lib/convex/dataModel';
import type { ChatMessage } from '@/domain/repositories';
import { MessageContent } from '@/domain/value-objects';
import {
  useConvexConversationRepository,
  useConvexMessageRepository,
} from '@/infrastructure/repositories';
import { useMessageSender, useTitleGenerator } from '@/hooks/chat';
import { toast } from 'sonner';

type DisplayedThread = {
  conversationId: Id<'conversations'>;
  messages: ChatMessage[];
};

export type FailedPrompt = {
  body: string;
  modelName?: string;
  provider?: string;
};

/**
 * Survives Next.js remounts of `/chat/[conversationId]` so we can keep showing
 * the previous thread instead of flashing a cold loader.
 */
let lastDisplayedThread: DisplayedThread | null = null;

/**
 * Loads messages for `targetConversationId`, but only commits the UI thread
 * once data is ready — previous messages stay mounted until then (no flicker).
 */
export function useChat(targetConversationId: Id<'conversations'>) {
  const messageRepository = useConvexMessageRepository(targetConversationId);
  const conversationRepository = useConvexConversationRepository();
  const listedMessages = messageRepository.list(targetConversationId);

  const [display, setDisplay] = useState<DisplayedThread | null>(
    () => lastDisplayedThread,
  );

  useEffect(() => {
    if (listedMessages === undefined) return;
    const next: DisplayedThread = {
      conversationId: targetConversationId,
      messages: listedMessages,
    };
    lastDisplayedThread = next;
    setDisplay(next);
  }, [targetConversationId, listedMessages]);

  const conversationId = display?.conversationId ?? targetConversationId;
  const messages = display?.messages ?? [];
  const isSwitching =
    display !== null && display.conversationId !== targetConversationId;
  const isColdLoading = display === null;

  const {
    isSending,
    error: senderError,
    streamingMessage,
    sendMessage: streamMessage,
    reset: resetSender,
  } = useMessageSender();
  const { generateTitle } = useTitleGenerator(
    async ({ conversationId, title }) => {
      await conversationRepository.updateTitle(conversationId, title);
    },
  );

  const [error, setError] = useState<string | null>(null);
  const [failedPrompt, setFailedPrompt] = useState<FailedPrompt | null>(null);

  useEffect(() => {
    resetSender();
    setError(null);
    setFailedPrompt(null);
  }, [targetConversationId, resetSender]);

  const completeAiReply = useCallback(
    async (
      message: string,
      activeId: Id<'conversations'>,
      modelName?: string,
      provider?: string,
    ) => {
      const aiResponse = await streamMessage(message, activeId, {
        modelName,
        provider,
      });

      if (!aiResponse) {
        throw new Error(senderError || 'Failed to fetch AI response');
      }

      await messageRepository.send({
        body: aiResponse,
        author: 'ai',
        conversationId: activeId,
      });
    },
    [messageRepository, senderError, streamMessage],
  );

  const runChatRequest = useCallback(
    async (rawMessage: string, modelName?: string, provider?: string) => {
      if (isSending || isSwitching || isColdLoading || !display) return;

      const activeId = display.conversationId;

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
      setFailedPrompt(null);

      let userPersisted = false;

      try {
        const isFirstMessage = display.messages.length === 0;

        await messageRepository.send({
          body: message,
          author: 'user',
          conversationId: activeId,
        });
        userPersisted = true;

        if (isFirstMessage) {
          void generateTitle(message, activeId);
        }

        await completeAiReply(message, activeId, modelName, provider);
      } catch (chatError) {
        const errMessage =
          chatError instanceof Error ? chatError.message : 'Unknown chat error';
        setError(errMessage);
        if (userPersisted) {
          setFailedPrompt({ body: message, modelName, provider });
        }

        toast.error('Message failed', {
          description: errMessage,
        });
      }
    },
    [
      completeAiReply,
      display,
      generateTitle,
      isColdLoading,
      isSending,
      isSwitching,
      messageRepository,
    ],
  );

  const retryFailedPrompt = useCallback(async () => {
    if (!failedPrompt || !display || isSending || isSwitching) return;

    const activeId = display.conversationId;
    setError(null);

    try {
      await completeAiReply(
        failedPrompt.body,
        activeId,
        failedPrompt.modelName,
        failedPrompt.provider,
      );
      setFailedPrompt(null);
    } catch (chatError) {
      const errMessage =
        chatError instanceof Error ? chatError.message : 'Unknown chat error';
      setError(errMessage);
      toast.error('Retry failed', {
        description: errMessage,
      });
    }
  }, [
    completeAiReply,
    display,
    failedPrompt,
    isSending,
    isSwitching,
  ]);

  const clearMessages = useCallback(async () => {
    if (!display) return;
    setError(null);
    setFailedPrompt(null);
    await messageRepository.clear(display.conversationId);
  }, [display, messageRepository]);

  return {
    conversationId,
    messages,
    isSwitching,
    isColdLoading,
    streamingMessage,
    isSending,
    error: error ?? senderError,
    failedPrompt,
    sendMessage: runChatRequest,
    retryFailedPrompt,
    clearMessages,
  };
}
