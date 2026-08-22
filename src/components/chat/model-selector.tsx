'use client';

import { Bot } from 'lucide-react';
import { AVAILABLE_MODELS } from '@/lib/ai/models';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  disabled?: boolean;
  className?: string;
  triggerClassName?: string;
}

export function ModelSelector({
  selectedModel,
  onModelChange,
  disabled,
  className,
  triggerClassName,
}: ModelSelectorProps) {
  return (
    <div className={cn('flex items-center gap-4', className)}>
      <Select
        value={selectedModel}
        onValueChange={(newModelId) => {
          onModelChange(newModelId);
          const newModelObj = AVAILABLE_MODELS.find((m) => m.id === newModelId);
          if (newModelObj) {
            toast.success(`Switched to ${newModelObj.name}`);
          }
        }}
        disabled={disabled}
      >
        <SelectTrigger
          className={cn(
            'w-[240px] rounded-xl h-9 transition-all duration-200 cursor-pointer',
            'bg-white/50 dark:bg-black/50 border-zinc-200 dark:border-white/10',
            triggerClassName,
          )}
          aria-label="Select AI model"
          title="Select AI model"
        >
          <Bot className="h-3.5 w-3.5 mr-2 text-zinc-400" />
          <SelectValue placeholder="Select a model" />
        </SelectTrigger>
        <SelectContent className="bg-zinc-100 dark:bg-zinc-900 border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl">
          {Array.from(new Set(AVAILABLE_MODELS.map((m) => m.provider))).map(
            (provider) => (
              <div key={provider} className="p-1">
                <div className="px-2 py-1.5 text-[10px] font-bold text-zinc-500 uppercase tracking-widest opacity-70">
                  {provider}
                </div>
                {AVAILABLE_MODELS.filter((m) => m.provider === provider).map(
                  (model) => (
                    <SelectItem
                      key={model.id}
                      value={model.id}
                      className="focus:bg-zinc-200 dark:focus:bg-white/10 cursor-pointer rounded-lg mx-0.5 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">
                          {model.name}
                        </span>
                      </div>
                    </SelectItem>
                  ),
                )}
              </div>
            ),
          )}
        </SelectContent>
      </Select>
    </div>
  );
}
