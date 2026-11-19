import { Menu, MessageSquare } from 'lucide-react';
import { NAV_ITEMS } from '@/src/components/layout/Sidebar';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';

interface HeaderProps {
  onOpenMobileNav: () => void;
}

export function Header({ onOpenMobileNav }: HeaderProps) {
  const { state, activeNav, assistantOpen, setAssistantOpen } =
    useCampaignWorkspace();
  const activeItem = NAV_ITEMS.find((item) => item.id === activeNav);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-4 border-b border-zinc-800/80 bg-[#09090B]/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileNav}
          aria-label="Open navigation menu"
          className="inline-flex items-center justify-center rounded-md border border-zinc-800 bg-zinc-900 p-2 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 md:hidden"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2 text-sm">
          <span className="truncate font-medium text-zinc-400">
            {state.profile.workspaceName}
          </span>
          <span className="text-zinc-600" aria-hidden="true">
            /
          </span>
          <span className="truncate font-display font-semibold text-zinc-100">
            {activeItem?.label ?? 'Overview'}
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={() => setAssistantOpen(!assistantOpen)}
          aria-expanded={assistantOpen}
          className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
            assistantOpen
              ? 'border-violet-500/60 bg-violet-600/20 text-violet-200'
              : 'border-zinc-800 bg-[#111216] text-zinc-200 hover:border-violet-500/50 hover:text-white'
          }`}
        >
          <MessageSquare className="h-3.5 w-3.5 text-violet-400" />
          <span>Campaign Assistant</span>
        </button>

        <div className="hidden text-right sm:block">
          <div className="text-xs font-medium text-zinc-200 leading-tight">
            {state.profile.userName}
          </div>
          <div className="text-[11px] text-zinc-500 leading-tight">
            {state.profile.userRole}
          </div>
        </div>
        <div
          aria-label={`${state.profile.userName} profile`}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-zinc-700/80 bg-zinc-900 font-display text-xs font-semibold text-zinc-200"
        >
          {state.profile.userInitials}
        </div>
      </div>
    </header>
  );
}

