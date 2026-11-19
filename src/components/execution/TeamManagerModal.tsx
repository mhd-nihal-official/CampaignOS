import React, { useState } from 'react';
import { Plus, Trash2, Users, X } from 'lucide-react';
import type { TeamMember } from '@/src/types/campaign';

interface TeamManagerModalProps {
  teamMembers: TeamMember[];
  onAddMember: (name: string, role?: string) => void;
  onDeleteMember: (memberId: string) => void;
  onClose: () => void;
}

export function TeamManagerModal({
  teamMembers,
  onAddMember,
  onDeleteMember,
  onClose,
}: TeamManagerModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Team member name is required.');
      return;
    }
    if (
      teamMembers.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())
    ) {
      setError('This team member already exists in the workspace.');
      return;
    }
    onAddMember(trimmed, role.trim() || undefined);
    setName('');
    setRole('');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Manage Workspace Team Owners"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
    >
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-[#111216] shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-400" />
            <div>
              <h2 className="font-display text-base font-semibold text-zinc-100">
                Manage Team Owners
              </h2>
              <p className="text-xs text-zinc-400">
                Add real team member names manually. Unassigned tasks display as &quot;Unassigned&quot;.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close team manager"
            className="rounded p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 p-5">
          <form onSubmit={handleAdd} className="space-y-2.5">
            {error && (
              <div className="rounded border border-rose-500/40 bg-rose-950/25 px-3 py-2 text-xs text-rose-200">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-5">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Member name *"
                className="sm:col-span-2 rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Role (optional)"
                className="sm:col-span-2 rounded-md border border-zinc-800 bg-[#09090B] px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1 rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add</span>
              </button>
            </div>
          </form>

          <div className="rounded-md border border-zinc-800/80 bg-[#09090B]">
            {teamMembers.length === 0 ? (
              <div className="px-4 py-6 text-center text-xs text-zinc-400">
                No team members added yet. All new tasks default to &quot;Unassigned&quot; until you add owners here.
              </div>
            ) : (
              <ul className="divide-y divide-zinc-800/70">
                {teamMembers.map((member) => (
                  <li
                    key={member.id}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-xs"
                  >
                    <div>
                      <span className="font-medium text-zinc-100">
                        {member.name}
                      </span>
                      {member.role && (
                        <span className="ml-2 text-zinc-400">
                          · {member.role}
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteMember(member.id)}
                      aria-label={`Remove ${member.name}`}
                      className="rounded p-1 text-zinc-500 hover:text-rose-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-700 bg-zinc-900 px-4 py-1.5 text-xs font-medium text-zinc-200 hover:text-white"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
