import { AVAILABLE_MODELS } from '@/lib/ai/models';

export type UserPreferences = {
  defaultModelId: string;
  useRag: boolean;
  temperature: number;
  customInstructions: string;
};

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  defaultModelId: AVAILABLE_MODELS.find((m) => !m.disabled)?.id ?? AVAILABLE_MODELS[0].id,
  useRag: true,
  temperature: 0.7,
  customInstructions: '',
};

export function resolveUserPreferences(
  preferences?: Partial<UserPreferences> | null,
): UserPreferences {
  const defaultModelId =
    preferences?.defaultModelId &&
    AVAILABLE_MODELS.some((m) => m.id === preferences.defaultModelId && !m.disabled)
      ? preferences.defaultModelId
      : DEFAULT_USER_PREFERENCES.defaultModelId;

  const temperature =
    typeof preferences?.temperature === 'number'
      ? Math.min(2, Math.max(0, preferences.temperature))
      : DEFAULT_USER_PREFERENCES.temperature;

  return {
    defaultModelId,
    useRag: preferences?.useRag ?? DEFAULT_USER_PREFERENCES.useRag,
    temperature,
    customInstructions: (preferences?.customInstructions ?? '').slice(0, 2000),
  };
}
