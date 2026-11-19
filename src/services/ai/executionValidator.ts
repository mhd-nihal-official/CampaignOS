import type {
  ExecutionAssistanceReport,
  ExecutionOverdueItem,
  ExecutionPrioritySuggestion,
  ExecutionScheduleConflictItem,
  TaskPriority,
} from '../../types/campaign.ts';

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asNonEmptyString(val: unknown, fieldPath: string): string {
  if (typeof val !== 'string' || !val.trim()) {
    throw new Error(`Invalid or empty string for "${fieldPath}".`);
  }
  return val.trim();
}

function normalizeTaskPriority(val: unknown): TaskPriority {
  if (typeof val === 'string') {
    const lower = val.trim().toLowerCase();
    if (
      lower === 'low' ||
      lower === 'medium' ||
      lower === 'high' ||
      lower === 'urgent'
    ) {
      return lower;
    }
  }
  return 'medium';
}

export function validateExecutionAssistancePayload(
  raw: unknown,
  meta: {
    campaignId: string;
    model: string;
    generatedAt: string;
  }
): ExecutionAssistanceReport {
  if (!isRecord(raw)) {
    throw new Error('Execution assistant payload must be a JSON object.');
  }

  const progressSummary = asNonEmptyString(
    raw.progressSummary,
    'progressSummary'
  );
  const outstandingWorkSummary = asNonEmptyString(
    raw.outstandingWorkSummary,
    'outstandingWorkSummary'
  );

  const overdueTasks: ExecutionOverdueItem[] = Array.isArray(raw.overdueTasks)
    ? raw.overdueTasks.map((item, idx) => {
        if (!isRecord(item)) {
          throw new Error(`overdueTasks[${idx}] must be an object.`);
        }
        return {
          taskTitle: asNonEmptyString(
            item.taskTitle,
            `overdueTasks[${idx}].taskTitle`
          ),
          dueDate: asNonEmptyString(
            item.dueDate,
            `overdueTasks[${idx}].dueDate`
          ),
          currentStatus: asNonEmptyString(
            item.currentStatus,
            `overdueTasks[${idx}].currentStatus`
          ),
          impact: asNonEmptyString(item.impact, `overdueTasks[${idx}].impact`),
        };
      })
    : [];

  const schedulingConflicts: ExecutionScheduleConflictItem[] = Array.isArray(
    raw.schedulingConflicts
  )
    ? raw.schedulingConflicts.map((item, idx) => {
        if (!isRecord(item)) {
          throw new Error(`schedulingConflicts[${idx}] must be an object.`);
        }
        return {
          topic: asNonEmptyString(
            item.topic,
            `schedulingConflicts[${idx}].topic`
          ),
          explanation: asNonEmptyString(
            item.explanation,
            `schedulingConflicts[${idx}].explanation`
          ),
          affectedTasks: Array.isArray(item.affectedTasks)
            ? item.affectedTasks.filter(
                (t): t is string => typeof t === 'string' && t.trim().length > 0
              )
            : [],
        };
      })
    : [];

  const prioritizationSuggestions: ExecutionPrioritySuggestion[] =
    Array.isArray(raw.prioritizationSuggestions)
      ? raw.prioritizationSuggestions.map((item, idx) => {
          if (!isRecord(item)) {
            throw new Error(
              `prioritizationSuggestions[${idx}] must be an object.`
            );
          }
          return {
            taskTitle: asNonEmptyString(
              item.taskTitle,
              `prioritizationSuggestions[${idx}].taskTitle`
            ),
            currentPriority: asNonEmptyString(
              item.currentPriority,
              `prioritizationSuggestions[${idx}].currentPriority`
            ),
            suggestedPriority: normalizeTaskPriority(item.suggestedPriority),
            rationale: asNonEmptyString(
              item.rationale,
              `prioritizationSuggestions[${idx}].rationale`
            ),
          };
        })
      : [];

  return {
    id: `exec_${meta.campaignId}_${Date.now().toString(36)}`,
    campaignId: meta.campaignId,
    model: meta.model,
    generatedAt: meta.generatedAt,
    progressSummary,
    outstandingWorkSummary,
    overdueTasks,
    schedulingConflicts,
    prioritizationSuggestions,
  };
}
