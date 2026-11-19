import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import express from 'express';
import type { Request, Response } from 'express';
import { validateBriefAnalysisPayload } from './src/services/ai/briefAnalysisValidator.ts';
import {
  validateFullStrategyPayload,
  validateRegeneratedSectionPayload,
} from './src/services/ai/strategyValidator.ts';
import { validateCampaignPlanPayload } from './src/services/ai/plannerValidator.ts';
import { validateExecutionAssistancePayload } from './src/services/ai/executionValidator.ts';
import { validateAssistantResponsePayload } from './src/services/ai/assistantValidator.ts';
import type {
  CampaignPlan,
  CampaignRecord,
  CampaignStrategy,
  ClientBrief,
  ContentPlanDeliverable,
  ExecutionTask,
  NavSection,
  StrategySectionKey,
  TimelineMilestone,
} from './src/types/campaign.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

const CLASSIFICATION_ENUM = ['PROVIDED', 'INFERRED', 'MISSING', 'CONFLICTING'];
const READINESS_ENUM = ['Ready', 'Needs Clarification', 'Incomplete'];

function classifiedFieldSchema(description: string) {
  return {
    type: Type.OBJECT,
    description,
    properties: {
      value: {
        type: Type.STRING,
        nullable: true,
        description:
          'Extracted or carefully inferred value. MUST be null when classification is MISSING.',
      },
      classification: {
        type: Type.STRING,
        enum: CLASSIFICATION_ENUM,
        description:
          'PROVIDED if explicitly stated, INFERRED if reasonably interpreted and needing confirmation, MISSING if unavailable, CONFLICTING if contradictory statements exist.',
      },
      evidence: {
        type: Type.STRING,
        nullable: true,
        description:
          'Direct quote or explicit reference from the brief supporting this classification, or null if MISSING.',
      },
      note: {
        type: Type.STRING,
        nullable: true,
        description:
          'Analyst note explaining why the item is INFERRED, MISSING, or CONFLICTING, or null if straightforward.',
      },
    },
    required: ['value', 'classification'],
  };
}

const BRIEF_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    briefSummary: {
      type: Type.STRING,
      description:
        'Section A: Concise, evidence-grounded summary of only what the submitted brief actually states.',
    },
    clientAndBusiness: {
      type: Type.OBJECT,
      description: 'Section B: Client and Business Information.',
      properties: {
        clientName: classifiedFieldSchema('Client or brand name.'),
        industry: classifiedFieldSchema('Client industry or sector.'),
        businessDescription: classifiedFieldSchema(
          'Description of the client business.'
        ),
        website: classifiedFieldSchema('Client website URL.'),
        competitors: classifiedFieldSchema(
          'Explicitly mentioned competitors.'
        ),
      },
      required: [
        'clientName',
        'industry',
        'businessDescription',
        'website',
        'competitors',
      ],
    },
    campaignObjectives: {
      type: Type.OBJECT,
      description: 'Section C: Campaign Objectives and unclear requirements.',
      properties: {
        primaryObjective: classifiedFieldSchema(
          'Primary campaign objective without silently altering client goals.'
        ),
        unclearRequirements: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'List of ambiguous, vague, or unmeasurable requirements found in the brief.',
        },
      },
      required: ['primaryObjective', 'unclearRequirements'],
    },
    productOrService: classifiedFieldSchema(
      'Section D: Product or service being promoted.'
    ),
    targetAudience: classifiedFieldSchema(
      'Section E: Target audience (never assume unless supported by the brief).'
    ),
    targetMarket: classifiedFieldSchema(
      'Section F: Target location or geographic market.'
    ),
    marketingChannels: {
      type: Type.OBJECT,
      description: 'Section G: Requested or implied marketing channels.',
      properties: {
        items: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'List of marketing channels. Empty array if classification is MISSING.',
        },
        classification: {
          type: Type.STRING,
          enum: CLASSIFICATION_ENUM,
        },
        evidence: {
          type: Type.STRING,
          nullable: true,
        },
        note: {
          type: Type.STRING,
          nullable: true,
        },
      },
      required: ['items', 'classification'],
    },
    keyMessage: classifiedFieldSchema(
      'Section H: Core campaign key message or value proposition.'
    ),
    campaignTimeline: {
      type: Type.OBJECT,
      description: 'Section I: Campaign timeline dates and constraints.',
      properties: {
        startDate: classifiedFieldSchema('Campaign start date.'),
        endDate: classifiedFieldSchema('Campaign end date.'),
        durationOrNotes: classifiedFieldSchema(
          'Timeline duration, milestones, or scheduling notes.'
        ),
      },
      required: ['startDate', 'endDate', 'durationOrNotes'],
    },
    budget: classifiedFieldSchema(
      'Section J: Campaign budget (never invent a budget).'
    ),
    missingInformation: {
      type: Type.ARRAY,
      description: 'Section K: Missing information items and their impact.',
      items: {
        type: Type.OBJECT,
        properties: {
          field: { type: Type.STRING },
          impact: { type: Type.STRING },
        },
        required: ['field', 'impact'],
      },
    },
    conflictingInformation: {
      type: Type.ARRAY,
      description:
        'Section L: Contradictions found within the brief or between structured fields and source text.',
      items: {
        type: Type.OBJECT,
        properties: {
          topic: { type: Type.STRING },
          statementA: { type: Type.STRING },
          statementB: { type: Type.STRING },
          explanation: { type: Type.STRING },
        },
        required: ['topic', 'statementA', 'statementB', 'explanation'],
      },
    },
    clarificationQuestions: {
      type: Type.ARRAY,
      description:
        'Section M: Specific clarification questions for the client or account team.',
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          targetField: { type: Type.STRING },
          reason: { type: Type.STRING },
        },
        required: ['question', 'targetField', 'reason'],
      },
    },
    readinessAssessment: {
      type: Type.OBJECT,
      description:
        'Section N: Qualitative readiness assessment (Ready, Needs Clarification, or Incomplete).',
      properties: {
        status: {
          type: Type.STRING,
          enum: READINESS_ENUM,
        },
        explanation: {
          type: Type.STRING,
          description:
            'Clear explanation of why this readiness status was assigned, without using any numerical score.',
        },
        blockingGaps: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description:
            'Specific gaps or conflicts blocking strategy creation.',
        },
      },
      required: ['status', 'explanation', 'blockingGaps'],
    },
  },
  required: [
    'briefSummary',
    'clientAndBusiness',
    'campaignObjectives',
    'productOrService',
    'targetAudience',
    'targetMarket',
    'marketingChannels',
    'keyMessage',
    'campaignTimeline',
    'budget',
    'missingInformation',
    'conflictingInformation',
    'clarificationQuestions',
    'readinessAssessment',
  ],
};

const SYSTEM_INSTRUCTION = `You are an experienced agency marketing brief analyst working inside CampaignOS.
Your task is to transform a submitted client brief into a structured, strictly evidence-grounded campaign brief analysis.

MANDATORY ANTI-HALLUCINATION RULES:
1. Read ONLY the provided brief fields and source brief text.
2. NEVER invent client information, products, services, pricing, or business facts.
3. NEVER assume a target audience unless the brief explicitly supports it.
4. NEVER invent a campaign budget, launch/end dates, or competitors.
5. NEVER claim that external research or market validation has been conducted.
6. NEVER present an assumption or inference as a verified fact.
7. NEVER silently change or rewrite the client's stated objectives.
8. If information is not present in the brief, set value to null (or items to []) and classification to "MISSING".

CLASSIFICATION DEFINITIONS:
- PROVIDED: Explicitly stated in the submitted brief fields or source brief text.
- INFERRED: A reasonable interpretation grounded in the brief that requires explicit user confirmation. Explain the basis in "note".
- MISSING: Not available anywhere in the brief. Must have value: null (or items: []).
- CONFLICTING: Two or more statements in the brief contradict each other (e.g., structured field vs source text, conflicting dates, conflicting goals, or budget vs scope contradictions). Document every conflict in conflictingInformation.

READINESS STATUS RULES (NO NUMERICAL SCORES):
- "Ready": Core client info, clear measurable objective, product/service, target audience, channels, and timeline are provided with no unresolved blocking conflicts.
- "Needs Clarification": Core brief exists, but contains inferences needing confirmation, unclear requirements, minor gaps (e.g. missing budget or audience specifics), or conflicting details that should be clarified before strategy sign-off.
- "Incomplete": Critical foundational elements (such as clear objective, audience, product/service, or timeline) are missing or severely underspecified, blocking reliable strategy creation.
Never invent or mention numerical readiness scores.`;

function buildBriefPrompt(brief: ClientBrief): string {
  const structuredFields = {
    clientName: brief.clientName || null,
    industry: brief.industry || null,
    businessDescription: brief.businessDescription || null,
    website: brief.website || null,
    campaignName: brief.campaignTitle || null,
    campaignObjective: brief.objective || null,
    productOrService: brief.productOrService || null,
    targetAudience: brief.targetAudience || null,
    targetLocationOrMarket: brief.targetLocation || null,
    campaignStartDate: brief.launchDate || null,
    campaignEndDate: brief.endDate || null,
    marketingChannels: brief.channels?.length ? brief.channels : null,
    budget: brief.budget || null,
    keyMessage: brief.keyMessage || null,
    competitors: brief.competitors || null,
    additionalRequirements: brief.notes || null,
    intakeMethod: brief.inputMethod,
    sourceFileName: brief.sourceFileName || null,
  };

  return [
    'Analyze the following submitted client brief and return the structured JSON report.',
    '',
    '=== STRUCTURED BRIEF FORM FIELDS ===',
    JSON.stringify(structuredFields, null, 2),
    '',
    '=== RAW SOURCE BRIEF TEXT (IF PROVIDED VIA UPLOAD OR PASTE) ===',
    brief.sourceText?.trim()
      ? brief.sourceText.trim()
      : '(No separate raw source text attached.)',
  ].join('\n');
}

function getHttpStatusCode(err: unknown): number | null {
  if (typeof err === 'object' && err !== null && 'status' in err) {
    const status = (err as { status?: unknown }).status;
    if (typeof status === 'number') return status;
  }
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as { error?: { code?: unknown } };
      if (typeof parsed?.error?.code === 'number') return parsed.error.code;
    } catch {
      // ignore non-JSON messages
    }
  }
  return null;
}

async function generateStructuredJsonWithRetry(
  ai: GoogleGenAI,
  contents: string,
  systemInstruction: string,
  responseSchema: Record<string, unknown>,
  thinkingLevel: ThinkingLevel = ThinkingLevel.LOW
): Promise<string> {
  const maxAttempts = 2;
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          responseSchema,
          seed: 42,
          thinkingConfig: { thinkingLevel },
          httpOptions: { timeout: 35000 },
          abortSignal: AbortSignal.timeout(35000),
        },
      });

      const text = response.text?.trim();
      if (!text) {
        throw new Error('Gemini returned an empty response body.');
      }
      return text;
    } catch (err) {
      lastError = err;
      const status = getHttpStatusCode(err);
      const errMessage = extractReadableGeminiError(err);
      const isTimeout =
        status === 504 ||
        /deadline expired/i.test(errMessage) ||
        (err instanceof Error &&
          (err.name === 'TimeoutError' || err.name === 'AbortError'));
      const isTransient =
        isTimeout || status === 429 || (status !== null && status >= 500);
      console.error(
        `[Gemini attempt ${attempt}/${maxAttempts}] status=${status ?? 'none'}:`,
        errMessage
      );
      if (!isTransient || attempt === maxAttempts) {
        throw err;
      }
      const backoffMs = 600 * attempt;
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

const SOURCE_TYPE_ENUM = ['BRIEF_FACT', 'STRATEGIC_RECOMMENDATION'];

function strategyTextBlockSchema(description: string) {
  return {
    type: Type.OBJECT,
    description,
    properties: {
      content: { type: Type.STRING },
      sourceType: {
        type: Type.STRING,
        enum: SOURCE_TYPE_ENUM,
        description:
          'BRIEF_FACT if directly grounded in confirmed brief facts; STRATEGIC_RECOMMENDATION if proposed by the strategist.',
      },
      briefBasis: {
        type: Type.STRING,
        description:
          'Specific confirmed fact from the approved brief analysis, or explicit statement of what brief info is missing.',
      },
      clarificationNeeded: {
        type: Type.STRING,
        nullable: true,
        description:
          'Specific clarification question if brief data is incomplete for this section, or null.',
      },
    },
    required: ['content', 'sourceType', 'briefBasis'],
  };
}

const PAIN_POINTS_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 4: Audience Pain Points grounded in brief or clearly labeled as strategic hypotheses.',
  items: {
    type: Type.OBJECT,
    properties: {
      painPoint: { type: Type.STRING },
      whatToDo: { type: Type.STRING },
      whyRelevant: { type: Type.STRING },
      supportedObjective: { type: Type.STRING },
      deliverableIdea: { type: Type.STRING },
      sourceType: { type: Type.STRING, enum: SOURCE_TYPE_ENUM },
    },
    required: [
      'painPoint',
      'whatToDo',
      'whyRelevant',
      'supportedObjective',
      'deliverableIdea',
      'sourceType',
    ],
  },
};

const CREATIVE_DIRECTIONS_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 7: Exactly 3 distinct proposed creative directions for comparison.',
  items: {
    type: Type.OBJECT,
    properties: {
      conceptName: { type: Type.STRING },
      conceptDescription: { type: Type.STRING },
      mainMessage: { type: Type.STRING },
      suggestedVisualApproach: { type: Type.STRING },
      exampleContentExecution: { type: Type.STRING },
    },
    required: [
      'conceptName',
      'conceptDescription',
      'mainMessage',
      'suggestedVisualApproach',
      'exampleContentExecution',
    ],
  },
};

const CONTENT_PILLARS_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 8: Structured content pillars.',
  items: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      whatToDo: { type: Type.STRING },
      whyRelevant: { type: Type.STRING },
      supportedObjective: { type: Type.STRING },
      deliverableIdea: { type: Type.STRING },
      sourceType: { type: Type.STRING, enum: SOURCE_TYPE_ENUM },
    },
    required: [
      'title',
      'whatToDo',
      'whyRelevant',
      'supportedObjective',
      'deliverableIdea',
      'sourceType',
    ],
  },
};

const CHANNELS_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 9: Recommended marketing channels relevant to approved objective, audience, and market.',
  items: {
    type: Type.OBJECT,
    properties: {
      channel: { type: Type.STRING },
      whatToDo: { type: Type.STRING },
      whyRelevant: { type: Type.STRING },
      supportedObjective: { type: Type.STRING },
      deliverableIdea: { type: Type.STRING },
      uncertaintyNote: { type: Type.STRING, nullable: true },
    },
    required: [
      'channel',
      'whatToDo',
      'whyRelevant',
      'supportedObjective',
      'deliverableIdea',
    ],
  },
};

const PHASES_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 10: Campaign phases aligned to the approved brief timeline.',
  items: {
    type: Type.OBJECT,
    properties: {
      phaseName: { type: Type.STRING },
      timeframe: { type: Type.STRING },
      whatToDo: { type: Type.STRING },
      whyRelevant: { type: Type.STRING },
      supportedObjective: { type: Type.STRING },
      deliverableIdea: { type: Type.STRING },
    },
    required: [
      'phaseName',
      'timeframe',
      'whatToDo',
      'whyRelevant',
      'supportedObjective',
      'deliverableIdea',
    ],
  },
};

const SUCCESS_METRICS_SCHEMA = {
  type: Type.ARRAY,
  description: 'Section 11: Suggested measurable KPIs without fabricated numeric targets or predictions.',
  items: {
    type: Type.OBJECT,
    properties: {
      kpiName: { type: Type.STRING },
      whatItMeasures: { type: Type.STRING },
      supportedObjective: { type: Type.STRING },
      measurementSource: { type: Type.STRING },
      note: {
        type: Type.STRING,
        description:
          'Explicitly state this is a suggested KPI and not actual performance data or a predicted target.',
      },
    },
    required: [
      'kpiName',
      'whatItMeasures',
      'supportedObjective',
      'measurementSource',
      'note',
    ],
  },
};

const FULL_STRATEGY_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    clarificationNotes: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        'Questions or missing brief details where clarification is needed before making assumptions.',
    },
    campaignOverview: strategyTextBlockSchema('1. Campaign Overview'),
    campaignObjective: strategyTextBlockSchema('2. Campaign Objective'),
    targetAudience: strategyTextBlockSchema('3. Target Audience'),
    audiencePainPoints: PAIN_POINTS_SCHEMA,
    campaignPositioning: strategyTextBlockSchema('5. Campaign Positioning'),
    coreCampaignMessage: strategyTextBlockSchema('6. Core Campaign Message'),
    creativeDirections: CREATIVE_DIRECTIONS_SCHEMA,
    contentPillars: CONTENT_PILLARS_SCHEMA,
    recommendedChannels: CHANNELS_SCHEMA,
    campaignPhases: PHASES_SCHEMA,
    successMetrics: SUCCESS_METRICS_SCHEMA,
  },
  required: [
    'clarificationNotes',
    'campaignOverview',
    'campaignObjective',
    'targetAudience',
    'audiencePainPoints',
    'campaignPositioning',
    'coreCampaignMessage',
    'creativeDirections',
    'contentPillars',
    'recommendedChannels',
    'campaignPhases',
    'successMetrics',
  ],
};

const STRATEGY_SYSTEM_INSTRUCTION = `You are a senior marketing strategist working inside CampaignOS.
Generate a practical, evidence-grounded campaign strategy using ONLY the approved brief analysis and verified brief context provided.

STRICT STRATEGY GENERATION RULES:
1. NEVER invent client facts, market statistics, audience demographics, product benefits, or historical campaign performance.
2. NEVER claim competitor research or market research has been conducted.
3. Every element must be clearly traceable to either a BRIEF_FACT (from the approved brief analysis) or a STRATEGIC_RECOMMENDATION (clearly labeled as a recommendation).
4. If important information is MISSING in the approved brief analysis (e.g. budget, target market, or specific audience details), explicitly state the uncertainty and ask the user for clarification in "clarificationNotes" / "clarificationNeeded" / "uncertaintyNote" rather than fabricating unsupported claims.
5. AVOID generic fluff such as "Post consistently on social media" or "Increase brand awareness through engaging content."
6. For every recommendation (pain points, content pillars, channels, phases), explicitly explain:
   - whatToDo: concrete, actionable activity
   - whyRelevant: why it fits this specific brief
   - supportedObjective: which approved campaign objective it supports
   - deliverableIdea: concrete deliverable asset that implements it
7. Generate EXACTLY THREE distinct Creative Directions in "creativeDirections" so the user can compare and choose one. Frame them as proposed directions, not approved creative decisions.
8. Recommend marketing channels ONLY when relevant to the approved objectives, audience, and market. If audience/market/budget info is missing, note the uncertainty.
9. For Success Metrics, suggest relevant measurable KPIs WITHOUT fabricating numeric target goals, conversion rates, ROI predictions, or performance forecasts. Clearly state in "note" that each is a suggested KPI and not actual performance data.`;

function buildStrategyPrompt(brief: ClientBrief): string {
  return [
    'Approved Brief Analysis (Primary Confirmed Source):',
    JSON.stringify(brief.analysis, null, 2),
    '',
    'Original Client Brief Metadata (Reference):',
    JSON.stringify(
      {
        clientName: brief.clientName,
        campaignTitle: brief.campaignTitle,
        launchDate: brief.launchDate,
        endDate: brief.endDate,
        channels: brief.channels,
      },
      null,
      2
    ),
  ].join('\n');
}

function getSectionSchema(sectionKey: StrategySectionKey): Record<string, unknown> {
  switch (sectionKey) {
    case 'overview':
      return strategyTextBlockSchema('1. Campaign Overview');
    case 'objective':
      return strategyTextBlockSchema('2. Campaign Objective');
    case 'targetAudience':
      return strategyTextBlockSchema('3. Target Audience');
    case 'painPoints':
      return PAIN_POINTS_SCHEMA;
    case 'positioning':
      return strategyTextBlockSchema('5. Campaign Positioning');
    case 'coreMessage':
      return strategyTextBlockSchema('6. Core Campaign Message');
    case 'creativeDirections':
      return CREATIVE_DIRECTIONS_SCHEMA;
    case 'contentPillars':
      return CONTENT_PILLARS_SCHEMA;
    case 'recommendedChannels':
      return CHANNELS_SCHEMA;
    case 'campaignPhases':
      return PHASES_SCHEMA;
    case 'successMetrics':
      return SUCCESS_METRICS_SCHEMA;
  }
}

function extractReadableGeminiError(err: unknown): string {
  if (!(err instanceof Error)) {
    return 'Unexpected Gemini API error.';
  }
  const raw = err.message.trim();
  try {
    const parsed = JSON.parse(raw) as { error?: { message?: unknown } };
    if (typeof parsed?.error?.message === 'string' && parsed.error.message.trim()) {
      return parsed.error.message.trim();
    }
  } catch {
    // non-JSON message
  }
  return raw || 'Unexpected Gemini API error.';
}

function handleGeminiRouteError(err: unknown, res: Response, contextLabel: string) {
  const status = getHttpStatusCode(err);
  const message = extractReadableGeminiError(err);
  const isTimeout =
    status === 504 ||
    /deadline expired/i.test(message) ||
    (err instanceof Error &&
      (err.name === 'TimeoutError' || err.name === 'AbortError'));

  if (status === 400 || status === 403) {
    res.status(status).json({
      error:
        'Gemini API rejected the request due to an invalid or unauthorized API key. Please check GEMINI_API_KEY in Settings > Secrets.',
    });
    return;
  }

  if (status === 404) {
    res.status(502).json({
      error: `Configured Gemini model "${MODEL_NAME}" was not found or is unavailable.`,
    });
    return;
  }

  if (status === 429) {
    res.status(429).json({
      error:
        'Gemini API rate limit or quota exceeded. Please wait a moment and try again.',
    });
    return;
  }

  if (status === 503) {
    res.status(503).json({
      error: `${contextLabel} failed: ${message}`,
    });
    return;
  }

  if (isTimeout) {
    res.status(504).json({
      error: `${contextLabel} timed out while waiting for the Gemini API. Please try again.`,
    });
    return;
  }

  res.status(502).json({
    error: `${contextLabel} failed: ${message}`,
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '2mb' }));

  app.post('/api/briefs/analyze', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as { brief?: ClientBrief } | undefined;
    const brief = body?.brief;
    if (!brief || typeof brief !== 'object') {
      res.status(400).json({ error: 'Missing brief payload in request body.' });
      return;
    }

    if (
      !brief.clientName?.trim() &&
      !brief.campaignTitle?.trim() &&
      !brief.objective?.trim() &&
      !brief.sourceText?.trim()
    ) {
      res.status(400).json({
        error:
          'Brief must include client/campaign details or source text before analysis.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const rawJsonText = await generateStructuredJsonWithRetry(
        ai,
        buildBriefPrompt(brief),
        SYSTEM_INSTRUCTION,
        BRIEF_ANALYSIS_SCHEMA
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJsonText);
      } catch {
        res.status(502).json({
          error:
            'The AI service returned malformed JSON that could not be parsed. No analysis was saved.',
        });
        return;
      }

      try {
        const validated = validateBriefAnalysisPayload(parsed, {
          briefId: brief.id,
          model: MODEL_NAME,
          analysedAt: new Date().toISOString(),
        });
        res.json({ analysis: validated });
      } catch (validationErr) {
        res.status(502).json({
          error:
            validationErr instanceof Error
              ? `AI response failed schema validation: ${validationErr.message}`
              : 'AI response failed structural validation. No analysis was saved.',
        });
      }
    } catch (err) {
      handleGeminiRouteError(err, res, 'Brief analysis');
    }
  });

  app.post('/api/strategy/generate', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as { brief?: ClientBrief } | undefined;
    const brief = body?.brief;
    if (!brief || typeof brief !== 'object') {
      res.status(400).json({ error: 'Missing brief payload in request body.' });
      return;
    }

    if (!brief.analysis || !brief.analysis.approved) {
      res.status(400).json({
        error:
          'Strategy generation requires an approved brief analysis. Review and approve the brief analysis in Briefs first.',
      });
      return;
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const rawJsonText = await generateStructuredJsonWithRetry(
        ai,
        buildStrategyPrompt(brief),
        STRATEGY_SYSTEM_INSTRUCTION,
        FULL_STRATEGY_SCHEMA
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJsonText);
      } catch {
        res.status(502).json({
          error:
            'The AI service returned malformed JSON for the strategy. No strategy was saved.',
        });
        return;
      }

      try {
        const validated = validateFullStrategyPayload(parsed);
        res.json({
          strategy: validated,
          model: MODEL_NAME,
          generatedAt: new Date().toISOString(),
        });
      } catch (validationErr) {
        res.status(502).json({
          error:
            validationErr instanceof Error
              ? `Strategy output failed schema validation: ${validationErr.message}`
              : 'Strategy output failed structural validation.',
        });
      }
    } catch (err) {
      handleGeminiRouteError(err, res, 'Strategy generation');
    }
  });

  app.post(
    '/api/strategy/regenerate-section',
    async (req: Request, res: Response) => {
      const apiKey = process.env.GEMINI_API_KEY?.trim();
      if (!apiKey) {
        res.status(503).json({
          error:
            'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
        });
        return;
      }

      const body = req.body as
        | {
            brief?: ClientBrief;
            sectionKey?: StrategySectionKey;
            currentStrategy?: Partial<CampaignStrategy>;
            guidance?: string;
          }
        | undefined;

      const brief = body?.brief;
      const sectionKey = body?.sectionKey;

      if (!brief || !sectionKey) {
        res
          .status(400)
          .json({ error: 'Missing brief or sectionKey in request body.' });
        return;
      }

      if (!brief.analysis || !brief.analysis.approved) {
        res.status(400).json({
          error:
            'Strategy regeneration requires an approved brief analysis first.',
        });
        return;
      }

      const sectionSchema = getSectionSchema(sectionKey);
      const wrappedSchema = {
        type: Type.OBJECT,
        properties: {
          sectionData: sectionSchema,
        },
        required: ['sectionData'],
      };

      const prompt = [
        buildStrategyPrompt(brief),
        '',
        `TARGET SECTION TO REGENERATE: "${sectionKey}"`,
        body?.guidance?.trim()
          ? `USER GUIDANCE FOR THIS REGENERATION: ${body.guidance.trim()}`
          : '',
        body?.currentStrategy
          ? `CURRENT STRATEGY CONTEXT (for alignment):\n${JSON.stringify(
              {
                campaignOverview: body.currentStrategy.campaignOverview,
                campaignObjective: body.currentStrategy.campaignObjective,
                targetAudience: body.currentStrategy.targetAudience,
                campaignPositioning: body.currentStrategy.campaignPositioning,
                coreCampaignMessage: body.currentStrategy.coreCampaignMessage,
              },
              null,
              2
            )}`
          : '',
        '',
        'Regenerate ONLY the requested sectionData while strictly following all anti-hallucination rules.',
      ]
        .filter(Boolean)
        .join('\n');

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      try {
        const rawJsonText = await generateStructuredJsonWithRetry(
          ai,
          prompt,
          STRATEGY_SYSTEM_INSTRUCTION,
          wrappedSchema
        );

        let parsed: unknown;
        try {
          parsed = JSON.parse(rawJsonText);
        } catch {
          res.status(502).json({
            error:
              'The AI service returned malformed JSON for section regeneration.',
          });
          return;
        }

        try {
          const sectionData = validateRegeneratedSectionPayload(
            sectionKey,
            parsed
          );
          res.json({
            sectionKey,
            sectionData,
            model: MODEL_NAME,
            regeneratedAt: new Date().toISOString(),
          });
        } catch (validationErr) {
          res.status(502).json({
            error:
              validationErr instanceof Error
                ? `Regenerated section failed schema validation: ${validationErr.message}`
                : 'Regenerated section failed structural validation.',
          });
        }
      } catch (err) {
        handleGeminiRouteError(err, res, 'Section regeneration');
      }
    }
  );

  const CAMPAIGN_PLAN_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      phases: {
        type: Type.ARRAY,
        description:
          'Chronological campaign phases mapped cleanly within the confirmed campaign start and end dates.',
        items: {
          type: Type.OBJECT,
          properties: {
            phaseName: { type: Type.STRING },
            startDate: {
              type: Type.STRING,
              description: 'ISO date YYYY-MM-DD within campaign period.',
            },
            endDate: {
              type: Type.STRING,
              description: 'ISO date YYYY-MM-DD within campaign period.',
            },
            objective: { type: Type.STRING },
            focus: { type: Type.STRING },
          },
          required: ['phaseName', 'startDate', 'endDate', 'objective', 'focus'],
        },
      },
      deliverables: {
        type: Type.ARRAY,
        description:
          'Focused set of strategy-aligned deliverables (no unnecessary filler) with suggested production and publication dates.',
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            format: {
              type: Type.STRING,
              enum: [
                'Static Post',
                'Carousel',
                'Reel',
                'Video',
                'Story',
                'Blog Article',
                'Email',
                'Other',
              ],
            },
            channel: { type: Type.STRING },
            phase: { type: Type.STRING },
            description: { type: Type.STRING },
            objective: { type: Type.STRING },
            relevanceNote: {
              type: Type.STRING,
              description:
                'Explicit explanation of why this deliverable is relevant to the approved strategy and selected creative direction.',
            },
            productionDate: {
              type: Type.STRING,
              description:
                'Suggested production completion date (YYYY-MM-DD), on or before publicationDate and within the campaign window.',
            },
            publicationDate: {
              type: Type.STRING,
              description:
                'Suggested publication date (YYYY-MM-DD) within its assigned phase and within the campaign window.',
            },
            priority: {
              type: Type.STRING,
              enum: ['low', 'normal', 'high'],
            },
            ownerRole: { type: Type.STRING },
          },
          required: [
            'title',
            'format',
            'channel',
            'phase',
            'description',
            'objective',
            'relevanceNote',
            'productionDate',
            'publicationDate',
            'priority',
            'ownerRole',
          ],
        },
      },
      planningNotes: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Important scheduling rationale, dependencies, or brief constraints noted for the agency planner.',
      },
    },
    required: ['phases', 'deliverables', 'planningNotes'],
  };

  const PLANNER_SYSTEM_INSTRUCTION = `You are a senior campaign producer and planner inside CampaignOS.
Convert ONLY the approved campaign strategy and confirmed campaign period into a practical, editable campaign plan (Campaign Phases, Deliverables, and Suggested Production/Publication Dates).

MANDATORY PLANNING RULES:
1. Only generate deliverables that directly support the approved strategy (objectives, selected creative direction, content pillars, recommended channels, and campaign phases).
2. NEVER invent filler deliverables just to increase volume or pad a calendar. Keep the deliverable list purposeful and directly tied to strategic recommendations.
3. Explain clearly in "relevanceNote" WHY each deliverable matters and which strategic objective/pillar it serves.
4. DATE INTEGRITY:
   - Strictly respect the confirmed campaignStartDate and campaignEndDate provided.
   - ALL phase startDate/endDate values MUST fall within [campaignStartDate, campaignEndDate].
   - ALL deliverable productionDate and publicationDate values MUST fall within [campaignStartDate, campaignEndDate], with productionDate <= publicationDate.
   - Ensure each deliverable's publicationDate falls within its assigned phase's startDate..endDate.
   - Avoid scheduling multiple deliverables on the same channel on the exact same publicationDate.
5. NEVER invent production costs, agency hours, media spend, or campaign budgets.
6. NEVER include claims about auto-publishing; all dates and deliverables remain editable suggestions awaiting plan approval.
7. Restrict "format" to: "Static Post", "Carousel", "Reel", "Video", "Story", "Blog Article", "Email", or "Other".`;

  app.post('/api/planner/generate', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as
      | {
          brief?: ClientBrief;
          strategy?: CampaignStrategy;
          campaignStartDate?: string;
          campaignEndDate?: string;
        }
      | undefined;

    const strategy = body?.strategy;
    const brief = body?.brief;
    const campaignStartDate = body?.campaignStartDate?.trim() || '';
    const campaignEndDate = body?.campaignEndDate?.trim() || '';

    if (!strategy || typeof strategy !== 'object') {
      res.status(400).json({ error: 'Missing campaign strategy in request.' });
      return;
    }

    if (strategy.approvalStatus !== 'approved') {
      res.status(400).json({
        error:
          'Only an approved campaign strategy can be used to generate a campaign plan. Approve the strategy first.',
      });
      return;
    }

    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!isoPattern.test(campaignStartDate) || !isoPattern.test(campaignEndDate)) {
      res.status(400).json({
        error:
          'Confirmed campaign start and end dates (YYYY-MM-DD) are required before generating a campaign plan. Please provide the campaign dates first.',
      });
      return;
    }

    if (campaignStartDate > campaignEndDate) {
      res.status(400).json({
        error:
          'Campaign start date cannot be after the campaign end date. Please correct the campaign period.',
      });
      return;
    }

    const selectedDirection = strategy.creativeDirections?.find(
      (d) => d.id === strategy.selectedCreativeDirectionId
    );

    const prompt = [
      'Generate a practical Campaign Plan (phases + deliverables + suggested dates) strictly from this approved strategy and confirmed campaign period.',
      '',
      `CONFIRMED CAMPAIGN PERIOD: ${campaignStartDate} to ${campaignEndDate}`,
      '',
      'APPROVED CAMPAIGN STRATEGY:',
      JSON.stringify(
        {
          campaignOverview: strategy.campaignOverview,
          campaignObjective: strategy.campaignObjective,
          targetAudience: strategy.targetAudience,
          campaignPositioning: strategy.campaignPositioning,
          coreCampaignMessage: strategy.coreCampaignMessage,
          selectedCreativeDirection: selectedDirection ?? null,
          contentPillars: strategy.contentPillars,
          recommendedChannels: strategy.recommendedChannels,
          campaignPhases: strategy.campaignPhases,
        },
        null,
        2
      ),
      brief
        ? `\nCLIENT BRIEF REFERENCE:\n${JSON.stringify(
            {
              clientName: brief.clientName,
              campaignTitle: brief.campaignTitle,
              productOrService: brief.productOrService,
              targetLocation: brief.targetLocation,
            },
            null,
            2
          )}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const rawJsonText = await generateStructuredJsonWithRetry(
        ai,
        prompt,
        PLANNER_SYSTEM_INSTRUCTION,
        CAMPAIGN_PLAN_SCHEMA
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJsonText);
      } catch {
        res.status(502).json({
          error:
            'The AI service returned malformed JSON for the campaign plan.',
        });
        return;
      }

      try {
        const validated = validateCampaignPlanPayload(parsed);
        res.json({
          plan: validated,
          model: MODEL_NAME,
          generatedAt: new Date().toISOString(),
        });
      } catch (validationErr) {
        res.status(502).json({
          error:
            validationErr instanceof Error
              ? `Campaign plan failed schema validation: ${validationErr.message}`
              : 'Campaign plan failed structural validation.',
        });
      }
    } catch (err) {
      handleGeminiRouteError(err, res, 'Campaign plan generation');
    }
  });

  const EXECUTION_ASSIST_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      progressSummary: {
        type: Type.STRING,
        description:
          'Concise summary of actual campaign production progress based strictly on provided task counts and statuses.',
      },
      outstandingWorkSummary: {
        type: Type.STRING,
        description:
          'Clear summary of remaining work across Not Started, In Progress, In Review, and Blocked tasks.',
      },
      overdueTasks: {
        type: Type.ARRAY,
        description:
          'Tasks whose dueDate is strictly before todayIso and status is not completed.',
        items: {
          type: Type.OBJECT,
          properties: {
            taskTitle: { type: Type.STRING },
            dueDate: { type: Type.STRING },
            currentStatus: { type: Type.STRING },
            impact: { type: Type.STRING },
          },
          required: ['taskTitle', 'dueDate', 'currentStatus', 'impact'],
        },
      },
      schedulingConflicts: {
        type: Type.ARRAY,
        description:
          'Detected conflicts such as task due dates after related deliverable publication dates, inverted start/due dates, or clustered high-priority deadlines.',
        items: {
          type: Type.OBJECT,
          properties: {
            topic: { type: Type.STRING },
            explanation: { type: Type.STRING },
            affectedTasks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ['topic', 'explanation', 'affectedTasks'],
        },
      },
      prioritizationSuggestions: {
        type: Type.ARRAY,
        description:
          'Advisory task prioritization recommendations for human review.',
        items: {
          type: Type.OBJECT,
          properties: {
            taskTitle: { type: Type.STRING },
            currentPriority: { type: Type.STRING },
            suggestedPriority: {
              type: Type.STRING,
              enum: ['low', 'medium', 'high', 'urgent'],
            },
            rationale: { type: Type.STRING },
          },
          required: [
            'taskTitle',
            'currentPriority',
            'suggestedPriority',
            'rationale',
          ],
        },
      },
    },
    required: [
      'progressSummary',
      'outstandingWorkSummary',
      'overdueTasks',
      'schedulingConflicts',
      'prioritizationSuggestions',
    ],
  };

  const EXECUTION_SYSTEM_INSTRUCTION = `You are a marketing operations producer inside CampaignOS.
Analyze ONLY the provided campaign record, approved deliverables, execution tasks, and current date (todayIso) to provide advisory execution guidance.

MANDATORY RULES:
1. NEVER invent tasks, owners, dates, completion percentages, or deliverables that are not in the input.
2. NEVER invent or guess employee identities; refer to "Unassigned" tasks as unassigned.
3. Base "overdueTasks" strictly on tasks where status !== "completed" AND dueDate < todayIso.
4. Highlight real scheduling conflicts (such as task dueDate > deliverable publicationDate, startDate > dueDate, blocked bottlenecks, or clustered deadlines).
5. Frame all prioritization recommendations strictly as advisory suggestions requiring human confirmation. Never claim tasks were updated automatically.`;

  app.post('/api/execution/assist', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as
      | {
          campaign?: CampaignRecord;
          deliverables?: ContentPlanDeliverable[];
          tasks?: ExecutionTask[];
          todayIso?: string;
        }
      | undefined;

    const campaign = body?.campaign;
    const deliverables = body?.deliverables ?? [];
    const tasks = body?.tasks ?? [];
    const todayIso =
      body?.todayIso?.trim() || new Date().toISOString().slice(0, 10);

    if (!campaign || typeof campaign !== 'object') {
      res.status(400).json({ error: 'Missing campaign payload in request.' });
      return;
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      res.status(400).json({
        error:
          'At least one execution task is required before running the Execution Assistant.',
      });
      return;
    }

    const prompt = [
      `Today's Date (todayIso): ${todayIso}`,
      '',
      'CAMPAIGN:',
      JSON.stringify(
        {
          id: campaign.id,
          title: campaign.title,
          clientName: campaign.clientName,
          launchDate: campaign.launchDate,
          endDate: campaign.endDate,
        },
        null,
        2
      ),
      '',
      'APPROVED CAMPAIGN DELIVERABLES:',
      JSON.stringify(deliverables, null, 2),
      '',
      'CURRENT EXECUTION TASKS:',
      JSON.stringify(tasks, null, 2),
    ].join('\n');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const rawJsonText = await generateStructuredJsonWithRetry(
        ai,
        prompt,
        EXECUTION_SYSTEM_INSTRUCTION,
        EXECUTION_ASSIST_SCHEMA
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJsonText);
      } catch {
        res.status(502).json({
          error:
            'The AI service returned malformed JSON for execution assistance.',
        });
        return;
      }

      try {
        const report = validateExecutionAssistancePayload(parsed, {
          campaignId: campaign.id,
          model: MODEL_NAME,
          generatedAt: new Date().toISOString(),
        });
        res.json({ report });
      } catch (validationErr) {
        res.status(502).json({
          error:
            validationErr instanceof Error
              ? `Execution assistant failed schema validation: ${validationErr.message}`
              : 'Execution assistant failed structural validation.',
        });
      }
    } catch (err) {
      handleGeminiRouteError(err, res, 'Execution assistant');
    }
  });

  const ASSISTANT_CHAT_SCHEMA = {
    type: Type.OBJECT,
    properties: {
      answer: {
        type: Type.STRING,
        description:
          'Direct, clear natural language answer grounded strictly in the provided selected campaign records.',
      },
      recordedFacts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Verified facts directly observed in the selected campaign records (statuses, dates, owners, approved brief/strategy details). Empty array if none.',
      },
      suggestions: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Clearly labeled advisory recommendations or next steps for human consideration.',
      },
      missingOrUnavailable: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description:
          'Items that are missing, unapproved, or unavailable in the selected campaign records.',
      },
      proposedActions: {
        type: Type.ARRAY,
        description:
          'Optional proposed workspace changes or campaign status report requiring explicit human confirmation. Only include when helpful or requested by the user.',
        items: {
          type: Type.OBJECT,
          properties: {
            actionType: {
              type: Type.STRING,
              enum: [
                'create_task',
                'update_task',
                'change_suggested_deadline',
                'add_deliverable',
                'prepare_campaign_report',
              ],
            },
            summary: {
              type: Type.STRING,
              description:
                'Clear 1-sentence description of what this proposed action would do upon user confirmation.',
            },
            taskPayload: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                deliverableId: { type: Type.STRING, nullable: true },
                suggestedOwner: { type: Type.STRING },
                assigneeName: {
                  type: Type.STRING,
                  description:
                    'Must be "Unassigned" or an exact name from teamMemberNames. Never invent employee names.',
                },
                startDate: { type: Type.STRING },
                dueDate: { type: Type.STRING },
                priority: {
                  type: Type.STRING,
                  enum: ['low', 'medium', 'high', 'urgent'],
                },
                status: {
                  type: Type.STRING,
                  enum: [
                    'not_started',
                    'in_progress',
                    'in_review',
                    'completed',
                    'blocked',
                  ],
                },
                notes: { type: Type.STRING },
              },
              required: [
                'title',
                'description',
                'suggestedOwner',
                'assigneeName',
                'startDate',
                'dueDate',
                'priority',
                'status',
                'notes',
              ],
            },
            updateTaskPayload: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                taskId: {
                  type: Type.STRING,
                  description: 'Exact id of an existing task in executionTasks.',
                },
                taskTitle: { type: Type.STRING },
                updates: {
                  type: Type.OBJECT,
                  properties: {
                    status: {
                      type: Type.STRING,
                      nullable: true,
                      enum: [
                        'not_started',
                        'in_progress',
                        'in_review',
                        'completed',
                        'blocked',
                      ],
                    },
                    priority: {
                      type: Type.STRING,
                      nullable: true,
                      enum: ['low', 'medium', 'high', 'urgent'],
                    },
                    startDate: { type: Type.STRING, nullable: true },
                    dueDate: { type: Type.STRING, nullable: true },
                    assigneeName: { type: Type.STRING, nullable: true },
                    notes: { type: Type.STRING, nullable: true },
                  },
                },
              },
              required: ['taskId', 'taskTitle', 'updates'],
            },
            deadlinePayload: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                targetType: {
                  type: Type.STRING,
                  enum: ['task', 'deliverable'],
                },
                targetId: {
                  type: Type.STRING,
                  description:
                    'Exact id of the existing task or deliverable.',
                },
                targetTitle: { type: Type.STRING },
                currentDueDate: { type: Type.STRING },
                proposedProductionDate: { type: Type.STRING, nullable: true },
                proposedDueDate: { type: Type.STRING },
                rationale: { type: Type.STRING },
              },
              required: [
                'targetType',
                'targetId',
                'targetTitle',
                'currentDueDate',
                'proposedDueDate',
                'rationale',
              ],
            },
            deliverablePayload: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                title: { type: Type.STRING },
                format: {
                  type: Type.STRING,
                  enum: [
                    'Static Post',
                    'Carousel',
                    'Reel',
                    'Video',
                    'Story',
                    'Blog Article',
                    'Email',
                    'Other',
                  ],
                },
                channel: { type: Type.STRING },
                phase: { type: Type.STRING },
                description: { type: Type.STRING },
                objective: { type: Type.STRING },
                relevanceNote: { type: Type.STRING },
                productionDate: { type: Type.STRING },
                publicationDate: { type: Type.STRING },
                priority: {
                  type: Type.STRING,
                  enum: ['low', 'normal', 'high'],
                },
                ownerRole: { type: Type.STRING },
              },
              required: [
                'title',
                'format',
                'channel',
                'phase',
                'description',
                'objective',
                'relevanceNote',
                'productionDate',
                'publicationDate',
                'priority',
                'ownerRole',
              ],
            },
            reportPayload: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                reportTitle: { type: Type.STRING },
                preparedFor: { type: Type.STRING },
                statusOverview: { type: Type.STRING },
                completedHighlights: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                outstandingWork: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                risksAndBlockers: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                nextSteps: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                markdownContent: { type: Type.STRING },
              },
              required: [
                'reportTitle',
                'preparedFor',
                'statusOverview',
                'completedHighlights',
                'outstandingWork',
                'risksAndBlockers',
                'nextSteps',
                'markdownContent',
              ],
            },
          },
          required: ['actionType', 'summary'],
        },
      },
    },
    required: [
      'answer',
      'recordedFacts',
      'suggestions',
      'missingOrUnavailable',
      'proposedActions',
    ],
  };

  const ASSISTANT_SYSTEM_INSTRUCTION = `You are the contextual CampaignOS AI Assistant embedded across the 5 agency workspace modules (Overview, Briefs, Strategy, Campaign Planner, Execution).

STRICT SCOPING & ANTI-HALLUCINATION RULES:
1. You may ONLY reference the single selected campaign's records provided in the prompt:
   - Approved brief (ONLY when approvedBrief is provided; if not approved, explicitly say the brief has not been approved yet).
   - Approved strategy (ONLY when approvedStrategy is provided; if not approved, explicitly say the strategy has not been approved yet).
   - Campaign plan & deliverables for this campaign (always note whether a deliverable is planned/in_production/pending_approval/approved/scheduled vs suggested).
   - Execution tasks & team member list for this campaign.
2. NEVER mix, assume, or reference data from any other campaign.
3. NEVER fabricate task statuses, completion progress, or completed work.
4. NEVER claim a deliverable has been published (even "scheduled" only means scheduled, NOT published).
5. NEVER invent campaign performance metrics, impressions, CTR, conversions, or ROI.
6. NEVER claim a team member completed an assignment unless an actual task record with status === "completed" and that owner exists.
7. NEVER invent employee names; use only names in teamMemberNames or "Unassigned".
8. CLEARLY DISTINGUISH recorded facts ("recordedFacts") from advisory recommendations ("suggestions").
9. If information is missing, unapproved, or unavailable, explicitly state that in both "answer" and "missingOrUnavailable".
10. You NEVER execute changes directly. When helpful or requested (creating a task, updating a task, changing a suggested deadline, adding a deliverable, or preparing a campaign status update/report), output structured entries in "proposedActions" so the user can explicitly confirm or dismiss them.
11. For update_task or change_suggested_deadline, use ONLY exact existing task/deliverable IDs provided in the context. Never invent IDs.`;

  app.post('/api/assistant/chat', async (req: Request, res: Response) => {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      res.status(503).json({
        error:
          'GEMINI_API_KEY is not configured on the server. Please add your Gemini API key in Settings > Secrets.',
      });
      return;
    }

    const body = req.body as
      | {
          campaign?: CampaignRecord;
          approvedBrief?: ClientBrief | null;
          approvedStrategy?: CampaignStrategy | null;
          plan?: CampaignPlan | null;
          deliverables?: ContentPlanDeliverable[];
          milestones?: TimelineMilestone[];
          tasks?: ExecutionTask[];
          teamMemberNames?: string[];
          approvalFlags?: {
            hasBrief: boolean;
            isBriefApproved: boolean;
            hasStrategy: boolean;
            isStrategyApproved: boolean;
            hasPlan: boolean;
            isPlanApproved: boolean;
          };
          activeModule?: NavSection;
          todayIso?: string;
          history?: Array<{ role: 'user' | 'assistant'; content: string }>;
          message?: string;
        }
      | undefined;

    const campaign = body?.campaign;
    const userMessage = body?.message?.trim() ?? '';

    if (!campaign || !campaign.id) {
      res.status(400).json({
        error: 'A selected campaign is required to use the Campaign Assistant.',
      });
      return;
    }

    if (!userMessage) {
      res.status(400).json({ error: 'Message cannot be empty.' });
      return;
    }

    // Server-side isolation guard: strip any cross-campaign or unapproved brief/strategy items
    const safeApprovedBrief =
      body?.approvedBrief &&
      body.approvedBrief.campaignId === campaign.id &&
      body.approvedBrief.analysis?.approved === true
        ? body.approvedBrief
        : null;

    const safeApprovedStrategy =
      body?.approvedStrategy &&
      body.approvedStrategy.campaignId === campaign.id &&
      body.approvedStrategy.approvalStatus === 'approved'
        ? body.approvedStrategy
        : null;

    const safePlan =
      body?.plan && body.plan.campaignId === campaign.id ? body.plan : null;

    const safeDeliverables = Array.isArray(body?.deliverables)
      ? body.deliverables.filter((d) => d.campaignId === campaign.id)
      : [];

    const safeMilestones = Array.isArray(body?.milestones)
      ? body.milestones.filter((m) => m.campaignId === campaign.id)
      : [];

    const safeTasks = Array.isArray(body?.tasks)
      ? body.tasks.filter((t) => t.campaignId === campaign.id)
      : [];

    const safeTeamNames = Array.isArray(body?.teamMemberNames)
      ? body.teamMemberNames.filter((n): n is string => typeof n === 'string' && Boolean(n.trim()))
      : [];

    const todayIso = body?.todayIso?.trim() || new Date().toISOString().slice(0, 10);

    const recentHistory = Array.isArray(body?.history)
      ? body.history.slice(-10)
      : [];

    const prompt = [
      `CURRENT DATE: ${todayIso}`,
      `CURRENT WORKSPACE MODULE VIEW: ${body?.activeModule || 'overview'}`,
      '',
      'SELECTED CAMPAIGN CONTEXT (STRICTLY ISOLATED TO THIS CAMPAIGN):',
      JSON.stringify(
        {
          campaign: {
            id: campaign.id,
            clientName: campaign.clientName,
            title: campaign.title,
            status: campaign.status,
            launchDate: campaign.launchDate || null,
            endDate: campaign.endDate || null,
            isDemo: Boolean(campaign.isDemo),
          },
          approvalFlags: body?.approvalFlags ?? {
            hasBrief: Boolean(safeApprovedBrief),
            isBriefApproved: Boolean(safeApprovedBrief),
            hasStrategy: Boolean(safeApprovedStrategy),
            isStrategyApproved: Boolean(safeApprovedStrategy),
            hasPlan: Boolean(safePlan),
            isPlanApproved: safePlan?.approvalStatus === 'approved',
          },
          approvedBrief: safeApprovedBrief,
          approvedStrategy: safeApprovedStrategy,
          campaignPlan: safePlan,
          deliverables: safeDeliverables,
          milestones: safeMilestones,
          executionTasks: safeTasks,
          teamMemberNames: safeTeamNames,
        },
        null,
        2
      ),
      '',
      recentHistory.length > 0
        ? `RECENT CONVERSATION IN THIS CAMPAIGN:\n${recentHistory
            .map((h) => `${h.role.toUpperCase()}: ${h.content}`)
            .join('\n')}`
        : 'CONVERSATION START (no prior messages).',
      '',
      `USER QUESTION / REQUEST:\n${userMessage}`,
    ].join('\n');

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    try {
      const rawJsonText = await generateStructuredJsonWithRetry(
        ai,
        prompt,
        ASSISTANT_SYSTEM_INSTRUCTION,
        ASSISTANT_CHAT_SCHEMA
      );

      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJsonText);
      } catch {
        res.status(502).json({
          error:
            'The AI service returned malformed JSON for the Campaign Assistant.',
        });
        return;
      }

      try {
        const assistantResponse = validateAssistantResponsePayload(parsed, {
          todayIso,
          tasks: safeTasks,
          deliverables: safeDeliverables,
          teamMemberNames: safeTeamNames,
        });
        res.json({
          response: assistantResponse,
          model: MODEL_NAME,
          generatedAt: new Date().toISOString(),
        });
      } catch (validationErr) {
        res.status(502).json({
          error:
            validationErr instanceof Error
              ? `Campaign Assistant failed schema validation: ${validationErr.message}`
              : 'Campaign Assistant failed structural validation.',
        });
      }
    } catch (err) {
      handleGeminiRouteError(err, res, 'Campaign Assistant');
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      const indexHtml = path.join(distDir, 'index.html');
      if (fs.existsSync(indexHtml)) {
        res.sendFile(indexHtml);
      } else {
        res.status(404).send('Production build not found.');
      }
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CampaignOS server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start CampaignOS server:', err);
  process.exit(1);
});
