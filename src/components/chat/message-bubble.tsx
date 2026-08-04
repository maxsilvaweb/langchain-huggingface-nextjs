import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react';

export interface MessageBubbleProps {
  message: {
    body: string;
    author: 'user' | 'ai';
    _id: string;
    _creationTime: number;
  };
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.author === 'user';

  return (
    <div
      className={cn(
        'flex w-full mb-6 animate-in fade-in slide-in-from-bottom-2 duration-300',
        isUser ? 'justify-end' : 'justify-start',
      )}
    >
      <div
        className={cn(
          'flex max-w-[85%] gap-3',
          isUser ? 'flex-row-reverse' : 'flex-row',
        )}
      >
        {/* Avatar Placeholder */}
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm',
            isUser
              ? 'bg-blue-600 text-blue-50 border-blue-700/20'
              : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        {/* Bubble Content */}
        <div
          className={cn(
            'flex flex-col gap-1',
            isUser ? 'items-end' : 'items-start',
          )}
        >
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 shadow-sm ring-1 ring-inset',
              isUser
                ? 'bg-blue-600 text-blue-50 ring-blue-700/10 rounded-tr-none'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-100 ring-emerald-600/10 rounded-tl-none',
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none break-words leading-relaxed">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.body}
              </ReactMarkdown>
            </div>
          </div>

          <span className="text-[10px] font-medium text-muted-foreground/60 px-1 uppercase tracking-wider">
            {new Date(message._creationTime).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    </div>
  );
}
