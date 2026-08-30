'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useQuery } from 'convex/react';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { api } from '@/lib/convex/api';
import { resolveUserPreferences } from '@/lib/user-preferences';

interface ModelContextValue {
  selectedModelId: string;
  /** Current saved default from settings (may differ if user overrode in-chat). */
  defaultModelId: string;
  setSelectedModelId: (id: string) => void;
  /** Apply the settings default — call when starting a new chat. */
  resetToDefaultModel: () => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

const STORAGE_KEY = 'chat-selected-model';

function isValidModelId(id: string | null | undefined): id is string {
  return Boolean(id && AVAILABLE_MODELS.some((m) => m.id === id && !m.disabled));
}

function fallbackModelId(): string {
  return AVAILABLE_MODELS.find((m) => !m.disabled)?.id ?? AVAILABLE_MODELS[0].id;
}

export function ModelProvider({ children }: { children: ReactNode }) {
  const user = useQuery(api.users.me);
  const [selectedModelId, setSelectedModelIdState] = useState(fallbackModelId);
  const [defaultModelId, setDefaultModelId] = useState(fallbackModelId);
  /** Last defaultModelId we applied from Convex — re-apply when settings change. */
  const lastSyncedDefault = useRef<string | null>(null);

  // localStorage fallback before Convex prefs load (overridden once prefs arrive)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isValidModelId(saved)) {
      setSelectedModelIdState(saved);
    }
  }, []);

  // Keep in sync with Convex preferences whenever the saved default changes.
  // Important: do not treat `user === null` as a one-shot hydrate — auth/user
  // can resolve after an initial null and bring real preferences.
  useEffect(() => {
    if (user === undefined) return;

    const prefs = resolveUserPreferences(user?.preferences);
    if (!isValidModelId(prefs.defaultModelId)) return;

    setDefaultModelId(prefs.defaultModelId);

    if (lastSyncedDefault.current === prefs.defaultModelId) return;

    lastSyncedDefault.current = prefs.defaultModelId;
    setSelectedModelIdState(prefs.defaultModelId);
    localStorage.setItem(STORAGE_KEY, prefs.defaultModelId);
  }, [user]);

  const setSelectedModelId = useCallback((id: string) => {
    if (!isValidModelId(id)) return;
    setSelectedModelIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const resetToDefaultModel = useCallback(() => {
    const prefs = resolveUserPreferences(user?.preferences);
    const next = isValidModelId(prefs.defaultModelId)
      ? prefs.defaultModelId
      : defaultModelId;
    if (!isValidModelId(next)) return;
    setSelectedModelIdState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }, [user, defaultModelId]);

  return (
    <ModelContext.Provider
      value={{
        selectedModelId,
        defaultModelId,
        setSelectedModelId,
        resetToDefaultModel,
      }}
    >
      {children}
    </ModelContext.Provider>
  );
}

export function useSelectedModel() {
  const ctx = useContext(ModelContext);
  if (!ctx) {
    throw new Error('useSelectedModel must be used within ModelProvider');
  }
  return ctx;
}
