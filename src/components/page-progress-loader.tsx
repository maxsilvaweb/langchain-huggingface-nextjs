'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type PageProgressLoaderProps = {
  className?: string;
  label?: string;
};

/**
 * Indeterminate-style progress for page loads (Settings, Knowledge Base, etc.).
 * Animates toward ~90% while waiting, then holds until the parent unmounts it.
 */
export function PageProgressLoader({
  className,
  label = 'Loading',
}: PageProgressLoaderProps) {
  const [value, setValue] = useState(8);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setValue((current) => {
        if (current >= 92) return current;
        const step = Math.max(1, Math.round((92 - current) * 0.12));
        return Math.min(92, current + step);
      });
    }, 180);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-3 px-4 py-16',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="w-full max-w-sm space-y-2">
        <div className="flex items-center justify-between text-xs text-white/50">
          <span>{label}</span>
          <span className="tabular-nums">{value}%</span>
        </div>
        <Progress value={value} className="h-2" />
      </div>
    </div>
  );
}

type PageRouteLoaderProps = {
  className?: string;
  label?: string;
  /** Show sticky header skeleton (matches PageHeader layout). */
  showHeader?: boolean;
};

/**
 * Full-page loading shell: optional header skeleton + progress bar.
 * Used by route `loading.tsx` files and the navigation overlay.
 */
export function PageRouteLoader({
  className,
  label = 'Loading',
  showHeader = true,
}: PageRouteLoaderProps) {
  return (
    <div className={cn('min-h-screen bg-background', className)}>
      {showHeader ? (
        <div className="sticky top-0 z-50 border-b border-white/10 bg-background/95 px-4 py-4 backdrop-blur-xl">
          <div className="mx-auto flex max-w-4xl items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-md bg-white/10" />
            <div className="space-y-2">
              <div className="h-4 w-36 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-48 animate-pulse rounded bg-white/10" />
            </div>
          </div>
        </div>
      ) : null}
      <PageProgressLoader className="min-h-[50vh]" label={label} />
    </div>
  );
}
