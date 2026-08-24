'use client';

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { AVAILABLE_MODELS } from '@/lib/ai/models';

interface ModelContextValue {
  selectedModelId: string;
  setSelectedModelId: (id: string) => void;
}

const ModelContext = createContext<ModelContextValue | null>(null);

const STORAGE_KEY = 'chat-selected-model';

export function ModelProvider({ children }: { children: ReactNode }) {
  const [selectedModelId, setSelectedModelIdState] = useState(
    AVAILABLE_MODELS[0].id,
  );

  // Load saved model from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && AVAILABLE_MODELS.some((m) => m.id === saved)) {
      setSelectedModelIdState(saved);
    }
  }, []);

  const setSelectedModelId = useCallback((id: string) => {
    setSelectedModelIdState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  return (
    <ModelContext.Provider value={{ selectedModelId, setSelectedModelId }}>
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
