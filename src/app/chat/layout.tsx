import { ChatShell } from '@/components/chat/chat-shell';

export const dynamic = 'force-dynamic';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ChatShell>{children}</ChatShell>;
}
