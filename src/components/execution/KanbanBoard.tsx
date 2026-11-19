import React, { useState } from 'react';
import { AlertTriangle, Edit3, Trash2 } from 'lucide-react';
import type {
  ExecutionTask,
  TaskPriority,
  TaskStatus,
} from '@/src/types/campaign';

interface KanbanBoardProps {
  tasks: ExecutionTask[];
  deliverableLookup: Map<string, string>;
  todayIso: string;
  onMoveStatus: (taskId: string, status: TaskStatus) => void;
  onEditTask: (task: ExecutionTask) => void;
  onDeleteTask: (taskId: string) => void;
}

const KANBAN_COLUMNS: Array<{
  status: TaskStatus;
  label: string;
  dotColor: string;
}> = [
  { status: 'not_started', label: 'Not Started', dotColor: 'bg-zinc-500' },
  { status: 'in_progress', label: 'In Progress', dotColor: 'bg-indigo-400' },
  { status: 'in_review', label: 'In Review', dotColor: 'bg-amber-400' },
  { status: 'completed', label: 'Completed', dotColor: 'bg-emerald-400' },
  { status: 'blocked', label: 'Blocked', dotColor: 'bg-rose-400' },
];

const PRIORITY_STYLE: Record<TaskPriority, { label: string; cls: string }> = {
  low: { label: 'Low', cls: 'text-zinc-400' },
  medium: { label: 'Medium', cls: 'text-zinc-200' },
  high: { label: 'High', cls: 'text-amber-400' },
  urgent: { label: 'Urgent', cls: 'text-rose-400 font-semibold' },
};

export function KanbanBoard({
  tasks,
  deliverableLookup,
  todayIso,
  onMoveStatus,
  onEditTask,
  onDeleteTask,
}: KanbanBoardProps) {
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<TaskStatus | null>(null);

  const handleDrop = (e: React.DragEvent, targetStatus: TaskStatus) => {
    e.preventDefault();
    const id = draggedTaskId || e.dataTransfer.getData('text/plain');
    setDragOverStatus(null);
    setDraggedTaskId(null);
    if (!id) return;
    const existing = tasks.find((t) => t.id === id);
    if (existing && existing.status !== targetStatus) {
      onMoveStatus(id, targetStatus);
    }
  };

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid min-w-[1120px] grid-cols-5 gap-3">
        {KANBAN_COLUMNS.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.status);
          const isDropTarget = dragOverStatus === col.status;

          return (
            <div
              key={col.status}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOverStatus(col.status);
              }}
              onDragLeave={() => setDragOverStatus(null)}
              onDrop={(e) => handleDrop(e, col.status)}
              className={`flex min-h-[420px] flex-col rounded-lg border transition-colors ${
                isDropTarget
                  ? 'border-violet-500/70 bg-violet-950/15'
                  : 'border-zinc-800/90 bg-[#111216]'
              }`}
            >
              <div className="flex items-center justify-between border-b border-zinc-800/80 px-3.5 py-3">
                <div className="flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${col.dotColor}`}
                    aria-hidden="true"
                  />
                  <h3 className="font-display text-xs font-semibold text-zinc-100">
                    {col.label}
                  </h3>
                </div>
                <span className="font-mono text-xs text-zinc-400 tabular-nums">
                  {colTasks.length}
                </span>
              </div>

              <div className="flex-1 space-y-2.5 p-2.5">
                {colTasks.length === 0 ? (
                  <div className="rounded border border-dashed border-zinc-800/80 px-3 py-8 text-center text-[11px] text-zinc-600">
                    No tasks
                  </div>
                ) : (
                  colTasks.map((task) => {
                    const isOverdue =
                      task.status !== 'completed' &&
                      Boolean(task.dueDate) &&
                      task.dueDate < todayIso;
                    const linkedDeliverable = task.deliverableId
                      ? deliverableLookup.get(task.deliverableId)
                      : undefined;
                    const pStyle = PRIORITY_STYLE[task.priority] ?? PRIORITY_STYLE.medium;

                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => {
                          setDraggedTaskId(task.id);
                          e.dataTransfer.setData('text/plain', task.id);
                        }}
                        onDragEnd={() => {
                          setDraggedTaskId(null);
                          setDragOverStatus(null);
                        }}
                        className={`rounded-md border p-3 transition-colors ${
                          isOverdue
                            ? 'border-rose-500/40 bg-rose-950/15'
                            : 'border-zinc-800 bg-[#09090B] hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="text-left text-xs font-semibold text-zinc-100 hover:text-violet-300 leading-snug"
                          >
                            {task.title}
                          </button>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => onEditTask(task)}
                              aria-label={`Edit ${task.title}`}
                              className="rounded p-1 text-zinc-500 hover:text-zinc-200"
                            >
                              <Edit3 className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => onDeleteTask(task.id)}
                              aria-label={`Delete ${task.title}`}
                              className="rounded p-1 text-zinc-500 hover:text-rose-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </div>

                        {linkedDeliverable && (
                          <div className="mt-1.5 truncate text-[11px] text-zinc-400">
                            {linkedDeliverable}
                          </div>
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-zinc-400">
                          <span className={pStyle.cls}>{pStyle.label}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              task.assigneeName === 'Unassigned'
                                ? 'text-zinc-500'
                                : 'text-zinc-200'
                            }
                          >
                            {task.assigneeName || 'Unassigned'}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-800/70 pt-2">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] tabular-nums ${
                              isOverdue ? 'text-rose-400' : 'text-zinc-400'
                            }`}
                          >
                            {isOverdue && (
                              <AlertTriangle className="h-3 w-3 shrink-0" />
                            )}
                            <span>{task.dueDate}</span>
                          </span>

                          <select
                            aria-label={`Move ${task.title} status`}
                            value={task.status}
                            onChange={(e) =>
                              onMoveStatus(task.id, e.target.value as TaskStatus)
                            }
                            className="rounded border border-zinc-800 bg-[#111216] px-1.5 py-0.5 text-[11px] text-zinc-300 focus:border-violet-500 focus:outline-none"
                          >
                            <option value="not_started">Not Started</option>
                            <option value="in_progress">In Progress</option>
                            <option value="in_review">In Review</option>
                            <option value="completed">Completed</option>
                            <option value="blocked">Blocked</option>
                          </select>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
