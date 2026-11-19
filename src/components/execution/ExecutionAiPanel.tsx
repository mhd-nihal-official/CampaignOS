import { AlertCircle, AlertTriangle, Loader2, Sparkles } from 'lucide-react';
import type { ExecutionAssistanceReport } from '@/src/types/campaign';

interface ExecutionAiPanelProps {
  report?: ExecutionAssistanceReport;
  isLoading: boolean;
  error: string | null;
  hasTasks: boolean;
  onRunAssistant: () => void;
  onDismissError: () => void;
}

export function ExecutionAiPanel({
  report,
  isLoading,
  error,
  hasTasks,
  onRunAssistant,
  onDismissError,
}: ExecutionAiPanelProps) {
  return (
    <section className="rounded-lg border border-zinc-800/90 bg-[#111216]">
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-base font-semibold text-zinc-100">
            Execution AI Assistant
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Advisory review of progress, outstanding work, overdue tasks, scheduling risks, and prioritization. Never alters tasks automatically.
          </p>
        </div>

        <button
          type="button"
          disabled={!hasTasks || isLoading}
          onClick={onRunAssistant}
          className="inline-flex items-center gap-1.5 self-start whitespace-nowrap rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45 sm:self-auto"
        >
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Sparkles className="h-3.5 w-3.5" />
          )}
          <span>
            {isLoading
              ? 'Analysing Execution...'
              : report
                ? 'Refresh Analysis'
                : 'Analyze Execution Status'}
          </span>
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 flex items-start justify-between gap-3 rounded-md border border-rose-500/40 bg-rose-950/25 px-3.5 py-2.5 text-xs text-rose-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={onDismissError}
            className="text-zinc-400 hover:text-zinc-200 shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {!report && !isLoading && (
        <div className="px-5 py-6 text-xs text-zinc-400">
          {hasTasks
            ? 'Click "Analyze Execution Status" to review bottlenecks, overdue items, scheduling conflicts, and advisory priority suggestions.'
            : 'Add or convert approved deliverables into execution tasks to enable contextual AI execution assistance.'}
        </div>
      )}

      {report && (
        <div className="space-y-4 p-5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400">
            <span>
              Advisory Only · Human confirmation required for all task updates
            </span>
            <span className="font-mono tabular-nums">
              Generated {report.generatedAt.replace('T', ' ').slice(0, 16)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-1.5">
              <div className="font-semibold text-zinc-200">
                Campaign Progress Summary
              </div>
              <p className="leading-relaxed text-zinc-300">
                {report.progressSummary}
              </p>
            </div>

            <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-1.5">
              <div className="font-semibold text-zinc-200">
                Outstanding Work Summary
              </div>
              <p className="leading-relaxed text-zinc-300">
                {report.outstandingWorkSummary}
              </p>
            </div>
          </div>

          {report.overdueTasks.length > 0 && (
            <div className="rounded-md border border-rose-500/35 bg-rose-950/15 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-rose-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>Overdue Tasks ({report.overdueTasks.length})</span>
              </div>
              <ul className="space-y-1.5 text-rose-100/90">
                {report.overdueTasks.map((item, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-white">
                      {item.taskTitle}
                    </span>{' '}
                    (Due{' '}
                    <span className="font-mono tabular-nums">
                      {item.dueDate}
                    </span>{' '}
                    · {item.currentStatus}) — {item.impact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.schedulingConflicts.length > 0 && (
            <div className="rounded-md border border-amber-500/35 bg-amber-950/15 p-4 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-amber-300">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
                <span>
                  Scheduling Conflicts ({report.schedulingConflicts.length})
                </span>
              </div>
              <ul className="space-y-1.5 text-amber-100/90">
                {report.schedulingConflicts.map((c, idx) => (
                  <li key={idx}>
                    <span className="font-medium text-white">{c.topic}:</span>{' '}
                    {c.explanation}
                    {c.affectedTasks.length > 0 && (
                      <span className="text-zinc-400">
                        {' '}
                        (Tasks: {c.affectedTasks.join(', ')})
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.prioritizationSuggestions.length > 0 && (
            <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2">
              <div className="font-semibold text-zinc-200">
                Suggested Prioritization (Advisory — Review Before Applying)
              </div>
              <div className="divide-y divide-zinc-800/60">
                {report.prioritizationSuggestions.map((s, idx) => (
                  <div
                    key={idx}
                    className="py-2 first:pt-0 last:pb-0 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="font-medium text-zinc-100">
                        {s.taskTitle}
                      </div>
                      <div className="text-zinc-400">{s.rationale}</div>
                    </div>
                    <div className="font-mono text-[11px] text-violet-300 shrink-0">
                      {s.currentPriority} → {s.suggestedPriority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
