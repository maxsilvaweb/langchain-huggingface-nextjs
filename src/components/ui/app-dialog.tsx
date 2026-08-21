'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ActionButton } from './action-button';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';

type DialogTheme =
  'default' | 'danger' | 'green' | 'red' | 'blue' | 'amber' | 'zinc';
type DialogSize = 'sm' | 'md' | 'lg';

interface AppDialogFooterProps {
  /** Show Cancel button */
  showCancel?: boolean;
  /** Cancel button text */
  cancelText?: string;
  /** Show Confirm button */
  showConfirm?: boolean;
  /** Confirm button text */
  confirmText?: string;
  /** Confirm button theme (drives color + icon) */
  confirmTheme?: DialogTheme;
  /** Icon to use for confirm button */
  confirmIcon?: LucideIcon;
  /** Loading state for confirm button */
  confirmLoading?: boolean;
  /** On confirm click */
  onConfirm?: () => void;
  /** On cancel click (defaults to setOpen(false)) */
  onCancel?: () => void;
  /** Additional custom content to append before buttons */
  children?: React.ReactNode;
  /** Additional class names for footer */
  className?: string;
}

export function AppDialogFooter({
  showCancel = true,
  cancelText = 'Cancel',
  showConfirm = true,
  confirmText = 'Confirm',
  confirmTheme = 'default',
  confirmIcon,
  confirmLoading,
  onConfirm,
  onCancel,
  children,
  className,
}: AppDialogFooterProps) {
  return (
    <DialogFooter className={cn('mt-4', className)}>
      {children}
      <div className="flex w-full items-center justify-end gap-2">
        {showCancel && (
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={confirmLoading}
            className="text-white/70 hover:text-white hover:bg-white/5 cursor-pointer"
          >
            {cancelText}
          </Button>
        )}
        {showConfirm && (
          <ActionButton
            icon={confirmIcon}
            label={confirmText}
            theme={
              confirmTheme === 'danger'
                ? 'red'
                : confirmTheme === 'default'
                  ? 'zinc'
                  : confirmTheme
            }
            onClick={onConfirm}
            disabled={confirmLoading}
            className="!w-auto !shadow-none"
          />
        )}
      </div>
    </DialogFooter>
  );
}

interface AppDialogProps {
  /** Controlled open state */
  open: boolean;
  /** Open state change handler */
  onOpenChange: (open: boolean) => void;
  /** Dialog title */
  title?: React.ReactNode;
  /** Dialog description (subtle grey text under title) */
  description?: React.ReactNode;
  /** Body content */
  children?: React.ReactNode;
  /** Size */
  size?: DialogSize;
  /** Optional footer config for easy "Confirm/Cancel" bar. If omitted, fully custom. */
  footer?: React.ReactNode;
  /** Optional content classes */
  className?: string;
}

const sizeClasses: Record<DialogSize, string> = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
};

export function AppDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
  size = 'md',
  footer,
  className,
}: AppDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'bg-zinc-900 border-white/10 text-white backdrop-blur-2xl',
          sizeClasses[size],
          className,
        )}
      >
        {(title || description) && (
          <DialogHeader>
            {title && <DialogTitle>{title}</DialogTitle>}
            {description && (
              <DialogDescription className="text-white/60">
                {description}
              </DialogDescription>
            )}
          </DialogHeader>
        )}
        {children}
        {footer}
      </DialogContent>
    </Dialog>
  );
}
