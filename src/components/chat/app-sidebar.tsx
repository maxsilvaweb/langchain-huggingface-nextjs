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
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { useParams, useRouter } from 'next/navigation';
import { useChatSession } from '@/hooks/use-chat-session';
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
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ThemeToggle } from '../theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

export function AppSidebar() {
  const conversations = useQuery(api.conversations.list);
  const emptyConversationId = useQuery(api.conversations.getFirstEmpty);
  const removeConversation = useMutation(api.conversations.remove);
  const updateTitle = useMutation(api.conversations.updateTitle);

  const params = useParams();
  const router = useRouter();
  const { startNewSession } = useChatSession({ autoCreate: false });
  const conversationId = params?.conversationId as string;

  const [renamingId, setRenamingId] = React.useState<string | null>(null);
  const [newTitle, setNewTitle] = React.useState('');

  const handleNewChat = async () => {
    try {
      // Safeguard: If there's already an empty conversation, just go to it
      if (emptyConversationId) {
        router.push(`/chat/${emptyConversationId}`);
        return;
      }

      const newId = await startNewSession();
      router.push(`/chat/${newId}`);
    } catch (err) {
      console.error('Failed to create new chat:', err);
      toast.error('Failed to create new chat');
    }
  };

  const handleSelectConversation = (id: string) => {
    router.push(`/chat/${id}`);
  };

  const handleDelete = async (id: string) => {
    try {
      await removeConversation({ conversationId: id as any });
      if (conversationId === id) {
        router.push('/');
      }
      toast.success('Conversation deleted');
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      toast.error('Failed to delete conversation');
    }
  };

  const handleRename = async () => {
    if (!renamingId || !newTitle.trim()) return;
    try {
      await updateTitle({
        conversationId: renamingId as any,
        title: newTitle.trim(),
      });
      setRenamingId(null);
      setNewTitle('');
      toast.success('Conversation renamed');
    } catch (err) {
      console.error('Failed to rename conversation:', err);
      toast.error('Failed to rename conversation');
    }
  };

  return (
    <Sidebar className="border-r border-white/10 bg-black/20 backdrop-blur-xl">
      <SidebarHeader className="p-4">
        <Button
          onClick={handleNewChat}
          className="w-full justify-start gap-2 bg-white/5 hover:bg-white/10 border-white/10 text-white"
          variant="outline"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </Button>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-white/40 px-4 py-2 text-xs font-medium uppercase tracking-wider">
            Recent Chats
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {conversations?.map((conv) => (
                <SidebarMenuItem key={conv._id}>
                  <SidebarMenuButton
                    onClick={() => handleSelectConversation(conv._id)}
                    isActive={conversationId === conv._id}
                    className={`w-full justify-start gap-3 px-4 py-2 text-sm transition-colors ${
                      conversationId === conv._id
                        ? 'bg-white/10 text-white'
                        : 'text-white/70 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate flex-1">
                      {conv.title || 'New Chat'}
                    </span>
                  </SidebarMenuButton>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <SidebarMenuAction className="text-white/40 hover:text-white transition-colors">
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
                          setNewTitle(conv.title || 'New Chat');
                        }}
                        className="gap-2 cursor-pointer focus:bg-white/10 focus:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                        Rename
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(conv._id)}
                        className="gap-2 cursor-pointer text-red-400 focus:bg-red-400/10 focus:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </SidebarMenuItem>
              ))}
              {!conversations && (
                <div className="px-4 py-2 text-sm text-white/30">
                  Loading...
                </div>
              )}
              {conversations?.length === 0 && (
                <div className="px-4 py-2 text-sm text-white/30 italic">
                  No history yet
                </div>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <Dialog
        open={!!renamingId}
        onOpenChange={(open) => !open && setRenamingId(null)}
      >
        <DialogContent className="bg-zinc-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle>Rename Conversation</DialogTitle>
          </DialogHeader>
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
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRenamingId(null)}
              className="text-white/70 hover:text-white hover:bg-white/5"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRename}
              className="bg-white text-black hover:bg-white/90"
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
