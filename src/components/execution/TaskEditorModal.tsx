import React, { useState } from 'react';
import { AlertTriangle, Clock, X } from 'lucide-react';
import type {
  ContentPlanDeliverable,
  ExecutionTask,
  TaskPriority,
  TaskStatus,
  TeamMember,
} from '@/src/types/campaign';

interface TaskEditorModalProps {
  mode: 'create' | 'edit';
  initialTask?: ExecutionTask;
  deliverables: ContentPlanDeliverable[];
  teamMembers: TeamMember[];
  onSave: (
    data: Omit<
      ExecutionTask,
      'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
    >
  ) => void;
  onClose: () => void;
}

export function TaskEditorModal({
  mode,
  initialTask,
  deliverables,
  teamMembers,
  onSave,
  onClose,
}: TaskEditorModalProps) {
  const todayIso = new Date().toISOString().slice(0, 10);

  const [title, setTitle] = useState(initialTask?.title ?? '');
  const [description, setDescription] = useState(
    initialTask?.description ?? ''
  );
  const [deliverableId, setDeliverableId] = useState(
    initialTask?.deliverableId ?? ''
  );
  const [suggestedOwner, setSuggestedOwner] = useState(
    initialTask?.suggestedOwner ?? 'Unassigned'
  );
  const [assigneeName, setAssigneeName] = useState(
    initialTask?.assigneeName || 'Unassigned'
  );
  const [startDate, setStartDate] = useState(
    initialTask?.startDate || todayIso
  );
  const [dueDate, setDueDate] = useState(initialTask?.dueDate || todayIso);
  const [priority, setPriority] = useState<TaskPriority>(
    initialTask?.priority ?? 'medium'
  );
  const [status, setStatus] = useState<TaskStatus>(
    initialTask?.status ?? 'not_started'
  );
  const [notes, setNotes] = useState(initialTask?.notes ?? '');
  const [formError, setFormError] = useState<string | null>(null);

  const invertedDates = Boolean(startDate && dueDate && startDate > dueDate);

  const handleDeliverableChange = (nextId: string) => {
    setDeliverableId(nextId);
    const chosen = deliverables.find((d) => d.id === nextId);
    if (chosen && mode === 'create') {
      if (!suggestedOwner || suggestedOwner === 'Unassigned') {
        setSuggestedOwner(chosen.ownerRole || 'Unassigned');
      }
      if (chosen.productionDate) {
        setDueDate(chosen.productionDate);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setFormError('Task title is required.');
      return;
    }
    if (!startDate || !dueDate) {
      setFormError('Start date and due date are required.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      deliverableId: deliverableId || undefined,
      suggestedOwner: suggestedOwner.trim() || 'Unassigned',
      assigneeName: assigneeName.trim() || 'Unassigned',
      startDate,
      dueDate,
      priority,
      status,
      notes: notes.trim(),
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'create' ? 'Create Execution Task' : 'Edit Task'}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-zinc-800 bg-[#111216] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div>
            <h2 className="font-display text-base font-semibold text-zinc-100">
              {mode === 'create' ? 'Create Execution Task' : 'Edit Execution Task'}
            </h2>
            <p className="mt-0.5 text-xs text-zinc-400">
              Changes are recorded with timestamp history upon user confirmation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close task modal"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          {formError && (
            <div className="rounded-md border border-rose-500/40 bg-rose-950/25 px-3.5 py-2.5 text-xs text-rose-200">
              {formError}
            </div>
          )}

          {invertedDates && (
            <div className="flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-950/25 px-3.5 py-2.5 text-xs text-amber-200">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
              <span>
                Start date ({startDate}) is after due date ({dueDate}).
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="task-title"
                className="block text-xs font-medium text-zinc-300"
              >
                Task Title *
              </label>
              <input
                id="task-title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Produce Instagram carousel copy & layout"
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-description"
                className="block text-xs font-medium text-zinc-300"
              >
                Description
              </label>
              <textarea
                id="task-description"
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Scope of work, creative instructions, or acceptance requirements..."
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-deliverable"
                className="block text-xs font-medium text-zinc-300"
              >
                Related Deliverable
              </label>
              <select
                id="task-deliverable"
                value={deliverableId}
                onChange={(e) => handleDeliverableChange(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="">General campaign task (no linked deliverable)</option>
                {deliverables.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.channel} · {d.format})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-owner"
                className="block text-xs font-medium text-zinc-300"
              >
                Assigned Owner
              </label>
              <select
                id="task-owner"
                value={assigneeName}
                onChange={(e) => setAssigneeName(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="Unassigned">Unassigned</option>
                {teamMembers.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name}
                    {m.role ? ` (${m.role})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="task-suggested-owner"
                className="block text-xs font-medium text-zinc-300"
              >
                Suggested Owner / Role
              </label>
              <input
                id="task-suggested-owner"
                type="text"
                value={suggestedOwner}
                onChange={(e) => setSuggestedOwner(e.target.value)}
                placeholder="e.g. Copywriter or Unassigned"
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="task-start-date"
                className="block text-xs font-medium text-zinc-300"
              >
                Start Date *
              </label>
              <input
                id="task-start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="task-due-date"
                className="block text-xs font-medium text-zinc-300"
              >
                Due Date *
              </label>
              <input
                id="task-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 font-mono text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="task-priority"
                className="block text-xs font-medium text-zinc-300"
              >
                Priority
              </label>
              <select
                id="task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="task-status"
                className="block text-xs font-medium text-zinc-300"
              >
                Status
              </label>
              <select
                id="task-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as TaskStatus)}
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 focus:border-violet-500 focus:outline-none"
              >
                <option value="not_started">Not Started</option>
                <option value="in_progress">In Progress</option>
                <option value="in_review">In Review</option>
                <option value="completed">Completed</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="task-notes"
                className="block text-xs font-medium text-zinc-300"
              >
                Notes
              </label>
              <textarea
                id="task-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Production blockers, review feedback, or handoff notes..."
                className="mt-1.5 w-full rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
            </div>
          </div>

          {mode === 'edit' &&
            initialTask?.history &&
            initialTask.history.length > 0 && (
              <div className="rounded-md border border-zinc-800/80 bg-[#0D0E12] p-3.5 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-300">
                  <Clock className="h-3.5 w-3.5 text-zinc-400" />
                  <span>Confirmed Update History</span>
                </div>
                <ul className="max-h-32 space-y-1.5 overflow-y-auto text-[11px] text-zinc-400">
                  {initialTask.history.map((entry) => (
                    <li
                      key={entry.id}
                      className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/60 pb-1 last:border-b-0 last:pb-0"
                    >
                      <span className="text-zinc-300">{entry.summary}</span>
                      <span className="font-mono text-zinc-500 tabular-nums">
                        {entry.timestamp.replace('T', ' ').slice(0, 16)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

          <div className="flex items-center justify-end gap-2.5 border-t border-zinc-800 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-xs font-medium text-zinc-300 hover:text-zinc-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-md bg-violet-600 px-4 py-2 text-xs font-medium text-white hover:bg-violet-500"
            >
              {mode === 'create' ? 'Create Task' : 'Confirm & Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
