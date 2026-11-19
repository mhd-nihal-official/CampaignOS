import { useState } from 'react';
import {
  AlertTriangle,
  Edit3,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import type {
  CampaignPlanPhase,
  ContentPlanDeliverable,
} from '@/src/types/campaign';
import {
  getEffectiveProductionDate,
  getEffectivePublicationDate,
  type ScheduleConflict,
} from '@/src/utils/scheduleConflicts';

interface ProductionTimelineProps {
  phases: CampaignPlanPhase[];
  deliverables: ContentPlanDeliverable[];
  campaignStartDate: string;
  campaignEndDate: string;
  conflicts: ScheduleConflict[];
  isPlanApproved: boolean;
  onUpdatePhases: (phases: CampaignPlanPhase[]) => void;
  onSelectDeliverable: (deliverable: ContentPlanDeliverable) => void;
}

export function ProductionTimeline({
  phases,
  deliverables,
  campaignStartDate,
  campaignEndDate,
  conflicts,
  isPlanApproved,
  onUpdatePhases,
  onSelectDeliverable,
}: ProductionTimelineProps) {
  const [editingPhases, setEditingPhases] = useState(false);
  const [draftPhases, setDraftPhases] = useState<CampaignPlanPhase[]>([]);

  const sortedPhases = [...phases].sort((a, b) =>
    a.startDate.localeCompare(b.startDate)
  );

  const chronologicalDeliverables = [...deliverables].sort((a, b) => {
    const aProd = getEffectiveProductionDate(a);
    const bProd = getEffectiveProductionDate(b);
    const prodCmp = aProd.localeCompare(bProd);
    if (prodCmp !== 0) return prodCmp;
    return getEffectivePublicationDate(a).localeCompare(
      getEffectivePublicationDate(b)
    );
  });

  const conflictDelIds = new Set(
    conflicts.flatMap((c) => c.affectedDeliverableIds)
  );

  const startEditing = () => {
    setDraftPhases(structuredClone(sortedPhases));
    setEditingPhases(true);
  };

  const handleAddPhase = () => {
    const newPhase: CampaignPlanPhase = {
      id: `phase_${Date.now().toString(36)}`,
      phaseName: `Phase ${draftPhases.length + 1}`,
      startDate: campaignStartDate || new Date().toISOString().slice(0, 10),
      endDate: campaignEndDate || new Date().toISOString().slice(0, 10),
      objective: '',
      focus: '',
      isSuggested: true,
    };
    setDraftPhases((prev) => [...prev, newPhase]);
  };

  const handleSavePhases = () => {
    const cleaned = draftPhases
      .filter((p) => p.phaseName.trim().length > 0)
      .map((p) => ({
        ...p,
        phaseName: p.phaseName.trim(),
        objective: p.objective.trim(),
        focus: p.focus.trim(),
        isSuggested: !isPlanApproved,
      }));
    onUpdatePhases(cleaned);
    setEditingPhases(false);
  };

  return (
    <div className="space-y-6">
      {/* Campaign Phases Section */}
      <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
        <div className="flex flex-col gap-3 border-b border-zinc-800/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              Campaign Phases ({sortedPhases.length})
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Chronological campaign phases aligned to{' '}
              <span className="font-mono tabular-nums text-zinc-300">
                {campaignStartDate || 'unset'} — {campaignEndDate || 'unset'}
              </span>
              {!isPlanApproved && ' (editable suggestions)'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {editingPhases ? (
              <>
                <button
                  type="button"
                  onClick={handleAddPhase}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Phase</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPhases(false)}
                  className="inline-flex items-center gap-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSavePhases}
                  className="inline-flex items-center gap-1 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>Save Phases</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={startEditing}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-violet-500/60 hover:text-white"
              >
                <Edit3 className="h-3.5 w-3.5" />
                <span>Edit Phases</span>
              </button>
            )}
          </div>
        </div>

        {editingPhases ? (
          <div className="divide-y divide-zinc-800/70">
            {draftPhases.length === 0 ? (
              <div className="px-5 py-8 text-center text-xs text-zinc-400">
                No phases configured yet. Click Add Phase above to define a campaign phase.
              </div>
            ) : (
              draftPhases.map((phase, idx) => (
                <div
                  key={phase.id}
                  className="grid grid-cols-1 gap-3 px-5 py-4 md:grid-cols-6"
                >
                  <input
                    type="text"
                    value={phase.phaseName}
                    onChange={(e) =>
                      setDraftPhases((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, phaseName: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Phase name"
                    className="md:col-span-2 rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-100"
                  />
                  <input
                    type="date"
                    value={phase.startDate}
                    onChange={(e) =>
                      setDraftPhases((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, startDate: e.target.value } : p
                        )
                      )
                    }
                    className="rounded-md border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 font-mono text-xs text-zinc-100"
                  />
                  <input
                    type="date"
                    value={phase.endDate}
                    onChange={(e) =>
                      setDraftPhases((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, endDate: e.target.value } : p
                        )
                      )
                    }
                    className="rounded-md border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 font-mono text-xs text-zinc-100"
                  />
                  <input
                    type="text"
                    value={phase.objective}
                    onChange={(e) =>
                      setDraftPhases((prev) =>
                        prev.map((p, i) =>
                          i === idx ? { ...p, objective: e.target.value } : p
                        )
                      )
                    }
                    placeholder="Phase objective"
                    className="rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-100"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={phase.focus}
                      onChange={(e) =>
                        setDraftPhases((prev) =>
                          prev.map((p, i) =>
                            i === idx ? { ...p, focus: e.target.value } : p
                          )
                        )
                      }
                      placeholder="Key focus"
                      className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-100"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setDraftPhases((prev) =>
                          prev.filter((_, i) => i !== idx)
                        )
                      }
                      aria-label={`Remove ${phase.phaseName}`}
                      className="rounded p-1.5 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : sortedPhases.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-zinc-400">
            No campaign phases generated yet. Generate a campaign plan from your approved strategy or click Edit Phases to add phases manually.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70">
            {sortedPhases.map((phase) => {
              const phaseDeliverableCount = deliverables.filter(
                (d) =>
                  d.phase?.trim().toLowerCase() ===
                  phase.phaseName.trim().toLowerCase()
              ).length;
              return (
                <div
                  key={phase.id}
                  className="flex flex-col gap-2 px-5 py-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-mono text-zinc-300 tabular-nums">
                        {phase.startDate} — {phase.endDate}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {phaseDeliverableCount}{' '}
                        {phaseDeliverableCount === 1
                          ? 'deliverable'
                          : 'deliverables'}
                      </span>
                      {!isPlanApproved && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-amber-300/90">
                            Suggested window
                          </span>
                        </>
                      )}
                    </div>
                    <h3 className="font-display text-sm font-semibold text-zinc-100">
                      {phase.phaseName}
                    </h3>
                    <p className="text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300">
                        Objective:
                      </span>{' '}
                      {phase.objective || '—'}{' '}
                      {phase.focus ? `· Focus: ${phase.focus}` : ''}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Chronological Production & Publication Timeline */}
      <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
        <div className="border-b border-zinc-800/80 px-5 py-4">
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Production & Publication Timeline ({chronologicalDeliverables.length})
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Chronological sequence of deliverable production deadlines and planned publication dates.
          </p>
        </div>

        {chronologicalDeliverables.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-zinc-400">
            No deliverables scheduled in the timeline yet.
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/70">
            {chronologicalDeliverables.map((item) => {
              const prodDate = getEffectiveProductionDate(item);
              const pubDate = getEffectivePublicationDate(item);
              const hasConflict = conflictDelIds.has(item.id);
              return (
                <div
                  key={item.id}
                  onClick={() => onSelectDeliverable(item)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onSelectDeliverable(item);
                    }
                  }}
                  className="flex flex-col gap-3 px-5 py-4 transition-colors hover:bg-zinc-900/50 cursor-pointer lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                      <span className="font-medium text-zinc-300">
                        {item.phase || 'Unassigned Phase'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.channel}</span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.format === 'Other' && item.customFormat
                          ? item.customFormat
                          : item.format}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{item.ownerRole}</span>
                      {hasConflict && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1 text-amber-400">
                            <AlertTriangle className="h-3 w-3" />
                            <span>Schedule Conflict</span>
                          </span>
                        </>
                      )}
                    </div>
                    <div className="font-display text-sm font-semibold text-zinc-100">
                      {item.title}
                    </div>
                    {item.relevanceNote && (
                      <p className="text-xs text-zinc-400 line-clamp-1">
                        {item.relevanceNote}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-5 shrink-0">
                    <div className="text-xs">
                      <div className="text-[11px] text-zinc-500">
                        {isPlanApproved
                          ? 'Production Due'
                          : 'Suggested Production'}
                      </div>
                      <div className="font-mono text-zinc-200 tabular-nums">
                        {prodDate || '—'}
                      </div>
                    </div>
                    <div className="text-xs">
                      <div className="text-[11px] text-zinc-500">
                        {isPlanApproved
                          ? 'Publication Date'
                          : 'Suggested Publication'}
                      </div>
                      <div className="font-mono text-zinc-200 tabular-nums">
                        {pubDate || '—'}
                      </div>
                    </div>
                    <StatusIndicator status={item.approvalStatus} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
