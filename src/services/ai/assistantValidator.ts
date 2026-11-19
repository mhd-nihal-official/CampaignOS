import {
  SUPPORTED_CONTENT_FORMATS,
  type AssistantProposedAction,
  type AssistantStructuredResponse,
  type ContentPlanDeliverable,
  type DeliverablePriority,
  type ExecutionTask,
  type TaskPriority,
  type TaskStatus,
} from '../../types/campaign.ts';

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter(Boolean);
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function validIsoDate(value: unknown, fallback: string): string {
  const s = asString(value);
  return ISO_DATE_RE.test(s) ? s : fallback;
}

function normalizeTaskStatus(value: unknown): TaskStatus | undefined {
  const s = asString(value);
  if (
    s === 'not_started' ||
    s === 'in_progress' ||
    s === 'in_review' ||
    s === 'completed' ||
    s === 'blocked'
  ) {
    return s;
  }
  return undefined;
}

function normalizeTaskPriority(value: unknown): TaskPriority | undefined {
  const s = asString(value);
  if (s === 'low' || s === 'medium' || s === 'high' || s === 'urgent') {
    return s;
  }
  return undefined;
}

function normalizeDeliverablePriority(value: unknown): DeliverablePriority {
  const s = asString(value);
  if (s === 'low' || s === 'normal' || s === 'high') {
    return s;
  }
  return 'normal';
}

function normalizeContentFormat(value: unknown): string {
  const s = asString(value);
  if (
    (SUPPORTED_CONTENT_FORMATS as readonly string[]).includes(s)
  ) {
    return s;
  }
  return 'Other';
}

function sanitizeOwnerName(
  candidate: unknown,
  validTeamMemberNames: Set<string>
): string {
  const name = asString(candidate);
  if (!name || name.toLowerCase() === 'unassigned') return 'Unassigned';
  for (const realMember of validTeamMemberNames) {
    if (realMember.toLowerCase() === name.toLowerCase()) {
      return realMember;
    }
  }
  // Never invent employee names not in workspace team members
  return 'Unassigned';
}

function createActionId(index: number): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 6)
      : Math.random().toString(36).slice(2, 8);
  return `act_${Date.now().toString(36)}_${rand}_${index}`;
}

export interface AssistantValidationContext {
  todayIso: string;
  tasks: ExecutionTask[];
  deliverables: ContentPlanDeliverable[];
  teamMemberNames: string[];
}

export function validateAssistantResponsePayload(
  raw: unknown,
  ctx: AssistantValidationContext
): AssistantStructuredResponse {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('Assistant response must be a JSON object.');
  }

  const record = raw as Record<string, unknown>;
  const answer = asString(record.answer);
  if (!answer) {
    throw new Error('Assistant response is missing answer text.');
  }

  const recordedFacts = asStringArray(record.recordedFacts);
  const suggestions = asStringArray(record.suggestions);
  const missingOrUnavailable = asStringArray(record.missingOrUnavailable);

  const taskById = new Map(ctx.tasks.map((t) => [t.id, t]));
  const taskByTitleLower = new Map(
    ctx.tasks.map((t) => [t.title.trim().toLowerCase(), t])
  );
  const deliverableById = new Map(ctx.deliverables.map((d) => [d.id, d]));
  const deliverableByTitleLower = new Map(
    ctx.deliverables.map((d) => [d.title.trim().toLowerCase(), d])
  );
  const validTeamMembers = new Set(
    ctx.teamMemberNames.map((n) => n.trim()).filter(Boolean)
  );

  const rawActions = Array.isArray(record.proposedActions)
    ? record.proposedActions
    : [];
  const proposedActions: AssistantProposedAction[] = [];

  for (let i = 0; i < rawActions.length; i += 1) {
    const item = rawActions[i];
    if (!item || typeof item !== 'object') continue;
    const act = item as Record<string, unknown>;
    const actionType = asString(act.actionType);
    const summary = asString(act.summary);

    if (!summary) continue;

    if (actionType === 'create_task') {
      const p = act.taskPayload as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') continue;
      const title = asString(p.title);
      if (!title) continue;

      const rawDelivId = asString(p.deliverableId);
      const deliverableId = rawDelivId && deliverableById.has(rawDelivId)
        ? rawDelivId
        : undefined;

      const startDate = validIsoDate(p.startDate, ctx.todayIso);
      const dueDate = validIsoDate(p.dueDate, startDate);

      proposedActions.push({
        id: createActionId(i),
        actionType: 'create_task',
        summary,
        status: 'pending',
        payload: {
          title,
          description: asString(p.description),
          deliverableId,
          suggestedOwner: asString(p.suggestedOwner, 'Unassigned'),
          assigneeName: sanitizeOwnerName(p.assigneeName, validTeamMembers),
          startDate,
          dueDate,
          priority: normalizeTaskPriority(p.priority) ?? 'medium',
          status: normalizeTaskStatus(p.status) ?? 'not_started',
          notes: asString(p.notes),
        },
      });
      continue;
    }

    if (actionType === 'update_task') {
      const p = act.updateTaskPayload as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') continue;
      const rawId = asString(p.taskId);
      const rawTitle = asString(p.taskTitle);
      const matchedTask =
        (rawId ? taskById.get(rawId) : undefined) ??
        (rawTitle ? taskByTitleLower.get(rawTitle.toLowerCase()) : undefined);
      if (!matchedTask) continue;

      const updatesRaw =
        p.updates && typeof p.updates === 'object'
          ? (p.updates as Record<string, unknown>)
          : {};

      const nextStatus = normalizeTaskStatus(updatesRaw.status);
      const nextPriority = normalizeTaskPriority(updatesRaw.priority);
      const nextStart = ISO_DATE_RE.test(asString(updatesRaw.startDate))
        ? asString(updatesRaw.startDate)
        : undefined;
      const nextDue = ISO_DATE_RE.test(asString(updatesRaw.dueDate))
        ? asString(updatesRaw.dueDate)
        : undefined;
      const nextNotes =
        typeof updatesRaw.notes === 'string' && updatesRaw.notes.trim()
          ? updatesRaw.notes.trim()
          : undefined;
      const nextOwnerRaw = asString(updatesRaw.assigneeName);
      const nextOwner = nextOwnerRaw
        ? sanitizeOwnerName(nextOwnerRaw, validTeamMembers)
        : undefined;

      if (
        !nextStatus &&
        !nextPriority &&
        !nextStart &&
        !nextDue &&
        !nextNotes &&
        !nextOwner
      ) {
        continue;
      }

      proposedActions.push({
        id: createActionId(i),
        actionType: 'update_task',
        summary,
        status: 'pending',
        payload: {
          taskId: matchedTask.id,
          taskTitle: matchedTask.title,
          updates: {
            ...(nextStatus ? { status: nextStatus } : {}),
            ...(nextPriority ? { priority: nextPriority } : {}),
            ...(nextStart ? { startDate: nextStart } : {}),
            ...(nextDue ? { dueDate: nextDue } : {}),
            ...(nextOwner ? { assigneeName: nextOwner } : {}),
            ...(nextNotes ? { notes: nextNotes } : {}),
          },
        },
      });
      continue;
    }

    if (actionType === 'change_suggested_deadline') {
      const p = act.deadlinePayload as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') continue;
      const targetType = asString(p.targetType);
      const rawId = asString(p.targetId);
      const rawTitle = asString(p.targetTitle);
      const proposedDueDate = asString(p.proposedDueDate);
      if (!ISO_DATE_RE.test(proposedDueDate)) continue;

      if (targetType === 'task') {
        const matchedTask =
          (rawId ? taskById.get(rawId) : undefined) ??
          (rawTitle ? taskByTitleLower.get(rawTitle.toLowerCase()) : undefined);
        if (!matchedTask) continue;

        proposedActions.push({
          id: createActionId(i),
          actionType: 'change_suggested_deadline',
          summary,
          status: 'pending',
          payload: {
            targetType: 'task',
            targetId: matchedTask.id,
            targetTitle: matchedTask.title,
            currentDueDate: matchedTask.dueDate,
            proposedDueDate,
            rationale: asString(p.rationale, summary),
          },
        });
      } else if (targetType === 'deliverable') {
        const matchedDeliv =
          (rawId ? deliverableById.get(rawId) : undefined) ??
          (rawTitle
            ? deliverableByTitleLower.get(rawTitle.toLowerCase())
            : undefined);
        if (!matchedDeliv) continue;

        const proposedProductionDate = ISO_DATE_RE.test(
          asString(p.proposedProductionDate)
        )
          ? asString(p.proposedProductionDate)
          : undefined;

        proposedActions.push({
          id: createActionId(i),
          actionType: 'change_suggested_deadline',
          summary,
          status: 'pending',
          payload: {
            targetType: 'deliverable',
            targetId: matchedDeliv.id,
            targetTitle: matchedDeliv.title,
            currentDueDate: matchedDeliv.publicationDate || matchedDeliv.dueDate,
            ...(proposedProductionDate ? { proposedProductionDate } : {}),
            proposedDueDate,
            rationale: asString(p.rationale, summary),
          },
        });
      }
      continue;
    }

    if (actionType === 'add_deliverable') {
      const p = act.deliverablePayload as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') continue;
      const title = asString(p.title);
      const channel = asString(p.channel);
      if (!title || !channel) continue;

      const productionDate = validIsoDate(p.productionDate, ctx.todayIso);
      const publicationDate = validIsoDate(p.publicationDate, productionDate);

      proposedActions.push({
        id: createActionId(i),
        actionType: 'add_deliverable',
        summary,
        status: 'pending',
        payload: {
          title,
          format: normalizeContentFormat(p.format),
          channel,
          phase: asString(p.phase, 'Campaign Execution'),
          description: asString(p.description),
          objective: asString(p.objective),
          relevanceNote: asString(p.relevanceNote, summary),
          productionDate,
          publicationDate,
          priority: normalizeDeliverablePriority(p.priority),
          ownerRole: asString(p.ownerRole, 'Unassigned'),
        },
      });
      continue;
    }

    if (actionType === 'prepare_campaign_report') {
      const p = act.reportPayload as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') continue;
      const reportTitle = asString(p.reportTitle, 'Campaign Status Update');
      const preparedFor = asString(p.preparedFor, 'Campaign Stakeholders');
      const statusOverview = asString(p.statusOverview, answer);
      const completedHighlights = asStringArray(p.completedHighlights);
      const outstandingWork = asStringArray(p.outstandingWork);
      const risksAndBlockers = asStringArray(p.risksAndBlockers);
      const nextSteps = asStringArray(p.nextSteps);

      const markdownContent =
        asString(p.markdownContent) ||
        [
          `# ${reportTitle}`,
          `Prepared for: ${preparedFor}`,
          '',
          '## Status Overview',
          statusOverview,
          '',
          '## Completed Work (Verified Records)',
          completedHighlights.length > 0
            ? completedHighlights.map((x) => `- ${x}`).join('\n')
            : '- No tasks marked completed yet.',
          '',
          '## Outstanding Work',
          outstandingWork.length > 0
            ? outstandingWork.map((x) => `- ${x}`).join('\n')
            : '- None recorded.',
          '',
          '## Risks & Blockers',
          risksAndBlockers.length > 0
            ? risksAndBlockers.map((x) => `- ${x}`).join('\n')
            : '- None recorded.',
          '',
          '## Recommended Next Steps',
          nextSteps.length > 0
            ? nextSteps.map((x) => `- ${x}`).join('\n')
            : '- Review pending tasks and approvals.',
        ].join('\n');

      proposedActions.push({
        id: createActionId(i),
        actionType: 'prepare_campaign_report',
        summary,
        status: 'pending',
        payload: {
          reportTitle,
          preparedFor,
          statusOverview,
          completedHighlights,
          outstandingWork,
          risksAndBlockers,
          nextSteps,
          markdownContent,
        },
      });
    }
  }

  return {
    answer,
    recordedFacts,
    suggestions,
    missingOrUnavailable,
    proposedActions,
  };
}
