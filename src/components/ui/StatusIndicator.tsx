import type {
  ApprovalStatus,
  BriefStatus,
  CampaignStatus,
  DeliverableStatus,
  TaskStatus,
} from '@/src/types/campaign';

type StatusValue =
  | CampaignStatus
  | ApprovalStatus
  | DeliverableStatus
  | TaskStatus
  | BriefStatus;

const STATUS_META: Record<
  StatusValue,
  { label: string; colorClass: string; markerClass: string }
> = {
  draft: {
    label: 'Draft',
    colorClass: 'text-zinc-400',
    markerClass: 'bg-zinc-500',
  },
  ready_for_analysis: {
    label: 'Ready for Analysis',
    colorClass: 'text-violet-300',
    markerClass: 'bg-violet-400',
  },
  analysed: {
    label: 'Analysed',
    colorClass: 'text-emerald-400',
    markerClass: 'bg-emerald-400',
  },
  archived: {
    label: 'Archived',
    colorClass: 'text-zinc-500',
    markerClass: 'bg-zinc-600',
  },
  in_review: {
    label: 'In Review',
    colorClass: 'text-amber-400',
    markerClass: 'bg-amber-400',
  },
  active: {
    label: 'Active',
    colorClass: 'text-emerald-400',
    markerClass: 'bg-emerald-400',
  },
  completed: {
    label: 'Completed',
    colorClass: 'text-violet-300',
    markerClass: 'bg-violet-400',
  },
  pending_approval: {
    label: 'Pending Approval',
    colorClass: 'text-amber-400',
    markerClass: 'bg-amber-400',
  },
  approved: {
    label: 'Approved',
    colorClass: 'text-emerald-400',
    markerClass: 'bg-emerald-400',
  },
  changes_requested: {
    label: 'Changes Requested',
    colorClass: 'text-rose-400',
    markerClass: 'bg-rose-400',
  },
  planned: {
    label: 'Planned',
    colorClass: 'text-zinc-400',
    markerClass: 'bg-zinc-500',
  },
  in_production: {
    label: 'In Production',
    colorClass: 'text-indigo-300',
    markerClass: 'bg-indigo-400',
  },
  scheduled: {
    label: 'Scheduled',
    colorClass: 'text-emerald-400',
    markerClass: 'bg-emerald-400',
  },
  not_started: {
    label: 'Not Started',
    colorClass: 'text-zinc-400',
    markerClass: 'bg-zinc-500',
  },
  in_progress: {
    label: 'In Progress',
    colorClass: 'text-indigo-300',
    markerClass: 'bg-indigo-400',
  },
  blocked: {
    label: 'Blocked',
    colorClass: 'text-rose-400',
    markerClass: 'bg-rose-400',
  },
};

export function StatusIndicator({ status }: { status: StatusValue }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-2 whitespace-nowrap text-xs font-medium ${meta.colorClass}`}
    >
      <span
        className={`h-1.5 w-1.5 shrink-0 rounded-full ${meta.markerClass}`}
        aria-hidden="true"
      />
      <span>{meta.label}</span>
    </span>
  );
}
