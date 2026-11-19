import {
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Edit3,
  HelpCircle,
  RefreshCw,
  ShieldAlert,
  X,
} from 'lucide-react';
import type {
  BriefAnalysisReport,
  BriefReadinessStatus,
  ClassifiedField,
  ClassifiedListField,
  ClientBrief,
  FactClassification,
} from '@/src/types/campaign';

interface BriefAnalysisViewProps {
  brief: ClientBrief;
  analysis: BriefAnalysisReport;
  isAnalysing: boolean;
  onEditBrief: () => void;
  onApproveAnalysis: () => void;
  onRerunAnalysis: () => void;
  onOpenStrategy: () => void;
  onClose: () => void;
}

const CLASSIFICATION_STYLES: Record<
  FactClassification,
  { label: string; textClass: string; borderClass: string; bgClass: string }
> = {
  PROVIDED: {
    label: 'PROVIDED',
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/20',
  },
  INFERRED: {
    label: 'INFERRED · Needs Confirmation',
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-950/20',
  },
  MISSING: {
    label: 'MISSING',
    textClass: 'text-zinc-400',
    borderClass: 'border-zinc-700/80',
    bgClass: 'bg-zinc-900/60',
  },
  CONFLICTING: {
    label: 'CONFLICTING',
    textClass: 'text-rose-300',
    borderClass: 'border-rose-500/40',
    bgClass: 'bg-rose-950/25',
  },
};

const READINESS_STYLES: Record<
  BriefReadinessStatus,
  { textClass: string; borderClass: string; bgClass: string }
> = {
  Ready: {
    textClass: 'text-emerald-300',
    borderClass: 'border-emerald-500/35',
    bgClass: 'bg-emerald-950/20',
  },
  'Needs Clarification': {
    textClass: 'text-amber-300',
    borderClass: 'border-amber-500/35',
    bgClass: 'bg-amber-950/20',
  },
  Incomplete: {
    textClass: 'text-rose-300',
    borderClass: 'border-rose-500/35',
    bgClass: 'bg-rose-950/20',
  },
};

function ClassificationTag({
  classification,
}: {
  classification: FactClassification;
}) {
  const style = CLASSIFICATION_STYLES[classification];
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 font-mono text-[10px] font-medium tracking-wide whitespace-nowrap ${style.textClass} ${style.borderClass} ${style.bgClass}`}
    >
      {style.label}
    </span>
  );
}

function ExtractedFieldRow({
  label,
  field,
}: {
  label: string;
  field: ClassifiedField;
}) {
  const isMissing = field.classification === 'MISSING' || !field.value;
  return (
    <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <ClassificationTag classification={field.classification} />
      </div>

      <div
        className={`text-sm leading-relaxed ${
          isMissing ? 'italic text-zinc-500' : 'text-zinc-100'
        }`}
      >
        {field.value ?? 'Missing — not provided in original brief'}
      </div>

      {field.evidence && (
        <div className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">Evidence:</span>{' '}
          <span className="text-zinc-300">&ldquo;{field.evidence}&rdquo;</span>
        </div>
      )}

      {field.note && (
        <div className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">Analyst Note:</span>{' '}
          {field.note}
        </div>
      )}
    </div>
  );
}

function ExtractedListRow({
  label,
  field,
}: {
  label: string;
  field: ClassifiedListField;
}) {
  const isMissing =
    field.classification === 'MISSING' || field.items.length === 0;
  return (
    <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-400">{label}</span>
        <ClassificationTag classification={field.classification} />
      </div>

      {isMissing ? (
        <div className="text-sm italic text-zinc-500">
          Missing — not provided in original brief
        </div>
      ) : (
        <div className="text-sm text-zinc-100">{field.items.join(' · ')}</div>
      )}

      {field.evidence && (
        <div className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">Evidence:</span>{' '}
          <span className="text-zinc-300">&ldquo;{field.evidence}&rdquo;</span>
        </div>
      )}

      {field.note && (
        <div className="text-xs text-zinc-400">
          <span className="font-medium text-zinc-500">Analyst Note:</span>{' '}
          {field.note}
        </div>
      )}
    </div>
  );
}

export function BriefAnalysisView({
  brief,
  analysis,
  isAnalysing,
  onEditBrief,
  onApproveAnalysis,
  onRerunAnalysis,
  onOpenStrategy,
  onClose,
}: BriefAnalysisViewProps) {
  const readinessStyle = READINESS_STYLES[analysis.readinessAssessment.status];
  const briefModifiedAfterAnalysis = brief.updatedAt > analysis.analysedAt;

  return (
    <section
      aria-label={`AI Brief Analysis for ${brief.campaignTitle}`}
      className="rounded-lg border border-zinc-800 bg-[#111216] p-6 space-y-6"
    >
      {/* Header & Required Actions */}
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>{brief.clientName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">
              Analysed {analysis.analysedAt.slice(0, 10)}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-zinc-500">{analysis.model}</span>
            {brief.isDemo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-violet-400">DEMO</span>
              </>
            )}
          </div>

          <h2 className="mt-1.5 font-display text-xl font-semibold text-zinc-100">
            AI Brief Analysis — {brief.campaignTitle}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onEditBrief}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Brief</span>
          </button>

          <button
            type="button"
            onClick={onRerunAnalysis}
            disabled={isAnalysing}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:border-zinc-600 hover:bg-zinc-800 disabled:opacity-50"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isAnalysing ? 'animate-spin' : ''}`}
            />
            <span>{isAnalysing ? 'Analysing...' : 'Re-analyse'}</span>
          </button>

          {!analysis.approved ? (
            <button
              type="button"
              onClick={onApproveAnalysis}
              disabled={isAnalysing}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve Analysis</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onOpenStrategy}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-emerald-600 px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
            >
              <span>Proceed to Strategy</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label="Close analysis view"
            className="rounded-md border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Approval Status Banner */}
      {analysis.approved ? (
        <div className="flex flex-col gap-2 rounded-md border border-emerald-500/35 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>
              <strong>Analysis Approved:</strong> Confirmed as the verified source for campaign strategy on{' '}
              <span className="font-mono">
                {analysis.approvedAt?.slice(0, 10) ?? 'today'}
              </span>
              .
            </span>
          </div>
          <button
            type="button"
            onClick={onOpenStrategy}
            className="inline-flex items-center gap-1 font-medium text-emerald-300 hover:text-emerald-200 self-start sm:self-auto"
          >
            <span>Open Strategy</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-start gap-2.5 rounded-md border border-amber-500/35 bg-amber-950/20 px-4 py-3 text-xs text-amber-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
          <div>
            <span className="font-semibold">Pending User Review:</span> Review extracted facts, inferences, missing data, and conflicts below. This analysis will not become the confirmed source for Strategy until you click <strong>Approve Analysis</strong>.
            {briefModifiedAfterAnalysis && (
              <span className="block mt-1 text-amber-300">
                Note: The brief was modified after this analysis ran. Consider re-analysing before approval.
              </span>
            )}
          </div>
        </div>
      )}

      {/* N. Brief Readiness Assessment & A. Brief Summary */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div
          className={`rounded-md border p-4 space-y-2 ${readinessStyle.borderClass} ${readinessStyle.bgClass}`}
        >
          <div className="text-xs font-medium text-zinc-400">
            N. Brief Readiness Assessment
          </div>
          <div className={`font-display text-lg font-semibold ${readinessStyle.textClass}`}>
            {analysis.readinessAssessment.status}
          </div>
          <p className="text-xs leading-relaxed text-zinc-200">
            {analysis.readinessAssessment.explanation}
          </p>
          {analysis.readinessAssessment.blockingGaps.length > 0 && (
            <div className="pt-2 border-t border-zinc-800/60">
              <div className="text-[11px] font-medium text-zinc-400">
                Blocking Gaps:
              </div>
              <ul className="mt-1 list-disc pl-4 space-y-0.5 text-xs text-zinc-300">
                {analysis.readinessAssessment.blockingGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 space-y-2 lg:col-span-2">
          <div className="text-xs font-medium text-zinc-400">
            A. Brief Summary
          </div>
          <p className="text-sm leading-relaxed text-zinc-100">
            {analysis.briefSummary}
          </p>
        </div>
      </div>

      {/* L. Conflicting Information Warnings */}
      {analysis.conflictingInformation.length > 0 && (
        <div className="rounded-md border border-rose-500/40 bg-rose-950/20 p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-rose-300">
            <AlertOctagon className="h-4 w-4 shrink-0 text-rose-400" />
            <span>
              L. Conflicting Information Detected ({analysis.conflictingInformation.length})
            </span>
          </div>
          <div className="space-y-3">
            {analysis.conflictingInformation.map((conflict, idx) => (
              <div
                key={idx}
                className="rounded border border-rose-500/25 bg-[#09090B] p-3 text-xs space-y-1.5"
              >
                <div className="font-semibold text-rose-200">
                  {conflict.topic}
                </div>
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div className="text-zinc-300">
                    <span className="text-zinc-500">Statement A:</span>{' '}
                    {conflict.statementA}
                  </div>
                  <div className="text-zinc-300">
                    <span className="text-zinc-500">Statement B:</span>{' '}
                    {conflict.statementB}
                  </div>
                </div>
                <div className="text-rose-300/90">{conflict.explanation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* K. Missing Information Indicators */}
      {analysis.missingInformation.length > 0 && (
        <div className="rounded-md border border-zinc-800 bg-[#0D0E12] p-4 space-y-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              K. Missing Information ({analysis.missingInformation.length})
            </span>
          </div>
          <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
            {analysis.missingInformation.map((item, idx) => (
              <div
                key={idx}
                className="rounded border border-zinc-800/80 bg-[#09090B] px-3 py-2.5 text-xs"
              >
                <div className="font-medium text-zinc-200">{item.field}</div>
                <div className="mt-0.5 text-zinc-400">{item.impact}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* B. Client and Business Information */}
      <div className="space-y-3">
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
          B. Client and Business Information
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <ExtractedFieldRow
            label="Client / Brand Name"
            field={analysis.clientAndBusiness.clientName}
          />
          <ExtractedFieldRow
            label="Industry"
            field={analysis.clientAndBusiness.industry}
          />
          <ExtractedFieldRow
            label="Business Description"
            field={analysis.clientAndBusiness.businessDescription}
          />
          <ExtractedFieldRow
            label="Website"
            field={analysis.clientAndBusiness.website}
          />
          <div className="md:col-span-2">
            <ExtractedFieldRow
              label="Competitors"
              field={analysis.clientAndBusiness.competitors}
            />
          </div>
        </div>
      </div>

      {/* C. Campaign Objectives & D-J Structured Fields */}
      <div className="space-y-3">
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
          C – J. Campaign Scope, Audience, Messaging, Timeline & Budget
        </h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <div className="md:col-span-2 space-y-2">
            <ExtractedFieldRow
              label="C. Campaign Objective"
              field={analysis.campaignObjectives.primaryObjective}
            />
            {analysis.campaignObjectives.unclearRequirements.length > 0 && (
              <div className="rounded-md border border-amber-500/30 bg-amber-950/15 px-4 py-3 text-xs">
                <div className="font-medium text-amber-300">
                  Unclear Requirements Flagged
                </div>
                <ul className="mt-1 list-disc pl-4 space-y-0.5 text-zinc-300">
                  {analysis.campaignObjectives.unclearRequirements.map(
                    (req, i) => (
                      <li key={i}>{req}</li>
                    )
                  )}
                </ul>
              </div>
            )}
          </div>

          <ExtractedFieldRow
            label="D. Product or Service"
            field={analysis.productOrService}
          />
          <ExtractedFieldRow
            label="E. Target Audience"
            field={analysis.targetAudience}
          />
          <ExtractedFieldRow
            label="F. Target Market / Location"
            field={analysis.targetMarket}
          />
          <ExtractedListRow
            label="G. Marketing Channels"
            field={analysis.marketingChannels}
          />
          <ExtractedFieldRow
            label="H. Key Message"
            field={analysis.keyMessage}
          />
          <ExtractedFieldRow label="J. Budget" field={analysis.budget} />
          <ExtractedFieldRow
            label="I. Campaign Start Date"
            field={analysis.campaignTimeline.startDate}
          />
          <ExtractedFieldRow
            label="I. Campaign End Date"
            field={analysis.campaignTimeline.endDate}
          />
          <div className="md:col-span-2">
            <ExtractedFieldRow
              label="I. Timeline Notes"
              field={analysis.campaignTimeline.durationOrNotes}
            />
          </div>
        </div>
      </div>

      {/* M. Clarification Questions */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-4 w-4 text-violet-400" />
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
            M. Clarification Questions ({analysis.clarificationQuestions.length})
          </h3>
        </div>
        {analysis.clarificationQuestions.length === 0 ? (
          <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] px-4 py-3 text-xs text-zinc-400">
            No clarification questions generated.
          </div>
        ) : (
          <ol className="space-y-2.5">
            {analysis.clarificationQuestions.map((q, idx) => (
              <li
                key={idx}
                className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 text-sm"
              >
                <div className="font-medium text-zinc-100">
                  <span className="mr-2 font-mono text-xs text-violet-400">
                    Q{idx + 1}.
                  </span>
                  {q.question}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-zinc-400">
                  <span className="font-mono text-zinc-300">
                    {q.targetField}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{q.reason}</span>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>

      {/* Preserved Original Brief Reference */}
      <details className="rounded-md border border-zinc-800 bg-[#0D0E12] p-4">
        <summary className="cursor-pointer text-xs font-medium text-zinc-300 hover:text-white">
          Original Submitted Client Brief Reference (Unmodified)
        </summary>
        <div className="mt-3 grid grid-cols-1 gap-3 border-t border-zinc-800/80 pt-3 text-xs md:grid-cols-2">
          <div>
            <span className="text-zinc-500">Client:</span>{' '}
            <span className="text-zinc-200">{brief.clientName}</span>
          </div>
          <div>
            <span className="text-zinc-500">Campaign:</span>{' '}
            <span className="text-zinc-200">{brief.campaignTitle}</span>
          </div>
          <div className="md:col-span-2">
            <span className="text-zinc-500">Objective:</span>{' '}
            <span className="text-zinc-200">{brief.objective}</span>
          </div>
          {brief.sourceText && (
            <div className="md:col-span-2">
              <div className="text-zinc-500 mb-1">Source Document / Pasted Text:</div>
              <pre className="max-h-44 overflow-y-auto whitespace-pre-wrap rounded border border-zinc-800 bg-[#09090B] p-3 font-mono text-[11px] text-zinc-300">
                {brief.sourceText}
              </pre>
            </div>
          )}
        </div>
      </details>

      {/* Bottom Action Footer */}
      <div className="flex flex-col gap-3 border-t border-zinc-800/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs text-zinc-500">
          {analysis.approved
            ? 'Analysis confirmed for next stage.'
            : 'Review all inferences and missing items before approving.'}
        </span>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={onEditBrief}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-200 hover:border-zinc-600 hover:bg-zinc-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit Brief</span>
          </button>

          {!analysis.approved && (
            <button
              type="button"
              onClick={onApproveAnalysis}
              disabled={isAnalysing}
              className="inline-flex items-center gap-1.5 rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Approve Analysis</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
