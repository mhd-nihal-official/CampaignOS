import { useState } from 'react';
import { CampaignAssistantDrawer } from '@/src/components/assistant/CampaignAssistantDrawer';
import { Header } from '@/src/components/layout/Header';
import { Sidebar } from '@/src/components/layout/Sidebar';
import { BriefsView } from '@/src/components/views/BriefsView';
import { ExecutionView } from '@/src/components/views/ExecutionView';
import { OverviewView } from '@/src/components/views/OverviewView';
import { PlannerView } from '@/src/components/views/PlannerView';
import { StrategyView } from '@/src/components/views/StrategyView';
import {
  CampaignProvider,
  useCampaignWorkspace,
} from '@/src/context/CampaignContext';

function WorkspaceShell() {
  const { activeNav } = useCampaignWorkspace();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const renderView = () => {
    switch (activeNav) {
      case 'overview':
        return <OverviewView />;
      case 'briefs':
        return <BriefsView />;
      case 'strategy':
        return <StrategyView />;
      case 'planner':
        return <PlannerView />;
      case 'execution':
        return <ExecutionView />;
      default:
        return <OverviewView />;
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] text-zinc-100">
      <Sidebar
        mobileOpen={mobileNavOpen}
        onCloseMobile={() => setMobileNavOpen(false)}
      />

      <div className="flex min-h-screen flex-col md:pl-60">
        <Header onOpenMobileNav={() => setMobileNavOpen(true)} />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">{renderView()}</div>
        </main>
      </div>

      <CampaignAssistantDrawer />
    </div>
  );
}

export default function App() {
  return (
    <CampaignProvider>
      <WorkspaceShell />
    </CampaignProvider>
  );
}

