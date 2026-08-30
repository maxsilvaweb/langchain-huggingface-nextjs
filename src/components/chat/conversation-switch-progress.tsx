'use client';

import { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';

/** Thin top progress used while a conversation switch is in flight. */
export function ConversationSwitchProgress() {
  const [value, setValue] = useState(18);

  useEffect(() => {
    const id = window.setInterval(() => {
      setValue((current) => {
        if (current >= 88) return current;
        return Math.min(88, current + Math.max(2, Math.round((88 - current) * 0.18)));
      });
    }, 100);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-50">
      <Progress
        value={value}
        className="h-0.5 rounded-none bg-transparent [&>[data-slot=progress-indicator]]:bg-emerald-400/90"
      />
    </div>
  );
}
