'use client';

import { ReactNode } from 'react';

import { ClerkProvider } from './ClerkProvider';
import { ConvexClientProvider } from './ConvexProvider';
import { ModelProvider } from './ModelProvider';
import { NavigationLoadingProvider } from './NavigationLoadingProvider';
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
            <NavigationLoadingProvider>
              {children}
              <ToasterProvider />
            </NavigationLoadingProvider>
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
  NavigationLoadingProvider,
  ThemeProvider,
  ToasterProvider,
};
