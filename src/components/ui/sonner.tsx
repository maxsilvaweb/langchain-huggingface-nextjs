'use client';

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
        ),
        info: <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />,
        warning: (
          <TriangleAlertIcon className="size-4 text-amber-600 dark:text-amber-400" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-600 dark:text-red-400" />
        ),
        loading: (
          <Loader2Icon className="size-4 animate-spin text-zinc-600 dark:text-zinc-400" />
        ),
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: '!rounded-2xl !shadow-2xl !p-4 !backdrop-blur-xl',
          success:
            '!bg-emerald-50 !text-emerald-900 !border !border-emerald-200 dark:!bg-emerald-950/60 dark:!text-emerald-100 dark:!border-emerald-800',
          error:
            '!bg-red-50 !text-red-900 !border !border-red-200 dark:!bg-red-950/60 dark:!text-red-100 dark:!border-red-800',
          warning:
            '!bg-amber-50 !text-amber-900 !border !border-amber-200 dark:!bg-amber-950/60 dark:!text-amber-100 dark:!border-amber-800',
          info: '!bg-blue-50 !text-blue-900 !border !border-blue-200 dark:!bg-blue-950/60 dark:!text-blue-100 dark:!border-blue-800',
          title: '!font-medium',
          description: '!opacity-80 !text-sm',
          content: '!p-0',
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
