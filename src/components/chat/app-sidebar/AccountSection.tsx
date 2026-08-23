'use client';

import { SignInButton, UserButton } from '@clerk/nextjs';
import { LogIn } from 'lucide-react';
import * as React from 'react';
import { AUTH_SIGN_IN_LABEL } from '@/lib/locale';

interface AccountSectionProps {
  clerkLoaded: boolean;
  isSignedIn: boolean;
  displayName?: string | null;
  email?: string | null;
  accountRowRef: React.RefObject<HTMLDivElement | null>;
  onActivate: (target: EventTarget | null) => void;
}

export function AccountSection({
  clerkLoaded,
  isSignedIn,
  displayName,
  email,
  accountRowRef,
  onActivate,
}: AccountSectionProps) {
  if (!clerkLoaded) {
    return <div className="h-8 w-48 animate-pulse rounded-md bg-white/5" />;
  }

  if (!isSignedIn) {
    return (
      <SignInButton mode="redirect">
        <button
          type="button"
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogIn className="h-3.5 w-3.5" />
          {AUTH_SIGN_IN_LABEL}
        </button>
      </SignInButton>
    );
  }

  return (
    <div
      ref={accountRowRef}
      role="button"
      tabIndex={0}
      className="flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2 text-white/70 transition-colors hover:bg-white/5 hover:text-white"
      onClick={(event) => onActivate(event.target)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onActivate(event.target);
        }
      }}
      title="Open account menu"
      aria-label="Open account menu"
    >
      <div data-account-avatar>
        <UserButton
          appearance={{
            elements: {
              userButtonAvatarBox:
                'h-8 w-8 border border-white/10 shadow-none',
            },
          }}
        />
      </div>
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-xs font-medium text-white">
          {displayName || 'Signed in'}
        </span>
        <span className="truncate text-[10px] text-white/45">
          {email || 'Clerk account'}
        </span>
      </div>
    </div>
  );
}
