import {
  ArrowRight,
  CheckCircle2,
  Edit3,
  ExternalLink,
  FileSearch,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { StatusIndicator } from '@/src/components/ui/StatusIndicator';
import type { ClientBrief } from '@/src/types/campaign';

interface BriefDetailPanelProps {
  brief: ClientBrief;
  isAnalysing: boolean;
  onEdit: () => void;
  onClose: () => void;
  onRequestDelete: () => void;
  onRunAnalysis: () => void;
  onViewAnalysis: () => void;
  onOpenStrategy: () => void;
}

function DetailField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value?: string;
  mono?: boolean;
}) {
  return (
    <div>
      <dt className="text-xs font-medium text-zinc-400">{label}</dt>
      <dd
        className={`mt-1 text-sm leading-relaxed ${
          value ? 'text-zinc-100' : 'text-zinc-600'
        } ${mono ? 'font-mono tabular-nums text-xs' : ''}`}
      >
        {value || 'Not specified'}
      </dd>
    </div>
  );
}

export function BriefDetailPanel({
  brief,
  isAnalysing,
  onEdit,
  onClose,
  onRequestDelete,
  onRunAnalysis,
  onViewAnalysis,
  onOpenStrategy,
}: BriefDetailPanelProps) {
  return (
    <section
      aria-label={`Brief details for ${brief.campaignTitle}`}
      className="rounded-lg border border-zinc-800 bg-[#111216] p-6 space-y-6"
    >
      <div className="flex flex-col gap-4 border-b border-zinc-800/80 pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400">
            <span>{brief.clientName}</span>
            {brief.industry && (
              <>
                <span aria-hidden="true">·</span>
                <span>{brief.industry}</span>
              </>
            )}
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">
              Created {brief.createdAt.slice(0, 10)}
            </span>
            {brief.isDemo && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-violet-400">DEMO</span>
              </>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-3">
            <h2 className="font-display text-xl font-semibold text-zinc-100">
              {brief.campaignTitle}
            </h2>
            <StatusIndicator status={brief.briefStatus} />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {brief.analysis && (
            <button
              type="button"
              onClick={onViewAnalysis}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-violet-500/50 bg-violet-500/15 px-3.5 py-2 text-xs font-medium text-violet-200 transition-colors hover:bg-violet-500/25"
            >
              <FileSearch className="h-3.5 w-3.5" />
              <span>
                View Analysis ({brief.analysis.readinessAssessment.status})
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={onRunAnalysis}
            disabled={isAnalysing}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-violet-600 px-3.5 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isAnalysing
                ? 'Analysing Brief...'
                : brief.analysis
                  ? 'Re-analyse with AI'
                  : 'Submit for AI Analysis'}
            </span>
          </button>

          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-600 hover:bg-zinc-800"
          >
            <Edit3 className="h-3.5 w-3.5" />
            <span>Edit</span>
          </button>

          <button
            type="button"
            onClick={onOpenStrategy}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-medium text-zinc-200 transition-colors hover:border-violet-500/60 hover:text-white"
          >
            <span>Open Strategy</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>

          <button
            type="button"
            onClick={onRequestDelete}
            className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md border border-zinc-800 bg-zinc-900/70 px-3 py-2 text-xs font-medium text-zinc-400 transition-colors hover:border-rose-500/40 hover:text-rose-400"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close brief detail view"
            className="rounded-md border border-zinc-800 p-2 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {brief.analysis && (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-800 bg-[#0D0E12] px-4 py-3 text-xs sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-zinc-300">
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${
                brief.analysis.approved ? 'text-emerald-400' : 'text-amber-400'
              }`}
            />
            <span>
              AI Brief Analysis ({brief.analysis.readinessAssessment.status}) —{' '}
              {brief.analysis.approved
                ? 'Approved by user as confirmed source.'
                : 'Awaiting user review and approval.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onViewAnalysis}
            className="font-medium text-violet-400 hover:text-violet-300 self-start sm:self-auto"
          >
            Review Analysis
          </button>
        </div>
      )}

      {/* Client Information */}
      <div>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Client Information
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 md:grid-cols-3">
          <DetailField label="Client/Brand Name" value={brief.clientName} />
          <DetailField label="Industry" value={brief.industry} />
          <div>
            <dt className="text-xs font-medium text-zinc-400">Website</dt>
            <dd className="mt-1 text-sm">
              {brief.website ? (
                <a
                  href={
                    brief.website.startsWith('http')
                      ? brief.website
                      : `https://${brief.website}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-violet-400 hover:text-violet-300"
                >
                  <span className="truncate max-w-xs">{brief.website}</span>
                  <ExternalLink className="h-3 w-3 shrink-0" />
                </a>
              ) : (
                <span className="text-zinc-600">Not specified</span>
              )}
            </dd>
          </div>
          <div className="md:col-span-3">
            <DetailField
              label="Business Description"
              value={brief.businessDescription}
            />
          </div>
        </dl>
      </div>

      {/* Campaign Information */}
      <div>
        <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Campaign Information
        </h3>
        <dl className="mt-3 grid grid-cols-1 gap-4 rounded-md border border-zinc-800/80 bg-[#0D0E12] p-4 md:grid-cols-3">
          <DetailField label="Campaign Name" value={brief.campaignTitle} />
          <DetailField
            label="Product or Service Being Promoted"
            value={brief.productOrService}
          />
          <DetailField
            label="Campaign Period"
            value={`${brief.launchDate} — ${brief.endDate}`}
            mono
          />
          <div className="md:col-span-3">
            <DetailField label="Campaign Objective" value={brief.objective} />
          </div>
          <DetailField label="Target Audience" value={brief.targetAudience} />
          <DetailField
            label="Target Location/Market"
            value={brief.targetLocation}
          />
          <DetailField label="Budget" value={brief.budget} />
          <DetailField
            label="Marketing Channels"
            value={
              brief.channels.length > 0 ? brief.channels.join(' · ') : ''
            }
          />
          <DetailField label="Key Message" value={brief.keyMessage} />
          <DetailField label="Competitors" value={brief.competitors} />
          <div className="md:col-span-3">
            <DetailField label="Additional Requirements" value={brief.notes} />
          </div>
        </dl>
      </div>

      {/* Source Document / Pasted Text */}
      {(brief.sourceFileName || brief.sourceText) && (
        <div>
          <h3 className="font-display text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Source Brief Content{' '}
            {brief.sourceFileName ? `(${brief.sourceFileName})` : '(Pasted Text)'}
          </h3>
          <pre className="mt-2 max-h-56 overflow-y-auto whitespace-pre-wrap rounded-md border border-zinc-800 bg-[#09090B] p-4 font-mono text-xs leading-relaxed text-zinc-300">
            {brief.sourceText}
          </pre>
        </div>
      )}
    </section>
  );
}
