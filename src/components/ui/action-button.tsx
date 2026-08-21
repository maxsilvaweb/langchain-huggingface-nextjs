'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type ThemeColor = 'green' | 'red' | 'blue' | 'amber' | 'zinc';

type ButtonProps = React.ComponentProps<typeof Button>;

interface ActionButtonProps extends Omit<ButtonProps, 'variant'> {
  icon?: LucideIcon;
  label: string;
  theme?: ThemeColor;
  className?: string;
}

const themeStyles: Record<ThemeColor, {
  container: string;
  iconBox: string;
  icon: string;
}> = {
  green: {
    container: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-100 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50',
    iconBox: 'bg-emerald-100/50 dark:bg-emerald-800/30',
    icon: 'text-emerald-700 dark:text-emerald-300',
  },
  red: {
    container: 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-100 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/50',
    iconBox: 'bg-red-100/50 dark:bg-red-800/30',
    icon: 'text-red-700 dark:text-red-300',
  },
  blue: {
    container: 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-100 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/50',
    iconBox: 'bg-blue-100/50 dark:bg-blue-800/30',
    icon: 'text-blue-700 dark:text-blue-300',
  },
  amber: {
    container: 'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-100 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50',
    iconBox: 'bg-amber-100/50 dark:bg-amber-800/30',
    icon: 'text-amber-700 dark:text-amber-300',
  },
  zinc: {
    container: 'bg-zinc-50 dark:bg-zinc-900/60 text-zinc-900 dark:text-zinc-100 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800/50',
    iconBox: 'bg-zinc-200/50 dark:bg-zinc-700/30',
    icon: 'text-zinc-700 dark:text-zinc-300',
  },
};

export function ActionButton({
  icon: Icon,
  label,
  theme = 'green',
  className,
  disabled,
  ...props
}: ActionButtonProps) {
  const styles = themeStyles[theme];

  return (
    <Button
      variant="outline"
      disabled={disabled}
      className={cn(
        'w-full justify-start gap-3 cursor-pointer shadow-lg px-1',
        'transition-all duration-200',
        styles.container,
        disabled && 'opacity-60 cursor-not-allowed pointer-events-none',
        className,
      )}
      {...props}
    >
      {Icon && (
        <span className={cn('h-6 w-6 rounded-lg flex items-center justify-center', styles.iconBox)}>
          <Icon className={cn('h-3.5 w-3.5', styles.icon)} />
        </span>
      )}
      <span className="translate-y-[1px] font-medium">{label}</span>
    </Button>
  );
}
