import { useEffect, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Compass,
  Loader2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { CreativeDirectionsComparison } from '@/src/components/strategy/CreativeDirectionsComparison';
import {
  SourceTraceBadge,
  StrategySectionShell,
} from '@/src/components/strategy/StrategySectionShell';
import { CampaignSelector } from '@/src/components/ui/CampaignSelector';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type {
  CampaignStatus,
  CampaignStrategy,
  CreativeDirectionOption,
  StrategyChannelRecommendation,
  StrategyContentPillar,
  StrategyPainPoint,
  StrategyPhaseItem,
  StrategySectionKey,
  StrategySuccessMetric,
  StrategyTextBlock,
} from '@/src/types/campaign';

function TextBlockDisplay({ block }: { block: StrategyTextBlock }) {
  return (
    <div className="space-y-3">
      <p className="text-sm leading-relaxed text-zinc-100 whitespace-pre-wrap">
        {block.content}
      </p>
      <div className="rounded border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5 text-xs text-zinc-400">
        <span className="font-medium text-zinc-300">Traceability:</span>{' '}
        {block.briefBasis}
      </div>
      {block.clarificationNeeded && (
        <div className="rounded border border-amber-500/30 bg-amber-950/20 px-3.5 py-2 text-xs text-amber-200">
          <span className="font-medium">Clarification Needed:</span>{' '}
          {block.clarificationNeeded}
        </div>
      )}
    </div>
  );
}

function TextBlockEditor({
  block,
  onChange,
}: {
  block: StrategyTextBlock;
  onChange: (next: StrategyTextBlock) => void;
}) {
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-zinc-400">
          Section Content
        </label>
        <textarea
          rows={4}
          value={block.content}
          onChange={(e) => onChange({ ...block, content: e.target.value })}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-zinc-400">
          Brief Basis / Traceability Note
        </label>
        <input
          type="text"
          value={block.briefBasis}
          onChange={(e) => onChange({ ...block, briefBasis: e.target.value })}
          className="mt-1 w-full rounded-md border border-zinc-700 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
        />
      </div>
    </div>
  );
}

export function StrategyView() {
  const {
    state,
    selectedCampaignId,
    setActiveNav,
    saveStrategy,
    generateCampaignStrategy,
    regenerateStrategySection,
    selectCreativeDirection,
    approveStrategy,
    updateCampaignStatus,
    openCampaignInSection,
  } = useCampaignWorkspace();

  const campaign =
    state.campaigns.find((c) => c.id === selectedCampaignId) ??
    state.campaigns[0] ??
    null;

  const existingStrategy = campaign
    ? state.strategies.find((s) => s.campaignId === campaign.id)
    : undefined;

  const linkedBrief = campaign
    ? state.briefs.find((b) => b.campaignId === campaign.id)
    : undefined;

  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingKey, setRegeneratingKey] =
    useState<StrategySectionKey | null>(null);
  const [editingSection, setEditingSection] =
    useState<StrategySectionKey | null>(null);
  const [draftStrategy, setDraftStrategy] = useState<CampaignStrategy | null>(
    null
  );
  const [strategyError, setStrategyError] = useState<string | null>(null);
  const [approvalNotice, setApprovalNotice] = useState<string | null>(null);

  useEffect(() => {
    setEditingSection(null);
    setDraftStrategy(null);
    setStrategyError(null);
    setApprovalNotice(null);
  }, [campaign?.id]);

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Strategy
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Generate and approve structured marketing strategies grounded in approved client brief analyses.
          </p>
        </div>
        <EmptyState
          icon={Compass}
          title="No campaign selected"
          description="Create and analyse a client marketing brief first to generate a campaign strategy."
          primaryAction={{
            label: 'Go to Briefs',
            onClick: () => setActiveNav('briefs'),
          }}
        />
      </div>
    );
  }

  const hasApprovedAnalysis = Boolean(
    linkedBrief?.analysis && linkedBrief.analysis.approved
  );

  const hasGeneratedStrategy = Boolean(
    existingStrategy?.campaignOverview &&
      existingStrategy?.creativeDirections &&
      existingStrategy.creativeDirections.length > 0
  );

  const isStrategyApproved = existingStrategy?.approvalStatus === 'approved';

  const handleGenerateFull = async () => {
    setStrategyError(null);
    setApprovalNotice(null);
    setIsGenerating(true);
    const result = await generateCampaignStrategy(campaign.id);
    setIsGenerating(false);
    if (!result.ok) {
      setStrategyError(result.error);
    }
  };

  const handleRegenerateSection = async (
    sectionKey: StrategySectionKey,
    guidance?: string
  ) => {
    setStrategyError(null);
    setApprovalNotice(null);
    setRegeneratingKey(sectionKey);
    const result = await regenerateStrategySection(
      campaign.id,
      sectionKey,
      guidance
    );
    setRegeneratingKey(null);
    if (!result.ok) {
      setStrategyError(result.error);
    }
  };

  const startEditing = (sectionKey: StrategySectionKey) => {
    if (!existingStrategy) return;
    setDraftStrategy(structuredClone(existingStrategy));
    setEditingSection(sectionKey);
    setApprovalNotice(null);
  };

  const cancelEditing = () => {
    setEditingSection(null);
    setDraftStrategy(null);
  };

  const saveEditedSection = () => {
    if (!draftStrategy || !editingSection) return;

    const patch: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>> =
      {
        approvalStatus: 'pending_approval',
        approvedAt: undefined,
      };

    switch (editingSection) {
      case 'overview':
        patch.campaignOverview = draftStrategy.campaignOverview;
        break;
      case 'objective':
        patch.campaignObjective = draftStrategy.campaignObjective;
        break;
      case 'targetAudience':
        patch.targetAudience = draftStrategy.targetAudience;
        if (draftStrategy.targetAudience) {
          patch.audienceInsight = draftStrategy.targetAudience.content;
        }
        break;
      case 'painPoints':
        patch.audiencePainPoints = draftStrategy.audiencePainPoints;
        break;
      case 'positioning':
        patch.campaignPositioning = draftStrategy.campaignPositioning;
        if (draftStrategy.campaignPositioning) {
          patch.positioningStatement = draftStrategy.campaignPositioning.content;
        }
        break;
      case 'coreMessage':
        patch.coreCampaignMessage = draftStrategy.coreCampaignMessage;
        break;
      case 'creativeDirections':
        patch.creativeDirections = draftStrategy.creativeDirections;
        break;
      case 'contentPillars':
        patch.contentPillars = draftStrategy.contentPillars;
        if (draftStrategy.contentPillars) {
          patch.pillars = draftStrategy.contentPillars.map((p) => ({
            id: p.id,
            title: p.title,
            description: `${p.whatToDo} (${p.supportedObjective})`,
          }));
        }
        break;
      case 'recommendedChannels':
        patch.recommendedChannels = draftStrategy.recommendedChannels;
        if (draftStrategy.recommendedChannels) {
          patch.primaryChannels = draftStrategy.recommendedChannels.map(
            (c) => c.channel
          );
        }
        break;
      case 'campaignPhases':
        patch.campaignPhases = draftStrategy.campaignPhases;
        break;
      case 'successMetrics':
        patch.successMetrics = draftStrategy.successMetrics;
        break;
    }

    saveStrategy(campaign.id, patch);
    setEditingSection(null);
    setDraftStrategy(null);
  };

  const handleApproveStrategy = () => {
    setApprovalNotice(null);
    if (!existingStrategy) return;
    if (
      existingStrategy.creativeDirections &&
      existingStrategy.creativeDirections.length > 0 &&
      !existingStrategy.selectedCreativeDirectionId
    ) {
      setApprovalNotice(
        'Select one preferred Creative Direction in Section 07 before approving the complete strategy.'
      );
      return;
    }
    approveStrategy(campaign.id);
  };

  const activeData =
    editingSection && draftStrategy ? draftStrategy : existingStrategy;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Strategy
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Evidence-grounded campaign strategy generated strictly from approved brief analyses.
          </p>
        </div>

        <CampaignSelector />
      </div>

      {/* Campaign & Brief Status Bar */}
      <div className="flex flex-col gap-4 rounded-lg border border-zinc-800/90 bg-[#111216] p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>{campaign.clientName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              {campaign.launchDate} — {campaign.endDate}
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
            {existingStrategy && (
              <StatusIndicator status={existingStrategy.approvalStatus} />
            )}
          </div>
          {linkedBrief?.analysis?.approved ? (
            <p className="max-w-3xl text-xs text-emerald-300/90">
              Confirmed Brief Source ({linkedBrief.analysis.readinessAssessment.status}):{' '}
              {linkedBrief.analysis.briefSummary}
            </p>
          ) : (
            <p className="max-w-3xl text-xs text-amber-300">
              {linkedBrief?.analysis
                ? 'Brief Analysis exists but has not been approved yet. Approve it in Briefs to unlock strategy generation.'
                : 'No approved brief analysis found. Analyse and approve this brief in Briefs first.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2">
            <label
              htmlFor="campaign-stage-select"
              className="text-xs text-zinc-400"
            >
              Stage
            </label>
            <select
              id="campaign-stage-select"
              value={campaign.status}
              onChange={(e) =>
                updateCampaignStatus(
                  campaign.id,
                  e.target.value as CampaignStatus
                )
              }
              className="rounded-md border border-zinc-800 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
            >
              <option value="draft">Draft</option>
              <option value="in_review">In Review</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <button
            type="button"
            disabled={!hasApprovedAnalysis || isGenerating}
            onClick={handleGenerateFull}
            title={
              !hasApprovedAnalysis
                ? 'Approve the brief analysis in Briefs before generating a strategy.'
                : undefined
            }
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span>
              {isGenerating
                ? 'Generating Strategy...'
                : hasGeneratedStrategy
                  ? 'Regenerate Strategy'
                  : 'Generate Strategy'}
            </span>
          </button>

          <button
            type="button"
            disabled={!isStrategyApproved}
            onClick={() => openCampaignInSection(campaign.id, 'planner')}
            title={
              isStrategyApproved
                ? 'Proceed to Campaign Planner'
                : 'Approve the complete strategy before proceeding to Campaign Planner.'
            }
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-500/60 hover:text-white disabled:cursor-not-allowed disabled:opacity-45"
          >
            {!isStrategyApproved && <Lock className="h-3 w-3 text-zinc-500" />}
            <span>Campaign Planner</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Error / Warning Banners */}
      {strategyError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-950/25 px-4 py-3 text-xs text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-semibold text-rose-100">
                Strategy Generation Error
              </div>
              <p className="mt-0.5 text-rose-300/90">{strategyError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStrategyError(null)}
            className="text-zinc-400 hover:text-zinc-200 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {approvalNotice && (
        <div
          role="alert"
          className="flex items-center justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-950/25 px-4 py-3 text-xs text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>{approvalNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setApprovalNotice(null)}
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
            Generating 11-section strategy and 3 creative directions from the approved brief analysis...
          </span>
        </div>
      )}

      {/* Gate when Brief Analysis is NOT approved */}
      {!hasApprovedAnalysis ? (
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-8 text-center space-y-4">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg border border-amber-500/30 bg-amber-950/20 text-amber-400">
            <Lock className="h-5 w-5" />
          </div>
          <div className="mx-auto max-w-lg space-y-1.5">
            <h3 className="font-display text-base font-semibold text-zinc-100">
              Approved Brief Analysis Required
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">
              {linkedBrief?.analysis
                ? 'An AI brief analysis exists for this campaign, but it is still pending your review and approval. Strategy generation cannot proceed from an unapproved brief analysis.'
                : 'Run the AI Brief Analyst on this client brief and approve the analysis before generating a campaign strategy.'}
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => setActiveNav('briefs')}
              className="inline-flex items-center gap-2 rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-500"
            >
              <span>
                {linkedBrief?.analysis
                  ? 'Review & Approve in Briefs'
                  : 'Go to Briefs'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : !hasGeneratedStrategy || !activeData ? (
        <EmptyState
          icon={Sparkles}
          title="Approved brief ready for strategy generation"
          description="Generate a structured 11-section campaign strategy with three proposed creative directions, channel rationales, phases, and measurable KPIs grounded strictly in the approved brief."
          primaryAction={{
            label: isGenerating
              ? 'Generating Strategy...'
              : 'Generate Campaign Strategy',
            onClick: handleGenerateFull,
          }}
        />
      ) : (
        <div className="space-y-5">
          {/* Clarification Requests if brief had gaps */}
          {activeData.clarificationNotes &&
            activeData.clarificationNotes.length > 0 && (
              <div className="rounded-lg border border-amber-500/35 bg-amber-950/15 p-4 space-y-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                  <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                  <span>
                    Brief Clarification Requests ({activeData.clarificationNotes.length})
                  </span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-xs text-amber-100/90">
                  {activeData.clarificationNotes.map((note, idx) => (
                    <li key={idx}>{note}</li>
                  ))}
                </ul>
              </div>
            )}

          {/* Approval Status Banner */}
          <div
            className={`flex flex-col gap-3 rounded-lg border px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${
              isStrategyApproved
                ? 'border-emerald-500/35 bg-emerald-950/20'
                : 'border-zinc-800 bg-[#111216]'
            }`}
          >
            <div className="text-xs">
              {isStrategyApproved ? (
                <div className="flex items-center gap-2 text-emerald-200">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>
                    <strong>Strategy Approved</strong> on{' '}
                    <span className="font-mono">
                      {activeData.approvedAt?.slice(0, 10) ?? 'today'}
                    </span>
                    . Campaign Planner is unlocked.
                  </span>
                </div>
              ) : (
                <div className="text-zinc-300">
                  <strong>Review & Approval Required:</strong> Edit or regenerate individual sections, select one preferred Creative Direction in Section 07, then approve the complete strategy to unlock Campaign Planner.
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              {!isStrategyApproved ? (
                <button
                  type="button"
                  onClick={handleApproveStrategy}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve Complete Strategy</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => openCampaignInSection(campaign.id, 'planner')}
                  className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
                >
                  <span>Proceed to Campaign Planner</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* 01. Campaign Overview */}
          {activeData.campaignOverview && (
            <StrategySectionShell
              sectionNumber="01"
              title="Campaign Overview"
              sectionKey="overview"
              sourceType={activeData.campaignOverview.sourceType}
              isEditing={editingSection === 'overview'}
              isRegenerating={regeneratingKey === 'overview'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('overview')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('overview', g)}
            >
              {editingSection === 'overview' ? (
                <TextBlockEditor
                  block={activeData.campaignOverview}
                  onChange={(next) =>
                    setDraftStrategy((prev) =>
                      prev ? { ...prev, campaignOverview: next } : prev
                    )
                  }
                />
              ) : (
                <TextBlockDisplay block={activeData.campaignOverview} />
              )}
            </StrategySectionShell>
          )}

          {/* 02. Campaign Objective */}
          {activeData.campaignObjective && (
            <StrategySectionShell
              sectionNumber="02"
              title="Campaign Objective"
              sectionKey="objective"
              sourceType={activeData.campaignObjective.sourceType}
              isEditing={editingSection === 'objective'}
              isRegenerating={regeneratingKey === 'objective'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('objective')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('objective', g)}
            >
              {editingSection === 'objective' ? (
                <TextBlockEditor
                  block={activeData.campaignObjective}
                  onChange={(next) =>
                    setDraftStrategy((prev) =>
                      prev ? { ...prev, campaignObjective: next } : prev
                    )
                  }
                />
              ) : (
                <TextBlockDisplay block={activeData.campaignObjective} />
              )}
            </StrategySectionShell>
          )}

          {/* 03. Target Audience */}
          {activeData.targetAudience && (
            <StrategySectionShell
              sectionNumber="03"
              title="Target Audience"
              sectionKey="targetAudience"
              sourceType={activeData.targetAudience.sourceType}
              isEditing={editingSection === 'targetAudience'}
              isRegenerating={regeneratingKey === 'targetAudience'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('targetAudience')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('targetAudience', g)}
            >
              {editingSection === 'targetAudience' ? (
                <TextBlockEditor
                  block={activeData.targetAudience}
                  onChange={(next) =>
                    setDraftStrategy((prev) =>
                      prev ? { ...prev, targetAudience: next } : prev
                    )
                  }
                />
              ) : (
                <TextBlockDisplay block={activeData.targetAudience} />
              )}
            </StrategySectionShell>
          )}

          {/* 04. Audience Pain Points */}
          {activeData.audiencePainPoints && (
            <StrategySectionShell
              sectionNumber="04"
              title="Audience Pain Points"
              sectionKey="painPoints"
              isEditing={editingSection === 'painPoints'}
              isRegenerating={regeneratingKey === 'painPoints'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('painPoints')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('painPoints', g)}
            >
              <div className="space-y-3">
                {activeData.audiencePainPoints.map((item, idx) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {editingSection === 'painPoints' ? (
                        <input
                          type="text"
                          value={item.painPoint}
                          onChange={(e) => {
                            const updated: StrategyPainPoint[] =
                              activeData.audiencePainPoints!.map((p, i) =>
                                i === idx
                                  ? { ...p, painPoint: e.target.value }
                                  : p
                              );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, audiencePainPoints: updated }
                                : prev
                            );
                          }}
                          className="min-w-0 flex-1 rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 text-sm font-semibold text-zinc-100 focus:border-violet-500 focus:outline-none"
                        />
                      ) : (
                        <h4 className="font-display text-sm font-semibold text-zinc-100">
                          {item.painPoint}
                        </h4>
                      )}
                      <SourceTraceBadge sourceType={item.sourceType} />
                    </div>

                    {editingSection === 'painPoints' ? (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <textarea
                          rows={2}
                          value={item.whatToDo}
                          onChange={(e) => {
                            const updated = activeData.audiencePainPoints!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whatToDo: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, audiencePainPoints: updated }
                                : prev
                            );
                          }}
                          placeholder="What should be done"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <textarea
                          rows={2}
                          value={item.whyRelevant}
                          onChange={(e) => {
                            const updated = activeData.audiencePainPoints!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whyRelevant: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, audiencePainPoints: updated }
                                : prev
                            );
                          }}
                          placeholder="Why it is relevant"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={item.supportedObjective}
                          onChange={(e) => {
                            const updated = activeData.audiencePainPoints!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, supportedObjective: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, audiencePainPoints: updated }
                                : prev
                            );
                          }}
                          placeholder="Supported objective"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={item.deliverableIdea}
                          onChange={(e) => {
                            const updated = activeData.audiencePainPoints!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, deliverableIdea: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, audiencePainPoints: updated }
                                : prev
                            );
                          }}
                          placeholder="Deliverable idea"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                        <div className="text-zinc-300">
                          <span className="font-medium text-zinc-400">
                            Action:
                          </span>{' '}
                          {item.whatToDo}
                        </div>
                        <div className="text-zinc-300">
                          <span className="font-medium text-zinc-400">
                            Relevance:
                          </span>{' '}
                          {item.whyRelevant}
                        </div>
                        <div className="text-zinc-400">
                          <span className="font-medium text-zinc-400">
                            Supports Objective:
                          </span>{' '}
                          {item.supportedObjective}
                        </div>
                        <div className="text-zinc-400">
                          <span className="font-medium text-zinc-400">
                            Deliverable:
                          </span>{' '}
                          {item.deliverableIdea}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </StrategySectionShell>
          )}

          {/* 05. Campaign Positioning */}
          {activeData.campaignPositioning && (
            <StrategySectionShell
              sectionNumber="05"
              title="Campaign Positioning"
              sectionKey="positioning"
              sourceType={activeData.campaignPositioning.sourceType}
              isEditing={editingSection === 'positioning'}
              isRegenerating={regeneratingKey === 'positioning'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('positioning')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('positioning', g)}
            >
              {editingSection === 'positioning' ? (
                <TextBlockEditor
                  block={activeData.campaignPositioning}
                  onChange={(next) =>
                    setDraftStrategy((prev) =>
                      prev ? { ...prev, campaignPositioning: next } : prev
                    )
                  }
                />
              ) : (
                <TextBlockDisplay block={activeData.campaignPositioning} />
              )}
            </StrategySectionShell>
          )}

          {/* 06. Core Campaign Message */}
          {activeData.coreCampaignMessage && (
            <StrategySectionShell
              sectionNumber="06"
              title="Core Campaign Message"
              sectionKey="coreMessage"
              sourceType={activeData.coreCampaignMessage.sourceType}
              isEditing={editingSection === 'coreMessage'}
              isRegenerating={regeneratingKey === 'coreMessage'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('coreMessage')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('coreMessage', g)}
            >
              {editingSection === 'coreMessage' ? (
                <TextBlockEditor
                  block={activeData.coreCampaignMessage}
                  onChange={(next) =>
                    setDraftStrategy((prev) =>
                      prev ? { ...prev, coreCampaignMessage: next } : prev
                    )
                  }
                />
              ) : (
                <TextBlockDisplay block={activeData.coreCampaignMessage} />
              )}
            </StrategySectionShell>
          )}

          {/* 07. Creative Direction (3 Distinct Options) */}
          {activeData.creativeDirections && (
            <StrategySectionShell
              sectionNumber="07"
              title="Creative Direction (3 Proposed Concepts)"
              sectionKey="creativeDirections"
              sourceType="STRATEGIC_RECOMMENDATION"
              isEditing={editingSection === 'creativeDirections'}
              isRegenerating={regeneratingKey === 'creativeDirections'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('creativeDirections')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) =>
                handleRegenerateSection('creativeDirections', g)
              }
            >
              <CreativeDirectionsComparison
                directions={activeData.creativeDirections}
                selectedId={activeData.selectedCreativeDirectionId}
                isEditing={editingSection === 'creativeDirections'}
                onSelect={(dirId) =>
                  selectCreativeDirection(campaign.id, dirId)
                }
                onUpdateDirection={(id, field, value) => {
                  const updated: CreativeDirectionOption[] =
                    activeData.creativeDirections!.map((d) =>
                      d.id === id ? { ...d, [field]: value } : d
                    );
                  setDraftStrategy((prev) =>
                    prev ? { ...prev, creativeDirections: updated } : prev
                  );
                }}
              />
            </StrategySectionShell>
          )}

          {/* 08. Content Pillars */}
          {activeData.contentPillars && (
            <StrategySectionShell
              sectionNumber="08"
              title="Content Pillars"
              sectionKey="contentPillars"
              isEditing={editingSection === 'contentPillars'}
              isRegenerating={regeneratingKey === 'contentPillars'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('contentPillars')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('contentPillars', g)}
            >
              <div className="space-y-3">
                {activeData.contentPillars.map((pillar, idx) => (
                  <div
                    key={pillar.id}
                    className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2.5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      {editingSection === 'contentPillars' ? (
                        <input
                          type="text"
                          value={pillar.title}
                          onChange={(e) => {
                            const updated: StrategyContentPillar[] =
                              activeData.contentPillars!.map((p, i) =>
                                i === idx ? { ...p, title: e.target.value } : p
                              );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, contentPillars: updated } : prev
                            );
                          }}
                          className="min-w-0 flex-1 rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 text-sm font-semibold text-zinc-100"
                        />
                      ) : (
                        <h4 className="font-display text-sm font-semibold text-zinc-100">
                          {pillar.title}
                        </h4>
                      )}
                      <SourceTraceBadge sourceType={pillar.sourceType} />
                    </div>

                    {editingSection === 'contentPillars' ? (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <textarea
                          rows={2}
                          value={pillar.whatToDo}
                          onChange={(e) => {
                            const updated = activeData.contentPillars!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whatToDo: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, contentPillars: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <textarea
                          rows={2}
                          value={pillar.whyRelevant}
                          onChange={(e) => {
                            const updated = activeData.contentPillars!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whyRelevant: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, contentPillars: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={pillar.supportedObjective}
                          onChange={(e) => {
                            const updated = activeData.contentPillars!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, supportedObjective: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, contentPillars: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={pillar.deliverableIdea}
                          onChange={(e) => {
                            const updated = activeData.contentPillars!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, deliverableIdea: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, contentPillars: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                        <div className="text-zinc-300">
                          <span className="font-medium text-zinc-400">
                            What to Do:
                          </span>{' '}
                          {pillar.whatToDo}
                        </div>
                        <div className="text-zinc-300">
                          <span className="font-medium text-zinc-400">
                            Why Relevant:
                          </span>{' '}
                          {pillar.whyRelevant}
                        </div>
                        <div className="text-zinc-400">
                          <span className="font-medium text-zinc-400">
                            Supports Objective:
                          </span>{' '}
                          {pillar.supportedObjective}
                        </div>
                        <div className="text-zinc-400">
                          <span className="font-medium text-zinc-400">
                            Deliverable:
                          </span>{' '}
                          {pillar.deliverableIdea}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </StrategySectionShell>
          )}

          {/* 09. Recommended Marketing Channels */}
          {activeData.recommendedChannels && (
            <StrategySectionShell
              sectionNumber="09"
              title="Recommended Marketing Channels"
              sectionKey="recommendedChannels"
              sourceType="STRATEGIC_RECOMMENDATION"
              isEditing={editingSection === 'recommendedChannels'}
              isRegenerating={regeneratingKey === 'recommendedChannels'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('recommendedChannels')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) =>
                handleRegenerateSection('recommendedChannels', g)
              }
            >
              <div className="space-y-3">
                {activeData.recommendedChannels.map((ch, idx) => (
                  <div
                    key={ch.id}
                    className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2.5"
                  >
                    {editingSection === 'recommendedChannels' ? (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <input
                          type="text"
                          value={ch.channel}
                          onChange={(e) => {
                            const updated: StrategyChannelRecommendation[] =
                              activeData.recommendedChannels!.map((c, i) =>
                                i === idx
                                  ? { ...c, channel: e.target.value }
                                  : c
                              );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, recommendedChannels: updated }
                                : prev
                            );
                          }}
                          className="md:col-span-2 rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 text-sm font-semibold text-zinc-100"
                        />
                        <textarea
                          rows={2}
                          value={ch.whatToDo}
                          onChange={(e) => {
                            const updated = activeData.recommendedChannels!.map(
                              (c, i) =>
                                i === idx
                                  ? { ...c, whatToDo: e.target.value }
                                  : c
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, recommendedChannels: updated }
                                : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <textarea
                          rows={2}
                          value={ch.whyRelevant}
                          onChange={(e) => {
                            const updated = activeData.recommendedChannels!.map(
                              (c, i) =>
                                i === idx
                                  ? { ...c, whyRelevant: e.target.value }
                                  : c
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, recommendedChannels: updated }
                                : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={ch.supportedObjective}
                          onChange={(e) => {
                            const updated = activeData.recommendedChannels!.map(
                              (c, i) =>
                                i === idx
                                  ? { ...c, supportedObjective: e.target.value }
                                  : c
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, recommendedChannels: updated }
                                : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={ch.deliverableIdea}
                          onChange={(e) => {
                            const updated = activeData.recommendedChannels!.map(
                              (c, i) =>
                                i === idx
                                  ? { ...c, deliverableIdea: e.target.value }
                                  : c
                            );
                            setDraftStrategy((prev) =>
                              prev
                                ? { ...prev, recommendedChannels: updated }
                                : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    ) : (
                      <>
                        <h4 className="font-display text-sm font-semibold text-zinc-100">
                          {ch.channel}
                        </h4>
                        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                          <div className="text-zinc-300">
                            <span className="font-medium text-zinc-400">
                              What to Do:
                            </span>{' '}
                            {ch.whatToDo}
                          </div>
                          <div className="text-zinc-300">
                            <span className="font-medium text-zinc-400">
                              Why Relevant:
                            </span>{' '}
                            {ch.whyRelevant}
                          </div>
                          <div className="text-zinc-400">
                            <span className="font-medium text-zinc-400">
                              Supports Objective:
                            </span>{' '}
                            {ch.supportedObjective}
                          </div>
                          <div className="text-zinc-400">
                            <span className="font-medium text-zinc-400">
                              Deliverable:
                            </span>{' '}
                            {ch.deliverableIdea}
                          </div>
                        </div>
                        {ch.uncertaintyNote && (
                          <div className="rounded border border-amber-500/30 bg-amber-950/20 px-3 py-1.5 text-xs text-amber-200">
                            <span className="font-medium">Uncertainty:</span>{' '}
                            {ch.uncertaintyNote}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </StrategySectionShell>
          )}

          {/* 10. Campaign Phases */}
          {activeData.campaignPhases && (
            <StrategySectionShell
              sectionNumber="10"
              title="Campaign Phases"
              sectionKey="campaignPhases"
              sourceType="STRATEGIC_RECOMMENDATION"
              isEditing={editingSection === 'campaignPhases'}
              isRegenerating={regeneratingKey === 'campaignPhases'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('campaignPhases')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('campaignPhases', g)}
            >
              <div className="space-y-3">
                {activeData.campaignPhases.map((phase, idx) => (
                  <div
                    key={phase.id}
                    className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2.5"
                  >
                    {editingSection === 'campaignPhases' ? (
                      <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                        <input
                          type="text"
                          value={phase.phaseName}
                          onChange={(e) => {
                            const updated: StrategyPhaseItem[] =
                              activeData.campaignPhases!.map((p, i) =>
                                i === idx
                                  ? { ...p, phaseName: e.target.value }
                                  : p
                              );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 text-sm font-semibold text-zinc-100"
                        />
                        <input
                          type="text"
                          value={phase.timeframe}
                          onChange={(e) => {
                            const updated = activeData.campaignPhases!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, timeframe: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1 font-mono text-xs text-zinc-200"
                        />
                        <textarea
                          rows={2}
                          value={phase.whatToDo}
                          onChange={(e) => {
                            const updated = activeData.campaignPhases!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whatToDo: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <textarea
                          rows={2}
                          value={phase.whyRelevant}
                          onChange={(e) => {
                            const updated = activeData.campaignPhases!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, whyRelevant: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          placeholder="Why it is relevant"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={phase.supportedObjective}
                          onChange={(e) => {
                            const updated = activeData.campaignPhases!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, supportedObjective: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          placeholder="Supported objective"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                        <input
                          type="text"
                          value={phase.deliverableIdea}
                          onChange={(e) => {
                            const updated = activeData.campaignPhases!.map(
                              (p, i) =>
                                i === idx
                                  ? { ...p, deliverableIdea: e.target.value }
                                  : p
                            );
                            setDraftStrategy((prev) =>
                              prev ? { ...prev, campaignPhases: updated } : prev
                            );
                          }}
                          placeholder="Deliverable idea"
                          className="rounded border border-zinc-700 bg-[#09090B] px-2.5 py-1.5 text-xs text-zinc-200"
                        />
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="font-display text-sm font-semibold text-zinc-100">
                            {phase.phaseName}
                          </h4>
                          <span className="font-mono text-xs text-zinc-400 tabular-nums">
                            {phase.timeframe}
                          </span>
                        </div>
                        <div className="grid grid-cols-1 gap-2 text-xs md:grid-cols-2">
                          <div className="text-zinc-300">
                            <span className="font-medium text-zinc-400">
                              What to Do:
                            </span>{' '}
                            {phase.whatToDo}
                          </div>
                          <div className="text-zinc-300">
                            <span className="font-medium text-zinc-400">
                              Why Relevant:
                            </span>{' '}
                            {phase.whyRelevant}
                          </div>
                          <div className="text-zinc-400">
                            <span className="font-medium text-zinc-400">
                              Supports Objective:
                            </span>{' '}
                            {phase.supportedObjective}
                          </div>
                          <div className="text-zinc-400">
                            <span className="font-medium text-zinc-400">
                              Deliverable:
                            </span>{' '}
                            {phase.deliverableIdea}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </StrategySectionShell>
          )}

          {/* 11. Success Metrics */}
          {activeData.successMetrics && (
            <StrategySectionShell
              sectionNumber="11"
              title="Success Metrics (Suggested KPIs)"
              sectionKey="successMetrics"
              sourceType="STRATEGIC_RECOMMENDATION"
              isEditing={editingSection === 'successMetrics'}
              isRegenerating={regeneratingKey === 'successMetrics'}
              canRegenerate={hasApprovedAnalysis}
              onToggleEdit={() => startEditing('successMetrics')}
              onSaveEdit={saveEditedSection}
              onCancelEdit={cancelEditing}
              onRegenerate={(g) => handleRegenerateSection('successMetrics', g)}
            >
              <div className="space-y-3">
                <p className="text-xs text-zinc-400">
                  Suggested measurable KPIs aligned to approved campaign objectives. No numeric target predictions or historical performance metrics are fabricated.
                </p>
                <div className="overflow-x-auto rounded-md border border-zinc-800/80">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-zinc-800 bg-[#0D0E12] text-zinc-400">
                      <tr>
                        <th className="px-4 py-2.5 font-medium">Suggested KPI</th>
                        <th className="px-4 py-2.5 font-medium">What It Measures</th>
                        <th className="px-4 py-2.5 font-medium">Supported Objective</th>
                        <th className="px-4 py-2.5 font-medium">Measurement Source</th>
                        <th className="px-4 py-2.5 font-medium">Distinction Note</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60 bg-[#09090B]">
                      {activeData.successMetrics.map((kpi, idx) => (
                        <tr key={kpi.id}>
                          <td className="px-4 py-3 font-medium text-zinc-100">
                            {editingSection === 'successMetrics' ? (
                              <input
                                type="text"
                                value={kpi.kpiName}
                                onChange={(e) => {
                                  const updated: StrategySuccessMetric[] =
                                    activeData.successMetrics!.map((m, i) =>
                                      i === idx
                                        ? { ...m, kpiName: e.target.value }
                                        : m
                                    );
                                  setDraftStrategy((prev) =>
                                    prev
                                      ? { ...prev, successMetrics: updated }
                                      : prev
                                  );
                                }}
                                className="w-full rounded border border-zinc-700 bg-[#111216] px-2 py-1 text-xs text-zinc-100"
                              />
                            ) : (
                              kpi.kpiName
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-300">
                            {editingSection === 'successMetrics' ? (
                              <input
                                type="text"
                                value={kpi.whatItMeasures}
                                onChange={(e) => {
                                  const updated = activeData.successMetrics!.map(
                                    (m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            whatItMeasures: e.target.value,
                                          }
                                        : m
                                  );
                                  setDraftStrategy((prev) =>
                                    prev
                                      ? { ...prev, successMetrics: updated }
                                      : prev
                                  );
                                }}
                                className="w-full rounded border border-zinc-700 bg-[#111216] px-2 py-1 text-xs text-zinc-200"
                              />
                            ) : (
                              kpi.whatItMeasures
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {editingSection === 'successMetrics' ? (
                              <input
                                type="text"
                                value={kpi.supportedObjective}
                                onChange={(e) => {
                                  const updated = activeData.successMetrics!.map(
                                    (m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            supportedObjective: e.target.value,
                                          }
                                        : m
                                  );
                                  setDraftStrategy((prev) =>
                                    prev
                                      ? { ...prev, successMetrics: updated }
                                      : prev
                                  );
                                }}
                                className="w-full rounded border border-zinc-700 bg-[#111216] px-2 py-1 text-xs text-zinc-200"
                              />
                            ) : (
                              kpi.supportedObjective
                            )}
                          </td>
                          <td className="px-4 py-3 text-zinc-400">
                            {editingSection === 'successMetrics' ? (
                              <input
                                type="text"
                                value={kpi.measurementSource}
                                onChange={(e) => {
                                  const updated = activeData.successMetrics!.map(
                                    (m, i) =>
                                      i === idx
                                        ? {
                                            ...m,
                                            measurementSource: e.target.value,
                                          }
                                        : m
                                  );
                                  setDraftStrategy((prev) =>
                                    prev
                                      ? { ...prev, successMetrics: updated }
                                      : prev
                                  );
                                }}
                                className="w-full rounded border border-zinc-700 bg-[#111216] px-2 py-1 text-xs text-zinc-200"
                              />
                            ) : (
                              kpi.measurementSource
                            )}
                          </td>
                          <td className="px-4 py-3 text-amber-300/90">
                            {editingSection === 'successMetrics' ? (
                              <input
                                type="text"
                                value={kpi.note}
                                onChange={(e) => {
                                  const updated = activeData.successMetrics!.map(
                                    (m, i) =>
                                      i === idx
                                        ? { ...m, note: e.target.value }
                                        : m
                                  );
                                  setDraftStrategy((prev) =>
                                    prev
                                      ? { ...prev, successMetrics: updated }
                                      : prev
                                  );
                                }}
                                className="w-full rounded border border-zinc-700 bg-[#111216] px-2 py-1 text-xs text-amber-200"
                              />
                            ) : (
                              kpi.note
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </StrategySectionShell>
          )}
        </div>
      )}
    </div>
  );
}
