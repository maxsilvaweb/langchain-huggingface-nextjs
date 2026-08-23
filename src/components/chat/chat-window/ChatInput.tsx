'use client';

import type React from 'react';
import { Loader2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatInputProps {
  input: string;
  disabled: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => Promise<void>;
}

export function ChatInput({
  input,
  disabled,
  onInputChange,
  onSubmit,
}: ChatInputProps) {
  const handleKeyDown = async (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      await onSubmit();
    }
  };

  return (
    <div className="relative w-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shadow-lg focus-within:ring-2 focus-within:ring-zinc-400/40 transition-all">
      <Textarea
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Message..."
        disabled={disabled}
        rows={3}
        className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[100px] md:min-h-[120px] px-4 md:px-5 pt-3 pb-4 pr-[4.5rem] resize-y text-sm md:text-[15px] leading-relaxed rounded-2xl placeholder:text-zinc-500/80"
      />

      <Button
        type="submit"
        size="icon"
        disabled={disabled || !input.trim()}
        className="group absolute right-3 bottom-3 h-10 w-10 rounded-xl cursor-pointer border border-emerald-700/40 bg-emerald-900/50 text-emerald-200 hover:bg-emerald-700/70 hover:text-white hover:border-emerald-500/60 hover:shadow-2xl hover:shadow-emerald-500/20 hover:brightness-110 hover:scale-[1.04] hover:-translate-y-0.5 active:scale-[0.97] active:translate-y-0 active:brightness-95 shadow-lg shadow-emerald-900/20 backdrop-blur-sm transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 disabled:hover:translate-y-0 disabled:hover:brightness-100"
        style={{
          cursor: disabled || !input.trim() ? 'default' : 'pointer',
        }}
        aria-label="Send message"
        title="Send message"
      >
        {disabled ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-hover:-translate-x-0.5 group-active:translate-y-0 group-active:translate-x-0" />
        )}
      </Button>
    </div>
  );
}
