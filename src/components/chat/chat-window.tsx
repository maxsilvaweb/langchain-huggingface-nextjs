'use client';

import { useEffect, useState } from 'react';
import { useChat } from '@/hooks/use-chat';
import { ModelSelection } from '@/domain/value-objects';
import type { Id } from '@/lib/convex/dataModel';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { ChatFooter } from './chat-window/ChatFooter';
import { ChatMessageList } from './chat-window/ChatMessageList';
import { ChatWindowContainer } from './chat-window/ChatWindowContainer';
import { useScrollManager } from './chat-window/useScrollManager';

interface ChatWindowProps {
  conversationId: Id<'conversations'>;
  onDeleteChat?: () => void;
}

export function ChatWindow({ conversationId, onDeleteChat }: ChatWindowProps) {
  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(AVAILABLE_MODELS[0].id);
  const {
    scrollRef,
    isAtBottom,
    hasOverflow,
    scrollToBottom,
    handleScroll,
    measureMetrics,
  } = useScrollManager();

  const { messages, streamingMessage, isSending, sendMessage } =
    useChat(conversationId);

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
    if (scrollRef.current && isAtBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isSending, isAtBottom, scrollRef]);

  const submitMessage = async () => {
    const message = input.trim();
    if (!message || isSending) return;

    setInput('');
    const modelSelection = ModelSelection.fromId(
      selectedModel,
      AVAILABLE_MODELS,
    );
    await sendMessage(
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
