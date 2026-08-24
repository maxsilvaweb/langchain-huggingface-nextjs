'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SetupNotice } from '@/components/setup-notice';
import { APP_DESCRIPTION, APP_NAME } from '@/lib/locale';

export default function Home() {
  const router = useRouter();
  const { isLoaded: authLoaded, isSignedIn } = useAuth();
  const hasEnv = !!process.env.NEXT_PUBLIC_CONVEX_URL;

  useEffect(() => {
    if (!authLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace('/sign-in');
      return;
    }

    if (hasEnv) {
      router.replace('/chat');
    }
  }, [authLoaded, hasEnv, isSignedIn, router]);

  if (!authLoaded || !isSignedIn) {
    return null;
  }

  if (!hasEnv) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 md:p-24 bg-background">
        <div className="z-10 w-full max-w-4xl flex flex-col gap-10">
          <div className="flex flex-row justify-between items-start gap-4">
            <div className="text-left space-y-4">
              <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-foreground">
                {APP_NAME}
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {APP_DESCRIPTION}
              </p>
            </div>
          </div>
          <SetupNotice />
        </div>
      </main>
    );
  }

  return null;
}
