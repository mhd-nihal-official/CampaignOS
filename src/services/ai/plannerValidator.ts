import {
  SUPPORTED_CONTENT_FORMATS,
  type CampaignPlanPhase,
  type DeliverableContentFormat,
  type DeliverablePriority,
} from '../../types/campaign.ts';

export interface ValidatedGeneratedDeliverable {
  id: string;
  title: string;
  format: DeliverableContentFormat;
  customFormat?: string;
  channel: string;
  phase: string;
  description: string;
  objective: string;
  relevanceNote: string;
  productionDate: string;
  publicationDate: string;
  priority: DeliverablePriority;
  ownerRole: string;
}

export interface ValidatedCampaignPlanPayload {
  phases: CampaignPlanPhase[];
  deliverables: ValidatedGeneratedDeliverable[];
  planningNotes: string[];
}

function isRecord(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function asNonEmptyString(val: unknown, fieldPath: string): string {
  if (typeof val !== 'string' || !val.trim()) {
    throw new Error(`Invalid or empty string for "${fieldPath}".`);
  }
  return val.trim();
}

function asIsoDate(val: unknown, fieldPath: string): string {
  const s = asNonEmptyString(val, fieldPath);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    throw new Error(
      `Invalid ISO date "${s}" at "${fieldPath}". Expected YYYY-MM-DD.`
    );
  }
  return s;
}

function normalizeFormat(raw: unknown, fieldPath: string): {
  format: DeliverableContentFormat;
  customFormat?: string;
} {
  const val = asNonEmptyString(raw, fieldPath);
  const match = SUPPORTED_CONTENT_FORMATS.find(
    (f) => f.toLowerCase() === val.toLowerCase()
  );
  if (match) {
    return { format: match };
  }
  return { format: 'Other', customFormat: val };
}

function normalizePriority(raw: unknown): DeliverablePriority {
  if (typeof raw === 'string') {
    const lower = raw.trim().toLowerCase();
    if (lower === 'low' || lower === 'normal' || lower === 'high') {
      return lower;
    }
  }
  return 'normal';
}

export function validateCampaignPlanPayload(
  raw: unknown
): ValidatedCampaignPlanPayload {
  if (!isRecord(raw)) {
    throw new Error('Campaign plan payload must be a JSON object.');
  }

  if (!Array.isArray(raw.phases) || raw.phases.length === 0) {
    throw new Error('Campaign plan must include at least one campaign phase.');
  }

  const phases: CampaignPlanPhase[] = raw.phases.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`phases[${idx}] must be an object.`);
    }
    return {
      id: `phase_${idx + 1}`,
      phaseName: asNonEmptyString(item.phaseName, `phases[${idx}].phaseName`),
      startDate: asIsoDate(item.startDate, `phases[${idx}].startDate`),
      endDate: asIsoDate(item.endDate, `phases[${idx}].endDate`),
      objective: asNonEmptyString(item.objective, `phases[${idx}].objective`),
      focus: asNonEmptyString(item.focus, `phases[${idx}].focus`),
      isSuggested: true,
    };
  });

  if (!Array.isArray(raw.deliverables) || raw.deliverables.length === 0) {
    throw new Error(
      'Campaign plan must include at least one strategy-aligned deliverable.'
    );
  }

  const deliverables: ValidatedGeneratedDeliverable[] = raw.deliverables.map(
    (item, idx) => {
      if (!isRecord(item)) {
        throw new Error(`deliverables[${idx}] must be an object.`);
      }
      const normalized = normalizeFormat(
        item.format,
        `deliverables[${idx}].format`
      );
      return {
        id: `del_${idx + 1}`,
        title: asNonEmptyString(item.title, `deliverables[${idx}].title`),
        format: normalized.format,
        customFormat: normalized.customFormat,
        channel: asNonEmptyString(item.channel, `deliverables[${idx}].channel`),
        phase: asNonEmptyString(item.phase, `deliverables[${idx}].phase`),
        description: asNonEmptyString(
          item.description,
          `deliverables[${idx}].description`
        ),
        objective: asNonEmptyString(
          item.objective,
          `deliverables[${idx}].objective`
        ),
        relevanceNote: asNonEmptyString(
          item.relevanceNote,
          `deliverables[${idx}].relevanceNote`
        ),
        productionDate: asIsoDate(
          item.productionDate,
          `deliverables[${idx}].productionDate`
        ),
        publicationDate: asIsoDate(
          item.publicationDate,
          `deliverables[${idx}].publicationDate`
        ),
        priority: normalizePriority(item.priority),
        ownerRole:
          typeof item.ownerRole === 'string' && item.ownerRole.trim()
            ? item.ownerRole.trim()
            : 'Content Strategist',
      };
    }
  );

  const planningNotes = Array.isArray(raw.planningNotes)
    ? raw.planningNotes.filter(
        (n): n is string => typeof n === 'string' && n.trim().length > 0
      )
    : [];

  return {
    phases,
    deliverables,
    planningNotes,
  };
}
