'use client';

import { useAuth, useUser } from '@clerk/nextjs';
import * as React from 'react';
import { Plus, Pencil, FileText, Settings2 } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useChatSession } from '@/hooks/use-chat-session';
import { useSearchableList } from '@/hooks/use-searchable-list';
import { useConvexConversationRepository } from '@/infrastructure/repositories';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { AppDialog, AppDialogFooter } from '@/components/ui/app-dialog';
import { Input } from '@/components/ui/input';
import { AccountSection } from './AccountSection';
import { useNavigationLoading } from '@/components/providers/NavigationLoadingProvider';
import { useSelectedModel } from '@/components/providers/ModelProvider';
import {
  CHAT_SESSION_STORAGE_KEY,
  NEW_CHAT_SHORTCUT_KEY,
  SIDEBAR_SEARCH_DEBOUNCE_MS,
  SIDEBAR_SEARCH_MAX_VISIBLE,
  SIDEBAR_SEARCH_MIN_LENGTH,
} from '@/lib/globals';
import { DEFAULT_CONVERSATION_TITLE } from '@/lib/locale';
import { cn, isApplePlatform, isEditableEventTarget } from '@/lib/utils';
import type { Id } from '@/lib/convex/dataModel';
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
  const { startNavigation } = useNavigationLoading();
  const { resetToDefaultModel } = useSelectedModel();
  const conversationId = params?.conversationId as
    Id<'conversations'> | undefined;
  const { isMobile, setOpenMobile } = useSidebar();
  const [isPendingNav, startTransition] = React.useTransition();

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

      // New chats should use the Settings default, not the last in-chat override.
      resetToDefaultModel();

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
    resetToDefaultModel,
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
      if (id === conversationId) return;
      if (isMobile) setOpenMobile(false);
      startTransition(() => {
        router.push(`/chat/${id}`);
      });
    },
    [conversationId, isMobile, router, setOpenMobile, startTransition],
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
      <SidebarHeader className="p-4 pb-2 space-y-4">
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
        <div className="space-y-2">
          <div className="overflow-hidden rounded-xl border border-emerald-800/80 bg-emerald-950/60 shadow-lg">
            <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300/70">
              Menu
            </p>
            <button
              type="button"
              onClick={handleNewChat}
              disabled={isCreating || isConvexLoading || hasEmptyChat}
              className="flex w-full cursor-pointer items-center gap-3 px-3 py-2.5 text-left text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-900/50 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label={newChatActionLabel}
              title={newChatActionLabel}
            >
              <Plus className="h-4 w-4 shrink-0 text-emerald-300" />
              <span className="flex-1">{DEFAULT_CONVERSATION_TITLE}</span>
              {newChatShortcutKeys.length ? (
                <span className="ml-auto hidden items-center gap-1 md:flex">
                  {newChatShortcutKeys.map((key) => (
                    <kbd
                      key={key}
                      className="inline-flex min-w-5 items-center justify-center rounded-md border border-emerald-700/60 bg-emerald-900/40 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-emerald-200/80"
                    >
                      {key}
                    </kbd>
                  ))}
                </span>
              ) : null}
            </button>
            <button
              type="button"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                startNavigation('/documents');
                router.push('/documents');
              }}
              className="flex w-full cursor-pointer items-center gap-3 border-t border-emerald-800/60 px-3 py-2.5 text-left text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-900/50"
              aria-label="Manage RAG knowledge base documents"
              title="Manage RAG knowledge base documents"
            >
              <FileText className="h-4 w-4 shrink-0 text-emerald-300" />
              RAG Documents
            </button>
            <button
              type="button"
              onClick={() => {
                if (isMobile) setOpenMobile(false);
                startNavigation('/settings');
                router.push('/settings');
              }}
              className="flex w-full cursor-pointer items-center gap-3 border-t border-emerald-800/60 px-3 py-2.5 text-left text-sm font-medium text-emerald-100 transition-colors hover:bg-emerald-900/50"
              aria-label="Open user settings"
              title="Open user settings"
            >
              <Settings2 className="h-4 w-4 shrink-0 text-emerald-300" />
              Settings
            </button>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="min-h-0 overflow-hidden pt-0">
        <SidebarGroup className="flex min-h-0 flex-1 flex-col p-0 pt-0">
          <div
            className={cn(
              'mx-2 mb-2 mt-0 flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-white/8 bg-slate-950/60 backdrop-blur-md transition-opacity duration-150',
              isPendingNav && 'opacity-70',
            )}
          >
            <div className="shrink-0">
              <SearchSection
                value={search.rawQuery}
                onChange={search.setQuery}
                onClear={search.reset}
                inputRef={searchInputRef}
                isSearching={search.isSearching}
                isEmpty={search.isEmpty}
                totalMatches={search.totalMatches}
              />
            </div>
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

    </Sidebar>
  );
}
