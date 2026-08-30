'use client';

import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { useNavigationLoading } from '@/components/providers/NavigationLoadingProvider';
import { getActiveChatHref } from '@/lib/chat-navigation';

type PageHeaderProps = {
  title: string;
  description: ReactNode;
  actions?: ReactNode;
  /** Override back target. Defaults to the active conversation thread. */
  backHref?: string;
};

export function PageHeader({
  title,
  description,
  actions,
  backHref,
}: PageHeaderProps) {
  const router = useRouter();
  const { startNavigation } = useNavigationLoading();

  return (
    <header className="sticky top-0 z-50 border-b border-white/10 bg-background/95 backdrop-blur-xl">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const href = backHref ?? getActiveChatHref();
              startNavigation(href);
              router.push(href);
            }}
            className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Back to chat"
            title="Back to chat"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            <p className="text-sm text-white/50">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}
