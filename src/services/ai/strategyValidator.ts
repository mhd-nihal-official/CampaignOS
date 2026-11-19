import type {
  CreativeDirectionOption,
  StrategyChannelRecommendation,
  StrategyContentPillar,
  StrategyPainPoint,
  StrategyPhaseItem,
  StrategySectionKey,
  StrategySourceType,
  StrategySuccessMetric,
  StrategyTextBlock,
} from '../../types/campaign.ts';

const VALID_SOURCES = new Set<StrategySourceType>([
  'BRIEF_FACT',
  'STRATEGIC_RECOMMENDATION',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function makeId(prefix: string, idx: number): string {
  const rand =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID().slice(0, 6)
      : `${Date.now().toString(36)}_${idx}`;
  return `${prefix}_${rand}_${idx}`;
}

function requireNonEmptyString(
  raw: unknown,
  fieldPath: string
): string {
  if (typeof raw !== 'string' || !raw.trim()) {
    throw new Error(`Invalid strategy output: "${fieldPath}" must be a non-empty string.`);
  }
  return raw.trim();
}

function optionalString(raw: unknown): string | null {
  return typeof raw === 'string' && raw.trim() ? raw.trim() : null;
}

function validateSourceType(
  raw: unknown,
  fieldPath: string
): StrategySourceType {
  if (typeof raw !== 'string' || !VALID_SOURCES.has(raw as StrategySourceType)) {
    throw new Error(
      `Invalid sourceType on "${fieldPath}": expected BRIEF_FACT or STRATEGIC_RECOMMENDATION.`
    );
  }
  return raw as StrategySourceType;
}

export function validateTextBlock(
  raw: unknown,
  fieldPath: string
): StrategyTextBlock {
  if (!isRecord(raw)) {
    throw new Error(`Invalid strategy section: "${fieldPath}" must be an object.`);
  }
  return {
    content: requireNonEmptyString(raw.content, `${fieldPath}.content`),
    sourceType: validateSourceType(raw.sourceType, `${fieldPath}.sourceType`),
    briefBasis: requireNonEmptyString(
      raw.briefBasis,
      `${fieldPath}.briefBasis`
    ),
    clarificationNeeded: optionalString(raw.clarificationNeeded),
  };
}

export function validatePainPoints(raw: unknown): StrategyPainPoint[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Invalid strategy output: "audiencePainPoints" must be a non-empty array.');
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid painPoint at index ${idx}.`);
    }
    return {
      id: makeId('pp', idx),
      painPoint: requireNonEmptyString(
        item.painPoint,
        `audiencePainPoints[${idx}].painPoint`
      ),
      whatToDo: requireNonEmptyString(
        item.whatToDo,
        `audiencePainPoints[${idx}].whatToDo`
      ),
      whyRelevant: requireNonEmptyString(
        item.whyRelevant,
        `audiencePainPoints[${idx}].whyRelevant`
      ),
      supportedObjective: requireNonEmptyString(
        item.supportedObjective,
        `audiencePainPoints[${idx}].supportedObjective`
      ),
      deliverableIdea: requireNonEmptyString(
        item.deliverableIdea,
        `audiencePainPoints[${idx}].deliverableIdea`
      ),
      sourceType: validateSourceType(
        item.sourceType,
        `audiencePainPoints[${idx}].sourceType`
      ),
    };
  });
}

export function validateCreativeDirections(
  raw: unknown
): CreativeDirectionOption[] {
  if (!Array.isArray(raw) || raw.length !== 3) {
    throw new Error(
      'Invalid strategy output: "creativeDirections" must contain exactly 3 distinct creative directions.'
    );
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid creativeDirection at index ${idx}.`);
    }
    return {
      id: makeId('cd', idx),
      conceptName: requireNonEmptyString(
        item.conceptName,
        `creativeDirections[${idx}].conceptName`
      ),
      conceptDescription: requireNonEmptyString(
        item.conceptDescription,
        `creativeDirections[${idx}].conceptDescription`
      ),
      mainMessage: requireNonEmptyString(
        item.mainMessage,
        `creativeDirections[${idx}].mainMessage`
      ),
      suggestedVisualApproach: requireNonEmptyString(
        item.suggestedVisualApproach,
        `creativeDirections[${idx}].suggestedVisualApproach`
      ),
      exampleContentExecution: requireNonEmptyString(
        item.exampleContentExecution,
        `creativeDirections[${idx}].exampleContentExecution`
      ),
    };
  });
}

export function validateContentPillars(raw: unknown): StrategyContentPillar[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error('Invalid strategy output: "contentPillars" must be a non-empty array.');
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid contentPillar at index ${idx}.`);
    }
    return {
      id: makeId('cp', idx),
      title: requireNonEmptyString(item.title, `contentPillars[${idx}].title`),
      whatToDo: requireNonEmptyString(
        item.whatToDo,
        `contentPillars[${idx}].whatToDo`
      ),
      whyRelevant: requireNonEmptyString(
        item.whyRelevant,
        `contentPillars[${idx}].whyRelevant`
      ),
      supportedObjective: requireNonEmptyString(
        item.supportedObjective,
        `contentPillars[${idx}].supportedObjective`
      ),
      deliverableIdea: requireNonEmptyString(
        item.deliverableIdea,
        `contentPillars[${idx}].deliverableIdea`
      ),
      sourceType: validateSourceType(
        item.sourceType,
        `contentPillars[${idx}].sourceType`
      ),
    };
  });
}

export function validateRecommendedChannels(
  raw: unknown
): StrategyChannelRecommendation[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      'Invalid strategy output: "recommendedChannels" must be a non-empty array.'
    );
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid recommendedChannel at index ${idx}.`);
    }
    return {
      id: makeId('ch', idx),
      channel: requireNonEmptyString(
        item.channel,
        `recommendedChannels[${idx}].channel`
      ),
      whatToDo: requireNonEmptyString(
        item.whatToDo,
        `recommendedChannels[${idx}].whatToDo`
      ),
      whyRelevant: requireNonEmptyString(
        item.whyRelevant,
        `recommendedChannels[${idx}].whyRelevant`
      ),
      supportedObjective: requireNonEmptyString(
        item.supportedObjective,
        `recommendedChannels[${idx}].supportedObjective`
      ),
      deliverableIdea: requireNonEmptyString(
        item.deliverableIdea,
        `recommendedChannels[${idx}].deliverableIdea`
      ),
      uncertaintyNote: optionalString(item.uncertaintyNote),
    };
  });
}

export function validateCampaignPhases(raw: unknown): StrategyPhaseItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      'Invalid strategy output: "campaignPhases" must be a non-empty array.'
    );
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid campaignPhase at index ${idx}.`);
    }
    return {
      id: makeId('ph', idx),
      phaseName: requireNonEmptyString(
        item.phaseName,
        `campaignPhases[${idx}].phaseName`
      ),
      timeframe: requireNonEmptyString(
        item.timeframe,
        `campaignPhases[${idx}].timeframe`
      ),
      whatToDo: requireNonEmptyString(
        item.whatToDo,
        `campaignPhases[${idx}].whatToDo`
      ),
      whyRelevant: requireNonEmptyString(
        item.whyRelevant,
        `campaignPhases[${idx}].whyRelevant`
      ),
      supportedObjective: requireNonEmptyString(
        item.supportedObjective,
        `campaignPhases[${idx}].supportedObjective`
      ),
      deliverableIdea: requireNonEmptyString(
        item.deliverableIdea,
        `campaignPhases[${idx}].deliverableIdea`
      ),
    };
  });
}

export function validateSuccessMetrics(raw: unknown): StrategySuccessMetric[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new Error(
      'Invalid strategy output: "successMetrics" must be a non-empty array.'
    );
  }
  return raw.map((item, idx) => {
    if (!isRecord(item)) {
      throw new Error(`Invalid successMetric at index ${idx}.`);
    }
    return {
      id: makeId('kpi', idx),
      kpiName: requireNonEmptyString(
        item.kpiName,
        `successMetrics[${idx}].kpiName`
      ),
      whatItMeasures: requireNonEmptyString(
        item.whatItMeasures,
        `successMetrics[${idx}].whatItMeasures`
      ),
      supportedObjective: requireNonEmptyString(
        item.supportedObjective,
        `successMetrics[${idx}].supportedObjective`
      ),
      measurementSource: requireNonEmptyString(
        item.measurementSource,
        `successMetrics[${idx}].measurementSource`
      ),
      note:
        optionalString(item.note) ??
        'Suggested KPI only — not actual performance data or a predicted target.',
    };
  });
}

export interface ValidatedGeneratedStrategy {
  clarificationNotes: string[];
  campaignOverview: StrategyTextBlock;
  campaignObjective: StrategyTextBlock;
  targetAudience: StrategyTextBlock;
  audiencePainPoints: StrategyPainPoint[];
  campaignPositioning: StrategyTextBlock;
  coreCampaignMessage: StrategyTextBlock;
  creativeDirections: CreativeDirectionOption[];
  contentPillars: StrategyContentPillar[];
  recommendedChannels: StrategyChannelRecommendation[];
  campaignPhases: StrategyPhaseItem[];
  successMetrics: StrategySuccessMetric[];
}

export function validateFullStrategyPayload(
  raw: unknown
): ValidatedGeneratedStrategy {
  if (!isRecord(raw)) {
    throw new Error('AI strategy response is not a JSON object.');
  }

  const clarificationNotes = Array.isArray(raw.clarificationNotes)
    ? raw.clarificationNotes
        .filter((item): item is string => typeof item === 'string')
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

  return {
    clarificationNotes,
    campaignOverview: validateTextBlock(
      raw.campaignOverview,
      'campaignOverview'
    ),
    campaignObjective: validateTextBlock(
      raw.campaignObjective,
      'campaignObjective'
    ),
    targetAudience: validateTextBlock(raw.targetAudience, 'targetAudience'),
    audiencePainPoints: validatePainPoints(raw.audiencePainPoints),
    campaignPositioning: validateTextBlock(
      raw.campaignPositioning,
      'campaignPositioning'
    ),
    coreCampaignMessage: validateTextBlock(
      raw.coreCampaignMessage,
      'coreCampaignMessage'
    ),
    creativeDirections: validateCreativeDirections(raw.creativeDirections),
    contentPillars: validateContentPillars(raw.contentPillars),
    recommendedChannels: validateRecommendedChannels(raw.recommendedChannels),
    campaignPhases: validateCampaignPhases(raw.campaignPhases),
    successMetrics: validateSuccessMetrics(raw.successMetrics),
  };
}

export function validateRegeneratedSectionPayload(
  sectionKey: StrategySectionKey,
  raw: unknown
): unknown {
  if (!isRecord(raw) || !('sectionData' in raw)) {
    throw new Error('Regenerated section payload missing "sectionData".');
  }
  const data = raw.sectionData;

  switch (sectionKey) {
    case 'overview':
      return validateTextBlock(data, 'campaignOverview');
    case 'objective':
      return validateTextBlock(data, 'campaignObjective');
    case 'targetAudience':
      return validateTextBlock(data, 'targetAudience');
    case 'painPoints':
      return validatePainPoints(data);
    case 'positioning':
      return validateTextBlock(data, 'campaignPositioning');
    case 'coreMessage':
      return validateTextBlock(data, 'coreCampaignMessage');
    case 'creativeDirections':
      return validateCreativeDirections(data);
    case 'contentPillars':
      return validateContentPillars(data);
    case 'recommendedChannels':
      return validateRecommendedChannels(data);
    case 'campaignPhases':
      return validateCampaignPhases(data);
    case 'successMetrics':
      return validateSuccessMetrics(data);
    default:
      throw new Error(`Unsupported strategy section key: ${String(sectionKey)}`);
  }
}
