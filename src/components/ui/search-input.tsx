'use client';

import * as React from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, isApplePlatform, isEditableEventTarget } from '@/lib/utils';

interface SearchInputProps extends Omit<
  React.ComponentProps<typeof Input>,
  'onChange' | 'type' | 'value'
> {
  value: string;
  onChange: (next: string) => void;
  onClear?: () => void;
  enableFocusShortcut?: boolean;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  clearLabel?: string;
  wrapperClassName?: string;
}

export function SearchInput({
  value,
  onChange,
  onClear,
  enableFocusShortcut = true,
  inputRef,
  clearLabel = 'Clear search',
  wrapperClassName,
  className,
  placeholder,
  ...props
}: SearchInputProps) {
  const internalRef = React.useRef<HTMLInputElement | null>(null);

  const setRef = React.useCallback(
    (node: HTMLInputElement | null) => {
      internalRef.current = node;

      if (inputRef) {
        inputRef.current = node;
      }
    },
    [inputRef],
  );

  const focusInput = React.useCallback(() => {
    internalRef.current?.focus();
    internalRef.current?.select();
  }, []);

  React.useEffect(() => {
    if (!enableFocusShortcut) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.isComposing) return;
      if (isEditableEventTarget(event.target)) return;

      const primaryModifier =
        typeof navigator !== 'undefined' && isApplePlatform(navigator)
          ? event.metaKey
          : event.ctrlKey;

      if (!primaryModifier || event.shiftKey || event.altKey) return;
      if (event.key.toLowerCase() !== 'f') return;

      event.preventDefault();
      focusInput();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [enableFocusShortcut, focusInput]);

  const handleClear = React.useCallback(() => {
    onChange('');
    onClear?.();
    focusInput();
  }, [focusInput, onChange, onClear]);

  return (
    <div
      className={cn(
        'group relative flex h-10 w-full items-center gap-3 border-0 border-b border-white/10 px-1 pr-3 transition-colors hover:border-white/20 focus-within:border-emerald-400/45',
        wrapperClassName,
      )}
    >
      <Search
        className="h-4 w-4 shrink-0 text-white/40 transition-colors group-focus-within:text-white/70"
        aria-hidden="true"
      />
      <Input
        ref={setRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cn(
          'h-full appearance-none border-0 bg-transparent! px-0 py-0 text-sm text-white shadow-none placeholder:text-white/35 focus-visible:ring-0 [&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none',
          className,
        )}
        aria-label={placeholder}
        {...props}
      />
      {value ? (
        <button
          type="button"
          onClick={handleClear}
          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-white/40 transition-colors hover:bg-white/5 hover:text-white"
          aria-label={clearLabel}
          title={clearLabel}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : null}
    </div>
  );
}
