'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {
  DEFAULT_CONVERSATION_TITLE,
  SIDEBAR_LABEL_NO_SEARCH_RESULTS,
} from '@/lib/locale';
import type { Id } from '@/lib/convex/dataModel';
import type { Conversation } from '@/domain/repositories';
import { MessageSquare, MoreVertical, Pencil, Trash2 } from 'lucide-react';

interface RecentChatsSectionProps {
  conversations?: Conversation[];
  displayItems?: Conversation[];
  isSearching: boolean;
  isEmpty: boolean;
  activeConversationId?: Id<'conversations'>;
  canDelete: boolean;
  onSelectConversation: (id: string) => void;
  onRenameConversation: (conversation: Conversation, effectiveTitle: string) => void;
  onDeleteConversation: (id: string) => void;
}

export function RecentChatsSection({
  conversations,
  displayItems,
  isSearching,
  isEmpty,
  activeConversationId,
  canDelete,
  onSelectConversation,
  onRenameConversation,
  onDeleteConversation,
}: RecentChatsSectionProps) {
  return (
    <>
      <SidebarGroupContent>
        <SidebarMenu>
          {displayItems?.map((conversation) => {
            const effectiveTitle =
              conversation.title || DEFAULT_CONVERSATION_TITLE;
            const canDeleteConversation = Boolean(conversation.title?.trim());

            return (
              <SidebarMenuItem key={conversation._id}>
                <SidebarMenuButton
                  onClick={() => onSelectConversation(conversation._id)}
                  isActive={activeConversationId === conversation._id}
                  className={`w-full justify-start gap-3 px-4 py-2 text-sm transition-colors cursor-pointer ${
                    activeConversationId === conversation._id
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
                      onClick={() =>
                        onRenameConversation(conversation, effectiveTitle)
                      }
                      className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                    >
                      <Pencil className="h-4 w-4" />
                      Rename
                    </DropdownMenuItem>
                    {canDelete && canDeleteConversation ? (
                      <DropdownMenuItem
                        onClick={() => onDeleteConversation(conversation._id)}
                        className="gap-2 cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </SidebarMenuItem>
            );
          })}
          {!conversations ? (
            <div className="px-4 py-2 text-sm text-white/30">Loading...</div>
          ) : null}
          {isEmpty ? (
            <div className="px-4 py-2 text-sm text-white/30 italic">
              {SIDEBAR_LABEL_NO_SEARCH_RESULTS}
            </div>
          ) : null}
          {!isSearching && conversations?.length === 0 ? (
            <div className="px-4 py-2 text-sm text-white/30 italic">
              No history yet
            </div>
          ) : null}
        </SidebarMenu>
      </SidebarGroupContent>
    </>
  );
}
