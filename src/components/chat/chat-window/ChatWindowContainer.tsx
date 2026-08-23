'use client';

import type React from 'react';

interface ChatWindowContainerProps {
  children: React.ReactNode;
}

export function ChatWindowContainer({
  children,
}: ChatWindowContainerProps) {
  return (
    <div className="w-full relative flex flex-col flex-1 min-h-0 bg-background">
      {children}
    </div>
  );
}
