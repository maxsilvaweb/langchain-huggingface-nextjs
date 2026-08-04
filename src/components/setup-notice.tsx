import { ArrowRight, Database, KeyRound } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-16">
      <Card className="w-full border-cyan-400/20 bg-zinc-950/80">
        <CardHeader>
          <Badge className="w-fit border-cyan-400/30 bg-cyan-400/10 text-cyan-200">
            Setup required
          </Badge>
          <CardTitle className="text-3xl">Connect Convex and Hugging Face</CardTitle>
          <CardDescription className="max-w-2xl text-base">
            The UI is ready, but the app still needs your Convex deployment URL and Hugging Face
            API key before chat and RAG can run.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="mb-3 flex items-center gap-2 text-zinc-100">
              <Database className="size-4 text-cyan-300" />
              <span className="font-medium">1. Start Convex</span>
            </div>
            <p className="text-sm text-zinc-400">Run `bun run convex:dev` and follow the login/project prompts.</p>
            <p className="mt-3 text-xs text-zinc-500">
              Convex will provision the backend and give you a `NEXT_PUBLIC_CONVEX_URL`.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5">
            <div className="mb-3 flex items-center gap-2 text-zinc-100">
              <KeyRound className="size-4 text-cyan-300" />
              <span className="font-medium">2. Add env vars</span>
            </div>
            <p className="text-sm text-zinc-400">
              Copy `.env.example` to `.env.local` and fill in your Convex URL and Hugging Face API key.
            </p>
            <p className="mt-3 text-xs text-zinc-500">
              You can also swap the default chat or embedding model later through env vars.
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/4 p-5 md:col-span-2">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className="text-sm font-medium text-zinc-100">Then start the app</p>
                <p className="mt-1 text-sm text-zinc-400">
                  Once those values are in place, run `bun dev` and this page will switch to the
                  live Convex + LangChain chat workspace.
                </p>
              </div>
              <ArrowRight className="mt-1 size-5 shrink-0 text-cyan-300" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
