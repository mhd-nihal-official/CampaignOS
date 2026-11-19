import React from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import type { CreativeDirectionOption } from '@/src/types/campaign';

interface CreativeDirectionsComparisonProps {
  directions: CreativeDirectionOption[];
  selectedId: string | null | undefined;
  isEditing: boolean;
  onSelect: (id: string) => void;
  onUpdateDirection: (
    id: string,
    field: keyof Omit<CreativeDirectionOption, 'id'>,
    value: string
  ) => void;
}

export function CreativeDirectionsComparison({
  directions,
  selectedId,
  isEditing,
  onSelect,
  onUpdateDirection,
}: CreativeDirectionsComparisonProps) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-zinc-400">
        <span>
          Compare the three proposed creative directions below and select one preferred concept before approving the strategy.
        </span>
        <span className="font-mono text-[11px] text-zinc-500">
          Proposed Options · Not Final Until Selected & Approved
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {directions.map((dir, idx) => {
          const isSelected = selectedId === dir.id;
          return (
            <div
              key={dir.id}
              className={`flex flex-col justify-between rounded-md border p-4 transition-colors ${
                isSelected
                  ? 'border-violet-500/70 bg-violet-950/15'
                  : 'border-zinc-800/90 bg-[#0D0E12]'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2 border-b border-zinc-800/70 pb-3">
                  <div>
                    <div className="font-mono text-[11px] text-zinc-500">
                      Option 0{idx + 1} · Proposed Direction
                    </div>
                    {isEditing ? (
                      <input
                        type="text"
                        value={dir.conceptName}
                        onChange={(e) =>
                          onUpdateDirection(dir.id, 'conceptName', e.target.value)
                        }
                        className="mt-1 w-full rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 text-sm font-semibold text-zinc-100 focus:border-violet-500 focus:outline-none"
                      />
                    ) : (
                      <h4 className="mt-0.5 font-display text-sm font-semibold text-zinc-100">
                        {dir.conceptName}
                      </h4>
                    )}
                  </div>
                  <Sparkles
                    className={`h-4 w-4 shrink-0 ${
                      isSelected ? 'text-violet-400' : 'text-zinc-600'
                    }`}
                  />
                </div>

                <div>
                  <div className="text-[11px] font-medium text-zinc-400">
                    Concept Description
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={dir.conceptDescription}
                      onChange={(e) =>
                        onUpdateDirection(
                          dir.id,
                          'conceptDescription',
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-200">
                      {dir.conceptDescription}
                    </p>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-medium text-zinc-400">
                    Main Message
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={dir.mainMessage}
                      onChange={(e) =>
                        onUpdateDirection(dir.id, 'mainMessage', e.target.value)
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-200">
                      {dir.mainMessage}
                    </p>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-medium text-zinc-400">
                    Suggested Visual Approach
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={dir.suggestedVisualApproach}
                      onChange={(e) =>
                        onUpdateDirection(
                          dir.id,
                          'suggestedVisualApproach',
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                      {dir.suggestedVisualApproach}
                    </p>
                  )}
                </div>

                <div>
                  <div className="text-[11px] font-medium text-zinc-400">
                    Example Content Execution
                  </div>
                  {isEditing ? (
                    <textarea
                      rows={2}
                      value={dir.exampleContentExecution}
                      onChange={(e) =>
                        onUpdateDirection(
                          dir.id,
                          'exampleContentExecution',
                          e.target.value
                        )
                      }
                      className="mt-1 w-full rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                    />
                  ) : (
                    <p className="mt-1 text-xs leading-relaxed text-zinc-300">
                      {dir.exampleContentExecution}
                    </p>
                  )}
                </div>
              </div>

              <div className="mt-4 border-t border-zinc-800/70 pt-3">
                <button
                  type="button"
                  onClick={() => onSelect(dir.id)}
                  className={`flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                    isSelected
                      ? 'bg-violet-600 text-white'
                      : 'border border-zinc-700 bg-zinc-900 text-zinc-200 hover:border-violet-500/60 hover:text-white'
                  }`}
                >
                  {isSelected ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Selected Preferred Direction</span>
                    </>
                  ) : (
                    <>
                      <Circle className="h-3.5 w-3.5 text-zinc-500" />
                      <span>Select This Direction</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
