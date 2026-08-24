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
    <SidebarGroupContent className="px-2 pb-3">
      <SidebarMenu className="gap-1">
        {displayItems?.map((conversation) => {
          const effectiveTitle =
            conversation.title || DEFAULT_CONVERSATION_TITLE;
          const canDeleteConversation = Boolean(conversation.title?.trim());
          const isActive = activeConversationId === conversation._id;

          return (
            <SidebarMenuItem key={conversation._id}>
              <SidebarMenuButton
                onClick={() => onSelectConversation(conversation._id)}
                isActive={isActive}
                className={`w-full justify-start gap-3 px-3 py-2.5 text-sm rounded-lg transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-white/12 text-white shadow-sm'
                    : 'text-white/60 hover:bg-white/8 hover:text-white/90'
                }`}
              >
                <MessageSquare className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : ''}`} />
                <span className="truncate flex-1">{effectiveTitle}</span>
              </SidebarMenuButton>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuAction
                    className="opacity-0 group-hover/menu-item:opacity-100 text-white/40 hover:text-white hover:bg-white/10 rounded-md transition-all duration-150 cursor-pointer right-2 top-2"
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
                  className="w-44 bg-zinc-900/95 backdrop-blur-sm border-white/10 text-white shadow-xl"
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
          <div className="px-3 py-3 text-sm text-white/30">Loading...</div>
        ) : null}
        {isEmpty ? (
          <div className="px-3 py-3 text-sm text-white/30 italic">
            {SIDEBAR_LABEL_NO_SEARCH_RESULTS}
          </div>
        ) : null}
        {!isSearching && conversations?.length === 0 ? (
          <div className="px-3 py-3 text-sm text-white/30 italic">
            No history yet
          </div>
        ) : null}
      </SidebarMenu>
    </SidebarGroupContent>
  );
}
