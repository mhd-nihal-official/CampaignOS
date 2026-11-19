import {
  CalendarRange,
  CheckSquare,
  Compass,
  FileText,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { useCampaignWorkspace } from '@/src/context/CampaignContext';
import type { NavSection } from '@/src/types/campaign';

export const NAV_ITEMS: Array<{
  id: NavSection;
  label: string;
  icon: typeof LayoutDashboard;
}> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'briefs', label: 'Briefs', icon: FileText },
  { id: 'strategy', label: 'Strategy', icon: Compass },
  { id: 'planner', label: 'Campaign Planner', icon: CalendarRange },
  { id: 'execution', label: 'Execution', icon: CheckSquare },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function Sidebar({ mobileOpen, onCloseMobile }: SidebarProps) {
  const { activeNav, setActiveNav } = useCampaignWorkspace();

  const handleSelect = (id: NavSection) => {
    setActiveNav(id);
    onCloseMobile();
  };

  const navContent = (
    <div className="flex h-full flex-col bg-[#0D0E12] border-r border-zinc-800/80">
      <div className="flex h-14 items-center justify-between border-b border-zinc-800/80 px-5">
        <button
          type="button"
          onClick={() => handleSelect('overview')}
          className="flex items-center gap-2.5 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-violet-600 font-display text-xs font-bold tracking-tight text-white">
            C
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-zinc-100 whitespace-nowrap shrink-0">
            CampaignOS
          </span>
        </button>

        <button
          type="button"
          onClick={onCloseMobile}
          aria-label="Close navigation menu"
          className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100 md:hidden"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <nav
        aria-label="Primary Workspace Navigation"
        className="flex-1 space-y-1 px-3 py-4"
      >
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeNav === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleSelect(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`group flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 ${
                isActive
                  ? 'bg-violet-500/12 text-zinc-100 ring-1 ring-inset ring-violet-500/30'
                  : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-100'
              }`}
            >
              <Icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-violet-400'
                    : 'text-zinc-500 group-hover:text-zinc-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Desktop fixed left sidebar */}
      <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-30 md:flex md:w-60 md:flex-col">
        {navContent}
      </aside>

      {/* Mobile slide-over drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="fixed inset-0 bg-black/70 backdrop-blur-xs"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="relative z-10 flex w-64 max-w-[80vw] flex-col">
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}
