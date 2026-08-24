'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import * as React from 'react';
import { Plus, Pencil, FileText } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useChatSession } from '@/hooks/use-chat-session';
import { useSearchableList } from '@/hooks/use-searchable-list';
import { useConvexConversationRepository } from '@/infrastructure/repositories';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { ActionButton } from '@/components/ui/action-button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '@/components/theme-toggle';
import { AppDialog, AppDialogFooter } from '@/components/ui/app-dialog';
import { Input } from '@/components/ui/input';
import {
  CHAT_SESSION_STORAGE_KEY,
  NEW_CHAT_SHORTCUT_KEY,
  SIDEBAR_SEARCH_DEBOUNCE_MS,
  SIDEBAR_SEARCH_MAX_VISIBLE,
  SIDEBAR_SEARCH_MIN_LENGTH,
} from '@/lib/globals';
import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';
import { isApplePlatform, isEditableEventTarget } from '@/lib/utils';
import type { Id } from '@/lib/convex/dataModel';
import { AccountSection } from './AccountSection';
import {
  type ConversationListItem,
  isPlaceholderConversation,
  toConversationSearchable,
} from './helpers';
import { RecentChatsSection } from './RecentChatsSection';
import { SearchSection } from './SearchSection';

export interface AppSidebarProps {
  deletingId?: string | null;
  setDeletingId?: (id: string | null) => void;
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
  const conversationId = params?.conversationId as
    Id<'conversations'> | undefined;
  const { isMobile, setOpenMobile } = useSidebar();

  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');
  const [isCreating, setIsCreating] = React.useState(false);
  const [applePlatform, setApplePlatform] = React.useState(false);
  const accountRowRef = React.useRef<HTMLDivElement | null>(null);
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

  const { isLoaded: clerkLoaded, isSignedIn } = useAuth();
  const { user } = useUser();

  const isConvexLoading =
    conversations === undefined || emptyConversationId === undefined;

  const hasEmptyChat = !!emptyConversationId;
  const emptyChatActive = emptyConversationId === conversationId;
  const placeholderConversationIds = React.useMemo(
    () =>
      (conversations ?? [])
        .filter(isPlaceholderConversation)
        .map((conversation) => conversation._id),
    [conversations],
  );
  const duplicatePlaceholderIds = React.useMemo(
    () => placeholderConversationIds.slice(1),
    [placeholderConversationIds],
  );
  const repairedDuplicateKeyRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    setApplePlatform(isApplePlatform(navigator));
  }, []);

  React.useEffect(() => {
    if (isConvexLoading || duplicatePlaceholderIds.length === 0) {
      repairedDuplicateKeyRef.current = null;
      return;
    }

    const repairKey = duplicatePlaceholderIds.join(',');
    if (repairedDuplicateKeyRef.current === repairKey) return;
    repairedDuplicateKeyRef.current = repairKey;

    let isActive = true;

    void (async () => {
      try {
        const canonicalId = await conversationRepository.ensureSingleEmpty();
        if (!isActive || !canonicalId) return;

        const storedId = localStorage.getItem(
          CHAT_SESSION_STORAGE_KEY,
        ) as Id<'conversations'> | null;
        if (storedId && duplicatePlaceholderIds.includes(storedId)) {
          localStorage.setItem(CHAT_SESSION_STORAGE_KEY, canonicalId);
        }

        if (
          conversationId &&
          duplicatePlaceholderIds.includes(conversationId)
        ) {
          router.replace(`/chat/${canonicalId}`);
        }
      } catch (error) {
        repairedDuplicateKeyRef.current = null;
        console.error('Failed to repair duplicate empty conversations:', error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [
    conversationId,
    conversationRepository,
    duplicatePlaceholderIds,
    isConvexLoading,
    router,
  ]);

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
    if (isCreating || isConvexLoading) return;
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

  const handleSelectConversation = React.useCallback(
    (id: string) => {
      if (isMobile) setOpenMobile(false);
      router.push(`/chat/${id}`);
    },
    [isMobile, router, setOpenMobile],
  );

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

  const handleAccountRowClick = React.useCallback(
    (target: EventTarget | null) => {
      if (!isSignedIn) return;

      if (
        target instanceof HTMLElement &&
        target.closest('[data-account-avatar]')
      ) {
        return;
      }

      const trigger = accountRowRef.current?.querySelector('button');
      trigger?.click();
    },
    [isSignedIn],
  );

  return (
    <Sidebar className="border-r border-white/10">
      <SidebarHeader className="p-4 space-y-4">
        <div className="px-2">
          <AccountSection
            clerkLoaded={clerkLoaded}
            isSignedIn={Boolean(isSignedIn)}
            displayName={user?.fullName || user?.username}
            email={user?.primaryEmailAddress?.emailAddress}
            accountRowRef={accountRowRef}
            onActivate={handleAccountRowClick}
          />
        </div>
        <Separator className="bg-white/10" />
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
          <div className="mx-2 mt-1 overflow-hidden rounded-xl bg-slate-950/60 backdrop-blur-md border border-white/8">
            <SearchSection
              value={search.rawQuery}
              onChange={search.setQuery}
              onClear={search.reset}
              inputRef={searchInputRef}
              isSearching={search.isSearching}
              isEmpty={search.isEmpty}
              totalMatches={search.totalMatches}
            />
            <RecentChatsSection
              conversations={conversations}
              displayItems={search.displayItems}
              isSearching={search.isSearching}
              isEmpty={search.isEmpty}
              activeConversationId={conversationId}
              canDelete={Boolean(setDeletingId)}
              onSelectConversation={handleSelectConversation}
              onRenameConversation={(conversation, effectiveTitle) => {
                setRenamingId(conversation._id);
                setNewTitle(effectiveTitle);
              }}
              onDeleteConversation={(id) => setDeletingId?.(id)}
            />
          </div>

          {/* RAG Documents Button */}
          <div className="mx-2 mt-3">
            <ActionButton
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                router.push('/documents');
              }}
              icon={FileText}
              label="RAG Documents"
              theme="green"
              aria-label="Manage RAG knowledge base documents"
              title="Manage RAG knowledge base documents"
            />
          </div>
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

      <SidebarFooter className="p-4 pt-0">
        <div className="flex items-center justify-start px-2">
          <ThemeToggle />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
