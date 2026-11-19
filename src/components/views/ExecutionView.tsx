import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckSquare,
  Edit3,
  Kanban,
  Layers,
  Plus,
  Search,
  Table2,
  Trash2,
  Users,
} from 'lucide-react';
import { ExecutionAiPanel } from '@/src/components/execution/ExecutionAiPanel';
import { KanbanBoard } from '@/src/components/execution/KanbanBoard';
import { TaskEditorModal } from '@/src/components/execution/TaskEditorModal';
import { TeamManagerModal } from '@/src/components/execution/TeamManagerModal';
import { CampaignSelector } from '@/src/components/ui/CampaignSelector';
import { EmptyState } from '@/src/components/ui/EmptyState';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type {
  ExecutionTask,
  TaskPriority,
  TaskStatus,
} from '@/src/types/campaign';

type ExecutionViewMode = 'kanban' | 'table';

const STATUS_FILTER_OPTIONS: Array<{ id: TaskStatus | 'all'; label: string }> = [
  { id: 'all', label: 'All Statuses' },
  { id: 'not_started', label: 'Not Started' },
  { id: 'in_progress', label: 'In Progress' },
  { id: 'in_review', label: 'In Review' },
  { id: 'completed', label: 'Completed' },
  { id: 'blocked', label: 'Blocked' },
];

const PRIORITY_FILTER_OPTIONS: Array<{ id: TaskPriority | 'all'; label: string }> = [
  { id: 'all', label: 'All Priorities' },
  { id: 'urgent', label: 'Urgent' },
  { id: 'high', label: 'High' },
  { id: 'medium', label: 'Medium' },
  { id: 'low', label: 'Low' },
];

export function ExecutionView() {
  const {
    state,
    selectedCampaignId,
    setActiveNav,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    convertDeliverablesToTasks,
    addTeamMember,
    deleteTeamMember,
    runExecutionAssistant,
    openCampaignInSection,
  } = useCampaignWorkspace();

  const [viewMode, setViewMode] = useState<ExecutionViewMode>('kanban');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<TaskPriority | 'all'>('all');
  const [ownerFilter, setOwnerFilter] = useState<string>('all');

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTask, setEditingTask] = useState<ExecutionTask | null>(null);
  const [showTeamModal, setShowTeamModal] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  const campaign =
    state.campaigns.find((c) => c.id === selectedCampaignId) ??
    state.campaigns[0] ??
    null;

  const todayIso = new Date().toISOString().slice(0, 10);

  const campaignId = campaign?.id ?? '';

  const campaignPlan = useMemo(
    () => state.plans.find((p) => p.campaignId === campaignId),
    [state.plans, campaignId]
  );

  const isPlanApproved =
    campaignPlan?.approvalStatus === 'approved' || Boolean(campaign?.isDemo);

  const allCampaignDeliverables = useMemo(
    () => state.deliverables.filter((d) => d.campaignId === campaignId),
    [state.deliverables, campaignId]
  );

  const approvedDeliverables = useMemo(
    () =>
      allCampaignDeliverables.filter((d) => isPlanApproved && !d.isSuggested),
    [allCampaignDeliverables, isPlanApproved]
  );

  const unapprovedDeliverablesCount =
    allCampaignDeliverables.length - approvedDeliverables.length;

  const deliverableLookup = useMemo(
    () => new Map(allCampaignDeliverables.map((d) => [d.id, d.title])),
    [allCampaignDeliverables]
  );

  const allCampaignTasks = useMemo(
    () =>
      state.tasks
        .filter((t) => t.campaignId === campaignId)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [state.tasks, campaignId]
  );

  const unconvertedApprovedDeliverables = useMemo(() => {
    const linkedDeliverableIds = new Set(
      allCampaignTasks.map((t) => t.deliverableId).filter(Boolean)
    );
    return approvedDeliverables.filter((d) => !linkedDeliverableIds.has(d.id));
  }, [approvedDeliverables, allCampaignTasks]);

  const progressStats = useMemo(() => {
    const total = allCampaignTasks.length;
    const completed = allCampaignTasks.filter(
      (t) => t.status === 'completed'
    ).length;
    const inProgress = allCampaignTasks.filter(
      (t) => t.status === 'in_progress'
    ).length;
    const inReview = allCampaignTasks.filter(
      (t) => t.status === 'in_review'
    ).length;
    const blocked = allCampaignTasks.filter(
      (t) => t.status === 'blocked'
    ).length;
    const notStarted = allCampaignTasks.filter(
      (t) => t.status === 'not_started'
    ).length;
    const overdue = allCampaignTasks.filter(
      (t) =>
        t.status !== 'completed' &&
        Boolean(t.dueDate) &&
        t.dueDate < todayIso
    ).length;
    const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      inReview,
      blocked,
      notStarted,
      overdue,
      completionPct,
    };
  }, [allCampaignTasks, todayIso]);

  const filteredTasks = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return allCampaignTasks.filter((task) => {
      if (statusFilter !== 'all' && task.status !== statusFilter) return false;
      if (priorityFilter !== 'all' && task.priority !== priorityFilter) {
        return false;
      }
      const owner = task.assigneeName || 'Unassigned';
      if (ownerFilter !== 'all' && owner !== ownerFilter) return false;

      if (!q) return true;
      const deliverableTitle = task.deliverableId
        ? (deliverableLookup.get(task.deliverableId) ?? '')
        : '';
      return (
        task.title.toLowerCase().includes(q) ||
        task.description.toLowerCase().includes(q) ||
        task.notes.toLowerCase().includes(q) ||
        owner.toLowerCase().includes(q) ||
        deliverableTitle.toLowerCase().includes(q)
      );
    });
  }, [
    allCampaignTasks,
    statusFilter,
    priorityFilter,
    ownerFilter,
    searchQuery,
    deliverableLookup,
  ]);

  if (!campaign) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Execution
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Convert approved deliverables into tracked production tasks, manage owners, and monitor campaign progress.
          </p>
        </div>
        <EmptyState
          icon={CheckSquare}
          title="No active campaigns for execution"
          description="Create a client marketing brief first to plan deliverables and track execution tasks."
          primaryAction={{
            label: 'Go to Briefs',
            onClick: () => setActiveNav('briefs'),
          }}
        />
      </div>
    );
  }

  const executionReport = state.executionReports[campaign.id];

  const handleRunAssistant = async () => {
    setAiError(null);
    setAiLoading(true);
    const res = await runExecutionAssistant(campaign.id);
    setAiLoading(false);
    if (!res.ok) {
      setAiError(res.error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-zinc-100">
            Campaign Execution
          </h1>
          <p className="mt-1 text-sm text-zinc-400">
            Manage approved deliverables, team ownership, and task execution for{' '}
            <span className="text-zinc-200">{campaign.title}</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <CampaignSelector />
          <button
            type="button"
            onClick={() => setShowTeamModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#111216] px-3 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-700 hover:text-white"
          >
            <Users className="h-3.5 w-3.5 text-zinc-400" />
            <span>Team Owners</span>
            <span className="font-mono text-zinc-400 tabular-nums">
              ({state.teamMembers.length})
            </span>
          </button>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-500"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Create Task</span>
          </button>
        </div>
      </div>

      {/* Planner / Deliverables Readiness Banners */}
      {unapprovedDeliverablesCount > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-amber-500/35 bg-amber-950/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              {unapprovedDeliverablesCount} planned{' '}
              {unapprovedDeliverablesCount === 1
                ? 'deliverable is'
                : 'deliverables are'}{' '}
              awaiting plan approval in Campaign Planner before conversion to execution tasks.
            </span>
          </div>
          <button
            type="button"
            onClick={() => openCampaignInSection(campaign.id, 'planner')}
            className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-md border border-amber-500/40 bg-[#09090B] px-3 py-1.5 text-xs font-medium text-amber-200 hover:border-amber-400 sm:self-auto"
          >
            <span>Review in Planner</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {unconvertedApprovedDeliverables.length > 0 && (
        <div className="flex flex-col gap-3 rounded-lg border border-violet-500/35 bg-violet-950/15 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-violet-200">
            <Layers className="h-4 w-4 shrink-0 text-violet-400" />
            <span>
              {unconvertedApprovedDeliverables.length} approved{' '}
              {unconvertedApprovedDeliverables.length === 1
                ? 'deliverable does'
                : 'deliverables do'}{' '}
              not have an execution task yet.
            </span>
          </div>
          <button
            type="button"
            onClick={() =>
              convertDeliverablesToTasks(
                campaign.id,
                unconvertedApprovedDeliverables
              )
            }
            className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-md bg-violet-600 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-violet-500 sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>
              Convert Approved Deliverables ({unconvertedApprovedDeliverables.length})
            </span>
          </button>
        </div>
      )}

      {/* Progress Tracking Strip (Calculated strictly from real tasks) */}
      <section className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4 space-y-3.5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              Total Tasks
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-zinc-100 tabular-nums">
              {progressStats.total}
            </div>
          </div>

          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              Completed Tasks
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-emerald-400 tabular-nums">
              {progressStats.completed}
            </div>
          </div>

          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              In-Progress Tasks
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-indigo-400 tabular-nums">
              {progressStats.inProgress}
            </div>
          </div>

          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              Blocked Tasks
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                progressStats.blocked > 0 ? 'text-rose-400' : 'text-zinc-200'
              }`}
            >
              {progressStats.blocked}
            </div>
          </div>

          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              Overdue Tasks
            </div>
            <div
              className={`mt-1 font-mono text-xl font-semibold tabular-nums ${
                progressStats.overdue > 0 ? 'text-rose-400' : 'text-zinc-200'
              }`}
            >
              {progressStats.overdue}
            </div>
          </div>

          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-3.5 py-2.5">
            <div className="text-[11px] font-medium text-zinc-400">
              Overall Completion
            </div>
            <div className="mt-1 font-mono text-xl font-semibold text-zinc-100 tabular-nums">
              {progressStats.completionPct}%
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-zinc-900 flex">
            {progressStats.total > 0 && (
              <>
                {progressStats.completed > 0 && (
                  <div
                    style={{
                      width: `${(progressStats.completed / progressStats.total) * 100}%`,
                    }}
                    className="bg-emerald-500 transition-all"
                    title={`Completed: ${progressStats.completed}`}
                  />
                )}
                {progressStats.inReview > 0 && (
                  <div
                    style={{
                      width: `${(progressStats.inReview / progressStats.total) * 100}%`,
                    }}
                    className="bg-amber-400 transition-all"
                    title={`In Review: ${progressStats.inReview}`}
                  />
                )}
                {progressStats.inProgress > 0 && (
                  <div
                    style={{
                      width: `${(progressStats.inProgress / progressStats.total) * 100}%`,
                    }}
                    className="bg-indigo-500 transition-all"
                    title={`In Progress: ${progressStats.inProgress}`}
                  />
                )}
                {progressStats.blocked > 0 && (
                  <div
                    style={{
                      width: `${(progressStats.blocked / progressStats.total) * 100}%`,
                    }}
                    className="bg-rose-500 transition-all"
                    title={`Blocked: ${progressStats.blocked}`}
                  />
                )}
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Completed ({progressStats.completed})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                In Review ({progressStats.inReview})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-indigo-500" />
                In Progress ({progressStats.inProgress})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-rose-500" />
                Blocked ({progressStats.blocked})
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-zinc-600" />
                Not Started ({progressStats.notStarted})
              </span>
            </div>
            <span className="font-mono tabular-nums">
              {progressStats.completed}/{progressStats.total} tasks completed
            </span>
          </div>
        </div>
      </section>

      {/* View Switcher & Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Execution views"
          className="inline-flex items-center gap-1 self-start rounded-lg border border-zinc-800/90 bg-[#111216] p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'kanban'}
            onClick={() => setViewMode('kanban')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'kanban'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Kanban className="h-3.5 w-3.5" />
            <span>Kanban Board</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={viewMode === 'table'}
            onClick={() => setViewMode('table')}
            className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              viewMode === 'table'
                ? 'bg-zinc-800 text-zinc-100'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Table2 className="h-3.5 w-3.5" />
            <span>Task Table</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tasks, owners..."
              aria-label="Search execution tasks"
              className="w-48 rounded-md border border-zinc-800 bg-[#111216] pl-8 pr-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <select
            aria-label="Filter by status"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as TaskStatus | 'all')
            }
            className="rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
          >
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by priority"
            value={priorityFilter}
            onChange={(e) =>
              setPriorityFilter(e.target.value as TaskPriority | 'all')
            }
            className="rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
          >
            {PRIORITY_FILTER_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label="Filter by owner"
            value={ownerFilter}
            onChange={(e) => setOwnerFilter(e.target.value)}
            className="rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
          >
            <option value="all">All Owners</option>
            <option value="Unassigned">Unassigned</option>
            {state.teamMembers.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>

          <span className="ml-1 font-mono text-xs text-zinc-400 tabular-nums">
            {filteredTasks.length} shown
          </span>
        </div>
      </div>

      {/* Main Board or Table View */}
      {viewMode === 'kanban' ? (
        allCampaignTasks.length === 0 ? (
          <div className="rounded-lg border border-zinc-800/90 bg-[#111216] px-6 py-12 text-center space-y-3">
            <p className="text-sm font-medium text-zinc-200">
              No execution tasks for this campaign yet.
            </p>
            <p className="mx-auto max-w-md text-xs text-zinc-400">
              {unconvertedApprovedDeliverables.length > 0
                ? 'Convert your approved campaign deliverables into tasks above, or create a manual execution task.'
                : 'Approve your campaign plan in Campaign Planner or create an execution task manually.'}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              {unconvertedApprovedDeliverables.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    convertDeliverablesToTasks(
                      campaign.id,
                      unconvertedApprovedDeliverables
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white hover:bg-violet-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>
                    Convert Approved Deliverables (
                    {unconvertedApprovedDeliverables.length})
                  </span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-[#09090B] px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Create Task</span>
              </button>
            </div>
          </div>
        ) : (
          <KanbanBoard
            tasks={filteredTasks}
            deliverableLookup={deliverableLookup}
            todayIso={todayIso}
            onMoveStatus={(taskId, nextStatus) =>
              updateTaskStatus(taskId, nextStatus)
            }
            onEditTask={(task) => setEditingTask(task)}
            onDeleteTask={(taskId) => deleteTask(taskId)}
          />
        )
      ) : (
        <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
          {filteredTasks.length === 0 ? (
            <div className="px-5 py-12 text-center text-sm text-zinc-400">
              {allCampaignTasks.length === 0
                ? 'No execution tasks created for this campaign yet.'
                : 'No tasks match the current search or filter criteria.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-800/80 text-xs font-medium text-zinc-400">
                    <th className="px-5 py-3">Task</th>
                    <th className="px-4 py-3">Related Deliverable</th>
                    <th className="px-4 py-3">Owner</th>
                    <th className="px-4 py-3">Dates</th>
                    <th className="px-4 py-3">Priority</th>
                    <th className="px-4 py-3">Status & Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60">
                  {filteredTasks.map((task) => {
                    const linkedTitle = task.deliverableId
                      ? deliverableLookup.get(task.deliverableId)
                      : undefined;
                    const isOverdue =
                      task.status !== 'completed' &&
                      Boolean(task.dueDate) &&
                      task.dueDate < todayIso;
                    const currentOwner = task.assigneeName || 'Unassigned';
                    const ownerInMembers =
                      currentOwner === 'Unassigned' ||
                      state.teamMembers.some((m) => m.name === currentOwner);

                    return (
                      <tr
                        key={task.id}
                        className={`transition-colors hover:bg-zinc-900/50 ${
                          isOverdue ? 'bg-rose-950/10' : ''
                        }`}
                      >
                        <td className="px-5 py-3.5 align-top">
                          <button
                            type="button"
                            onClick={() => setEditingTask(task)}
                            className="text-left font-medium text-zinc-100 hover:text-violet-300"
                          >
                            {task.title}
                          </button>
                          {task.description && (
                            <p className="mt-0.5 line-clamp-1 max-w-xs text-xs text-zinc-400">
                              {task.description}
                            </p>
                          )}
                          {task.notes && (
                            <p className="mt-0.5 line-clamp-1 max-w-xs text-[11px] text-zinc-500">
                              Note: {task.notes}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top text-xs text-zinc-300">
                          {linkedTitle ? (
                            <span className="line-clamp-2 max-w-[190px]">
                              {linkedTitle}
                            </span>
                          ) : (
                            <span className="text-zinc-500">General task</span>
                          )}
                        </td>

                        <td className="px-4 py-3.5 align-top text-xs">
                          <select
                            aria-label={`Owner for ${task.title}`}
                            value={currentOwner}
                            onChange={(e) => {
                              const nextOwner = e.target.value;
                              updateTask(
                                task.id,
                                { assigneeName: nextOwner },
                                `Owner changed from ${currentOwner} to ${nextOwner}.`
                              );
                            }}
                            className="rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs text-zinc-200 focus:border-violet-500 focus:outline-none"
                          >
                            <option value="Unassigned">Unassigned</option>
                            {!ownerInMembers && (
                              <option value={currentOwner}>
                                {currentOwner}
                              </option>
                            )}
                            {state.teamMembers.map((m) => (
                              <option key={m.id} value={m.name}>
                                {m.name}
                              </option>
                            ))}
                          </select>
                          {task.suggestedOwner &&
                            task.suggestedOwner !== 'Unassigned' && (
                              <div className="mt-1 text-[11px] text-zinc-500">
                                Suggested: {task.suggestedOwner}
                              </div>
                            )}
                        </td>

                        <td className="px-4 py-3.5 align-top font-mono text-xs tabular-nums whitespace-nowrap">
                          <div className="text-zinc-400">
                            Start: {task.startDate}
                          </div>
                          <div
                            className={`mt-0.5 inline-flex items-center gap-1 ${
                              isOverdue ? 'text-rose-400' : 'text-zinc-200'
                            }`}
                          >
                            {isOverdue && (
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                            )}
                            <span>Due: {task.dueDate}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 align-top text-xs">
                          <select
                            aria-label={`Priority for ${task.title}`}
                            value={task.priority}
                            onChange={(e) => {
                              const nextPriority = e.target.value as TaskPriority;
                              updateTask(
                                task.id,
                                { priority: nextPriority },
                                `Priority changed from ${task.priority} to ${nextPriority}.`
                              );
                            }}
                            className={`rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs focus:border-violet-500 focus:outline-none ${
                              task.priority === 'urgent'
                                ? 'text-rose-400 font-semibold'
                                : task.priority === 'high'
                                  ? 'text-amber-400'
                                  : task.priority === 'low'
                                    ? 'text-zinc-400'
                                    : 'text-zinc-200'
                            }`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                        </td>

                        <td className="px-4 py-3.5 align-top">
                          <div className="flex items-center gap-2">
                            <StatusIndicator status={task.status} />
                            <select
                              aria-label={`Task status for ${task.title}`}
                              value={task.status}
                              onChange={(e) =>
                                updateTaskStatus(
                                  task.id,
                                  e.target.value as TaskStatus
                                )
                              }
                              className="rounded border border-zinc-800 bg-[#09090B] px-2 py-1 text-xs text-zinc-300 focus:border-violet-500 focus:outline-none"
                            >
                              <option value="not_started">Not Started</option>
                              <option value="in_progress">In Progress</option>
                              <option value="in_review">In Review</option>
                              <option value="completed">Completed</option>
                              <option value="blocked">Blocked</option>
                            </select>
                          </div>
                          <div className="mt-1 font-mono text-[10px] text-zinc-500 tabular-nums">
                            Updated {task.updatedAt.replace('T', ' ').slice(0, 16)}
                          </div>
                        </td>

                        <td className="px-5 py-3.5 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setEditingTask(task)}
                              aria-label={`Edit task ${task.title}`}
                              className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                            >
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteTask(task.id)}
                              aria-label={`Delete task ${task.title}`}
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

      {/* Contextual Execution AI Assistant */}
      <ExecutionAiPanel
        report={executionReport}
        isLoading={aiLoading}
        error={aiError}
        hasTasks={allCampaignTasks.length > 0}
        onRunAssistant={handleRunAssistant}
        onDismissError={() => setAiError(null)}
      />

      {/* Modals */}
      {showCreateModal && (
        <TaskEditorModal
          mode="create"
          deliverables={approvedDeliverables}
          teamMembers={state.teamMembers}
          onSave={(data) => {
            addTask(campaign.id, data);
            setShowCreateModal(false);
          }}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {editingTask && (
        <TaskEditorModal
          mode="edit"
          initialTask={editingTask}
          deliverables={approvedDeliverables}
          teamMembers={state.teamMembers}
          onSave={(data) => {
            updateTask(editingTask.id, data);
            setEditingTask(null);
          }}
          onClose={() => setEditingTask(null)}
        />
      )}

      {showTeamModal && (
        <TeamManagerModal
          teamMembers={state.teamMembers}
          onAddMember={(name, role) => addTeamMember(name, role)}
          onDeleteMember={(memberId) => deleteTeamMember(memberId)}
          onClose={() => setShowTeamModal(false)}
        />
      )}
    </div>
  );
}
