'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import { RouteLoader } from '@/components/route-loader';
import { PageRouteLoader } from '@/components/page-progress-loader';

type LoaderVariant = 'chat' | 'page';

type NavigationLoadingContextValue = {
  isNavigating: boolean;
  startNavigation: (destinationHref?: string) => void;
};

const NavigationLoadingContext =
  createContext<NavigationLoadingContextValue | null>(null);

function resolveVariant(href?: string): LoaderVariant {
  if (!href) return 'chat';
  if (href.startsWith('/documents') || href.startsWith('/settings')) {
    return 'page';
  }
  return 'chat';
}

function resolvePageLabel(href?: string): string {
  if (href?.startsWith('/documents')) return 'Loading knowledge base';
  if (href?.startsWith('/settings')) return 'Loading settings';
  return 'Loading';
}

export function NavigationLoadingProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const [pendingVariant, setPendingVariant] = useState<LoaderVariant>('chat');
  const [pendingLabel, setPendingLabel] = useState('Loading');

  useEffect(() => {
    setIsNavigating(false);
  }, [pathname]);

  const startNavigation = useCallback((destinationHref?: string) => {
    setPendingVariant(resolveVariant(destinationHref));
    setPendingLabel(resolvePageLabel(destinationHref));
    setIsNavigating(true);
  }, []);

  return (
    <NavigationLoadingContext.Provider
      value={{ isNavigating, startNavigation }}
    >
      {children}
      {isNavigating ? (
        <div
          className="fixed inset-0 z-[100] overflow-y-auto bg-background"
          role="status"
          aria-live="polite"
          aria-label={pendingLabel}
        >
          {pendingVariant === 'page' ? (
            <PageRouteLoader label={pendingLabel} />
          ) : (
            <RouteLoader
              className="min-h-0"
              variant="chat"
              label="Loading page"
            />
          )}
        </div>
      ) : null}
    </NavigationLoadingContext.Provider>
  );
}

export function useNavigationLoading() {
  const ctx = useContext(NavigationLoadingContext);
  if (!ctx) {
    return {
      isNavigating: false,
      startNavigation: (_destinationHref?: string) => undefined,
    };
  }
  return ctx;
}
