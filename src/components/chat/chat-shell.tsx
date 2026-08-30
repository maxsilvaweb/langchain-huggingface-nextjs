'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppSidebar } from '@/components/chat/app-sidebar';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { AppDialog, AppDialogFooter } from '@/components/ui/app-dialog';
import { api } from '@/lib/convex/api';
import type { Id } from '@/lib/convex/dataModel';
import { APP_NAME } from '@/lib/locale';

type ChatChromeContextValue = {
  requestDelete: (conversationId: Id<'conversations'> | string) => void;
};

const ChatChromeContext = createContext<ChatChromeContextValue | null>(null);

export function useChatChrome() {
  const ctx = useContext(ChatChromeContext);
  if (!ctx) {
    return {
      requestDelete: () => undefined,
    };
  }
  return ctx;
}

/**
 * Stable chat chrome (sidebar + inset). Lives in the layout so it does not
 * remount when switching `/chat/[conversationId]` routes.
 */
export function ChatShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const removeConversation = useMutation(api.conversations.remove);

  const requestDelete = useCallback((conversationId: Id<'conversations'> | string) => {
    setDeletingId(conversationId);
  }, []);

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      const idToDelete = deletingId;
      await removeConversation({
        conversationId: idToDelete as Id<'conversations'>,
      });
      setDeletingId(null);
      toast.success('Conversation deleted');
      router.replace('/chat');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  return (
    <ChatChromeContext.Provider value={{ requestDelete }}>
      <SidebarProvider defaultOpen={true}>
        <AppSidebar deletingId={deletingId} setDeletingId={setDeletingId} />
        <SidebarInset className="relative flex h-screen flex-col overflow-hidden bg-transparent">
          <header className="z-60 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-background/95 px-3 backdrop-blur-xl md:hidden">
            <div className="flex items-center gap-2">
              <SidebarTrigger
                className="size-8 cursor-pointer hover:bg-white/10"
                title="Open conversation history"
                aria-label="Open conversation history"
              />
              <span className="truncate text-sm font-semibold tracking-tight text-foreground">
                {APP_NAME}
              </span>
            </div>
          </header>
          {children}
        </SidebarInset>

        <AppDialog
          open={!!deletingId}
          onOpenChange={(open) => !open && setDeletingId(null)}
          title="Delete Conversation"
          description="Are you sure you want to delete this conversation? This action cannot be undone."
          footer={
            <AppDialogFooter
              cancelText="Cancel"
              confirmText="Delete"
              confirmTheme="danger"
              confirmIcon={Trash2}
              onCancel={() => setDeletingId(null)}
              onConfirm={confirmDelete}
            />
          }
        />
      </SidebarProvider>
    </ChatChromeContext.Provider>
  );
}
