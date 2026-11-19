import React, { useState } from 'react';
import { Check, Edit3, Loader2, RefreshCw, X } from 'lucide-react';
import type { StrategySectionKey, StrategySourceType } from '@/src/types/campaign';

export function SourceTraceBadge({
  sourceType,
}: {
  sourceType: StrategySourceType;
}) {
  const isFact = sourceType === 'BRIEF_FACT';
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium whitespace-nowrap ${
        isFact
          ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'
          : 'border-violet-500/30 bg-violet-950/20 text-violet-300'
      }`}
    >
      {isFact ? 'BRIEF FACT' : 'STRATEGIC RECOMMENDATION'}
    </span>
  );
}

interface StrategySectionShellProps {
  sectionNumber: string;
  title: string;
  sectionKey: StrategySectionKey;
  sourceType?: StrategySourceType;
  isEditing: boolean;
  isRegenerating: boolean;
  canRegenerate: boolean;
  onToggleEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onRegenerate: (guidance?: string) => void;
  children: React.ReactNode;
}

export function StrategySectionShell({
  sectionNumber,
  title,
  sourceType,
  isEditing,
  isRegenerating,
  canRegenerate,
  onToggleEdit,
  onSaveEdit,
  onCancelEdit,
  onRegenerate,
  children,
}: StrategySectionShellProps) {
  const [showGuidance, setShowGuidance] = useState(false);
  const [guidance, setGuidance] = useState('');

  const handleConfirmRegenerate = (e: React.FormEvent) => {
    e.preventDefault();
    onRegenerate(guidance);
    setShowGuidance(false);
    setGuidance('');
  };

  return (
    <section className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5 space-y-4">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5">
          <h3 className="font-display text-base font-semibold text-zinc-100">
            <span className="mr-2 font-mono text-xs text-zinc-500">
              {sectionNumber}.
            </span>
            {title}
          </h3>
          {sourceType && <SourceTraceBadge sourceType={sourceType} />}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isEditing ? (
            <>
              <button
                type="button"
                onClick={onCancelEdit}
                className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-800"
              >
                <X className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="button"
                onClick={onSaveEdit}
                className="inline-flex items-center gap-1 rounded bg-violet-600 px-3 py-1 text-xs font-medium text-white hover:bg-violet-500"
              >
                <Check className="h-3.5 w-3.5" />
                <span>Save Section</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onToggleEdit}
                className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </button>
              {canRegenerate && (
                <button
                  type="button"
                  disabled={isRegenerating}
                  onClick={() => setShowGuidance((v) => !v)}
                  className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-violet-500/50 hover:text-violet-200 disabled:opacity-50"
                >
                  {isRegenerating ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="h-3.5 w-3.5" />
                  )}
                  <span>
                    {isRegenerating ? 'Regenerating...' : 'Regenerate'}
                  </span>
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showGuidance && !isEditing && (
        <form
          onSubmit={handleConfirmRegenerate}
          className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-[#0D0E12] p-3 sm:flex-row sm:items-center"
        >
          <input
            type="text"
            value={guidance}
            onChange={(e) => setGuidance(e.target.value)}
            placeholder="Optional guidance (e.g. emphasize enterprise CTO angle, keep under 2 phases)..."
            className="min-w-0 flex-1 rounded border border-zinc-800 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setShowGuidance(false)}
              className="rounded border border-zinc-800 px-2.5 py-1.5 text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isRegenerating}
              className="rounded bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              Regenerate Section
            </button>
          </div>
        </form>
      )}

      <div>{children}</div>
    </section>
  );
}
