'use client';

import { useEffect, useState } from 'react';
import { ModelSelection } from '@/domain/value-objects';
import type { ChatMessage } from '@/domain/repositories';
import type { Id } from '@/lib/convex/dataModel';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { useSelectedModel } from '@/components/providers/ModelProvider';
import { ChatFooter } from './chat-window/ChatFooter';
import { ChatMessageList } from './chat-window/ChatMessageList';
import { ChatWindowContainer } from './chat-window/ChatWindowContainer';
import { useScrollManager } from './chat-window/useScrollManager';

interface ChatWindowProps {
  conversationId: Id<'conversations'>;
  messages: ChatMessage[];
  isSending: boolean;
  streamingMessage: string;
  onSendMessage: (
    message: string,
    modelName?: string,
    provider?: string,
  ) => Promise<void>;
  failedPromptBody?: string | null;
  onRetryFailedPrompt?: () => void;
  onDeleteChat?: () => void;
}

export function ChatWindow({
  conversationId,
  messages,
  isSending,
  streamingMessage,
  onSendMessage,
  failedPromptBody,
  onRetryFailedPrompt,
  onDeleteChat,
}: ChatWindowProps) {
  const [input, setInput] = useState('');
  const {
    selectedModelId: selectedModel,
    setSelectedModelId: setSelectedModel,
  } = useSelectedModel();
  const {
    scrollRef,
    isAtBottom,
    hasOverflow,
    scrollToBottom,
    handleScroll,
    measureMetrics,
  } = useScrollManager();

  useEffect(() => {
    setInput('');
    // Land at the bottom of the newly committed thread without animating from the previous scroll position.
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [conversationId, scrollRef]);

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
  }, [messages, streamingMessage, isSending, measureMetrics]);

  useEffect(() => {
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, streamingMessage, isAtBottom, scrollRef]);

  const submitMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    const modelSelection = ModelSelection.fromId(
      selectedModel,
      AVAILABLE_MODELS,
    );
    await onSendMessage(
      message,
      modelSelection?.getId() ?? selectedModel,
      modelSelection?.getProvider(),
    );
    scrollToBottom();
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await submitMessage();
  };

  return (
    <ChatWindowContainer>
      <ChatMessageList
        messages={messages}
        streamingMessage={streamingMessage}
        isSending={isSending}
        scrollRef={scrollRef}
        onScroll={handleScroll}
        failedPromptBody={failedPromptBody}
        onRetryFailedPrompt={onRetryFailedPrompt}
      />

      <ChatFooter
        input={input}
        selectedModel={selectedModel}
        isSending={isSending}
        hasOverflow={hasOverflow}
        isAtBottom={isAtBottom}
        onInputChange={setInput}
        onModelChange={setSelectedModel}
        onDeleteChat={onDeleteChat}
        onScrollToBottom={scrollToBottom}
        onSubmit={handleSubmit}
        onSubmitMessage={submitMessage}
      />
    </ChatWindowContainer>
  );
}
