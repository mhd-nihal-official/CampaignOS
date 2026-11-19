import type {
  BriefAnalysisReport,
  BriefReadinessStatus,
  ClassifiedField,
  ClassifiedListField,
  FactClassification,
} from '../../types/campaign.ts';

const VALID_CLASSIFICATIONS = new Set<FactClassification>([
  'PROVIDED',
  'INFERRED',
  'MISSING',
  'CONFLICTING',
]);

const VALID_READINESS = new Set<BriefReadinessStatus>([
  'Ready',
  'Needs Clarification',
  'Incomplete',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function validateClassifiedField(
  raw: unknown,
  fieldPath: string
): ClassifiedField {
  if (!isRecord(raw)) {
    throw new Error(`Invalid analysis structure: "${fieldPath}" must be an object.`);
  }

  const classification = raw.classification;
  if (
    typeof classification !== 'string' ||
    !VALID_CLASSIFICATIONS.has(classification as FactClassification)
  ) {
    throw new Error(
      `Invalid classification on "${fieldPath}": expected PROVIDED, INFERRED, MISSING, or CONFLICTING.`
    );
  }

  const typedClass = classification as FactClassification;
  const rawValue =
    typeof raw.value === 'string' && raw.value.trim().length > 0
      ? raw.value.trim()
      : null;

  return {
    value: typedClass === 'MISSING' ? null : rawValue,
    classification: typedClass,
    evidence:
      typeof raw.evidence === 'string' && raw.evidence.trim().length > 0
        ? raw.evidence.trim()
        : null,
    note:
      typeof raw.note === 'string' && raw.note.trim().length > 0
        ? raw.note.trim()
        : null,
  };
}

function validateClassifiedListField(
  raw: unknown,
  fieldPath: string
): ClassifiedListField {
  if (!isRecord(raw)) {
    throw new Error(`Invalid analysis structure: "${fieldPath}" must be an object.`);
  }

  const classification = raw.classification;
  if (
    typeof classification !== 'string' ||
    !VALID_CLASSIFICATIONS.has(classification as FactClassification)
  ) {
    throw new Error(
      `Invalid classification on "${fieldPath}": expected PROVIDED, INFERRED, MISSING, or CONFLICTING.`
    );
  }

  const typedClass = classification as FactClassification;
  const items = Array.isArray(raw.items)
    ? raw.items
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    items: typedClass === 'MISSING' ? [] : items,
    classification: typedClass,
    evidence:
      typeof raw.evidence === 'string' && raw.evidence.trim().length > 0
        ? raw.evidence.trim()
        : null,
    note:
      typeof raw.note === 'string' && raw.note.trim().length > 0
        ? raw.note.trim()
        : null,
  };
}

function validateStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function validateBriefAnalysisPayload(
  raw: unknown,
  meta: { briefId: string; model: string; analysedAt?: string }
): BriefAnalysisReport {
  if (!isRecord(raw)) {
    throw new Error('AI response is not a JSON object.');
  }

  if (typeof raw.briefSummary !== 'string' || !raw.briefSummary.trim()) {
    throw new Error('AI response is missing "briefSummary".');
  }

  if (!isRecord(raw.clientAndBusiness)) {
    throw new Error('AI response is missing "clientAndBusiness".');
  }

  if (!isRecord(raw.campaignObjectives)) {
    throw new Error('AI response is missing "campaignObjectives".');
  }

  if (!isRecord(raw.campaignTimeline)) {
    throw new Error('AI response is missing "campaignTimeline".');
  }

  if (!isRecord(raw.readinessAssessment)) {
    throw new Error('AI response is missing "readinessAssessment".');
  }

  const readinessStatus = raw.readinessAssessment.status;
  if (
    typeof readinessStatus !== 'string' ||
    !VALID_READINESS.has(readinessStatus as BriefReadinessStatus)
  ) {
    throw new Error(
      'AI response "readinessAssessment.status" must be Ready, Needs Clarification, or Incomplete.'
    );
  }

  if (
    typeof raw.readinessAssessment.explanation !== 'string' ||
    !raw.readinessAssessment.explanation.trim()
  ) {
    throw new Error(
      'AI response is missing "readinessAssessment.explanation".'
    );
  }

  const missingInformation = Array.isArray(raw.missingInformation)
    ? raw.missingInformation
        .filter(isRecord)
        .filter(
          (m) => typeof m.field === 'string' && m.field.trim().length > 0
        )
        .map((m) => ({
          field: (m.field as string).trim(),
          impact:
            typeof m.impact === 'string' && m.impact.trim()
              ? m.impact.trim()
              : 'Required for complete campaign planning.',
        }))
    : [];

  const conflictingInformation = Array.isArray(raw.conflictingInformation)
    ? raw.conflictingInformation
        .filter(isRecord)
        .filter(
          (c) =>
            typeof c.topic === 'string' &&
            typeof c.statementA === 'string' &&
            typeof c.statementB === 'string'
        )
        .map((c) => ({
          topic: (c.topic as string).trim(),
          statementA: (c.statementA as string).trim(),
          statementB: (c.statementB as string).trim(),
          explanation:
            typeof c.explanation === 'string' && c.explanation.trim()
              ? c.explanation.trim()
              : 'Conflicting details detected in the brief.',
        }))
    : [];

  const clarificationQuestions = Array.isArray(raw.clarificationQuestions)
    ? raw.clarificationQuestions
        .filter(isRecord)
        .filter(
          (q) =>
            typeof q.question === 'string' && q.question.trim().length > 0
        )
        .map((q) => ({
          question: (q.question as string).trim(),
          targetField:
            typeof q.targetField === 'string' && q.targetField.trim()
              ? q.targetField.trim()
              : 'General Brief',
          reason:
            typeof q.reason === 'string' && q.reason.trim()
              ? q.reason.trim()
              : 'Needed to clarify brief scope.',
        }))
    : [];

  const idSuffix =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 8)
      : Date.now().toString(36);

  const validatedClientAndBusiness = {
    clientName: validateClassifiedField(
      raw.clientAndBusiness.clientName,
      'clientAndBusiness.clientName'
    ),
    industry: validateClassifiedField(
      raw.clientAndBusiness.industry,
      'clientAndBusiness.industry'
    ),
    businessDescription: validateClassifiedField(
      raw.clientAndBusiness.businessDescription,
      'clientAndBusiness.businessDescription'
    ),
    website: validateClassifiedField(
      raw.clientAndBusiness.website,
      'clientAndBusiness.website'
    ),
    competitors: validateClassifiedField(
      raw.clientAndBusiness.competitors,
      'clientAndBusiness.competitors'
    ),
  };

  const validatedObjectives = {
    primaryObjective: validateClassifiedField(
      raw.campaignObjectives.primaryObjective,
      'campaignObjectives.primaryObjective'
    ),
    unclearRequirements: validateStringArray(
      raw.campaignObjectives.unclearRequirements
    ),
  };

  const validatedProduct = validateClassifiedField(
    raw.productOrService,
    'productOrService'
  );
  const validatedAudience = validateClassifiedField(
    raw.targetAudience,
    'targetAudience'
  );
  const validatedMarket = validateClassifiedField(
    raw.targetMarket,
    'targetMarket'
  );
  const validatedChannels = validateClassifiedListField(
    raw.marketingChannels,
    'marketingChannels'
  );
  const validatedKeyMessage = validateClassifiedField(
    raw.keyMessage,
    'keyMessage'
  );
  const validatedTimeline = {
    startDate: validateClassifiedField(
      raw.campaignTimeline.startDate,
      'campaignTimeline.startDate'
    ),
    endDate: validateClassifiedField(
      raw.campaignTimeline.endDate,
      'campaignTimeline.endDate'
    ),
    durationOrNotes: validateClassifiedField(
      raw.campaignTimeline.durationOrNotes,
      'campaignTimeline.durationOrNotes'
    ),
  };
  const validatedBudget = validateClassifiedField(raw.budget, 'budget');

  const hasAnyConflict =
    conflictingInformation.length > 0 ||
    [
      validatedClientAndBusiness.clientName,
      validatedClientAndBusiness.industry,
      validatedClientAndBusiness.businessDescription,
      validatedClientAndBusiness.website,
      validatedClientAndBusiness.competitors,
      validatedObjectives.primaryObjective,
      validatedProduct,
      validatedAudience,
      validatedMarket,
      validatedKeyMessage,
      validatedTimeline.startDate,
      validatedTimeline.endDate,
      validatedTimeline.durationOrNotes,
      validatedBudget,
    ].some((f) => f.classification === 'CONFLICTING') ||
    validatedChannels.classification === 'CONFLICTING';

  const blockingGaps = validateStringArray(raw.readinessAssessment.blockingGaps);
  let normalizedReadiness = readinessStatus as BriefReadinessStatus;
  if (hasAnyConflict && normalizedReadiness === 'Ready') {
    normalizedReadiness = 'Needs Clarification';
    if (blockingGaps.length === 0) {
      blockingGaps.push(
        'Conflicting brief information requires user clarification before approval.'
      );
    }
  }

  return {
    id:
      typeof raw.id === 'string' && raw.id.trim()
        ? raw.id.trim()
        : `anl_${idSuffix}`,
    briefId: meta.briefId,
    model: meta.model,
    analysedAt: meta.analysedAt ?? new Date().toISOString(),
    approved: typeof raw.approved === 'boolean' ? raw.approved : false,
    approvedAt:
      typeof raw.approvedAt === 'string' ? raw.approvedAt : undefined,
    briefSummary: raw.briefSummary.trim(),
    clientAndBusiness: validatedClientAndBusiness,
    campaignObjectives: validatedObjectives,
    productOrService: validatedProduct,
    targetAudience: validatedAudience,
    targetMarket: validatedMarket,
    marketingChannels: validatedChannels,
    keyMessage: validatedKeyMessage,
    campaignTimeline: validatedTimeline,
    budget: validatedBudget,
    missingInformation,
    conflictingInformation,
    clarificationQuestions,
    readinessAssessment: {
      status: normalizedReadiness,
      explanation: raw.readinessAssessment.explanation.trim(),
      blockingGaps,
    },
  };
}
