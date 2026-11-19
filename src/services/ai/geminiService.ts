import { validateBriefAnalysisPayload } from '@/src/services/ai/briefAnalysisValidator';
import { validateCampaignPlanPayload, type ValidatedCampaignPlanPayload } from '@/src/services/ai/plannerValidator';
import { validateExecutionAssistancePayload } from '@/src/services/ai/executionValidator';
import { validateAssistantResponsePayload } from '@/src/services/ai/assistantValidator';
import {
  validateFullStrategyPayload,
  validateRegeneratedSectionPayload,
  type ValidatedGeneratedStrategy,
} from '@/src/services/ai/strategyValidator';
import type {
  AssistantStructuredResponse,
  BriefAnalysisReport,
  CampaignPlan,
  CampaignRecord,
  CampaignStrategy,
  ClientBrief,
  ContentPlanDeliverable,
  ExecutionAssistanceReport,
  ExecutionTask,
  NavSection,
  StrategySectionKey,
  TimelineMilestone,
} from '@/src/types/campaign';

export interface AnalyzeBriefSuccess {
  ok: true;
  analysis: BriefAnalysisReport;
}

export interface AnalyzeBriefFailure {
  ok: false;
  error: string;
}

export type AnalyzeBriefResponse = AnalyzeBriefSuccess | AnalyzeBriefFailure;

export async function analyzeBriefWithGemini(
  brief: ClientBrief
): Promise<AnalyzeBriefResponse> {
  try {
    const response = await fetch('/api/briefs/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ brief }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${response.status}). No analysis was saved.`,
      };
    }

    if (!response.ok) {
      const serverMessage =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Brief analysis failed with HTTP ${response.status}.`;
      return {
        ok: false,
        error: serverMessage,
      };
    }

    const rawAnalysis =
      typeof payload === 'object' && payload !== null && 'analysis' in payload
        ? (payload as { analysis: unknown }).analysis
        : null;

    if (!rawAnalysis || typeof rawAnalysis !== 'object') {
      return {
        ok: false,
        error: 'Server response did not include an analysis object.',
      };
    }

    const metaRecord = rawAnalysis as {
      model?: unknown;
      analysedAt?: unknown;
    };

    const validated = validateBriefAnalysisPayload(rawAnalysis, {
      briefId: brief.id,
      model:
        typeof metaRecord.model === 'string'
          ? metaRecord.model
          : 'gemini-4-hydrogen',
      analysedAt:
        typeof metaRecord.analysedAt === 'string'
          ? metaRecord.analysedAt
          : new Date().toISOString(),
    });

    return {
      ok: true,
      analysis: validated,
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach brief analysis service: ${err.message}`
          : 'Network error while analysing brief.',
    };
  }
}

export type GenerateStrategyResponse =
  | {
      ok: true;
      strategy: ValidatedGeneratedStrategy;
      model: string;
      generatedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function generateStrategyWithGemini(
  brief: ClientBrief
): Promise<GenerateStrategyResponse> {
  if (!brief.analysis || !brief.analysis.approved) {
    return {
      ok: false,
      error:
        'Strategy generation is blocked until the brief analysis is approved.',
    };
  }

  try {
    const response = await fetch('/api/strategy/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const msg =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Strategy generation failed (HTTP ${response.status}).`;
      return { ok: false, error: msg };
    }

    const data = payload as {
      strategy?: unknown;
      model?: unknown;
      generatedAt?: unknown;
    };
    const validated = validateFullStrategyPayload(data.strategy);

    return {
      ok: true,
      strategy: validated,
      model:
        typeof data.model === 'string' ? data.model : 'gemini-4-hydrogen',
      generatedAt:
        typeof data.generatedAt === 'string'
          ? data.generatedAt
          : new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach strategy generator: ${err.message}`
          : 'Network error while generating strategy.',
    };
  }
}

export type RegenerateSectionResponse =
  | {
      ok: true;
      sectionKey: StrategySectionKey;
      sectionData: unknown;
      regeneratedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function regenerateStrategySectionWithGemini(params: {
  brief: ClientBrief;
  sectionKey: StrategySectionKey;
  currentStrategy: Partial<CampaignStrategy>;
  guidance?: string;
}): Promise<RegenerateSectionResponse> {
  const { brief, sectionKey, currentStrategy, guidance } = params;
  if (!brief.analysis || !brief.analysis.approved) {
    return {
      ok: false,
      error: 'Section regeneration requires an approved brief analysis.',
    };
  }

  try {
    const response = await fetch('/api/strategy/regenerate-section', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brief, sectionKey, currentStrategy, guidance }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const msg =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Section regeneration failed (HTTP ${response.status}).`;
      return { ok: false, error: msg };
    }

    const data = payload as {
      sectionData?: unknown;
      regeneratedAt?: unknown;
    };

    const validatedSection = validateRegeneratedSectionPayload(sectionKey, {
      sectionData: data.sectionData,
    });

    return {
      ok: true,
      sectionKey,
      sectionData: validatedSection,
      regeneratedAt:
        typeof data.regeneratedAt === 'string'
          ? data.regeneratedAt
          : new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach strategy service: ${err.message}`
          : 'Network error while regenerating strategy section.',
    };
  }
}

export type GenerateCampaignPlanResponse =
  | {
      ok: true;
      plan: ValidatedCampaignPlanPayload;
      model: string;
      generatedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function generateCampaignPlanWithGemini(params: {
  brief?: ClientBrief;
  strategy: CampaignStrategy;
  campaignStartDate: string;
  campaignEndDate: string;
}): Promise<GenerateCampaignPlanResponse> {
  const { brief, strategy, campaignStartDate, campaignEndDate } = params;
  if (strategy.approvalStatus !== 'approved') {
    return {
      ok: false,
      error:
        'Only an approved campaign strategy can be used to generate a campaign plan.',
    };
  }

  if (!campaignStartDate || !campaignEndDate) {
    return {
      ok: false,
      error:
        'Confirmed campaign start and end dates are required before generating a campaign plan.',
    };
  }

  try {
    const response = await fetch('/api/planner/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief,
        strategy,
        campaignStartDate,
        campaignEndDate,
      }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const msg =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Campaign plan generation failed (HTTP ${response.status}).`;
      return { ok: false, error: msg };
    }

    const data = payload as {
      plan?: unknown;
      model?: unknown;
      generatedAt?: unknown;
    };

    const validated = validateCampaignPlanPayload(data.plan);

    return {
      ok: true,
      plan: validated,
      model:
        typeof data.model === 'string' ? data.model : 'gemini-4-hydrogen',
      generatedAt:
        typeof data.generatedAt === 'string'
          ? data.generatedAt
          : new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach campaign planner service: ${err.message}`
          : 'Network error while generating campaign plan.',
    };
  }
}

export type ExecutionAssistantResponse =
  | {
      ok: true;
      report: ExecutionAssistanceReport;
    }
  | {
      ok: false;
      error: string;
    };

export async function analyzeExecutionWithGemini(params: {
  campaign: CampaignRecord;
  deliverables: ContentPlanDeliverable[];
  tasks: ExecutionTask[];
  todayIso: string;
}): Promise<ExecutionAssistantResponse> {
  const { campaign, deliverables, tasks, todayIso } = params;
  if (tasks.length === 0) {
    return {
      ok: false,
      error:
        'Create or convert at least one execution task before running the Execution Assistant.',
    };
  }

  try {
    const response = await fetch('/api/execution/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaign, deliverables, tasks, todayIso }),
    });

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${response.status}).`,
      };
    }

    if (!response.ok) {
      const msg =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Execution assistant failed (HTTP ${response.status}).`;
      return { ok: false, error: msg };
    }

    const rawReport =
      typeof payload === 'object' && payload !== null && 'report' in payload
        ? (payload as { report: unknown }).report
        : null;

    if (!rawReport || typeof rawReport !== 'object') {
      return {
        ok: false,
        error: 'Server response did not include an execution report.',
      };
    }

    const meta = rawReport as { model?: unknown; generatedAt?: unknown };
    const validated = validateExecutionAssistancePayload(rawReport, {
      campaignId: campaign.id,
      model: typeof meta.model === 'string' ? meta.model : 'gemini-4-hydrogen',
      generatedAt:
        typeof meta.generatedAt === 'string'
          ? meta.generatedAt
          : new Date().toISOString(),
    });

    return { ok: true, report: validated };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach execution assistant service: ${err.message}`
          : 'Network error while analysing execution.',
    };
  }
}

export type AssistantChatResponse =
  | {
      ok: true;
      response: AssistantStructuredResponse;
      model: string;
      generatedAt: string;
    }
  | {
      ok: false;
      error: string;
    };

export async function sendAssistantMessageWithGemini(params: {
  campaign: CampaignRecord;
  approvedBrief: ClientBrief | null;
  approvedStrategy: CampaignStrategy | null;
  plan: CampaignPlan | null;
  deliverables: ContentPlanDeliverable[];
  milestones: TimelineMilestone[];
  tasks: ExecutionTask[];
  teamMemberNames: string[];
  approvalFlags: {
    hasBrief: boolean;
    isBriefApproved: boolean;
    hasStrategy: boolean;
    isStrategyApproved: boolean;
    hasPlan: boolean;
    isPlanApproved: boolean;
  };
  activeModule: NavSection;
  todayIso: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
  message: string;
}): Promise<AssistantChatResponse> {
  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });

    let payload: unknown;
    try {
      payload = await res.json();
    } catch {
      return {
        ok: false,
        error: `Server returned an invalid response (HTTP ${res.status}).`,
      };
    }

    if (!res.ok) {
      const msg =
        typeof payload === 'object' &&
        payload !== null &&
        'error' in payload &&
        typeof (payload as { error: unknown }).error === 'string'
          ? (payload as { error: string }).error
          : `Campaign Assistant failed (HTTP ${res.status}).`;
      return { ok: false, error: msg };
    }

    const data = payload as {
      response?: unknown;
      model?: unknown;
      generatedAt?: unknown;
    };

    const validated = validateAssistantResponsePayload(data.response, {
      todayIso: params.todayIso,
      tasks: params.tasks,
      deliverables: params.deliverables,
      teamMemberNames: params.teamMemberNames,
    });

    return {
      ok: true,
      response: validated,
      model: typeof data.model === 'string' ? data.model : 'gemini-4-hydrogen',
      generatedAt:
        typeof data.generatedAt === 'string'
          ? data.generatedAt
          : new Date().toISOString(),
    };
  } catch (err) {
    return {
      ok: false,
      error:
        err instanceof Error
          ? `Unable to reach Campaign Assistant service: ${err.message}`
          : 'Network error while contacting Campaign Assistant.',
    };
  }
}

