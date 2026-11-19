import type {
  CampaignPlanPhase,
  ContentPlanDeliverable,
} from '@/src/types/campaign';

export type ScheduleConflictSeverity = 'error' | 'warning';

export type ScheduleConflictKind =
  | 'out_of_period'
  | 'inverted_dates'
  | 'overlapping_publications'
  | 'overlapping_productions'
  | 'phase_mismatch'
  | 'phase_overlap';

export interface ScheduleConflict {
  id: string;
  kind: ScheduleConflictKind;
  severity: ScheduleConflictSeverity;
  date?: string;
  affectedDeliverableIds: string[];
  affectedPhaseIds?: string[];
  message: string;
}

export function getEffectivePublicationDate(
  deliverable: ContentPlanDeliverable
): string {
  return deliverable.publicationDate || deliverable.dueDate || '';
}

export function getEffectiveProductionDate(
  deliverable: ContentPlanDeliverable
): string {
  return deliverable.productionDate || deliverable.dueDate || '';
}

export function isValidIsoDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export function detectScheduleConflicts(params: {
  deliverables: ContentPlanDeliverable[];
  phases: CampaignPlanPhase[];
  campaignStartDate: string;
  campaignEndDate: string;
}): ScheduleConflict[] {
  const { deliverables, phases, campaignStartDate, campaignEndDate } = params;
  const conflicts: ScheduleConflict[] = [];
  const hasCampaignWindow =
    isValidIsoDate(campaignStartDate) &&
    isValidIsoDate(campaignEndDate) &&
    campaignStartDate <= campaignEndDate;

  const phaseLookup = new Map(
    phases.map((p) => [p.phaseName.trim().toLowerCase(), p])
  );

  // 1. Check phase dates
  for (let i = 0; i < phases.length; i += 1) {
    const phase = phases[i];
    if (
      isValidIsoDate(phase.startDate) &&
      isValidIsoDate(phase.endDate) &&
      phase.startDate > phase.endDate
    ) {
      conflicts.push({
        id: `phase_inv_${phase.id}`,
        kind: 'inverted_dates',
        severity: 'error',
        affectedDeliverableIds: [],
        affectedPhaseIds: [phase.id],
        message: `Phase "${phase.phaseName}" has start date (${phase.startDate}) after end date (${phase.endDate}).`,
      });
    }

    if (hasCampaignWindow) {
      if (
        (isValidIsoDate(phase.startDate) &&
          phase.startDate < campaignStartDate) ||
        (isValidIsoDate(phase.endDate) && phase.endDate > campaignEndDate)
      ) {
        conflicts.push({
          id: `phase_out_${phase.id}`,
          kind: 'out_of_period',
          severity: 'warning',
          affectedDeliverableIds: [],
          affectedPhaseIds: [phase.id],
          message: `Phase "${phase.phaseName}" (${phase.startDate} to ${phase.endDate}) extends outside approved campaign period (${campaignStartDate} to ${campaignEndDate}).`,
        });
      }
    }

    for (let j = i + 1; j < phases.length; j += 1) {
      const other = phases[j];
      if (
        isValidIsoDate(phase.startDate) &&
        isValidIsoDate(phase.endDate) &&
        isValidIsoDate(other.startDate) &&
        isValidIsoDate(other.endDate)
      ) {
        if (
          phase.startDate <= other.endDate &&
          other.startDate <= phase.endDate
        ) {
          // Only warn if phases overlap by more than 1 boundary day
          if (
            phase.endDate !== other.startDate &&
            other.endDate !== phase.startDate
          ) {
            conflicts.push({
              id: `phase_ov_${phase.id}_${other.id}`,
              kind: 'phase_overlap',
              severity: 'warning',
              affectedDeliverableIds: [],
              affectedPhaseIds: [phase.id, other.id],
              message: `Phases "${phase.phaseName}" and "${other.phaseName}" have overlapping date ranges.`,
            });
          }
        }
      }
    }
  }

  // 2. Check deliverable dates
  const pubByDate = new Map<string, ContentPlanDeliverable[]>();
  const prodByDate = new Map<string, ContentPlanDeliverable[]>();

  for (const del of deliverables) {
    const pubDate = getEffectivePublicationDate(del);
    const prodDate = getEffectiveProductionDate(del);

    if (
      isValidIsoDate(prodDate) &&
      isValidIsoDate(pubDate) &&
      prodDate > pubDate
    ) {
      conflicts.push({
        id: `del_inv_${del.id}`,
        kind: 'inverted_dates',
        severity: 'error',
        date: pubDate,
        affectedDeliverableIds: [del.id],
        message: `"${del.title}" has production date (${prodDate}) after publication date (${pubDate}).`,
      });
    }

    if (hasCampaignWindow) {
      const outPub =
        isValidIsoDate(pubDate) &&
        (pubDate < campaignStartDate || pubDate > campaignEndDate);
      const outProd =
        isValidIsoDate(prodDate) &&
        (prodDate < campaignStartDate || prodDate > campaignEndDate);

      if (outPub || outProd) {
        const parts: string[] = [];
        if (outProd) parts.push(`production ${prodDate}`);
        if (outPub) parts.push(`publication ${pubDate}`);
        conflicts.push({
          id: `del_out_${del.id}`,
          kind: 'out_of_period',
          severity: 'warning',
          date: outPub ? pubDate : prodDate,
          affectedDeliverableIds: [del.id],
          message: `"${del.title}" (${parts.join(', ')}) falls outside the approved campaign period (${campaignStartDate} — ${campaignEndDate}).`,
        });
      }
    }

    if (del.phase && isValidIsoDate(pubDate)) {
      const assignedPhase = phaseLookup.get(del.phase.trim().toLowerCase());
      if (
        assignedPhase &&
        isValidIsoDate(assignedPhase.startDate) &&
        isValidIsoDate(assignedPhase.endDate) &&
        (pubDate < assignedPhase.startDate || pubDate > assignedPhase.endDate)
      ) {
        conflicts.push({
          id: `del_phase_${del.id}`,
          kind: 'phase_mismatch',
          severity: 'warning',
          date: pubDate,
          affectedDeliverableIds: [del.id],
          affectedPhaseIds: [assignedPhase.id],
          message: `"${del.title}" publishes on ${pubDate}, which is outside its assigned "${assignedPhase.phaseName}" window (${assignedPhase.startDate} — ${assignedPhase.endDate}).`,
        });
      }
    }

    if (isValidIsoDate(pubDate)) {
      const list = pubByDate.get(pubDate) ?? [];
      list.push(del);
      pubByDate.set(pubDate, list);
    }

    if (isValidIsoDate(prodDate)) {
      const list = prodByDate.get(prodDate) ?? [];
      list.push(del);
      prodByDate.set(prodDate, list);
    }
  }

  // 3. Overlapping publication dates
  for (const [date, items] of pubByDate.entries()) {
    if (items.length > 1) {
      const sameChannel = new Set(items.map((i) => i.channel)).size < items.length;
      conflicts.push({
        id: `pub_ov_${date}`,
        kind: 'overlapping_publications',
        severity: sameChannel ? 'error' : 'warning',
        date,
        affectedDeliverableIds: items.map((i) => i.id),
        message: `${items.length} deliverables share the same publication date (${date})${
          sameChannel ? ' including same-channel overlap' : ''
        }: ${items.map((i) => i.title).join(', ')}.`,
      });
    }
  }

  // 4. Overlapping production deadlines (warn when 3+ or same-date high priority collision)
  for (const [date, items] of prodByDate.entries()) {
    const highPriorityCount = items.filter((i) => i.priority === 'high').length;
    if (items.length >= 3 || (items.length >= 2 && highPriorityCount >= 2)) {
      conflicts.push({
        id: `prod_ov_${date}`,
        kind: 'overlapping_productions',
        severity: 'warning',
        date,
        affectedDeliverableIds: items.map((i) => i.id),
        message: `${items.length} deliverables have overlapping production deadlines on ${date}: ${items.map((i) => i.title).join(', ')}.`,
      });
    }
  }

  return conflicts;
}

export function parseIsoDateParts(iso: string): {
  year: number;
  month: number;
  day: number;
} {
  const [y, m, d] = iso.split('-').map(Number);
  return { year: y, month: m, day: d };
}

export function formatIsoDate(year: number, month: number, day: number): string {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.toISOString().slice(0, 10);
}

export function addDaysIso(iso: string, deltaDays: number): string {
  if (!isValidIsoDate(iso)) return iso;
  const { year, month, day } = parseIsoDateParts(iso);
  const date = new Date(Date.UTC(year, month - 1, day + deltaDays));
  return date.toISOString().slice(0, 10);
}

export function getStartOfWeekIso(iso: string): string {
  if (!isValidIsoDate(iso)) return new Date().toISOString().slice(0, 10);
  const { year, month, day } = parseIsoDateParts(iso);
  const date = new Date(Date.UTC(year, month - 1, day));
  const dow = date.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  date.setUTCDate(date.getUTCDate() + diffToMonday);
  return date.toISOString().slice(0, 10);
}

export function getMonthGridDays(year: number, month: number): string[] {
  const firstOfMonth = formatIsoDate(year, month, 1);
  const gridStart = getStartOfWeekIso(firstOfMonth);
  const days: string[] = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(addDaysIso(gridStart, i));
  }
  return days;
}
