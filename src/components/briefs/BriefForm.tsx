import React, { useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  ClipboardPaste,
  FileText,
  Upload,
  X,
} from 'lucide-react';
import {
  extractBriefDocumentText,
  parseBriefTextToFields,
} from '@/src/services/briefs/documentExtractor';
import type { BriefFormInput } from '@/src/services/storage/campaignRepository';
import type {
  BriefInputMethod,
  BriefStatus,
  ClientBrief,
} from '@/src/types/campaign';

const CHANNEL_OPTIONS = [
  'LinkedIn',
  'YouTube',
  'Instagram',
  'Email',
  'Paid Search',
  'Display',
  'Events',
  'TikTok',
  'SEO',
  'PR',
];

interface BriefFormProps {
  mode: 'create' | 'edit';
  initialBrief?: ClientBrief;
  onSave: (input: BriefFormInput) => void;
  onCancel: () => void;
}

function getDefaultDates() {
  const start = new Date().toISOString().slice(0, 10);
  const endObj = new Date();
  endObj.setDate(endObj.getDate() + 30);
  const end = endObj.toISOString().slice(0, 10);
  return { start, end };
}

export function BriefForm({
  mode,
  initialBrief,
  onSave,
  onCancel,
}: BriefFormProps) {
  const defaults = getDefaultDates();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [inputMethod, setInputMethod] = useState<BriefInputMethod>(
    initialBrief?.inputMethod ?? 'manual'
  );

  // Client Information
  const [clientName, setClientName] = useState(initialBrief?.clientName ?? '');
  const [industry, setIndustry] = useState(initialBrief?.industry ?? '');
  const [businessDescription, setBusinessDescription] = useState(
    initialBrief?.businessDescription ?? ''
  );
  const [website, setWebsite] = useState(initialBrief?.website ?? '');

  // Campaign Information
  const [campaignTitle, setCampaignTitle] = useState(
    initialBrief?.campaignTitle ?? ''
  );
  const [objective, setObjective] = useState(initialBrief?.objective ?? '');
  const [productOrService, setProductOrService] = useState(
    initialBrief?.productOrService ?? ''
  );
  const [targetAudience, setTargetAudience] = useState(
    initialBrief?.targetAudience ?? ''
  );
  const [targetLocation, setTargetLocation] = useState(
    initialBrief?.targetLocation ?? ''
  );
  const [launchDate, setLaunchDate] = useState(
    initialBrief?.launchDate ?? defaults.start
  );
  const [endDate, setEndDate] = useState(
    initialBrief?.endDate ?? defaults.end
  );
  const [channels, setChannels] = useState<string[]>(
    initialBrief?.channels ?? []
  );
  const [budget, setBudget] = useState(initialBrief?.budget ?? '');
  const [keyMessage, setKeyMessage] = useState(initialBrief?.keyMessage ?? '');
  const [competitors, setCompetitors] = useState(
    initialBrief?.competitors ?? ''
  );
  const [notes, setNotes] = useState(initialBrief?.notes ?? '');
  const [briefStatus, setBriefStatus] = useState<BriefStatus>(
    initialBrief?.briefStatus ?? 'draft'
  );

  // Upload / Paste state
  const [sourceFileName, setSourceFileName] = useState<string | undefined>(
    initialBrief?.sourceFileName
  );
  const [sourceText, setSourceText] = useState<string>(
    initialBrief?.sourceText ?? ''
  );
  const [pastedDraftText, setPastedDraftText] = useState<string>(
    initialBrief?.sourceText ?? ''
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState('');
  const [extractionSummary, setExtractionSummary] = useState<{
    message: string;
    matchedLabels: string[];
  } | null>(null);

  // Validation state
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [dateError, setDateError] = useState('');

  const toggleChannel = (channel: string) => {
    setChannels((prev) =>
      prev.includes(channel)
        ? prev.filter((c) => c !== channel)
        : [...prev, channel]
    );
  };

  const applyParsedFields = (
    rawText: string,
    originLabel: string,
    fileName?: string
  ) => {
    const { fields, matchedLabels } = parseBriefTextToFields(rawText);

    if (fields.clientName) setClientName(fields.clientName);
    if (fields.industry) setIndustry(fields.industry);
    if (fields.businessDescription)
      setBusinessDescription(fields.businessDescription);
    if (fields.website) setWebsite(fields.website);
    if (fields.campaignTitle) setCampaignTitle(fields.campaignTitle);
    if (fields.objective) setObjective(fields.objective);
    if (fields.productOrService) setProductOrService(fields.productOrService);
    if (fields.targetAudience) setTargetAudience(fields.targetAudience);
    if (fields.targetLocation) setTargetLocation(fields.targetLocation);
    if (fields.launchDate) setLaunchDate(fields.launchDate);
    if (fields.endDate) setEndDate(fields.endDate);
    if (fields.channels && fields.channels.length > 0)
      setChannels(fields.channels);
    if (fields.budget) setBudget(fields.budget);
    if (fields.keyMessage) setKeyMessage(fields.keyMessage);
    if (fields.competitors) setCompetitors(fields.competitors);
    if (fields.notes) setNotes(fields.notes);

    setSourceText(rawText);
    if (fileName) setSourceFileName(fileName);

    setExtractionSummary({
      message:
        matchedLabels.length > 0
          ? `${originLabel} extracted (${rawText.length} characters). Populated ${matchedLabels.length} labeled ${matchedLabels.length === 1 ? 'field' : 'fields'}. Review and complete any missing required fields below.`
          : `${originLabel} extracted (${rawText.length} characters). No standard field labels (e.g. "Client Name:", "Campaign Name:", "Objective:") were matched automatically — review the extracted text below and complete the structured fields manually.`,
      matchedLabels,
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExtractionError('');
    setExtractionSummary(null);
    setIsExtracting(true);

    try {
      const extracted = await extractBriefDocumentText(file);
      setPastedDraftText(extracted.text);
      applyParsedFields(
        extracted.text,
        `Document "${extracted.fileName}" (${extracted.fileType.toUpperCase()})`,
        extracted.fileName
      );
    } catch (err) {
      setSourceFileName(undefined);
      setSourceText('');
      setExtractionSummary(null);
      setExtractionError(
        err instanceof Error
          ? err.message
          : 'Document extraction failed. Please verify the file format and try again.'
      );
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleApplyPastedText = () => {
    setExtractionError('');
    setExtractionSummary(null);
    const trimmed = pastedDraftText.trim();
    if (!trimmed) {
      setExtractionError('Please paste brief text before applying it to the form.');
      return;
    }
    setSourceFileName(undefined);
    applyParsedFields(trimmed, 'Pasted brief text');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const missing: string[] = [];
    if (!clientName.trim()) missing.push('Client/Brand Name');
    if (!campaignTitle.trim()) missing.push('Campaign Name');
    if (!objective.trim()) missing.push('Campaign Objective');

    let invalidDates = '';
    if (launchDate && endDate && endDate < launchDate) {
      invalidDates = 'Campaign End Date cannot be earlier than Campaign Start Date.';
    }

    setMissingFields(missing);
    setDateError(invalidDates);

    if (missing.length > 0 || invalidDates) {
      return;
    }

    onSave({
      clientName,
      industry,
      businessDescription,
      website,
      campaignTitle,
      objective,
      productOrService,
      targetAudience,
      targetLocation,
      launchDate,
      endDate,
      channels,
      budget,
      keyMessage,
      competitors,
      notes,
      briefStatus,
      inputMethod,
      sourceFileName,
      sourceText: sourceText || undefined,
    });
  };

  const hasMissingClient = missingFields.includes('Client/Brand Name');
  const hasMissingCampaign = missingFields.includes('Campaign Name');
  const hasMissingObjective = missingFields.includes('Campaign Objective');

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-zinc-800 bg-[#111216] p-6 space-y-6"
    >
      <div className="flex flex-col gap-3 border-b border-zinc-800/80 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-zinc-100">
            {mode === 'create' ? 'New Client Brief' : `Edit Brief — ${initialBrief?.campaignTitle}`}
          </h2>
          <p className="mt-0.5 text-xs text-zinc-400">
            Enter client and campaign requirements manually, upload a PDF/DOCX/TXT document, or paste existing brief text.
          </p>
        </div>

        <button
          type="button"
          onClick={onCancel}
          aria-label="Close brief form"
          className="self-end rounded-md border border-zinc-800 p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100 sm:self-auto"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Input Method Selector */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-zinc-400 mr-1">
            Intake Method:
          </span>
          <button
            type="button"
            onClick={() => {
              setInputMethod('manual');
              setExtractionError('');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMethod === 'manual'
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-200'
                : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Manual Entry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMethod('upload');
              setExtractionError('');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMethod === 'upload'
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-200'
                : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <Upload className="h-3.5 w-3.5" />
            <span>Upload Document (PDF, DOCX, TXT)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setInputMethod('paste');
              setExtractionError('');
            }}
            className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
              inputMethod === 'paste'
                ? 'border-violet-500/60 bg-violet-500/15 text-violet-200'
                : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
          >
            <ClipboardPaste className="h-3.5 w-3.5" />
            <span>Paste Brief Text</span>
          </button>
        </div>

        {inputMethod === 'upload' && (
          <div className="rounded-md border border-zinc-800 bg-[#0D0E12] p-4 space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-xs font-medium text-zinc-200">
                  Upload Brief Document
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  Supported formats: <span className="font-mono text-zinc-300">.pdf</span>,{' '}
                  <span className="font-mono text-zinc-300">.docx</span>,{' '}
                  <span className="font-mono text-zinc-300">.txt</span>. Text is extracted locally in your browser.
                </div>
              </div>
              <div className="shrink-0">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                  onChange={handleFileChange}
                  disabled={isExtracting}
                  className="hidden"
                  id="brief-file-upload"
                />
                <label
                  htmlFor="brief-file-upload"
                  className={`inline-flex cursor-pointer items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-100 transition-colors hover:border-violet-500/60 hover:bg-zinc-800 ${
                    isExtracting ? 'opacity-60 pointer-events-none' : ''
                  }`}
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>{isExtracting ? 'Extracting Text...' : 'Select Document'}</span>
                </label>
              </div>
            </div>

            {sourceFileName && !extractionError && (
              <div className="text-xs text-zinc-400">
                Loaded file: <span className="font-mono text-zinc-200">{sourceFileName}</span>
              </div>
            )}
          </div>
        )}

        {inputMethod === 'paste' && (
          <div className="rounded-md border border-zinc-800 bg-[#0D0E12] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <label
                htmlFor="paste-brief-textarea"
                className="text-xs font-medium text-zinc-200"
              >
                Paste Existing Brief Content
              </label>
              <span className="text-[11px] text-zinc-500">
                Labeled lines (e.g. Client:, Campaign:, Objective:) auto-fill matching fields
              </span>
            </div>
            <textarea
              id="paste-brief-textarea"
              rows={5}
              value={pastedDraftText}
              onChange={(e) => setPastedDraftText(e.target.value)}
              placeholder={`Paste raw client brief text here...\n\nExample labeled lines:\nClient Name: Acme Corp\nCampaign Name: Q2 Launch\nObjective: Increase qualified demo requests`}
              className="w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs leading-relaxed text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleApplyPastedText}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 hover:border-violet-500/60 hover:bg-zinc-800"
              >
                <ClipboardPaste className="h-3.5 w-3.5" />
                <span>Extract Fields from Pasted Text</span>
              </button>
            </div>
          </div>
        )}

        {extractionError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs text-rose-200"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
            <div>
              <div className="font-medium text-rose-200">
                Document extraction failed
              </div>
              <p className="mt-0.5 text-rose-300/90">{extractionError}</p>
            </div>
          </div>
        )}

        {extractionSummary && !extractionError && (
          <div className="space-y-2 rounded-md border border-emerald-500/30 bg-emerald-950/20 px-4 py-3 text-xs text-emerald-200">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
              <div>
                <p>{extractionSummary.message}</p>
                {extractionSummary.matchedLabels.length > 0 && (
                  <p className="mt-1 text-emerald-300/90">
                    Matched fields: {extractionSummary.matchedLabels.join(' · ')}
                  </p>
                )}
              </div>
            </div>
            {sourceText && (
              <details className="pt-1">
                <summary className="cursor-pointer text-zinc-300 hover:text-white">
                  View extracted source text ({sourceText.length} chars)
                </summary>
                <pre className="mt-2 max-h-48 overflow-y-auto whitespace-pre-wrap rounded border border-zinc-800 bg-[#09090B] p-3 font-mono text-[11px] leading-relaxed text-zinc-300">
                  {sourceText}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>

      {/* Validation Alert */}
      {(missingFields.length > 0 || dateError) && (
        <div
          role="alert"
          className="rounded-md border border-rose-500/40 bg-rose-950/30 px-4 py-3 text-xs text-rose-200 space-y-1"
        >
          {missingFields.length > 0 && (
            <div>
              <span className="font-semibold">Missing mandatory fields:</span>{' '}
              {missingFields.join(', ')}
            </div>
          )}
          {dateError && <div>{dateError}</div>}
        </div>
      )}

      {/* CLIENT INFORMATION */}
      <fieldset className="space-y-4 border-t border-zinc-800/80 pt-5">
        <legend className="font-display text-sm font-semibold text-zinc-100">
          Client Information
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="brief-client-name"
              className="block text-xs font-medium text-zinc-300"
            >
              Client/Brand Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="brief-client-name"
              type="text"
              value={clientName}
              onChange={(e) => {
                setClientName(e.target.value);
                if (hasMissingClient && e.target.value.trim()) {
                  setMissingFields((prev) =>
                    prev.filter((f) => f !== 'Client/Brand Name')
                  );
                }
              }}
              placeholder="e.g. Northstar Robotics"
              aria-invalid={hasMissingClient}
              className={`mt-1.5 w-full rounded-md border bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
                hasMissingClient
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="brief-industry"
              className="block text-xs font-medium text-zinc-300"
            >
              Industry
            </label>
            <input
              id="brief-industry"
              type="text"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              placeholder="e.g. Industrial Automation, B2B SaaS, Consumer Audio"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <label
              htmlFor="brief-business-desc"
              className="block text-xs font-medium text-zinc-300"
            >
              Business Description
            </label>
            <textarea
              id="brief-business-desc"
              rows={2}
              value={businessDescription}
              onChange={(e) => setBusinessDescription(e.target.value)}
              placeholder="Overview of the client's business model, market position, and offering..."
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="brief-website"
              className="block text-xs font-medium text-zinc-300"
            >
              Website <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              id="brief-website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://example.com"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>
      </fieldset>

      {/* CAMPAIGN INFORMATION */}
      <fieldset className="space-y-4 border-t border-zinc-800/80 pt-5">
        <legend className="font-display text-sm font-semibold text-zinc-100">
          Campaign Information
        </legend>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="brief-campaign-name"
              className="block text-xs font-medium text-zinc-300"
            >
              Campaign Name <span className="text-rose-400">*</span>
            </label>
            <input
              id="brief-campaign-name"
              type="text"
              value={campaignTitle}
              onChange={(e) => {
                setCampaignTitle(e.target.value);
                if (hasMissingCampaign && e.target.value.trim()) {
                  setMissingFields((prev) =>
                    prev.filter((f) => f !== 'Campaign Name')
                  );
                }
              }}
              placeholder="e.g. Q2 Enterprise Platform Launch"
              aria-invalid={hasMissingCampaign}
              className={`mt-1.5 w-full rounded-md border bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
                hasMissingCampaign
                  ? 'border-rose-500 focus:border-rose-400'
                  : 'border-zinc-800 focus:border-violet-500'
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="brief-product-service"
              className="block text-xs font-medium text-zinc-300"
            >
              Product or Service Being Promoted
            </label>
            <input
              id="brief-product-service"
              type="text"
              value={productOrService}
              onChange={(e) => setProductOrService(e.target.value)}
              placeholder="Specific product line, software suite, or service"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="brief-objective"
            className="block text-xs font-medium text-zinc-300"
          >
            Campaign Objective <span className="text-rose-400">*</span>
          </label>
          <textarea
            id="brief-objective"
            rows={2}
            value={objective}
            onChange={(e) => {
              setObjective(e.target.value);
              if (hasMissingObjective && e.target.value.trim()) {
                setMissingFields((prev) =>
                  prev.filter((f) => f !== 'Campaign Objective')
                );
              }
            }}
            placeholder="Primary campaign goal, KPIs, and expected business outcome..."
            aria-invalid={hasMissingObjective}
            className={`mt-1.5 w-full rounded-md border bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none ${
              hasMissingObjective
                ? 'border-rose-500 focus:border-rose-400'
                : 'border-zinc-800 focus:border-violet-500'
            }`}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="brief-target-audience"
              className="block text-xs font-medium text-zinc-300"
            >
              Target Audience
            </label>
            <input
              id="brief-target-audience"
              type="text"
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              placeholder="Buyer personas, roles, demographics"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="brief-target-location"
              className="block text-xs font-medium text-zinc-300"
            >
              Target Location/Market
            </label>
            <input
              id="brief-target-location"
              type="text"
              value={targetLocation}
              onChange={(e) => setTargetLocation(e.target.value)}
              placeholder="e.g. United States, DACH, Global"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label
              htmlFor="brief-start-date"
              className="block text-xs font-medium text-zinc-300"
            >
              Campaign Start Date
            </label>
            <input
              id="brief-start-date"
              type="date"
              value={launchDate}
              onChange={(e) => setLaunchDate(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="brief-end-date"
              className="block text-xs font-medium text-zinc-300"
            >
              Campaign End Date
            </label>
            <input
              id="brief-end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="brief-budget"
              className="block text-xs font-medium text-zinc-300"
            >
              Budget <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              id="brief-budget"
              type="text"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="e.g. $50,000"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <span className="block text-xs font-medium text-zinc-300">
            Marketing Channels
          </span>
          <div className="mt-2 flex flex-wrap gap-2">
            {CHANNEL_OPTIONS.map((channel) => {
              const selected = channels.includes(channel);
              return (
                <button
                  key={channel}
                  type="button"
                  onClick={() => toggleChannel(channel)}
                  className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                    selected
                      ? 'border-violet-500/60 bg-violet-500/15 text-violet-200'
                      : 'border-zinc-800 bg-[#09090B] text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                  }`}
                >
                  {channel}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label
              htmlFor="brief-key-message"
              className="block text-xs font-medium text-zinc-300"
            >
              Key Message
            </label>
            <input
              id="brief-key-message"
              type="text"
              value={keyMessage}
              onChange={(e) => setKeyMessage(e.target.value)}
              placeholder="Core value proposition or campaign hook"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="brief-competitors"
              className="block text-xs font-medium text-zinc-300"
            >
              Competitors <span className="text-zinc-500">(optional)</span>
            </label>
            <input
              id="brief-competitors"
              type="text"
              value={competitors}
              onChange={(e) => setCompetitors(e.target.value)}
              placeholder="Key competing brands or alternatives"
              className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="brief-additional-req"
            className="block text-xs font-medium text-zinc-300"
          >
            Additional Requirements
          </label>
          <textarea
            id="brief-additional-req"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Compliance constraints, tone of voice, brand guidelines, deliverables notes..."
            className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
          />
        </div>
      </fieldset>

      {/* Footer Actions & Brief Status */}
      <div className="flex flex-col gap-4 border-t border-zinc-800/80 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <label
            htmlFor="brief-status-select"
            className="text-xs font-medium text-zinc-400"
          >
            Brief Status
          </label>
          <select
            id="brief-status-select"
            value={briefStatus}
            onChange={(e) => setBriefStatus(e.target.value as BriefStatus)}
            className="rounded-md border border-zinc-800 bg-[#09090B] px-3 py-1.5 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
          >
            <option value="draft">Draft</option>
            <option value="ready_for_analysis">Ready for Analysis</option>
            <option value="analysed">Analysed</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-zinc-800 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-zinc-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500"
          >
            {mode === 'create' ? 'Save Brief' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
}
