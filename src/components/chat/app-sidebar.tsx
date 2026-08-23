'use client';

import * as React from 'react';
import {
  Plus,
  MessageSquare,
  User,
  MoreVertical,
  Pencil,
  Trash2,
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useChatSession } from '@/hooks/use-chat-session';
import { useSearchableList } from '@/hooks/use-searchable-list';
import { useConvexConversationRepository } from '@/infrastructure/repositories';
import { toast } from 'sonner';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenuAction,
  useSidebar,
} from '@/components/ui/sidebar';
import { ActionButton } from '@/components/ui/action-button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '../theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppDialog, AppDialogFooter } from '@/components/ui/app-dialog';
import { Input } from '@/components/ui/input';
import { SearchInput } from '@/components/ui/search-input';
import {
  DEFAULT_CONVERSATION_TITLE,
  SIDEBAR_LABEL_RECENT_CHATS,
  SIDEBAR_LABEL_NO_SEARCH_RESULTS,
  getSidebarSearchResultsLabel,
} from '@/lib/locale';
import {
  NEW_CHAT_SHORTCUT_KEY,
  SIDEBAR_SEARCH_DEBOUNCE_MS,
  SIDEBAR_SEARCH_MAX_VISIBLE,
  SIDEBAR_SEARCH_MIN_LENGTH,
  SIDEBAR_SEARCH_PLACEHOLDER,
} from '@/lib/globals';
import { isApplePlatform, isEditableEventTarget } from '@/lib/utils';
import type { ISearchable } from '@/lib/search';
import type { Conversation } from '@/domain/repositories';

interface AppSidebarProps {
  deletingId?: string | null;
  setDeletingId?: (id: string | null) => void;
}

type ConversationListItem = Conversation;

function toConversationSearchable(
  conversation: ConversationListItem,
): ISearchable<ConversationListItem> {
  return {
    id: conversation._id,
    item: conversation,
    getHaystack: () =>
      [conversation.title ?? DEFAULT_CONVERSATION_TITLE, conversation._id]
        .join(' ')
        .trim(),
  };
}

export function AppSidebar({
  deletingId: _deletingId,
  setDeletingId,
}: AppSidebarProps) {
  const conversationRepository = useConvexConversationRepository();
  const conversations = conversationRepository.list();
  const emptyConversationId = conversationRepository.getFirstEmpty();

  const params = useParams();
  const router = useRouter();
  const { startNewSession } = useChatSession({ autoCreate: false });
  const conversationId = params?.conversationId as string;
  const { isMobile, setOpenMobile } = useSidebar();

  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [applePlatform, setApplePlatform] = React.useState(false);
  const searchInputRef = React.useRef<HTMLInputElement | null>(null);

  const searchAdapter = React.useCallback(
    (conversation: ConversationListItem) =>
      toConversationSearchable(conversation),
    [],
  );

  const search = useSearchableList<ConversationListItem>({
    items: conversations,
    adapter: searchAdapter,
    debounceMs: SIDEBAR_SEARCH_DEBOUNCE_MS,
    maxVisibleResults: SIDEBAR_SEARCH_MAX_VISIBLE,
    minQueryLength: SIDEBAR_SEARCH_MIN_LENGTH,
  });

  const isConvexLoading =
    conversations === undefined || emptyConversationId === undefined;

  const hasEmptyChat = !!emptyConversationId;
  const emptyChatActive = emptyConversationId === conversationId;

  React.useEffect(() => {
    setApplePlatform(isApplePlatform(navigator));
  }, []);

  const newChatShortcutKeys = React.useMemo(
    () =>
      applePlatform
        ? ['⌘', NEW_CHAT_SHORTCUT_KEY.toUpperCase()]
        : ['Ctrl', NEW_CHAT_SHORTCUT_KEY.toUpperCase()],
    [applePlatform],
  );

  const newChatShortcutLabel = React.useMemo(
    () => newChatShortcutKeys.join(' + '),
    [newChatShortcutKeys],
  );

  const newChatActionLabel = isCreating
    ? 'Creating new chat…'
    : isConvexLoading
      ? 'Loading conversations…'
      : hasEmptyChat
        ? emptyChatActive
          ? `You already have an empty ${DEFAULT_CONVERSATION_TITLE.toLowerCase()} open`
          : `An empty ${DEFAULT_CONVERSATION_TITLE.toLowerCase()} already exists — send a message first to unlock a new one`
        : `Create new chat (${newChatShortcutLabel})`;

  const handleNewChat = React.useCallback(async () => {
    if (isCreating || isConvexLoading || hasEmptyChat) return;
    try {
      setIsCreating(true);
      if (isMobile) setOpenMobile(false);
      if (emptyConversationId) {
        router.push(`/chat/${emptyConversationId}`);
        return;
      }

      const newId = await startNewSession();
      router.push(`/chat/${newId}`);
    } catch (err) {
      console.error('Failed to create new chat:', err);
      toast.error('Failed to create new chat');
    } finally {
      setIsCreating(false);
    }
  }, [
    emptyConversationId,
    hasEmptyChat,
    isConvexLoading,
    isCreating,
    isMobile,
    router,
    setOpenMobile,
    startNewSession,
  ]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const hasPrimaryModifier = applePlatform ? event.metaKey : event.ctrlKey;
      const hasOnlyExpectedModifiers = applePlatform
        ? !event.ctrlKey && !event.altKey && !event.shiftKey
        : !event.metaKey && !event.altKey && !event.shiftKey;

      if (
        event.defaultPrevented ||
        event.isComposing ||
        isEditableEventTarget(event.target) ||
        !hasOnlyExpectedModifiers ||
        !hasPrimaryModifier ||
        event.key.toLowerCase() !== NEW_CHAT_SHORTCUT_KEY
      ) {
        return;
      }

      event.preventDefault();
      void handleNewChat();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNewChat, applePlatform]);

  const handleSelectConversation = (id: string) => {
    if (isMobile) setOpenMobile(false);
    router.push(`/chat/${id}`);
  };

  const handleRename = React.useCallback(async () => {
    if (!renamingId || !newTitle.trim()) return;
    try {
      await conversationRepository.updateTitle(
        renamingId as any,
        newTitle.trim(),
      );
      setRenamingId(null);
      setNewTitle('');
      toast.success('Conversation renamed');
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      toast.error('Failed to rename conversation');
    }
  }, [conversationRepository, newTitle, renamingId]);

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-4">
        <ActionButton
          onClick={handleNewChat}
          icon={Plus}
          label={DEFAULT_CONVERSATION_TITLE}
          theme="green"
          shortcut={newChatShortcutKeys}
          disabled={isCreating || isConvexLoading || hasEmptyChat}
          aria-label={newChatActionLabel}
          title={newChatActionLabel}
        />
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <div className="px-4 pb-2 pt-3">
            <SearchInput
              value={search.rawQuery}
              onChange={search.setQuery}
              onClear={search.reset}
              inputRef={searchInputRef}
              placeholder={SIDEBAR_SEARCH_PLACEHOLDER}
            />
            {search.isSearching ? (
              <div className="mt-1 px-1 text-[10px] font-medium uppercase tracking-wider text-white/35">
                {search.isEmpty
                  ? SIDEBAR_LABEL_NO_SEARCH_RESULTS
                  : getSidebarSearchResultsLabel(search.totalMatches ?? 0)}
              </div>
            ) : null}
          </div>
          <SidebarGroupLabel className="text-white/40 px-4 py-2 text-xs font-medium uppercase tracking-wider">
            {SIDEBAR_LABEL_RECENT_CHATS}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {search.displayItems?.map((conv) => {
                const effectiveTitle = conv.title || DEFAULT_CONVERSATION_TITLE;
                const canDeleteConversation = Boolean(conv.title?.trim());

                return (
                  <SidebarMenuItem key={conv._id}>
                    <SidebarMenuButton
                      onClick={() => handleSelectConversation(conv._id)}
                      isActive={conversationId === conv._id}
                      className={`w-full justify-start gap-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
                        conversationId === conv._id
                          ? 'bg-white/10 text-white'
                          : 'text-white/70 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <MessageSquare className="h-4 w-4 shrink-0" />
                      <span className="truncate flex-1">{effectiveTitle}</span>
                    </SidebarMenuButton>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuAction
                          className="text-white/40 hover:text-white transition-colors cursor-pointer"
                          aria-label="Conversation options"
                          title="Conversation options"
                        >
                          <MoreVertical className="h-4 w-4" />
                          <span className="sr-only">More</span>
                        </SidebarMenuAction>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        side="right"
                        align="start"
                        className="w-48 bg-zinc-900 border-white/10 text-white"
                      >
                        <DropdownMenuItem
                          onClick={() => {
                            setRenamingId(conv._id);
                            setNewTitle(effectiveTitle);
                          }}
                          className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                        >
                          <Pencil className="h-4 w-4" />
                          Rename
                        </DropdownMenuItem>
                        {canDeleteConversation && (
                          <DropdownMenuItem
                            onClick={() => setDeletingId?.(conv._id)}
                            disabled={!setDeletingId}
                            className="gap-2 cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                );
              })}
              {!conversations && (
                <div className="px-4 py-2 text-sm text-white/30">
                  Loading...
                </div>
              )}
              {search.isEmpty && (
                <div className="px-4 py-2 text-sm text-white/30 italic">
                  {SIDEBAR_LABEL_NO_SEARCH_RESULTS}
                </div>
              )}
              {!search.isSearching && conversations?.length === 0 && (
                <div className="px-4 py-2 text-sm text-white/30 italic">
                  No history yet
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <AppDialog
        open={!!renamingId}
        onOpenChange={(open) => !open && setRenamingId(null)}
        title="Rename Conversation"
        footer={
          <AppDialogFooter
            cancelText="Cancel"
            confirmText="Save"
            confirmTheme="green"
            confirmIcon={Pencil}
            onCancel={() => setRenamingId(null)}
            onConfirm={handleRename}
          />
        }
      >
        <div className="py-4">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Enter new title..."
            className="bg-white/5 border-white/10 text-white focus:ring-white/20"
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            autoFocus
          />
        </div>
      </AppDialog>

      <SidebarFooter className="p-4 flex flex-col gap-4">
        <Separator className="bg-white/10" />
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3 text-white/70">
            <div className="h-8 w-8 rounded-full bg-white/10 flex items-center justify-center border border-white/10">
              <User className="h-4 w-4" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-white">
                Maximillian
              </span>
              <span className="text-[10px]">Free Plan</span>
            </div>
          </div>
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
