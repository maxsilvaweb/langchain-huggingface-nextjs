'use client';

import { ReactNode } from 'react';

import { ClerkProvider } from './ClerkProvider';
import { ConvexClientProvider } from './ConvexProvider';
import { ModelProvider } from './ModelProvider';
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
          <ModelProvider>
            {children}
            <ToasterProvider />
          </ModelProvider>
        </ConvexClientProvider>
      </ClerkProvider>
    </ThemeProvider>
  );
}

export {
  ClerkProvider,
  ConvexClientProvider,
  ModelProvider,
  ThemeProvider,
  ToasterProvider,
};
