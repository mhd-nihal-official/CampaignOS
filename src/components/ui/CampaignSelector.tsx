import { useCampaignWorkspace } from '@/src/context/CampaignContext';

export function CampaignSelector() {
  const { state, selectedCampaignId, setSelectedCampaignId } =
    useCampaignWorkspace();

  if (state.campaigns.length === 0) {
    return null;
  }

  const activeId = selectedCampaignId ?? state.campaigns[0]?.id ?? '';

  return (
    <div className="flex items-center gap-2">
      <label
        htmlFor="active-campaign-select"
        className="text-xs font-medium text-zinc-400 whitespace-nowrap"
      >
        Campaign
      </label>
      <select
        id="active-campaign-select"
        value={activeId}
        onChange={(e) => setSelectedCampaignId(e.target.value)}
        className="rounded-md border border-zinc-800 bg-[#111216] px-3 py-1.5 text-sm text-zinc-100 focus:border-violet-500 focus:outline-none"
      >
        {state.campaigns.map((c) => (
          <option key={c.id} value={c.id}>
            {c.title} ({c.clientName})
          </option>
        ))}
      </select>
    </div>
  );
}
