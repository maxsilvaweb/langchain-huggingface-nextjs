'use client';

import { useAuth } from '@clerk/nextjs';
import { useMutation, useQuery } from 'convex/react';
import { Info, Loader2 } from 'lucide-react';
import { PageRouteLoader } from '@/components/page-progress-loader';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import { ModelSelector } from '@/components/chat/model-selector';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useSelectedModel } from '@/components/providers/ModelProvider';
import { api } from '@/lib/convex/api';
import {
  DEFAULT_USER_PREFERENCES,
  resolveUserPreferences,
  type UserPreferences,
} from '@/lib/user-preferences';
import { cn } from '@/lib/utils';

function SettingInfo({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 flex gap-2.5 rounded-xl border border-sky-200/80 bg-sky-50 px-3.5 py-3 text-xs leading-relaxed text-sky-950 dark:border-sky-500/20 dark:bg-sky-950/40 dark:text-sky-100/90">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-sky-600 dark:text-sky-400" />
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const user = useQuery(api.users.me);
  const updatePreferences = useMutation(api.users.updatePreferences);
  const { setSelectedModelId } = useSelectedModel();

  const resolved = useMemo(
    () => resolveUserPreferences(user?.preferences),
    [user?.preferences],
  );

  const [draft, setDraft] = useState<UserPreferences>(DEFAULT_USER_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace('/sign-in');
    }
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user === undefined) return;
    setDraft(resolved);
    setHydrated(true);
  }, [user, resolved]);

  const isDirty =
    draft.defaultModelId !== resolved.defaultModelId ||
    draft.useRag !== resolved.useRag ||
    draft.temperature !== resolved.temperature ||
    draft.customInstructions !== resolved.customInstructions;

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updatePreferences({
        preferences: {
          defaultModelId: draft.defaultModelId,
          useRag: draft.useRag,
          temperature: draft.temperature,
          customInstructions: draft.customInstructions.trim(),
        },
      });
      setSelectedModelId(draft.defaultModelId);
      toast.success('Settings saved');
    } catch (error) {
      toast.error('Failed to save settings', {
        description: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isLoaded || !isSignedIn || !hydrated) {
    return <PageRouteLoader label="Loading settings" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader
        title="Settings"
        description="Defaults for your chats across devices"
        actions={
          <>
            <Button
              type="button"
              variant="ghost"
              disabled={!isDirty || isSaving}
              onClick={() => setDraft(resolved)}
              className="cursor-pointer text-white/60 hover:bg-white/10 hover:text-white"
            >
              Reset
            </Button>
            <Button
              type="button"
              disabled={!isDirty || isSaving}
              onClick={() => void handleSave()}
              className="cursor-pointer gap-2 bg-emerald-600 text-white hover:bg-emerald-500"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving
                </>
              ) : (
                'Save settings'
              )}
            </Button>
          </>
        }
      />

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-white">Default model</h2>
          <p className="mt-1 text-xs text-white/50">
            Which AI model starts selected when you open chat.
          </p>
          <div className="mt-4">
            <ModelSelector
              selectedModel={draft.defaultModelId}
              onModelChange={(id) =>
                setDraft((prev) => ({ ...prev, defaultModelId: id }))
              }
              triggerClassName="w-full max-w-full sm:w-[320px]"
              showToast={false}
            />
          </div>
          <SettingInfo>
            <p>
              This is your preferred model across devices. In any conversation
              you can still switch models from the chat footer without changing
              this default.
            </p>
            <p>
              Different providers (OpenAI, Google, Hugging Face, etc.) vary in
              speed, cost, and reasoning quality — pick what fits your usual
              workload.
            </p>
          </SettingInfo>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-white">
                Use knowledge base (RAG)
              </h2>
              <p className="mt-1 text-xs text-white/50">
                Include your uploaded documents when the AI answers.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={draft.useRag}
              onClick={() =>
                setDraft((prev) => ({ ...prev, useRag: !prev.useRag }))
              }
              className={cn(
                'relative h-7 w-12 shrink-0 rounded-full transition-colors',
                draft.useRag ? 'bg-emerald-500' : 'bg-zinc-600',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform',
                  draft.useRag && 'translate-x-5',
                )}
              />
            </button>
          </div>
          <SettingInfo>
            <p>
              When on, each message searches your RAG Documents for relevant
              chunks and injects them into the prompt so answers can cite your
              own material.
            </p>
            <p>
              Turn it off for general chat with no document lookup — faster, and
              ignores the knowledge base even if you have files uploaded.
            </p>
          </SettingInfo>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-medium text-white">Temperature</h2>
              <p className="mt-1 text-xs text-white/50">
                How random or deterministic replies are.
              </p>
            </div>
            <span className="font-mono text-sm tabular-nums text-white/70">
              {draft.temperature.toFixed(1)}
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={draft.temperature}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                temperature: Number(event.target.value),
              }))
            }
            className="mt-4 w-full accent-emerald-500"
            aria-label="Temperature"
          />
          <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wide text-white/40">
            <span>Precise</span>
            <span>Creative</span>
          </div>
          <SettingInfo>
            <p>
              Near 0, answers stay focused and repeatable — good for facts, code,
              and RAG Q&amp;A.
            </p>
            <p>
              Near 1–2, replies vary more and can feel more creative — useful for
              brainstorming, but less reliable for exact details.
            </p>
          </SettingInfo>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h2 className="text-sm font-medium text-white">Custom instructions</h2>
          <p className="mt-1 text-xs text-white/50">
            Standing guidance the model should follow on every reply.
          </p>
          <Textarea
            value={draft.customInstructions}
            onChange={(event) =>
              setDraft((prev) => ({
                ...prev,
                customInstructions: event.target.value.slice(0, 2000),
              }))
            }
            placeholder="e.g. Prefer concise answers. Cite sources when using the knowledge base."
            className="mt-4 min-h-28 rounded-xl border-white/10 bg-black/30"
            maxLength={2000}
          />
          <p className="mt-2 text-right text-[10px] text-white/40">
            {draft.customInstructions.length}/2000
          </p>
          <SettingInfo>
            <p>
              These notes are appended to the system prompt for all of your chats
              — tone, format, audience, or rules like “always cite sources.”
            </p>
            <p>
              Keep them short and specific. Leave blank to use the app’s default
              assistant behavior only.
            </p>
          </SettingInfo>
        </section>
      </main>
    </div>
  );
}
