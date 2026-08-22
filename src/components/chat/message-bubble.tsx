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
        <div
          className={cn(
            'flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-full border shadow-sm backdrop-blur-md transition-all duration-200',
            isUser
              ? 'bg-zinc-800/60 dark:bg-white/10 text-zinc-100 dark:text-white border-zinc-700/60 dark:border-white/10 shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]'
              : 'bg-emerald-100/90 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40 shadow-[0_1px_0_rgba(255,255,255,0.15)_inset] backdrop-blur-sm',
          )}
        >
          {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
        </div>

        <div
          className={cn(
            'flex flex-col gap-1',
            isUser ? 'items-end' : 'items-start',
          )}
        >
          <div
            className={cn(
              'rounded-2xl px-4 py-2.5 ring-1 ring-inset backdrop-blur-sm transition-all duration-200',
              isUser
                ? 'bg-zinc-100/80 dark:bg-white/6 text-zinc-900 dark:text-zinc-100 ring-zinc-200/60 dark:ring-white/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.4)_inset] dark:shadow-[0_1px_0_rgba(255,255,255,0.04)_inset] rounded-tr-md border border-zinc-200/40 dark:border-white/7'
                : 'bg-emerald-50/90 dark:bg-emerald-950/25 text-emerald-900 dark:text-emerald-100 ring-emerald-600/8 dark:ring-emerald-500/12 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_1px_0_rgba(255,255,255,0.5)_inset] dark:shadow-[0_1px_0_rgba(255,255,255,0.03)_inset] rounded-tl-md border border-emerald-100/60 dark:border-emerald-800/20',
            )}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none wrap-break-word leading-relaxed text-[15px]">
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
