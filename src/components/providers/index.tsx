'use client';

import { ReactNode } from 'react';

import { ClerkProvider } from './ClerkProvider';
import { ConvexClientProvider } from './ConvexProvider';
import { ThemeProvider } from './ThemeProvider';
import { ToasterProvider } from './ToasterProvider';

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
      <ClerkProvider>
        <ConvexClientProvider>
          {children}
          <ToasterProvider />
        </ConvexClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export { ClerkProvider, ConvexClientProvider, ThemeProvider, ToasterProvider };
