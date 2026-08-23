'use client';

import { useCallback, useMemo } from 'react';
import { ApiChatService } from '@/services/chat/ApiChatService';
import { ConversationTitle } from '@/domain/value-objects';
import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';
import type { Id } from '@/lib/convex/dataModel';

export interface TitleGeneratorOptions {
  onSuccess?: (title: string) => void;
  onError?: (error: Error) => void;
}

export interface UseTitleGeneratorReturn {
  generateTitle: (
    message: string,
    conversationId: Id<'conversations'>,
  ) => Promise<string | null>;
  buildFallbackTitle: (message: string) => string;
}

/**
 * Hook for generating conversation titles from the first user message.
 *
 * This follows the Single Responsibility Principle by isolating title generation
 * logic from the main chat flow. Titles are generated fire-and-forget style to
 * not block the chat experience.
 */
export function useTitleGenerator(
  updateTitleMutation: (args: {
    conversationId: Id<'conversations'>;
    title: string;
  }) => Promise<void>,
  options: TitleGeneratorOptions = {},
): UseTitleGeneratorReturn {
  const chatService = useMemo(() => new ApiChatService(), []);

  const buildFallbackTitle = useCallback((message: string): string => {
    const title = ConversationTitle.fromFirstMessage(message);
    return title.getValue();
  }, []);

  const generateTitle = useCallback(
    async (
      message: string,
      conversationId: Id<'conversations'>,
    ): Promise<string | null> => {
      // Fire-and-forget title generation - intentionally NOT awaited
      // to prevent blocking the chat experience
      const generateTitleAsync = async (): Promise<string | null> => {
        try {
          const title = await chatService.generateTitle(message);

          if (
            title &&
            title.toLowerCase() !== DEFAULT_CONVERSATION_TITLE.toLowerCase()
          ) {
            const conversationTitle = new ConversationTitle(title);
            const finalTitle = conversationTitle.getValue();

            await updateTitleMutation({
              conversationId,
              title: finalTitle,
            });

            options.onSuccess?.(finalTitle);
            return finalTitle;
          }
        } catch (err) {
          console.warn('Title generation failed, using fallback.', err);
          options.onError?.(
            err instanceof Error ? err : new Error('Unknown error'),
          );
        }

        // Fallback to truncated message
        try {
          const fallbackTitle = buildFallbackTitle(message);
          await updateTitleMutation({
            conversationId,
            title: fallbackTitle,
          });
          return fallbackTitle;
        } catch {
          // Final swallow - no visible failure from user's perspective
          return null;
        }
      };

      // Fire and forget - don't block chat
      void generateTitleAsync();
      return null;
    },
    [chatService, updateTitleMutation, buildFallbackTitle, options],
  );

  return {
    generateTitle,
    buildFallbackTitle,
  };
}
