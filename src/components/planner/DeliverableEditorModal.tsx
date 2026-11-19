import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import {
  SUPPORTED_CONTENT_FORMATS,
  type CampaignPlanPhase,
  type ContentPlanDeliverable,
  type DeliverableContentFormat,
  type DeliverablePriority,
  type DeliverableStatus,
} from '@/src/types/campaign';
import {
  getEffectiveProductionDate,
  getEffectivePublicationDate,
  isValidIsoDate,
} from '@/src/utils/scheduleConflicts';

interface DeliverableEditorModalProps {
  mode: 'create' | 'edit';
  initialDeliverable?: ContentPlanDeliverable;
  campaignStartDate: string;
  campaignEndDate: string;
  availableChannels: string[];
  availablePhases: CampaignPlanPhase[];
  defaultObjective: string;
  isPlanApproved: boolean;
  onSave: (
    data: Omit<ContentPlanDeliverable, 'id' | 'campaignId'>
  ) => void;
  onClose: () => void;
}

const DEFAULT_CHANNELS = [
  'LinkedIn',
  'Instagram',
  'YouTube',
  'TikTok',
  'Email',
  'Blog / Web',
  'Paid Search',
  'Display',
];

export function DeliverableEditorModal({
  mode,
  initialDeliverable,
  campaignStartDate,
  campaignEndDate,
  availableChannels,
  availablePhases,
  defaultObjective,
  isPlanApproved,
  onSave,
  onClose,
}: DeliverableEditorModalProps) {
  const channelOptions = Array.from(
    new Set([...availableChannels, ...DEFAULT_CHANNELS])
  );

  const initialFormat = initialDeliverable?.format ?? 'Static Post';
  const isKnownFormat = SUPPORTED_CONTENT_FORMATS.includes(
    initialFormat as DeliverableContentFormat
  );

  const defaultProdDate =
    (initialDeliverable && getEffectiveProductionDate(initialDeliverable)) ||
    campaignStartDate ||
    new Date().toISOString().slice(0, 10);
  const defaultPubDate =
    (initialDeliverable && getEffectivePublicationDate(initialDeliverable)) ||
    campaignStartDate ||
    new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(initialDeliverable?.title ?? '');
  const [format, setFormat] = useState<string>(
    isKnownFormat ? initialFormat : 'Other'
  );
  const [customFormat, setCustomFormat] = useState(
    initialDeliverable?.customFormat ?? (!isKnownFormat ? initialFormat : '')
  );
  const [channel, setChannel] = useState(
    initialDeliverable?.channel ?? channelOptions[0] ?? 'LinkedIn'
  );
  const [phase, setPhase] = useState(
    initialDeliverable?.phase ??
      availablePhases[0]?.phaseName ??
      'Phase 1 · Launch'
  );
  const [description, setDescription] = useState(
    initialDeliverable?.description ?? ''
  );
  const [objective, setObjective] = useState(
    initialDeliverable?.objective ?? defaultObjective
  );
  const [relevanceNote, setRelevanceNote] = useState(
    initialDeliverable?.relevanceNote ?? ''
  );
  const [productionDate, setProductionDate] = useState(defaultProdDate);
  const [publicationDate, setPublicationDate] = useState(defaultPubDate);
  const [priority, setPriority] = useState<DeliverablePriority>(
    initialDeliverable?.priority ?? 'normal'
  );
  const [approvalStatus, setApprovalStatus] = useState<DeliverableStatus>(
    initialDeliverable?.approvalStatus ?? 'planned'
  );
  const [ownerRole, setOwnerRole] = useState(
    initialDeliverable?.ownerRole ?? 'Content Strategist'
  );
  const [formError, setFormError] = useState<string | null>(null);

  const hasWindow =
    isValidIsoDate(campaignStartDate) && isValidIsoDate(campaignEndDate);
  const outOfWindowWarning =
    hasWindow &&
    ((isValidIsoDate(productionDate) &&
      (productionDate < campaignStartDate ||
        productionDate > campaignEndDate)) ||
      (isValidIsoDate(publicationDate) &&
        (publicationDate < campaignStartDate ||
          publicationDate > campaignEndDate)));

  const invertedDatesWarning =
    isValidIsoDate(productionDate) &&
    isValidIsoDate(publicationDate) &&
    productionDate > publicationDate;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Deliverable title is required.');
      return;
    }
    if (!isValidIsoDate(productionDate) || !isValidIsoDate(publicationDate)) {
      setFormError('Valid production and publication dates are required.');
      return;
    }
    if (!description.trim()) {
      setFormError('Deliverable description is required.');
      return;
    }
    if (!objective.trim()) {
      setFormError('Supported campaign objective is required.');
      return;
    }

    onSave({
      title: title.trim(),
      format,
      customFormat: format === 'Other' ? customFormat.trim() || undefined : undefined,
      channel: channel.trim() || 'LinkedIn',
      phase: phase.trim() || 'Campaign Phase',
      description: description.trim(),
      objective: objective.trim(),
      relevanceNote:
        relevanceNote.trim() ||
        'Supports the approved campaign strategy objective.',
      productionDate,
      publicationDate,
      dueDate: publicationDate,
      priority,
      approvalStatus,
      ownerRole: ownerRole.trim() || 'Content Strategist',
      isSuggested: !isPlanApproved,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Add Deliverable' : 'Edit Deliverable'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-800 bg-[#111216] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              {mode === 'create' ? 'Add Campaign Deliverable' : 'Edit Deliverable'}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              {isPlanApproved
                ? 'Modifying deliverables will require re-approval of the campaign plan.'
                : 'Dates and details remain editable suggestions until the campaign plan is approved.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close deliverable editor"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError && (
            <div className="rounded-md border border-rose-500/40 bg-rose-950/25 px-3.5 py-2.5 text-xs text-rose-200">
              {formError}
            </div>
          )}

          {(outOfWindowWarning || invertedDatesWarning) && (
            <div className="space-y-1.5 rounded-md border border-amber-500/40 bg-amber-950/25 px-3.5 py-2.5 text-xs text-amber-200">
              {outOfWindowWarning && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>
                    Selected date falls outside the approved campaign period (
                    <span className="font-mono">
                      {campaignStartDate} — {campaignEndDate}
                    </span>
                    ).
                  </span>
                </div>
              )}
              {invertedDatesWarning && (
                <div className="flex items-start gap-2">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                  <span>
                    Production date ({productionDate}) is scheduled after publication date ({publicationDate}).
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="deliv-title"
                className="block text-xs font-medium text-zinc-300"
              >
                Deliverable Title *
              </label>
              <input
                id="deliv-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Launch Proof Case Study Carousel"
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="deliv-format"
                className="block text-xs font-medium text-zinc-300"
              >
                Content Format *
              </label>
              <select
                id="deliv-format"
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                {SUPPORTED_CONTENT_FORMATS.map((fmt) => (
                  <option key={fmt} value={fmt}>
                    {fmt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="deliv-channel"
                className="block text-xs font-medium text-zinc-300"
              >
                Marketing Channel *
              </label>
              <select
                id="deliv-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                {channelOptions.map((ch) => (
                  <option key={ch} value={ch}>
                    {ch}
                  </option>
                ))}
              </select>
            </div>

            {format === 'Other' && (
              <div className="sm:col-span-2">
                <label
                  htmlFor="deliv-custom-format"
                  className="block text-xs font-medium text-zinc-300"
                >
                  Custom Format Specification
                </label>
                <input
                  id="deliv-custom-format"
                  type="text"
                  value={customFormat}
                  onChange={(e) => setCustomFormat(e.target.value)}
                  placeholder="Specify custom deliverable format"
                  className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="deliv-phase"
                className="block text-xs font-medium text-zinc-300"
              >
                Campaign Phase *
              </label>
              {availablePhases.length > 0 ? (
                <select
                  id="deliv-phase"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
                >
                  {!availablePhases.some((p) => p.phaseName === phase) && phase && (
                    <option value={phase}>{phase}</option>
                  )}
                  {availablePhases.map((p) => (
                    <option key={p.id} value={p.phaseName}>
                      {p.phaseName} ({p.startDate} — {p.endDate})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id="deliv-phase"
                  type="text"
                  value={phase}
                  onChange={(e) => setPhase(e.target.value)}
                  className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
                />
              )}
            </div>

            <div>
              <label
                htmlFor="deliv-owner"
                className="block text-xs font-medium text-zinc-300"
              >
                Owner Role
              </label>
              <input
                id="deliv-owner"
                type="text"
                value={ownerRole}
                onChange={(e) => setOwnerRole(e.target.value)}
                placeholder="e.g. Copywriter, Brand Designer"
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="deliv-prod-date"
                className="block text-xs font-medium text-zinc-300"
              >
                {isPlanApproved
                  ? 'Production Date *'
                  : 'Suggested Production Date *'}
              </label>
              <input
                id="deliv-prod-date"
                type="date"
                value={productionDate}
                onChange={(e) => setProductionDate(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="deliv-pub-date"
                className="block text-xs font-medium text-zinc-300"
              >
                {isPlanApproved
                  ? 'Publication Date *'
                  : 'Suggested Publication Date *'}
              </label>
              <input
                id="deliv-pub-date"
                type="date"
                value={publicationDate}
                onChange={(e) => setPublicationDate(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="deliv-priority"
                className="block text-xs font-medium text-zinc-300"
              >
                Priority
              </label>
              <select
                id="deliv-priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as DeliverablePriority)
                }
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="deliv-status"
                className="block text-xs font-medium text-zinc-300"
              >
                Status
              </label>
              <select
                id="deliv-status"
                value={approvalStatus}
                onChange={(e) =>
                  setApprovalStatus(e.target.value as DeliverableStatus)
                }
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="planned">Planned</option>
                <option value="in_production">In Production</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="deliv-description"
                className="block text-xs font-medium text-zinc-300"
              >
                Description *
              </label>
              <textarea
                id="deliv-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the asset scope, core angle, and content structure..."
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="deliv-objective"
                className="block text-xs font-medium text-zinc-300"
              >
                Supported Campaign Objective *
              </label>
              <input
                id="deliv-objective"
                type="text"
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Which approved strategy objective does this deliverable support?"
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="deliv-relevance"
                className="block text-xs font-medium text-zinc-300"
              >
                Why This Deliverable Is Relevant
              </label>
              <textarea
                id="deliv-relevance"
                rows={2}
                value={relevanceNote}
                onChange={(e) => setRelevanceNote(e.target.value)}
                placeholder="Explain how it directly supports the approved strategy pillars, audience, and selected creative direction..."
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500"
            >
              {mode === 'create' ? 'Add Deliverable' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
