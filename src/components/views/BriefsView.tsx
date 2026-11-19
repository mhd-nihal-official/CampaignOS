import { useMemo, useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Edit3,
  Eye,
  FileSearch,
  FileText,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { BriefAnalysisView } from '@/src/components/briefs/BriefAnalysisView';
import { BriefDetailPanel } from '@/src/components/briefs/BriefDetailPanel';
import { BriefForm } from '@/src/components/briefs/BriefForm';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type { BriefFormInput } from '@/src/services/storage/campaignRepository';
import type { BriefStatus, ClientBrief } from '@/src/types/campaign';

type PanelMode =
  | { type: 'closed' }
  | { type: 'create' }
  | { type: 'view'; briefId: string }
  | { type: 'edit'; briefId: string }
  | { type: 'analysis'; briefId: string };

const STATUS_FILTERS: Array<{ id: BriefStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All Briefs' },
  { id: 'draft', label: 'Draft' },
  { id: 'ready_for_analysis', label: 'Ready for Analysis' },
  { id: 'analysed', label: 'Analysed' },
  { id: 'archived', label: 'Archived' },
];

export function BriefsView() {
  const {
    state,
    createBriefWithCampaign,
    updateBrief,
    runBriefAnalysis,
    approveBriefAnalysis,
    deleteCampaign,
    openCampaignInSection,
  } = useCampaignWorkspace();

  const [panelMode, setPanelMode] = useState<PanelMode>({ type: 'closed' });
  const [statusFilter, setStatusFilter] = useState<BriefStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingDeleteBrief, setPendingDeleteBrief] =
    useState<ClientBrief | null>(null);
  const [analysingBriefId, setAnalysingBriefId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  const filteredBriefs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return state.briefs.filter((b) => {
      if (statusFilter !== 'all' && b.briefStatus !== statusFilter) {
        return false;
      }
      if (!q) return true;
      return (
        b.campaignTitle.toLowerCase().includes(q) ||
        b.clientName.toLowerCase().includes(q) ||
        b.industry.toLowerCase().includes(q)
      );
    });
  }, [state.briefs, statusFilter, searchQuery]);

  const activeBrief = useMemo(() => {
    if (
      panelMode.type === 'view' ||
      panelMode.type === 'edit' ||
      panelMode.type === 'analysis'
    ) {
      return state.briefs.find((b) => b.id === panelMode.briefId) ?? null;
    }
    return null;
  }, [panelMode, state.briefs]);

  const handleCreateSave = (input: BriefFormInput) => {
    createBriefWithCampaign(input);
    setAnalysisError(null);
    setPanelMode({ type: 'closed' });
  };

  const handleEditSave = (briefId: string, input: BriefFormInput) => {
    updateBrief(briefId, input);
    setAnalysisError(null);
    setPanelMode({ type: 'view', briefId });
  };

  const handleRunAnalysis = async (brief: ClientBrief) => {
    setAnalysisError(null);
    setAnalysingBriefId(brief.id);

    const result = await runBriefAnalysis(brief.id);
    setAnalysingBriefId(null);

    if (!result.ok) {
      setAnalysisError(result.error);
      return;
    }

    setPanelMode({ type: 'analysis', briefId: brief.id });
  };

  const handleConfirmDelete = () => {
    if (!pendingDeleteBrief) return;
    const deletedId = pendingDeleteBrief.id;
    deleteCampaign(pendingDeleteBrief.campaignId);
    setPendingDeleteBrief(null);
    if (
      (panelMode.type === 'view' ||
        panelMode.type === 'edit' ||
        panelMode.type === 'analysis') &&
      panelMode.briefId === deletedId
    ) {
      setPanelMode({ type: 'closed' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Client Marketing Briefs
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Intake, analyse, and verify client marketing briefs before campaign strategy creation.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setAnalysisError(null);
            setPanelMode((prev) =>
              prev.type === 'create' ? { type: 'closed' } : { type: 'create' }
            );
          }}
          className="inline-flex items-center gap-2 self-start whitespace-nowrap rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>New Brief</span>
        </button>
      </div>

      {/* Delete Confirmation Dialog Banner */}
      {pendingDeleteBrief && (
        <div
          role="alertdialog"
          aria-labelledby="delete-brief-confirm-title"
          className="flex flex-col gap-4 rounded-lg border border-rose-500/40 bg-rose-950/25 px-5 py-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <h2
                id="delete-brief-confirm-title"
                className="text-sm font-semibold text-zinc-100"
              >
                Delete brief &ldquo;{pendingDeleteBrief.campaignTitle}&rdquo;?
              </h2>
              <p className="mt-0.5 text-xs text-zinc-300">
                This permanently removes the brief for {pendingDeleteBrief.clientName} and its linked campaign workspace from local storage.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => setPendingDeleteBrief(null)}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-zinc-800"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="rounded-md bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-500"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      )}

      {/* Analysis Error Banner */}
      {analysisError && (
        <div
          role="alert"
          className="flex items-start justify-between gap-4 rounded-lg border border-rose-500/40 bg-rose-950/25 px-4 py-3 text-xs text-rose-200"
        >
          <div className="flex items-start gap-2.5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-semibold text-rose-100">
                AI Brief Analysis Error
              </div>
              <p className="mt-0.5 text-rose-300/90">{analysisError}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAnalysisError(null)}
            className="text-zinc-400 hover:text-zinc-200 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* In-progress Analysis Banner */}
      {analysingBriefId && (
        <div className="flex items-center gap-3 rounded-lg border border-violet-500/35 bg-violet-950/20 px-4 py-3 text-xs text-violet-200">
          <Loader2 className="h-4 w-4 animate-spin text-violet-400 shrink-0" />
          <span>
            Running AI Brief Analyst via Gemini API — extracting provided facts, flagging inferences, detecting conflicts, and generating clarification questions...
          </span>
        </div>
      )}

      {/* Create / Edit / View / Analysis Panels */}
      {panelMode.type === 'create' && (
        <BriefForm
          mode="create"
          onSave={handleCreateSave}
          onCancel={() => setPanelMode({ type: 'closed' })}
        />
      )}

      {panelMode.type === 'edit' && activeBrief && (
        <BriefForm
          key={activeBrief.id}
          mode="edit"
          initialBrief={activeBrief}
          onSave={(input) => handleEditSave(activeBrief.id, input)}
          onCancel={() =>
            setPanelMode({ type: 'view', briefId: activeBrief.id })
          }
        />
      )}

      {panelMode.type === 'view' && activeBrief && (
        <BriefDetailPanel
          brief={activeBrief}
          isAnalysing={analysingBriefId === activeBrief.id}
          onEdit={() => setPanelMode({ type: 'edit', briefId: activeBrief.id })}
          onClose={() => setPanelMode({ type: 'closed' })}
          onRequestDelete={() => setPendingDeleteBrief(activeBrief)}
          onRunAnalysis={() => handleRunAnalysis(activeBrief)}
          onViewAnalysis={() =>
            setPanelMode({ type: 'analysis', briefId: activeBrief.id })
          }
          onOpenStrategy={() =>
            openCampaignInSection(activeBrief.campaignId, 'strategy')
          }
        />
      )}

      {panelMode.type === 'analysis' && activeBrief && activeBrief.analysis && (
        <BriefAnalysisView
          brief={activeBrief}
          analysis={activeBrief.analysis}
          isAnalysing={analysingBriefId === activeBrief.id}
          onEditBrief={() =>
            setPanelMode({ type: 'edit', briefId: activeBrief.id })
          }
          onApproveAnalysis={() => approveBriefAnalysis(activeBrief.id)}
          onRerunAnalysis={() => handleRunAnalysis(activeBrief)}
          onOpenStrategy={() =>
            openCampaignInSection(activeBrief.campaignId, 'strategy')
          }
          onClose={() => setPanelMode({ type: 'closed' })}
        />
      )}

      {/* Brief Management Table */}
      {state.briefs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No client briefs saved"
          description="Click New Brief to enter client information manually, upload a PDF/DOCX/TXT brief, or paste existing brief text."
          primaryAction={{
            label: 'New Brief',
            onClick: () => setPanelMode({ type: 'create' }),
          }}
        />
      ) : (
        <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
          <div className="flex flex-col gap-3 border-b border-zinc-800/80 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div
              role="tablist"
              aria-label="Filter briefs by status"
              className="flex flex-wrap items-center gap-1 rounded-md border border-zinc-800/80 bg-[#09090B] p-1"
            >
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter.id;
                return (
                  <button
                    key={filter.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setStatusFilter(filter.id)}
                    className={`rounded px-2.5 py-1 text-xs font-medium transition-colors whitespace-nowrap ${
                      active
                        ? 'bg-zinc-800 text-zinc-100'
                        : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                );
              })}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search brief, client, or industry..."
                aria-label="Search briefs"
                className="w-full rounded-md border border-zinc-800 bg-[#09090B] py-1.5 pl-8 pr-3 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {filteredBriefs.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-zinc-400">
              No briefs match the current filter or search query.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-xs font-medium text-zinc-400">
                    <th className="px-5 py-3">Brief Name</th>
                    <th className="px-4 py-3">Client Name</th>
                    <th className="px-4 py-3">Industry</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Campaign Period</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredBriefs.map((brief) => {
                    const isSelected =
                      (panelMode.type === 'view' ||
                        panelMode.type === 'edit' ||
                        panelMode.type === 'analysis') &&
                      panelMode.briefId === brief.id;
                    const isRowAnalysing = analysingBriefId === brief.id;

                    return (
                      <tr
                        key={brief.id}
                        className={`transition-colors ${
                          isSelected
                            ? 'bg-violet-500/5'
                            : 'hover:bg-zinc-900/50'
                        }`}
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              setPanelMode({ type: 'view', briefId: brief.id })
                            }
                            className="text-left font-medium text-zinc-100 transition-colors hover:text-violet-300"
                          >
                            {brief.campaignTitle}
                          </button>
                          {brief.isDemo && (
                            <span className="ml-2 font-mono text-[11px] text-violet-400">
                              DEMO
                            </span>
                          )}
                          {brief.analysis && (
                            <div className="mt-0.5 text-[11px] text-zinc-500">
                              {brief.analysis.readinessAssessment.status} ·{' '}
                              {brief.analysis.approved
                                ? 'Confirmed'
                                : 'Unapproved'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-300">
                          {brief.clientName}
                        </td>
                        <td className="px-4 py-3.5 text-xs text-zinc-400">
                          {brief.industry || '—'}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                          {brief.createdAt.slice(0, 10)}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                          {brief.launchDate} — {brief.endDate}
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusIndicator status={brief.briefStatus} />
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setPanelMode({
                                  type: 'view',
                                  briefId: brief.id,
                                })
                              }
                              title="View brief"
                              aria-label={`View ${brief.campaignTitle}`}
                              className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              <span>View</span>
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setPanelMode({
                                  type: 'edit',
                                  briefId: brief.id,
                                })
                              }
                              title="Edit brief"
                              aria-label={`Edit ${brief.campaignTitle}`}
                              className="inline-flex items-center gap-1 rounded border border-zinc-800 bg-zinc-900/70 px-2.5 py-1 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-white"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Edit</span>
                            </button>
                            {brief.analysis ? (
                              <button
                                type="button"
                                onClick={() =>
                                  setPanelMode({
                                    type: 'analysis',
                                    briefId: brief.id,
                                  })
                                }
                                title="View AI brief analysis"
                                aria-label={`View AI analysis for ${brief.campaignTitle}`}
                                className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/15 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/25 whitespace-nowrap"
                              >
                                <FileSearch className="h-3.5 w-3.5" />
                                <span>View Analysis</span>
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={isRowAnalysing}
                                onClick={() => handleRunAnalysis(brief)}
                                title="Submit for AI analysis"
                                aria-label={`Submit ${brief.campaignTitle} for AI analysis`}
                                className="inline-flex items-center gap-1 rounded border border-violet-500/40 bg-violet-500/10 px-2.5 py-1 text-xs font-medium text-violet-200 hover:bg-violet-500/20 disabled:opacity-50 whitespace-nowrap"
                              >
                                {isRowAnalysing ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Sparkles className="h-3.5 w-3.5" />
                                )}
                                <span>
                                  {isRowAnalysing
                                    ? 'Analysing...'
                                    : 'Submit for AI Analysis'}
                                </span>
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => setPendingDeleteBrief(brief)}
                              title="Delete brief"
                              aria-label={`Delete ${brief.campaignTitle}`}
                              className="rounded border border-zinc-800 p-1.5 text-zinc-500 transition-colors hover:border-rose-500/40 hover:text-rose-400"
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
    </div>
  );
}
