import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  Copy,
  Download,
  Loader2,
  MessageSquare,
  RotateCcw,
  Send,
  X,
} from 'lucide-react';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type { AssistantProposedAction } from '@/src/types/campaign';

const STARTER_PROMPTS = [
  'Summarize this campaign.',
  'What are the outstanding deliverables?',
  'Which tasks are overdue?',
  'What information is missing?',
  'Explain our campaign strategy.',
  'What should the creative team work on next?',
  'Are there any scheduling conflicts?',
  'Prepare a campaign status update.',
];

const ACTION_TYPE_LABEL: Record<AssistantProposedAction['actionType'], string> = {
  create_task: 'Proposed Action: Create Execution Task',
  update_task: 'Proposed Action: Update Task',
  change_suggested_deadline: 'Proposed Action: Change Suggested Deadline',
  add_deliverable: 'Proposed Action: Add Campaign Deliverable',
  prepare_campaign_report: 'Proposed Action: Prepare Campaign Status Report',
};

export function CampaignAssistantDrawer() {
  const {
    state,
    activeNav,
    selectedCampaignId,
    setSelectedCampaignId,
    assistantOpen,
    setAssistantOpen,
    assistantConversations,
    sendAssistantMessage,
    applyAssistantAction,
    dismissAssistantAction,
    resetAssistantConversation,
  } = useCampaignWorkspace();

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedActionId, setCopiedActionId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const campaign = useMemo(
    () =>
      state.campaigns.find((c) => c.id === selectedCampaignId) ??
      state.campaigns[0] ??
      null,
    [state.campaigns, selectedCampaignId]
  );

  const campaignId = campaign?.id ?? '';
  const messages = useMemo(
    () => (campaignId ? assistantConversations[campaignId] ?? [] : []),
    [assistantConversations, campaignId]
  );

  const scopeStatus = useMemo(() => {
    if (!campaignId) return null;
    const brief = state.briefs.find((b) => b.campaignId === campaignId);
    const strategy = state.strategies.find((s) => s.campaignId === campaignId);
    const deliverableCount = state.deliverables.filter(
      (d) => d.campaignId === campaignId
    ).length;
    const taskCount = state.tasks.filter(
      (t) => t.campaignId === campaignId
    ).length;

    return {
      briefApproved: Boolean(brief?.analysis?.approved),
      strategyApproved: strategy?.approvalStatus === 'approved',
      deliverableCount,
      taskCount,
    };
  }, [campaignId, state.briefs, state.strategies, state.deliverables, state.tasks]);

  useEffect(() => {
    if (!assistantOpen) return;
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [assistantOpen, messages.length, isSending]);

  useEffect(() => {
    if (!assistantOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [assistantOpen, setAssistantOpen]);

  if (!assistantOpen) return null;

  const handleSend = async (textOverride?: string) => {
    if (!campaign || isSending) return;
    const text = (textOverride ?? draft).trim();
    if (!text) return;

    setError(null);
    if (!textOverride) {
      setDraft('');
    }
    setIsSending(true);
    const res = await sendAssistantMessage(campaign.id, text);
    setIsSending(false);
    if (!res.ok) {
      setError(res.error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleCopyReport = async (actionId: string, markdown: string) => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopiedActionId(actionId);
      setTimeout(() => {
        setCopiedActionId((prev) => (prev === actionId ? null : prev));
      }, 2000);
    } catch {
      setError('Unable to copy report to clipboard.');
    }
  };

  const handleDownloadReport = (title: string, markdown: string) => {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'campaign-status-report';
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${slug}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Campaign Assistant"
      className="fixed inset-0 z-50 flex justify-end"
    >
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-xs"
        onClick={() => setAssistantOpen(false)}
        aria-hidden="true"
      />

      <aside className="relative z-10 flex h-full w-full max-w-[560px] flex-col border-l border-zinc-800 bg-[#0D0E12] shadow-2xl">
        {/* Drawer Header */}
        <div className="border-b border-zinc-800/90 px-5 py-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <MessageSquare className="h-4 w-4 shrink-0 text-violet-400" />
              <h2 className="font-display text-base font-semibold text-zinc-100 truncate">
                Campaign Assistant
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                disabled={!campaign || messages.length === 0 || isSending}
                onClick={() => {
                  if (campaign) {
                    setError(null);
                    resetAssistantConversation(campaign.id);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs font-medium text-zinc-300 hover:border-zinc-700 hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-45"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>New Chat</span>
              </button>

              <button
                type="button"
                onClick={() => setAssistantOpen(false)}
                aria-label="Close Campaign Assistant"
                className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {state.campaigns.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="assistant-campaign-select"
                  className="text-xs font-medium text-zinc-400 whitespace-nowrap"
                >
                  Active Campaign
                </label>
                <select
                  id="assistant-campaign-select"
                  value={campaign?.id ?? ''}
                  onChange={(e) => {
                    setError(null);
                    setSelectedCampaignId(e.target.value);
                  }}
                  className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-[#111216] px-2.5 py-1.5 text-xs font-medium text-zinc-100 focus:border-violet-500 focus:outline-none"
                >
                  {state.campaigns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.clientName} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              {scopeStatus && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-400">
                  <span>
                    Brief:{' '}
                    <span
                      className={
                        scopeStatus.briefApproved
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {scopeStatus.briefApproved ? 'Approved' : 'Not Approved'}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Strategy:{' '}
                    <span
                      className={
                        scopeStatus.strategyApproved
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }
                    >
                      {scopeStatus.strategyApproved
                        ? 'Approved'
                        : 'Not Approved'}
                    </span>
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Deliverables: {scopeStatus.deliverableCount}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">
                    Tasks: {scopeStatus.taskCount}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">View: {activeNav}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Message History */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 py-4 space-y-4"
        >
          {!campaign ? (
            <div className="rounded-lg border border-zinc-800 bg-[#111216] p-5 text-xs text-zinc-400 leading-relaxed">
              No campaigns exist in this workspace yet. Create a client brief in
              the <span className="text-zinc-200 font-medium">Briefs</span>{' '}
              module to start interacting with the Campaign Assistant.
            </div>
          ) : messages.length === 0 ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4 space-y-2">
                <div className="text-xs font-semibold text-zinc-100">
                  Scoped to {campaign.title}
                </div>
                <p className="text-xs leading-relaxed text-zinc-400">
                  Ask questions about this campaign&apos;s approved brief,
                  approved strategy, deliverables, deadlines, and execution
                  tasks. Data from other campaigns is never mixed in, and any
                  proposed updates require your explicit confirmation.
                </p>
              </div>

              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-400">
                  Suggested Questions
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {STARTER_PROMPTS.map((promptText) => (
                    <button
                      key={promptText}
                      type="button"
                      disabled={isSending}
                      onClick={() => void handleSend(promptText)}
                      className="rounded-md border border-zinc-800 bg-[#111216] px-3 py-2 text-left text-xs text-zinc-200 transition-colors hover:border-violet-500/60 hover:bg-zinc-900 disabled:opacity-50"
                    >
                      {promptText}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            messages.map((msg) =>
              msg.role === 'user' ? (
                <div key={msg.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-lg border border-violet-500/35 bg-violet-600/15 px-3.5 py-2.5 text-xs leading-relaxed text-zinc-100">
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className="mt-1.5 font-mono text-[10px] text-zinc-400 tabular-nums">
                      {msg.createdAt.replace('T', ' ').slice(0, 16)}
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  key={msg.id}
                  className="rounded-lg border border-zinc-800/90 bg-[#111216] p-4 space-y-3.5 text-xs"
                >
                  <p className="whitespace-pre-wrap leading-relaxed text-zinc-100">
                    {msg.content}
                  </p>

                  {msg.recordedFacts && msg.recordedFacts.length > 0 && (
                    <div className="border-t border-zinc-800/80 pt-3 space-y-1.5">
                      <div className="font-semibold text-zinc-200">
                        Recorded Campaign Facts
                      </div>
                      <ul className="list-disc space-y-1 pl-4 text-zinc-300 leading-relaxed">
                        {msg.recordedFacts.map((fact, idx) => (
                          <li key={idx}>{fact}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="border-t border-zinc-800/80 pt-3 space-y-1.5">
                      <div className="font-semibold text-violet-300">
                        Advisory Suggestions
                      </div>
                      <ul className="list-disc space-y-1 pl-4 text-zinc-300 leading-relaxed">
                        {msg.suggestions.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {msg.missingOrUnavailable &&
                    msg.missingOrUnavailable.length > 0 && (
                      <div className="border-t border-zinc-800/80 pt-3 space-y-1.5">
                        <div className="font-semibold text-amber-300">
                          Unavailable or Unapproved Information
                        </div>
                        <ul className="list-disc space-y-1 pl-4 text-amber-100/85 leading-relaxed">
                          {msg.missingOrUnavailable.map((gap, idx) => (
                            <li key={idx}>{gap}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {msg.proposedActions && msg.proposedActions.length > 0 && (
                    <div className="border-t border-zinc-800/80 pt-3 space-y-2.5">
                      <div className="font-semibold text-zinc-200">
                        Proposed Changes (Confirmation Required)
                      </div>

                      {msg.proposedActions.map((action) => (
                        <div
                          key={action.id}
                          className="rounded-md border border-zinc-800 bg-[#09090B] p-3 space-y-2.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="font-medium text-violet-300">
                                {ACTION_TYPE_LABEL[action.actionType]}
                              </div>
                              <p className="mt-0.5 text-zinc-200 leading-relaxed">
                                {action.summary}
                              </p>
                            </div>
                          </div>

                          {/* Action Payload Preview */}
                          {action.actionType === 'create_task' && (
                            <div className="space-y-1 border-t border-zinc-800/70 pt-2 text-[11px] text-zinc-400">
                              <div>
                                Title:{' '}
                                <span className="text-zinc-200">
                                  {action.payload.title}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span>
                                  Owner: {action.payload.assigneeName}
                                </span>
                                <span>
                                  Priority: {action.payload.priority}
                                </span>
                                <span className="font-mono tabular-nums">
                                  {action.payload.startDate} →{' '}
                                  {action.payload.dueDate}
                                </span>
                              </div>
                            </div>
                          )}

                          {action.actionType === 'update_task' && (
                            <div className="space-y-1 border-t border-zinc-800/70 pt-2 text-[11px] text-zinc-400">
                              <div>
                                Task:{' '}
                                <span className="text-zinc-200">
                                  {action.payload.taskTitle}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                {action.payload.updates.status && (
                                  <span>
                                    Status: {action.payload.updates.status}
                                  </span>
                                )}
                                {action.payload.updates.priority && (
                                  <span>
                                    Priority: {action.payload.updates.priority}
                                  </span>
                                )}
                                {action.payload.updates.assigneeName && (
                                  <span>
                                    Owner: {action.payload.updates.assigneeName}
                                  </span>
                                )}
                                {action.payload.updates.dueDate && (
                                  <span className="font-mono tabular-nums">
                                    Due: {action.payload.updates.dueDate}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}

                          {action.actionType ===
                            'change_suggested_deadline' && (
                            <div className="space-y-1 border-t border-zinc-800/70 pt-2 text-[11px] text-zinc-400">
                              <div>
                                Target ({action.payload.targetType}):{' '}
                                <span className="text-zinc-200">
                                  {action.payload.targetTitle}
                                </span>
                              </div>
                              <div className="font-mono tabular-nums text-zinc-300">
                                {action.payload.currentDueDate} →{' '}
                                {action.payload.proposedDueDate}
                              </div>
                            </div>
                          )}

                          {action.actionType === 'add_deliverable' && (
                            <div className="space-y-1 border-t border-zinc-800/70 pt-2 text-[11px] text-zinc-400">
                              <div>
                                Deliverable:{' '}
                                <span className="text-zinc-200">
                                  {action.payload.title}
                                </span>
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1">
                                <span>{action.payload.channel}</span>
                                <span>{action.payload.format}</span>
                                <span>{action.payload.phase}</span>
                                <span className="font-mono tabular-nums">
                                  Pub: {action.payload.publicationDate}
                                </span>
                              </div>
                            </div>
                          )}

                          {action.actionType === 'prepare_campaign_report' && (
                            <div className="space-y-1 border-t border-zinc-800/70 pt-2 text-[11px] text-zinc-400">
                              <div>
                                Report:{' '}
                                <span className="text-zinc-200">
                                  {action.payload.reportTitle}
                                </span>{' '}
                                ({action.payload.preparedFor})
                              </div>
                            </div>
                          )}

                          {/* Confirmation Controls or Applied Report Output */}
                          {action.status === 'pending' ? (
                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                onClick={() =>
                                  applyAssistantAction(
                                    campaign.id,
                                    msg.id,
                                    action.id
                                  )
                                }
                                className="inline-flex items-center gap-1 rounded bg-violet-600 px-2.5 py-1.5 text-[11px] font-medium text-white hover:bg-violet-500"
                              >
                                <Check className="h-3 w-3" />
                                <span>
                                  {action.actionType ===
                                  'prepare_campaign_report'
                                    ? 'Confirm & Generate Report'
                                    : 'Confirm & Apply'}
                                </span>
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  dismissAssistantAction(
                                    campaign.id,
                                    msg.id,
                                    action.id
                                  )
                                }
                                className="rounded border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-[11px] font-medium text-zinc-300 hover:text-white"
                              >
                                Dismiss
                              </button>
                            </div>
                          ) : action.status === 'applied' ? (
                            <div className="space-y-2.5 pt-1">
                              <div className="flex items-center justify-between text-[11px] text-emerald-400">
                                <span className="inline-flex items-center gap-1 font-medium">
                                  <Check className="h-3 w-3" />
                                  Confirmed & Applied
                                </span>
                                {action.appliedAt && (
                                  <span className="font-mono text-zinc-500 tabular-nums">
                                    {action.appliedAt
                                      .replace('T', ' ')
                                      .slice(0, 16)}
                                  </span>
                                )}
                              </div>

                              {action.actionType ===
                                'prepare_campaign_report' && (
                                <div className="rounded border border-zinc-800 bg-[#111216] p-3 space-y-2">
                                  <div className="flex flex-wrap items-center justify-between gap-2">
                                    <span className="font-semibold text-zinc-100">
                                      {action.payload.reportTitle}
                                    </span>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() =>
                                          void handleCopyReport(
                                            action.id,
                                            action.payload.markdownContent
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-[#09090B] px-2 py-1 text-[11px] text-zinc-200 hover:border-zinc-500"
                                      >
                                        {copiedActionId === action.id ? (
                                          <Check className="h-3 w-3 text-emerald-400" />
                                        ) : (
                                          <Copy className="h-3 w-3" />
                                        )}
                                        <span>
                                          {copiedActionId === action.id
                                            ? 'Copied'
                                            : 'Copy'}
                                        </span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() =>
                                          handleDownloadReport(
                                            action.payload.reportTitle,
                                            action.payload.markdownContent
                                          )
                                        }
                                        className="inline-flex items-center gap-1 rounded border border-zinc-700 bg-[#09090B] px-2 py-1 text-[11px] text-zinc-200 hover:border-zinc-500"
                                      >
                                        <Download className="h-3 w-3" />
                                        <span>Export .md</span>
                                      </button>
                                    </div>
                                  </div>
                                  <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap font-sans text-[11px] leading-relaxed text-zinc-300">
                                    {action.payload.markdownContent}
                                  </pre>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="pt-1 text-[11px] text-zinc-500">
                              Dismissed by user
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            )
          )}

          {isSending && (
            <div className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-[#111216] px-4 py-3 text-xs text-zinc-300">
              <Loader2 className="h-3.5 w-3.5 animate-spin text-violet-400" />
              <span>Reviewing {campaign?.title} records...</span>
            </div>
          )}

          {error && (
            <div className="flex items-start justify-between gap-2 rounded-md border border-rose-500/40 bg-rose-950/25 px-3.5 py-2.5 text-xs text-rose-200">
              <div className="flex items-start gap-2">
                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
              <button
                type="button"
                onClick={() => setError(null)}
                className="text-zinc-400 hover:text-zinc-200 shrink-0"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-zinc-800/90 bg-[#111216] p-4 space-y-2.5">
          <div className="flex items-end gap-2">
            <textarea
              rows={2}
              value={draft}
              disabled={!campaign || isSending}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                campaign
                  ? `Ask about ${campaign.title}...`
                  : 'Select or create a campaign first...'
              }
              aria-label="Ask Campaign Assistant"
              className="flex-1 resize-none rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none disabled:opacity-50"
            />
            <button
              type="button"
              disabled={!campaign || !draft.trim() || isSending}
              onClick={() => void handleSend()}
              aria-label="Send message"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-violet-600 px-3.5 text-xs font-medium text-white hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {isSending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              <span>Send</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500">
            Strictly scoped to the selected campaign. Proposed changes always require your explicit confirmation.
          </p>
        </div>
      </aside>
    </div>
  );
}
