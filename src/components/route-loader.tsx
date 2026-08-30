'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type RouteLoaderProps = {
  className?: string;
  label?: string;
  /** chat = conversation bubbles; page = settings/docs style blocks */
  variant?: 'chat' | 'page';
};

function ChatSkeleton() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-10 md:px-0">
      {/* user */}
      <div className="flex justify-end">
        <div className="w-[72%] max-w-md space-y-2">
          <Skeleton className="ml-auto h-4 w-3/4 rounded-2xl bg-white/10" />
          <Skeleton className="ml-auto h-4 w-1/2 rounded-2xl bg-white/10" />
        </div>
      </div>
      {/* assistant */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
        <div className="w-[80%] max-w-xl space-y-2 pt-1">
          <Skeleton className="h-4 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-4 w-[92%] rounded-2xl bg-white/10" />
          <Skeleton className="h-4 w-4/5 rounded-2xl bg-white/10" />
        </div>
      </div>
      {/* user */}
      <div className="flex justify-end">
        <div className="w-[60%] max-w-sm space-y-2">
          <Skeleton className="ml-auto h-4 w-full rounded-2xl bg-white/10" />
          <Skeleton className="ml-auto h-4 w-2/3 rounded-2xl bg-white/10" />
        </div>
      </div>
      {/* assistant */}
      <div className="flex gap-3">
        <Skeleton className="h-8 w-8 shrink-0 rounded-full bg-white/10" />
        <div className="w-[75%] max-w-lg space-y-2 pt-1">
          <Skeleton className="h-4 w-full rounded-2xl bg-white/10" />
          <Skeleton className="h-4 w-[88%] rounded-2xl bg-white/10" />
          <Skeleton className="h-4 w-3/5 rounded-2xl bg-white/10" />
          <Skeleton className="h-4 w-2/5 rounded-2xl bg-white/10" />
        </div>
      </div>
    </div>
  );
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8">
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-4 w-40 bg-white/10" />
        <Skeleton className="h-3 w-64 bg-white/10" />
        <Skeleton className="mt-2 h-10 w-72 rounded-xl bg-white/10" />
        <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-48 bg-white/10" />
            <Skeleton className="h-3 w-56 bg-white/10" />
          </div>
          <Skeleton className="h-7 w-12 rounded-full bg-white/10" />
        </div>
        <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
      </div>
      <div className="space-y-3 rounded-2xl border border-white/10 bg-white/5 p-5">
        <Skeleton className="h-4 w-32 bg-white/10" />
        <Skeleton className="h-3 w-52 bg-white/10" />
        <Skeleton className="mt-2 h-3 w-full rounded-full bg-white/10" />
        <Skeleton className="h-16 w-full rounded-xl bg-white/10" />
      </div>
    </div>
  );
}

/** Skeleton placeholder for page / conversation transitions. */
export function RouteLoader({
  className,
  label = 'Loading',
  variant = 'chat',
}: RouteLoaderProps) {
  return (
    <div
      className={cn(
        'min-h-screen w-full bg-background',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {variant === 'page' ? <PageSkeleton /> : <ChatSkeleton />}
    </div>
  );
}
