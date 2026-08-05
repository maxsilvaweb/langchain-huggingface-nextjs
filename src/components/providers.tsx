'use client';

import { ReactNode } from 'react';
import { ThemeProvider } from './theme-provider';
import { ConvexClientProvider } from './convex-provider';

type ProvidersProps = {
  children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem
      disableTransitionOnChange
    >
      <ConvexClientProvider>
        {children}
      </ConvexClientProvider>
    </ThemeProvider>
  );
}
