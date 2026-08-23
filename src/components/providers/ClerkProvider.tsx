'use client';

import { ClerkProvider as NextClerkProvider } from '@clerk/nextjs';
import type { ReactNode } from 'react';
import {
  POST_SIGN_IN_REDIRECT_PATH,
  POST_SIGN_UP_REDIRECT_PATH,
  SIGN_IN_PATH,
  SIGN_UP_PATH,
} from '@/lib/globals';
import { clerkAppearance } from './clerk-theme';

type ClerkProviderProps = {
  children: ReactNode;
};

export function ClerkProvider({ children }: ClerkProviderProps) {
  return (
    <NextClerkProvider
      appearance={clerkAppearance}
      dynamic
      signInUrl={SIGN_IN_PATH}
      signUpUrl={SIGN_UP_PATH}
      signInFallbackRedirectUrl={POST_SIGN_IN_REDIRECT_PATH}
      signUpFallbackRedirectUrl={POST_SIGN_UP_REDIRECT_PATH}
    >
      {children}
    </NextClerkProvider>
  );
}
