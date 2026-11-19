import {
  ArrowRight,
  CalendarClock,
  FolderKanban,
  Layers,
  Plus,
  Trash2,
} from 'lucide-react';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type { CampaignStatus } from '@/src/types/campaign';

const STATUS_ROWS: Array<{ key: CampaignStatus; label: string; barColor: string }> = [
  { key: 'active', label: 'Active', barColor: 'bg-emerald-500' },
  { key: 'in_review', label: 'In Review', barColor: 'bg-amber-500' },
  { key: 'draft', label: 'Draft', barColor: 'bg-zinc-500' },
  { key: 'completed', label: 'Completed', barColor: 'bg-violet-500' },
];

export function OverviewView() {
  const {
    state,
    metrics,
    hasDemoData,
    setActiveNav,
    openCampaignInSection,
    clearDemoData,
    restoreDemoData,
  } = useCampaignWorkspace();

  const todayIso = new Date().toISOString().slice(0, 10);

  const recentCampaigns = [...state.campaigns]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, 6);

  const upcomingDeliverableList = [...state.deliverables]
    .filter((d) => d.dueDate >= todayIso && d.approvalStatus !== 'scheduled')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 6);

  const campaignLookup = new Map(state.campaigns.map((c) => [c.id, c]));

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Workspace Overview
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Campaign pipeline health, approvals, and upcoming deliverables across active agency briefs.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setActiveNav('briefs')}
            className="inline-flex items-center gap-2 whitespace-nowrap rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
          >
            <Plus className="h-4 w-4" />
            <span>New Brief</span>
          </button>
        </div>
      </div>

      {hasDemoData && (
        <div className="flex flex-col gap-3 rounded-lg border border-violet-500/30 bg-violet-950/20 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-zinc-200">
            <span className="mr-2 font-mono text-xs font-medium text-violet-300">
              DEMO
            </span>
            <span className="text-zinc-300">
              A sample campaign is loaded to demonstrate CampaignOS metrics and workflow stages.
            </span>
          </div>
          <button
            type="button"
            onClick={clearDemoData}
            className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-md border border-zinc-700/80 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800 sm:self-auto"
          >
            <Trash2 className="h-3.5 w-3.5 text-zinc-400" />
            <span>Remove Demo Data</span>
          </button>
        </div>
      )}

      {/* Four Primary KPI Cards */}
      <section
        aria-label="Campaign Metrics"
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5">
          <div className="text-xs font-medium text-zinc-400">Total Campaigns</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {metrics.totalCampaigns}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500">
            {metrics.totalCampaigns === 0
              ? 'No briefs recorded yet'
              : `${state.briefs.length} client ${state.briefs.length === 1 ? 'brief' : 'briefs'} on file`}
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5">
          <div className="text-xs font-medium text-zinc-400">Active Campaigns</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {metrics.activeCampaigns}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500">
            Currently in active execution
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5">
          <div className="text-xs font-medium text-zinc-400">Pending Approvals</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {metrics.pendingApprovals}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500">
            Strategies & deliverables awaiting sign-off
          </div>
        </div>

        <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5">
          <div className="text-xs font-medium text-zinc-400">Upcoming Deliverables</div>
          <div className="mt-2 font-display text-3xl font-semibold tracking-tight text-zinc-100 tabular-nums">
            {metrics.upcomingDeliverables}
          </div>
          <div className="mt-1.5 text-xs text-zinc-500">
            Scheduled from today onward
          </div>
        </div>
      </section>

      {state.campaigns.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No campaigns in workspace"
          description="Create your first client marketing brief to structure a campaign strategy, content plan, deliverables, and execution timeline."
          primaryAction={{
            label: 'Create Client Brief',
            onClick: () => setActiveNav('briefs'),
          }}
          secondaryAction={{
            label: 'Load Demo Campaign',
            onClick: restoreDemoData,
          }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent Campaigns Table */}
          <section className="rounded-lg border border-zinc-800/90 bg-[#111216] lg:col-span-2">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-zinc-100">
                  Recent Campaigns
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Updated briefs and active campaign workspaces
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('briefs')}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                <span>View Briefs</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-xs font-medium text-zinc-400">
                    <th className="px-5 py-3">Campaign</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Launch Window</th>
                    <th className="px-5 py-3 text-right">Deliverables</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {recentCampaigns.map((campaign) => {
                    const count = state.deliverables.filter(
                      (d) => d.campaignId === campaign.id
                    ).length;
                    return (
                      <tr
                        key={campaign.id}
                        className="transition-colors hover:bg-zinc-900/50"
                      >
                        <td className="px-5 py-3.5">
                          <button
                            type="button"
                            onClick={() =>
                              openCampaignInSection(campaign.id, 'strategy')
                            }
                            className="text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                          >
                            <div className="font-medium text-zinc-100 hover:text-violet-300 transition-colors">
                              {campaign.title}
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                              <span>{campaign.clientName}</span>
                              {campaign.isDemo && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-mono text-[11px] text-violet-400">
                                    DEMO
                                  </span>
                                </>
                              )}
                            </div>
                          </button>
                        </td>
                        <td className="px-4 py-3.5">
                          <StatusIndicator status={campaign.status} />
                        </td>
                        <td className="px-4 py-3.5 font-mono text-xs text-zinc-400 tabular-nums whitespace-nowrap">
                          {campaign.launchDate} — {campaign.endDate}
                        </td>
                        <td className="px-5 py-3.5 text-right font-mono text-xs text-zinc-300 tabular-nums">
                          {count}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Campaign Status Overview */}
          <section className="rounded-lg border border-zinc-800/90 bg-[#111216] p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-semibold text-zinc-100">
                Campaign Status Overview
              </h2>
              <Layers className="h-4 w-4 text-zinc-500" />
            </div>
            <p className="mt-0.5 text-xs text-zinc-400">
              Distribution across workflow stages
            </p>

            <div className="mt-6 space-y-4">
              {STATUS_ROWS.map((row) => {
                const count = metrics.statusCounts[row.key];
                const pct =
                  metrics.totalCampaigns > 0
                    ? Math.round((count / metrics.totalCampaigns) * 100)
                    : 0;
                return (
                  <div key={row.key}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-zinc-300">
                        {row.label}
                      </span>
                      <span className="font-mono text-zinc-400 tabular-nums">
                        {count} ({pct}%)
                      </span>
                    </div>
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${row.barColor}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 border-t border-zinc-800/80 pt-4">
              <div className="flex items-center justify-between text-xs text-zinc-400">
                <span>Open Execution Tasks</span>
                <span className="font-mono font-medium text-zinc-200 tabular-nums">
                  {state.tasks.filter((t) => t.status !== 'completed').length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-zinc-400">
                <span>Completed Milestones</span>
                <span className="font-mono font-medium text-zinc-200 tabular-nums">
                  {state.milestones.filter((m) => m.completed).length} /{' '}
                  {state.milestones.length}
                </span>
              </div>
            </div>
          </section>

          {/* Upcoming Deliverables */}
          <section className="rounded-lg border border-zinc-800/90 bg-[#111216] lg:col-span-3">
            <div className="flex items-center justify-between border-b border-zinc-800/80 px-5 py-4">
              <div>
                <h2 className="font-display text-base font-semibold text-zinc-100">
                  Upcoming Deliverables
                </h2>
                <p className="mt-0.5 text-xs text-zinc-400">
                  Scheduled content deliverables sorted by due date
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveNav('planner')}
                className="inline-flex items-center gap-1 text-xs font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                <span>Open Planner</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {upcomingDeliverableList.length === 0 ? (
              <div className="flex items-center justify-between px-5 py-8 text-sm text-zinc-400">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-4 w-4 text-zinc-500" />
                  <span>No upcoming deliverables scheduled yet.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveNav('planner')}
                  className="text-xs font-medium text-violet-400 hover:text-violet-300"
                >
                  Add Deliverable
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-zinc-800/80 text-xs font-medium text-zinc-400">
                      <th className="px-5 py-3">Deliverable</th>
                      <th className="px-4 py-3">Campaign</th>
                      <th className="px-4 py-3">Channel & Format</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-5 py-3 text-right">Due Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {upcomingDeliverableList.map((item) => {
                      const parent = campaignLookup.get(item.campaignId);
                      return (
                        <tr
                          key={item.id}
                          className="transition-colors hover:bg-zinc-900/50"
                        >
                          <td className="px-5 py-3 font-medium text-zinc-100">
                            {item.title}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-400">
                            {parent ? (
                              <button
                                type="button"
                                onClick={() =>
                                  openCampaignInSection(parent.id, 'planner')
                                }
                                className="hover:text-zinc-200 transition-colors"
                              >
                                {parent.title}
                              </button>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-zinc-400">
                            {item.channel} · {item.format}
                          </td>
                          <td className="px-4 py-3">
                            <StatusIndicator status={item.approvalStatus} />
                          </td>
                          <td className="px-5 py-3 text-right font-mono text-xs text-zinc-300 tabular-nums whitespace-nowrap">
                            {item.dueDate}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
