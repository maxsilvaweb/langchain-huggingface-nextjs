'use client';

import { ReactNode } from 'react';

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
      <ConvexClientProvider>
        {children}
        <ToasterProvider />
      </ConvexClientProvider>
    </ThemeProvider>
  );
}

export { ConvexClientProvider, ThemeProvider, ToasterProvider };
