import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  Edit3,
  Loader2,
  Lock,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { ContentCalendar } from '@/src/components/planner/ContentCalendar';
import { DeliverableEditorModal } from '@/src/components/planner/DeliverableEditorModal';
import { ProductionTimeline } from '@/src/components/planner/ProductionTimeline';
import { CampaignSelector } from '@/src/components/ui/CampaignSelector';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type {
  CampaignPlanPhase,
  ContentPlanDeliverable,
  DeliverablePriority,
  DeliverableStatus,
} from '@/src/types/campaign';
import {
  detectScheduleConflicts,
  getEffectiveProductionDate,
  getEffectivePublicationDate,
  isValidIsoDate,
} from '@/src/utils/scheduleConflicts';

type PlannerTab = 'deliverables' | 'calendar' | 'timeline';

export function PlannerView() {
  const {
    state,
    selectedCampaignId,
    setActiveNav,
    saveCampaignDates,
    generateCampaignPlan,
    updatePlanPhases,
    approveCampaignPlan,
    addDeliverable,
    updateDeliverable,
    updateDeliverableStatus,
    deleteDeliverable,
    openCampaignInSection,
  } = useCampaignWorkspace();

  const campaign =
    state.campaigns.find((c) => c.id === selectedCampaignId) ??
    state.campaigns[0] ??
    null;

  const [activeTab, setActiveTab] = useState<PlannerTab>('deliverables');
  const [isGenerating, setIsGenerating] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [approvalBanner, setApprovalBanner] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'create' | 'edit' | null>(null);
  const [editingDeliverable, setEditingDeliverable] = useState<
    ContentPlanDeliverable | undefined
  >(undefined);

  const [phaseFilter, setPhaseFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [missingStartInput, setMissingStartInput] = useState('');
  const [missingEndInput, setMissingEndInput] = useState('');
  const [dateInputError, setDateInputError] = useState<string | null>(null);

  useEffect(() => {
    setPlanError(null);
    setApprovalBanner(null);
    setModalMode(null);
    setEditingDeliverable(undefined);
    setPhaseFilter('all');
    setChannelFilter('all');
    setSearchQuery('');
    setDateInputError(null);
    if (campaign) {
      setMissingStartInput(campaign.launchDate || '');
      setMissingEndInput(campaign.endDate || '');
    }
  }, [campaign?.id, campaign?.launchDate, campaign?.endDate]);

  const strategy = campaign
    ? state.strategies.find((s) => s.campaignId === campaign.id)
    : undefined;
  const brief = campaign
    ? state.briefs.find((b) => b.campaignId === campaign.id)
    : undefined;
  const plan = campaign
    ? state.plans.find((p) => p.campaignId === campaign.id)
    : undefined;

  const isStrategyApproved = strategy?.approvalStatus === 'approved';
  const campaignStartDate =
    brief?.launchDate?.trim() || campaign?.launchDate?.trim() || '';
  const campaignEndDate =
    brief?.endDate?.trim() || campaign?.endDate?.trim() || '';
  const hasValidCampaignDates =
    isValidIsoDate(campaignStartDate) &&
    isValidIsoDate(campaignEndDate) &&
    campaignStartDate <= campaignEndDate;

  const campaignDeliverables = useMemo(() => {
    if (!campaign) return [];
    return state.deliverables
      .filter((d) => d.campaignId === campaign.id)
      .sort((a, b) =>
        getEffectivePublicationDate(a).localeCompare(
          getEffectivePublicationDate(b)
        )
      );
  }, [state.deliverables, campaign]);

  const phases: CampaignPlanPhase[] = useMemo(() => {
    if (plan?.phases && plan.phases.length > 0) {
      return plan.phases;
    }
    return [];
  }, [plan?.phases]);

  const conflicts = useMemo(
    () =>
      detectScheduleConflicts({
        deliverables: campaignDeliverables,
        phases,
        campaignStartDate,
        campaignEndDate,
      }),
    [campaignDeliverables, phases, campaignStartDate, campaignEndDate]
  );

  const conflictDelIds = useMemo(
    () => new Set(conflicts.flatMap((c) => c.affectedDeliverableIds)),
    [conflicts]
  );

  const isPlanApproved = plan?.approvalStatus === 'approved';

  const availableChannels = useMemo(() => {
    const fromStrategy =
      strategy?.recommendedChannels?.map((c) => c.channel) ??
      strategy?.primaryChannels ??
      [];
    const fromBrief = brief?.channels ?? [];
    const fromDeliverables = campaignDeliverables.map((d) => d.channel);
    return Array.from(
      new Set([...fromStrategy, ...fromBrief, ...fromDeliverables])
    ).filter(Boolean);
  }, [strategy, brief, campaignDeliverables]);

  const filteredDeliverables = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return campaignDeliverables.filter((d) => {
      if (phaseFilter !== 'all' && (d.phase || '') !== phaseFilter) {
        return false;
      }
      if (channelFilter !== 'all' && d.channel !== channelFilter) {
        return false;
      }
      if (q) {
        const hay = `${d.title} ${d.description ?? ''} ${d.objective ?? ''} ${d.channel} ${d.format}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [campaignDeliverables, phaseFilter, channelFilter, searchQuery]);

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Convert approved campaign strategies into actionable deliverables, calendars, and production timelines.
          </p>
        </div>
        <EmptyState
          icon={CalendarRange}
          title="No campaign to plan"
          description="Create, analyse, and approve a client brief and campaign strategy first to build a campaign plan."
          primaryAction={{
            label: 'Go to Briefs',
            onClick: () => setActiveNav('briefs'),
          }}
        />
      </div>
    );
  }

  if (!isStrategyApproved || !strategy) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
              Campaign Planner
            </h1>
            <p className="mt-1 text-sm text-zinc-400">
              Manage content plan deliverables, calendars, and production timelines.
            </p>
          </div>

          <CampaignSelector />
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-8 text-center space-y-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div className="mx-auto max-w-lg space-y-2">
            <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
              <span>{campaign.title}</span>
              <span aria-hidden="true">·</span>
              <StatusIndicator status={strategy?.approvalStatus ?? 'draft'} />
            </div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              Approved Strategy Required Before Planning
            </h2>
            <p className="text-sm leading-relaxed text-zinc-400">
              Only an approved campaign strategy can be used to generate a campaign plan. Return to Strategy to review, select a creative direction, and approve the strategy.
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => openCampaignInSection(campaign.id, 'strategy')}
              className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
            >
              <span>Go to Strategy</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveMissingDates = (e: React.FormEvent) => {
    e.preventDefault();
    setDateInputError(null);
    if (
      !isValidIsoDate(missingStartInput) ||
      !isValidIsoDate(missingEndInput)
    ) {
      setDateInputError('Please provide both a valid start date and end date.');
      return;
    }
    if (missingStartInput > missingEndInput) {
      setDateInputError('Campaign start date must be on or before end date.');
      return;
    }
    saveCampaignDates(campaign.id, missingStartInput, missingEndInput);
  };

  const handleGeneratePlan = async () => {
    setPlanError(null);
    setApprovalBanner(null);
    setIsGenerating(true);
    const result = await generateCampaignPlan(campaign.id);
    setIsGenerating(false);
    if (!result.ok) {
      setPlanError(result.error);
    }
  };

  const handleApprovePlan = () => {
    setApprovalBanner(null);
    if (campaignDeliverables.length === 0) {
      setApprovalBanner(
        'Add or generate at least one deliverable before approving the campaign plan.'
      );
      return;
    }
    const blockingErrors = conflicts.filter((c) => c.severity === 'error');
    if (blockingErrors.length > 0) {
      setApprovalBanner(
        'Resolve scheduling errors (such as inverted production/publication dates or same-day channel collisions) before approving the campaign plan.'
      );
      return;
    }
    approveCampaignPlan(campaign.id);
  };

  const openCreateModal = () => {
    setEditingDeliverable(undefined);
    setModalMode('create');
  };

  const openEditModal = (del: ContentPlanDeliverable) => {
    setEditingDeliverable(del);
    setModalMode('edit');
  };

  const defaultObjective =
    strategy.campaignObjective?.content || brief?.objective || '';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Planner
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Deliverable management, visual content calendar, and chronological production schedule grounded in your approved strategy.
          </p>
        </div>

        <CampaignSelector />
      </div>

      {/* Campaign Plan Status & Action Bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800/90 bg-[#111216] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>{campaign.clientName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums text-zinc-300">
              {hasValidCampaignDates
                ? `${campaignStartDate} — ${campaignEndDate}`
                : 'Campaign dates missing'}
            </span>
            {campaign.isDemo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-violet-400">DEMO</span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-display text-base font-semibold text-zinc-100">
              {campaign.title}
            </h2>
            <StatusIndicator status={plan?.approvalStatus ?? 'draft'} />
          </div>
          <p className="text-xs text-zinc-400">
            {isPlanApproved
              ? `Approved on ${plan?.approvedAt?.slice(0, 10) ?? 'today'} · Approved deliverables are available in Execution.`
              : 'All generated dates and deliverables remain editable suggestions until you approve the campaign plan.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            disabled={!hasValidCampaignDates || isGenerating}
            onClick={handleGeneratePlan}
            title={
              !hasValidCampaignDates
                ? 'Provide campaign start and end dates below before generating a plan.'
                : undefined
            }
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              {isGenerating
                ? 'Generating Plan...'
                : plan
                  ? 'Regenerate Plan'
                  : 'Generate Campaign Plan'}
            </span>
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 hover:border-violet-500/60 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Deliverable</span>
          </button>

          {!isPlanApproved ? (
            <button
              type="button"
              disabled={campaignDeliverables.length === 0}
              onClick={handleApprovePlan}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-emerald-500/50 bg-emerald-950/30 px-3.5 py-2 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-900/40 disabled:cursor-not-allowed disabled:opacity-45"
            >
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              <span>Approve Campaign Plan</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => openCampaignInSection(campaign.id, 'execution')}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <span>Execution Tasks</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Missing / Unconfirmed Campaign Dates Prompt */}
      {!hasValidCampaignDates && (
        <form
          onSubmit={handleSaveMissingDates}
          className="rounded-lg border border-amber-500/40 bg-amber-950/20 p-5 space-y-3"
        >
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
            <div>
              <h3 className="text-sm font-semibold text-amber-200">
                Campaign Dates Required
              </h3>
              <p className="mt-0.5 text-xs text-amber-100/80">
                The approved brief does not contain valid start and end dates. CampaignOS will never invent confirmed dates—please provide the campaign period before generating the schedule.
              </p>
            </div>
          </div>
          {dateInputError && (
            <div className="text-xs text-rose-300">{dateInputError}</div>
          )}
          <div className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="missing-start-date"
                className="block text-xs font-medium text-amber-200"
              >
                Campaign Start Date
              </label>
              <input
                id="missing-start-date"
                type="date"
                value={missingStartInput}
                onChange={(e) => setMissingStartInput(e.target.value)}
                className="mt-1 rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 font-mono text-xs text-zinc-100"
              />
            </div>
            <div>
              <label
                htmlFor="missing-end-date"
                className="block text-xs font-medium text-amber-200"
              >
                Campaign End Date
              </label>
              <input
                id="missing-end-date"
                type="date"
                value={missingEndInput}
                onChange={(e) => setMissingEndInput(e.target.value)}
                className="mt-1 rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 font-mono text-xs text-zinc-100"
              />
            </div>
            <button
              type="submit"
              className="rounded-md bg-amber-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-amber-500"
            >
              Save Campaign Period
            </button>
          </div>
        </form>
      )}

      {/* Error / Notice / Loading Banners */}
      {planError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-950/25 px-4 py-3 text-xs text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-semibold text-rose-100">
                Campaign Plan Error
              </div>
              <p className="mt-0.5 text-rose-300/90">{planError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPlanError(null)}
            className="text-zinc-400 hover:text-zinc-200 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {approvalBanner && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{approvalBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setApprovalBanner(null)}
            className="text-zinc-400 hover:text-zinc-200 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="flex items-center gap-3 rounded-lg border border-violet-500/35 bg-violet-950/20 px-4 py-3 text-xs text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400 shrink-0" />
          <span>
            Converting approved strategy into campaign phases, deliverables, and suggested production/publication dates...
          </span>
        </div>
      )}

      {/* Scheduling Conflict & Out-of-Period Alerts */}
      {conflicts.length > 0 && (
        <div className="rounded-lg border border-amber-500/35 bg-amber-950/15 p-4 space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                Scheduling Conflicts & Date Alerts ({conflicts.length})
              </span>
            </div>
          </div>
          <ul className="space-y-1.5 text-xs text-amber-100/90">
            {conflicts.map((conflict) => {
              const firstAffected = conflict.affectedDeliverableIds[0]
                ? campaignDeliverables.find(
                    (d) => d.id === conflict.affectedDeliverableIds[0]
                  )
                : undefined;
              return (
                <li
                  key={conflict.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-amber-500/20 bg-[#09090B]/60 px-3 py-2"
                >
                  <span
                    className={
                      conflict.severity === 'error'
                        ? 'text-rose-200'
                        : 'text-amber-100'
                    }
                  >
                    {conflict.message}
                  </span>
                  {firstAffected && (
                    <button
                      type="button"
                      onClick={() => openEditModal(firstAffected)}
                      className="text-xs font-medium text-violet-400 hover:text-violet-300 shrink-0"
                    >
                      Adjust Dates
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Planning Summary Strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4">
          <div className="text-xs text-zinc-400">Approved Brief Period</div>
          <div className="mt-1 font-mono text-sm font-semibold text-zinc-100 tabular-nums">
            {hasValidCampaignDates
              ? `${campaignStartDate} — ${campaignEndDate}`
              : 'Not provided'}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4">
          <div className="text-xs text-zinc-400">Campaign Phases</div>
          <div className="mt-1 font-mono text-lg font-semibold text-zinc-100 tabular-nums">
            {phases.length}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4">
          <div className="text-xs text-zinc-400">Planned Deliverables</div>
          <div className="mt-1 font-mono text-lg font-semibold text-zinc-100 tabular-nums">
            {campaignDeliverables.length}
          </div>
        </div>
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4">
          <div className="text-xs text-zinc-400">Schedule Alerts</div>
          <div
            className={`mt-1 font-mono text-lg font-semibold tabular-nums ${
              conflicts.length > 0 ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {conflicts.length}
          </div>
        </div>
      </div>

      {/* Planning Notes from Strategy */}
      {plan?.planningNotes && plan.planningNotes.length > 0 && (
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] px-5 py-4 space-y-1.5">
          <div className="text-xs font-semibold text-zinc-300">
            Strategy Alignment Notes
          </div>
          <ul className="list-disc pl-5 space-y-1 text-xs text-zinc-400">
            {plan.planningNotes.map((note, idx) => (
              <li key={idx}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Workspace Tabs */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Campaign Planner sections"
          className="inline-flex items-center gap-1 rounded-lg border border-zinc-800/90 bg-[#111216] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'deliverables'}
            onClick={() => setActiveTab('deliverables')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'deliverables'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Deliverables ({campaignDeliverables.length})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'calendar'}
            onClick={() => setActiveTab('calendar')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'calendar'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Content Calendar
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'timeline'}
            onClick={() => setActiveTab('timeline')}
            className={`rounded-md px-3.5 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              activeTab === 'timeline'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Timeline & Phases ({phases.length})
          </button>
        </div>

        {activeTab === 'deliverables' && campaignDeliverables.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter deliverables..."
              aria-label="Filter deliverables"
              className="rounded-md border border-zinc-800 bg-[#111216] px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
            <select
              value={phaseFilter}
              onChange={(e) => setPhaseFilter(e.target.value)}
              aria-label="Filter by phase"
              className="rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Phases</option>
              {phases.map((p) => (
                <option key={p.id} value={p.phaseName}>
                  {p.phaseName}
                </option>
              ))}
            </select>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              aria-label="Filter by channel"
              className="rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
            >
              <option value="all">All Channels</option>
              {availableChannels.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'deliverables' && (
        <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
          <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-100">
                Campaign Deliverables ({filteredDeliverables.length})
              </h2>
              <p className="mt-0.5 text-xs text-zinc-400">
                {isPlanApproved
                  ? 'Confirmed deliverable schedule. Changes require plan re-approval.'
                  : 'Editable suggested deliverables aligned to your approved campaign strategy.'}
              </p>
            </div>
          </div>

          {campaignDeliverables.length === 0 ? (
            <div className="px-5 py-12 text-center space-y-3">
              <p className="text-sm text-zinc-400">
                No deliverables planned yet for this campaign. Generate a strategy-aligned campaign plan or add deliverables manually.
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  disabled={!hasValidCampaignDates || isGenerating}
                  onClick={handleGeneratePlan}
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-45"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Generate Campaign Plan</span>
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:text-white"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add Manually</span>
                </button>
              </div>
            </div>
          ) : filteredDeliverables.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No deliverables match the active filters.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-zinc-400">
                    <th className="px-5 py-3 font-medium">Deliverable & Relevance</th>
                    <th className="px-3 py-3 font-medium">Format & Channel</th>
                    <th className="px-3 py-3 font-medium">Phase</th>
                    <th className="px-3 py-3 font-medium">
                      {isPlanApproved ? 'Production Date' : 'Suggested Prod.'}
                    </th>
                    <th className="px-3 py-3 font-medium">
                      {isPlanApproved ? 'Publication Date' : 'Suggested Pub.'}
                    </th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredDeliverables.map((item) => {
                    const prodDate = getEffectiveProductionDate(item);
                    const pubDate = getEffectivePublicationDate(item);
                    const hasConflict = conflictDelIds.has(item.id);

                    return (
                      <tr
                        key={item.id}
                        className="align-top transition-colors hover:bg-zinc-900/40"
                      >
                        <td className="px-5 py-3.5 max-w-sm">
                          <div className="flex items-start gap-2">
                            {hasConflict && (
                              <AlertTriangle
                                aria-label="Schedule conflict"
                                className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400"
                              />
                            )}
                            <div>
                              <div className="font-medium text-sm text-zinc-100">
                                {item.title}
                              </div>
                              {item.description && (
                                <p className="mt-1 text-xs text-zinc-400 line-clamp-2">
                                  {item.description}
                                </p>
                              )}
                              {item.objective && (
                                <p className="mt-1 text-[11px] text-zinc-400">
                                  <span className="font-medium text-zinc-300">
                                    Objective:
                                  </span>{' '}
                                  {item.objective}
                                </p>
                              )}
                              {item.relevanceNote && (
                                <p className="mt-0.5 text-[11px] text-zinc-500">
                                  <span className="font-medium text-zinc-400">
                                    Relevance:
                                  </span>{' '}
                                  {item.relevanceNote}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-3 py-3.5 whitespace-nowrap text-zinc-300">
                          <div className="font-medium">
                            {item.format === 'Other' && item.customFormat
                              ? item.customFormat
                              : item.format}
                          </div>
                          <div className="mt-0.5 text-[11px] text-zinc-400">
                            {item.channel} · {item.ownerRole}
                          </div>
                        </td>

                        <td className="px-3 py-3.5">
                          <select
                            aria-label={`Phase for ${item.title}`}
                            value={item.phase ?? ''}
                            onChange={(e) =>
                              updateDeliverable(item.id, {
                                phase: e.target.value,
                              })
                            }
                            className="max-w-[160px] rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          >
                            {!phases.some((p) => p.phaseName === item.phase) &&
                              item.phase && (
                                <option value={item.phase}>{item.phase}</option>
                              )}
                            {phases.length === 0 && !item.phase && (
                              <option value="">Unassigned</option>
                            )}
                            {phases.map((p) => (
                              <option key={p.id} value={p.phaseName}>
                                {p.phaseName}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="px-3 py-3.5">
                          <input
                            type="date"
                            aria-label={`Production date for ${item.title}`}
                            value={prodDate}
                            onChange={(e) =>
                              updateDeliverable(item.id, {
                                productionDate: e.target.value,
                              })
                            }
                            className="rounded border border-zinc-800 bg-[#09090B] px-2 py-1 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          />
                        </td>

                        <td className="px-3 py-3.5">
                          <input
                            type="date"
                            aria-label={`Publication date for ${item.title}`}
                            value={pubDate}
                            onChange={(e) =>
                              updateDeliverable(item.id, {
                                publicationDate: e.target.value,
                                dueDate: e.target.value,
                              })
                            }
                            className="rounded border border-zinc-800 bg-[#09090B] px-2 py-1 font-mono text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          />
                        </td>

                        <td className="px-3 py-3.5">
                          <select
                            aria-label={`Priority for ${item.title}`}
                            value={item.priority ?? 'normal'}
                            onChange={(e) =>
                              updateDeliverable(item.id, {
                                priority: e.target.value as DeliverablePriority,
                              })
                            }
                            className="rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          >
                            <option value="low">Low</option>
                            <option value="normal">Normal</option>
                            <option value="high">High</option>
                          </select>
                        </td>

                        <td className="px-3 py-3.5">
                          <div className="space-y-1.5">
                            <StatusIndicator status={item.approvalStatus} />
                            <select
                              aria-label={`Status for ${item.title}`}
                              value={item.approvalStatus}
                              onChange={(e) =>
                                updateDeliverableStatus(
                                  item.id,
                                  e.target.value as DeliverableStatus
                                )
                              }
                              className="block rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
                            >
                              <option value="planned">Planned</option>
                              <option value="in_production">
                                In Production
                              </option>
                              <option value="pending_approval">
                                Pending Approval
                              </option>
                              <option value="approved">Approved</option>
                              <option value="scheduled">Scheduled</option>
                            </select>
                          </div>
                        </td>

                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              aria-label={`Edit ${item.title}`}
                              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteDeliverable(item.id)}
                              aria-label={`Delete ${item.title}`}
                              className="rounded p-1.5 text-zinc-500 hover:bg-zinc-800 hover:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'calendar' && (
        <ContentCalendar
          deliverables={campaignDeliverables}
          campaignStartDate={campaignStartDate}
          campaignEndDate={campaignEndDate}
          conflicts={conflicts}
          isPlanApproved={isPlanApproved}
          onSelectDeliverable={openEditModal}
        />
      )}

      {activeTab === 'timeline' && (
        <ProductionTimeline
          phases={phases}
          deliverables={campaignDeliverables}
          campaignStartDate={campaignStartDate}
          campaignEndDate={campaignEndDate}
          conflicts={conflicts}
          isPlanApproved={isPlanApproved}
          onUpdatePhases={(nextPhases) =>
            updatePlanPhases(campaign.id, nextPhases)
          }
          onSelectDeliverable={openEditModal}
        />
      )}

      {/* Add / Edit Deliverable Modal */}
      {modalMode && (
        <DeliverableEditorModal
          mode={modalMode}
          initialDeliverable={editingDeliverable}
          campaignStartDate={campaignStartDate}
          campaignEndDate={campaignEndDate}
          availableChannels={availableChannels}
          availablePhases={phases}
          defaultObjective={defaultObjective}
          isPlanApproved={isPlanApproved}
          onSave={(data) => {
            if (modalMode === 'create') {
              addDeliverable(campaign.id, data);
            } else if (editingDeliverable) {
              updateDeliverable(editingDeliverable.id, data);
            }
            setModalMode(null);
            setEditingDeliverable(undefined);
          }}
          onClose={() => {
            setModalMode(null);
            setEditingDeliverable(undefined);
          }}
        />
      )}
    </div>
  );
}
