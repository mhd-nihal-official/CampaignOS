import React, { createContext, useContext, useMemo, useState } from 'react';
import {
  analyzeBriefWithGemini,
  analyzeExecutionWithGemini,
  generateCampaignPlanWithGemini,
  generateStrategyWithGemini,
  regenerateStrategySectionWithGemini,
  sendAssistantMessageWithGemini,
} from '@/src/services/ai/geminiService';
import {
  campaignRepository,
  type BriefFormInput,
  type CreateBriefInput,
} from '@/src/services/storage/campaignRepository';
import type {
  ApprovalStatus,
  AssistantMessage,
  CampaignPlanPhase,
  CampaignStatus,
  CampaignStrategy,
  ContentPlanDeliverable,
  CreativeDirectionOption,
  DashboardMetrics,
  DeliverableStatus,
  ExecutionTask,
  NavSection,
  StrategyChannelRecommendation,
  StrategyContentPillar,
  StrategyPainPoint,
  StrategyPhaseItem,
  StrategySectionKey,
  StrategySuccessMetric,
  StrategyTextBlock,
  TaskStatus,
  TimelineMilestone,
  WorkspaceState,
} from '@/src/types/campaign';

interface CampaignContextValue {
  state: WorkspaceState;
  activeNav: NavSection;
  setActiveNav: (nav: NavSection) => void;
  selectedCampaignId: string | null;
  setSelectedCampaignId: (id: string | null) => void;
  metrics: DashboardMetrics;
  hasDemoData: boolean;
  createBriefWithCampaign: (input: CreateBriefInput) => string;
  updateBrief: (briefId: string, input: BriefFormInput) => void;
  runBriefAnalysis: (
    briefId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  approveBriefAnalysis: (briefId: string) => void;
  updateCampaignStatus: (campaignId: string, status: CampaignStatus) => void;
  deleteCampaign: (campaignId: string) => void;
  saveStrategy: (
    campaignId: string,
    updates: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>>
  ) => void;
  generateCampaignStrategy: (
    campaignId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  regenerateStrategySection: (
    campaignId: string,
    sectionKey: StrategySectionKey,
    guidance?: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  selectCreativeDirection: (campaignId: string, directionId: string) => void;
  approveStrategy: (campaignId: string) => void;
  saveCampaignDates: (
    campaignId: string,
    launchDate: string,
    endDate: string
  ) => void;
  generateCampaignPlan: (
    campaignId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  updatePlanPhases: (campaignId: string, phases: CampaignPlanPhase[]) => void;
  approveCampaignPlan: (campaignId: string) => void;
  addDeliverable: (
    campaignId: string,
    input: Omit<ContentPlanDeliverable, 'id' | 'campaignId'>
  ) => void;
  updateDeliverable: (
    deliverableId: string,
    updates: Partial<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>
  ) => void;
  updateDeliverableStatus: (
    deliverableId: string,
    approvalStatus: DeliverableStatus
  ) => void;
  deleteDeliverable: (deliverableId: string) => void;
  addMilestone: (
    campaignId: string,
    input: Omit<TimelineMilestone, 'id' | 'campaignId'>
  ) => void;
  toggleMilestone: (milestoneId: string) => void;
  deleteMilestone: (milestoneId: string) => void;
  addTask: (
    campaignId: string,
    input: Omit<
      ExecutionTask,
      'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
    >
  ) => void;
  updateTask: (
    taskId: string,
    updates: Partial<
      Omit<
        ExecutionTask,
        'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
      >
    >,
    changeSummary?: string
  ) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;
  deleteTask: (taskId: string) => void;
  convertDeliverablesToTasks: (
    campaignId: string,
    deliverables: ContentPlanDeliverable[]
  ) => void;
  addTeamMember: (name: string, role?: string) => void;
  deleteTeamMember: (memberId: string) => void;
  runExecutionAssistant: (
    campaignId: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  assistantOpen: boolean;
  setAssistantOpen: (open: boolean) => void;
  assistantConversations: Record<string, AssistantMessage[]>;
  sendAssistantMessage: (
    campaignId: string,
    messageText: string
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  applyAssistantAction: (
    campaignId: string,
    messageId: string,
    actionId: string
  ) => void;
  dismissAssistantAction: (
    campaignId: string,
    messageId: string,
    actionId: string
  ) => void;
  resetAssistantConversation: (campaignId: string) => void;
  clearDemoData: () => void;
  restoreDemoData: () => void;
  openCampaignInSection: (campaignId: string, section: NavSection) => void;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WorkspaceState>(() =>
    campaignRepository.load()
  );
  const [activeNav, setActiveNav] = useState<NavSection>('overview');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(
    () => state.campaigns[0]?.id ?? null
  );
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantConversations, setAssistantConversations] = useState<
    Record<string, AssistantMessage[]>
  >({});

  const metrics = useMemo<DashboardMetrics>(() => {
    const todayIso = new Date().toISOString().slice(0, 10);

    const statusCounts: Record<CampaignStatus, number> = {
      draft: 0,
      in_review: 0,
      active: 0,
      completed: 0,
    };

    for (const campaign of state.campaigns) {
      statusCounts[campaign.status] += 1;
    }

    const pendingStrategyApprovals = state.strategies.filter(
      (s) => s.approvalStatus === 'pending_approval'
    ).length;

    const pendingDeliverableApprovals = state.deliverables.filter(
      (d) => d.approvalStatus === 'pending_approval'
    ).length;

    const upcomingDeliverables = state.deliverables.filter(
      (d) => d.dueDate >= todayIso && d.approvalStatus !== 'scheduled'
    ).length;

    return {
      totalCampaigns: state.campaigns.length,
      activeCampaigns: statusCounts.active,
      pendingApprovals: pendingStrategyApprovals + pendingDeliverableApprovals,
      upcomingDeliverables,
      statusCounts,
    };
  }, [state.campaigns, state.strategies, state.deliverables]);

  const hasDemoData = useMemo(
    () => state.campaigns.some((c) => c.isDemo),
    [state.campaigns]
  );

  const createBriefWithCampaign = (input: CreateBriefInput): string => {
    const next = campaignRepository.createBriefWithCampaign(state, input);
    setState(next);
    const created = next.campaigns[0];
    if (created) {
      setSelectedCampaignId(created.id);
      return created.id;
    }
    return '';
  };

  const updateBrief = (briefId: string, input: BriefFormInput) => {
    setState((prev) => campaignRepository.updateBrief(prev, briefId, input));
  };

  const runBriefAnalysis = async (
    briefId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const brief = state.briefs.find((b) => b.id === briefId);
    if (!brief) {
      return { ok: false, error: 'Brief record was not found.' };
    }

    const result = await analyzeBriefWithGemini(brief);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setState((prev) =>
      campaignRepository.saveBriefAnalysis(prev, briefId, result.analysis)
    );
    return { ok: true };
  };

  const approveBriefAnalysis = (briefId: string) => {
    setState((prev) => campaignRepository.approveBriefAnalysis(prev, briefId));
  };

  const updateCampaignStatus = (campaignId: string, status: CampaignStatus) => {
    setState((prev) =>
      campaignRepository.updateCampaignStatus(prev, campaignId, status)
    );
  };

  const deleteCampaign = (campaignId: string) => {
    setState((prev) => {
      const next = campaignRepository.deleteCampaign(prev, campaignId);
      if (selectedCampaignId === campaignId) {
        setSelectedCampaignId(next.campaigns[0]?.id ?? null);
      }
      return next;
    });
    setAssistantConversations((prev) => {
      if (!(campaignId in prev)) return prev;
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
  };

  const saveStrategy = (
    campaignId: string,
    updates: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>>
  ) => {
    setState((prev) =>
      campaignRepository.saveStrategy(prev, campaignId, updates)
    );
  };

  const generateCampaignStrategy = async (
    campaignId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const brief = state.briefs.find((b) => b.campaignId === campaignId);
    if (!brief) {
      return { ok: false, error: 'Linked client brief was not found.' };
    }
    if (!brief.analysis || !brief.analysis.approved) {
      return {
        ok: false,
        error:
          'Cannot generate a strategy from an unapproved brief analysis. Approve the brief analysis in Briefs first.',
      };
    }

    const result = await generateStrategyWithGemini(brief);
    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const s = result.strategy;
    setState((prev) =>
      campaignRepository.saveStrategy(prev, campaignId, {
        model: result.model,
        generatedAt: result.generatedAt,
        briefAnalysisId: brief.analysis?.id,
        approvalStatus: 'pending_approval',
        approvedAt: undefined,
        positioningStatement: s.campaignPositioning.content,
        audienceInsight: s.targetAudience.content,
        primaryChannels: s.recommendedChannels.map((c) => c.channel),
        pillars: s.contentPillars.map((p) => ({
          id: p.id,
          title: p.title,
          description: `${p.whatToDo} (${p.supportedObjective})`,
        })),
        clarificationNotes: s.clarificationNotes,
        campaignOverview: s.campaignOverview,
        campaignObjective: s.campaignObjective,
        targetAudience: s.targetAudience,
        audiencePainPoints: s.audiencePainPoints,
        campaignPositioning: s.campaignPositioning,
        coreCampaignMessage: s.coreCampaignMessage,
        creativeDirections: s.creativeDirections,
        selectedCreativeDirectionId: null,
        contentPillars: s.contentPillars,
        recommendedChannels: s.recommendedChannels,
        campaignPhases: s.campaignPhases,
        successMetrics: s.successMetrics,
      })
    );

    return { ok: true };
  };

  const regenerateStrategySection = async (
    campaignId: string,
    sectionKey: StrategySectionKey,
    guidance?: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const brief = state.briefs.find((b) => b.campaignId === campaignId);
    if (!brief || !brief.analysis || !brief.analysis.approved) {
      return {
        ok: false,
        error:
          'Section regeneration requires an approved brief analysis first.',
      };
    }

    const currentStrategy = state.strategies.find(
      (s) => s.campaignId === campaignId
    );

    const result = await regenerateStrategySectionWithGemini({
      brief,
      sectionKey,
      currentStrategy: currentStrategy ?? {},
      guidance,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const patch: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>> =
      {
        approvalStatus: 'pending_approval',
        approvedAt: undefined,
      };

    switch (sectionKey) {
      case 'overview':
        patch.campaignOverview = result.sectionData as StrategyTextBlock;
        break;
      case 'objective':
        patch.campaignObjective = result.sectionData as StrategyTextBlock;
        break;
      case 'targetAudience': {
        const block = result.sectionData as StrategyTextBlock;
        patch.targetAudience = block;
        patch.audienceInsight = block.content;
        break;
      }
      case 'painPoints':
        patch.audiencePainPoints = result.sectionData as StrategyPainPoint[];
        break;
      case 'positioning': {
        const block = result.sectionData as StrategyTextBlock;
        patch.campaignPositioning = block;
        patch.positioningStatement = block.content;
        break;
      }
      case 'coreMessage':
        patch.coreCampaignMessage = result.sectionData as StrategyTextBlock;
        break;
      case 'creativeDirections':
        patch.creativeDirections =
          result.sectionData as CreativeDirectionOption[];
        patch.selectedCreativeDirectionId = null;
        break;
      case 'contentPillars': {
        const list = result.sectionData as StrategyContentPillar[];
        patch.contentPillars = list;
        patch.pillars = list.map((p) => ({
          id: p.id,
          title: p.title,
          description: `${p.whatToDo} (${p.supportedObjective})`,
        }));
        break;
      }
      case 'recommendedChannels': {
        const channels =
          result.sectionData as StrategyChannelRecommendation[];
        patch.recommendedChannels = channels;
        patch.primaryChannels = channels.map((c) => c.channel);
        break;
      }
      case 'campaignPhases':
        patch.campaignPhases = result.sectionData as StrategyPhaseItem[];
        break;
      case 'successMetrics':
        patch.successMetrics = result.sectionData as StrategySuccessMetric[];
        break;
    }

    setState((prev) =>
      campaignRepository.saveStrategy(prev, campaignId, patch)
    );
    return { ok: true };
  };

  const selectCreativeDirection = (campaignId: string, directionId: string) => {
    setState((prev) =>
      campaignRepository.saveStrategy(prev, campaignId, {
        selectedCreativeDirectionId: directionId,
        approvalStatus: 'pending_approval',
        approvedAt: undefined,
      })
    );
  };

  const approveStrategy = (campaignId: string) => {
    setState((prev) =>
      campaignRepository.saveStrategy(prev, campaignId, {
        approvalStatus: 'approved',
        approvedAt: new Date().toISOString(),
      })
    );
  };

  const saveCampaignDates = (
    campaignId: string,
    launchDate: string,
    endDate: string
  ) => {
    setState((prev) =>
      campaignRepository.saveCampaignDates(prev, campaignId, launchDate, endDate)
    );
  };

  const generateCampaignPlan = async (
    campaignId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const campaign = state.campaigns.find((c) => c.id === campaignId);
    const brief = state.briefs.find((b) => b.campaignId === campaignId);
    const strategy = state.strategies.find((s) => s.campaignId === campaignId);

    if (!strategy || strategy.approvalStatus !== 'approved') {
      return {
        ok: false,
        error:
          'Only an approved campaign strategy can be used to generate a campaign plan.',
      };
    }

    const startDate =
      brief?.launchDate?.trim() || campaign?.launchDate?.trim() || '';
    const endDate =
      brief?.endDate?.trim() || campaign?.endDate?.trim() || '';

    if (!startDate || !endDate) {
      return {
        ok: false,
        error:
          'Campaign start and end dates are missing. Provide confirmed campaign dates before generating the plan.',
      };
    }

    const result = await generateCampaignPlanWithGemini({
      brief,
      strategy,
      campaignStartDate: startDate,
      campaignEndDate: endDate,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setState((prev) =>
      campaignRepository.saveGeneratedPlan(prev, campaignId, {
        strategyId: strategy.id,
        phases: result.plan.phases,
        planningNotes: result.plan.planningNotes,
        model: result.model,
        generatedAt: result.generatedAt,
        deliverables: result.plan.deliverables.map((d) => ({
          title: d.title,
          format: d.format,
          customFormat: d.customFormat,
          channel: d.channel,
          phase: d.phase,
          description: d.description,
          objective: d.objective,
          relevanceNote: d.relevanceNote,
          productionDate: d.productionDate,
          publicationDate: d.publicationDate,
          dueDate: d.publicationDate,
          priority: d.priority,
          ownerRole: d.ownerRole,
          approvalStatus: 'planned',
          isSuggested: true,
        })),
      })
    );

    return { ok: true };
  };

  const updatePlanPhases = (
    campaignId: string,
    phases: CampaignPlanPhase[]
  ) => {
    setState((prev) =>
      campaignRepository.updatePlanPhases(prev, campaignId, phases)
    );
  };

  const approveCampaignPlan = (campaignId: string) => {
    setState((prev) =>
      campaignRepository.approveCampaignPlan(prev, campaignId)
    );
  };

  const addDeliverable = (
    campaignId: string,
    input: Omit<ContentPlanDeliverable, 'id' | 'campaignId'>
  ) => {
    setState((prev) =>
      campaignRepository.addDeliverable(prev, campaignId, input)
    );
  };

  const updateDeliverable = (
    deliverableId: string,
    updates: Partial<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>
  ) => {
    setState((prev) =>
      campaignRepository.updateDeliverable(prev, deliverableId, updates)
    );
  };

  const updateDeliverableStatus = (
    deliverableId: string,
    approvalStatus: DeliverableStatus
  ) => {
    setState((prev) =>
      campaignRepository.updateDeliverableStatus(
        prev,
        deliverableId,
        approvalStatus
      )
    );
  };

  const deleteDeliverable = (deliverableId: string) => {
    setState((prev) =>
      campaignRepository.deleteDeliverable(prev, deliverableId)
    );
  };

  const addMilestone = (
    campaignId: string,
    input: Omit<TimelineMilestone, 'id' | 'campaignId'>
  ) => {
    setState((prev) =>
      campaignRepository.addMilestone(prev, campaignId, input)
    );
  };

  const toggleMilestone = (milestoneId: string) => {
    setState((prev) =>
      campaignRepository.toggleMilestone(prev, milestoneId)
    );
  };

  const deleteMilestone = (milestoneId: string) => {
    setState((prev) =>
      campaignRepository.deleteMilestone(prev, milestoneId)
    );
  };

  const addTask = (
    campaignId: string,
    input: Omit<
      ExecutionTask,
      'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
    >
  ) => {
    setState((prev) => campaignRepository.addTask(prev, campaignId, input));
  };

  const updateTask = (
    taskId: string,
    updates: Partial<
      Omit<
        ExecutionTask,
        'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
      >
    >,
    changeSummary?: string
  ) => {
    setState((prev) =>
      campaignRepository.updateTask(prev, taskId, updates, changeSummary)
    );
  };

  const updateTaskStatus = (taskId: string, status: TaskStatus) => {
    setState((prev) => campaignRepository.updateTaskStatus(prev, taskId, status));
  };

  const deleteTask = (taskId: string) => {
    setState((prev) => campaignRepository.deleteTask(prev, taskId));
  };

  const convertDeliverablesToTasks = (
    campaignId: string,
    deliverables: ContentPlanDeliverable[]
  ) => {
    setState((prev) =>
      campaignRepository.convertDeliverablesToTasks(
        prev,
        campaignId,
        deliverables
      )
    );
  };

  const addTeamMember = (name: string, role?: string) => {
    setState((prev) => campaignRepository.addTeamMember(prev, name, role));
  };

  const deleteTeamMember = (memberId: string) => {
    setState((prev) => campaignRepository.deleteTeamMember(prev, memberId));
  };

  const runExecutionAssistant = async (
    campaignId: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const campaign = state.campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      return { ok: false, error: 'Campaign record not found.' };
    }
    const campaignPlan = state.plans.find((p) => p.campaignId === campaignId);
    const isPlanApproved =
      campaignPlan?.approvalStatus === 'approved' || Boolean(campaign.isDemo);
    const approvedDeliverables = state.deliverables.filter(
      (d) => d.campaignId === campaignId && isPlanApproved && !d.isSuggested
    );
    const campaignTasks = state.tasks.filter(
      (t) => t.campaignId === campaignId
    );
    if (campaignTasks.length === 0) {
      return {
        ok: false,
        error:
          'Create or convert at least one execution task before running the Execution Assistant.',
      };
    }

    const todayIso = new Date().toISOString().slice(0, 10);
    const result = await analyzeExecutionWithGemini({
      campaign,
      deliverables: approvedDeliverables,
      tasks: campaignTasks,
      todayIso,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    setState((prev) =>
      campaignRepository.saveExecutionReport(prev, campaignId, result.report)
    );
    return { ok: true };
  };

  const sendAssistantMessage = async (
    campaignId: string,
    messageText: string
  ): Promise<{ ok: true } | { ok: false; error: string }> => {
    const trimmed = messageText.trim();
    if (!trimmed) {
      return { ok: false, error: 'Please enter a message.' };
    }
    const campaign = state.campaigns.find((c) => c.id === campaignId);
    if (!campaign) {
      return { ok: false, error: 'Select a valid campaign first.' };
    }

    const brief = state.briefs.find((b) => b.campaignId === campaignId);
    const strategy = state.strategies.find((s) => s.campaignId === campaignId);
    const plan = state.plans.find((p) => p.campaignId === campaignId) ?? null;
    const deliverables = state.deliverables.filter(
      (d) => d.campaignId === campaignId
    );
    const milestones = state.milestones.filter(
      (m) => m.campaignId === campaignId
    );
    const tasks = state.tasks.filter((t) => t.campaignId === campaignId);

    const isBriefApproved = Boolean(brief?.analysis?.approved);
    const isStrategyApproved = strategy?.approvalStatus === 'approved';
    const isPlanApproved = plan?.approvalStatus === 'approved';

    const msgNonce =
      typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
        ? crypto.randomUUID().slice(0, 6)
        : Math.random().toString(36).slice(2, 8);

    const userMsg: AssistantMessage = {
      id: `msg_${Date.now().toString(36)}_${msgNonce}_u`,
      campaignId,
      role: 'user',
      content: trimmed,
      createdAt: new Date().toISOString(),
      moduleContext: activeNav,
    };

    const priorHistory = (assistantConversations[campaignId] ?? []).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setAssistantConversations((prev) => ({
      ...prev,
      [campaignId]: [...(prev[campaignId] ?? []), userMsg],
    }));

    const result = await sendAssistantMessageWithGemini({
      campaign,
      approvedBrief: isBriefApproved && brief ? brief : null,
      approvedStrategy: isStrategyApproved && strategy ? strategy : null,
      plan,
      deliverables,
      milestones,
      tasks,
      teamMemberNames: state.teamMembers.map((m) => m.name),
      approvalFlags: {
        hasBrief: Boolean(brief),
        isBriefApproved,
        hasStrategy: Boolean(strategy),
        isStrategyApproved,
        hasPlan: Boolean(plan),
        isPlanApproved,
      },
      activeModule: activeNav,
      todayIso: new Date().toISOString().slice(0, 10),
      history: priorHistory,
      message: trimmed,
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const assistantMsg: AssistantMessage = {
      id: `msg_${Date.now().toString(36)}_${msgNonce}_a`,
      campaignId,
      role: 'assistant',
      content: result.response.answer,
      createdAt: result.generatedAt,
      moduleContext: activeNav,
      recordedFacts: result.response.recordedFacts,
      suggestions: result.response.suggestions,
      missingOrUnavailable: result.response.missingOrUnavailable,
      proposedActions: result.response.proposedActions,
    };

    setAssistantConversations((prev) => ({
      ...prev,
      [campaignId]: [...(prev[campaignId] ?? []), assistantMsg],
    }));

    return { ok: true };
  };

  const applyAssistantAction = (
    campaignId: string,
    messageId: string,
    actionId: string
  ) => {
    const messages = assistantConversations[campaignId] ?? [];
    const targetMessage = messages.find((m) => m.id === messageId);
    const targetAction = targetMessage?.proposedActions?.find(
      (a) => a.id === actionId
    );
    if (!targetAction || targetAction.status !== 'pending') return;

    const now = new Date().toISOString();

    if (targetAction.actionType === 'create_task') {
      addTask(campaignId, targetAction.payload);
    } else if (targetAction.actionType === 'update_task') {
      updateTask(
        targetAction.payload.taskId,
        targetAction.payload.updates,
        `Confirmed via Campaign Assistant: ${targetAction.summary}`
      );
    } else if (targetAction.actionType === 'change_suggested_deadline') {
      const p = targetAction.payload;
      if (p.targetType === 'task') {
        updateTask(
          p.targetId,
          { dueDate: p.proposedDueDate },
          `Confirmed deadline change via Campaign Assistant (${p.currentDueDate} → ${p.proposedDueDate}).`
        );
      } else {
        updateDeliverable(p.targetId, {
          ...(p.proposedProductionDate
            ? { productionDate: p.proposedProductionDate }
            : {}),
          publicationDate: p.proposedDueDate,
          dueDate: p.proposedDueDate,
        });
      }
    } else if (targetAction.actionType === 'add_deliverable') {
      const p = targetAction.payload;
      addDeliverable(campaignId, {
        title: p.title,
        format: p.format,
        channel: p.channel,
        phase: p.phase,
        description: p.description,
        objective: p.objective,
        relevanceNote: p.relevanceNote,
        productionDate: p.productionDate,
        publicationDate: p.publicationDate,
        dueDate: p.publicationDate,
        priority: p.priority,
        ownerRole: p.ownerRole,
        approvalStatus: 'planned',
        isSuggested: true,
      });
    }

    setAssistantConversations((prev) => ({
      ...prev,
      [campaignId]: (prev[campaignId] ?? []).map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              proposedActions: msg.proposedActions?.map((act) =>
                act.id === actionId
                  ? { ...act, status: 'applied', appliedAt: now }
                  : act
              ),
            }
          : msg
      ),
    }));
  };

  const dismissAssistantAction = (
    campaignId: string,
    messageId: string,
    actionId: string
  ) => {
    setAssistantConversations((prev) => ({
      ...prev,
      [campaignId]: (prev[campaignId] ?? []).map((msg) =>
        msg.id === messageId
          ? {
              ...msg,
              proposedActions: msg.proposedActions?.map((act) =>
                act.id === actionId && act.status === 'pending'
                  ? { ...act, status: 'dismissed' }
                  : act
              ),
            }
          : msg
      ),
    }));
  };

  const resetAssistantConversation = (campaignId: string) => {
    setAssistantConversations((prev) => {
      const next = { ...prev };
      delete next[campaignId];
      return next;
    });
  };

  const clearDemoData = () => {
    setState((prev) => {
      const next = campaignRepository.clearDemoData(prev);
      setSelectedCampaignId(next.campaigns[0]?.id ?? null);
      return next;
    });
  };

  const restoreDemoData = () => {
    setState((prev) => {
      const next = campaignRepository.restoreDemoData(prev);
      setSelectedCampaignId(next.campaigns[0]?.id ?? null);
      return next;
    });
  };

  const openCampaignInSection = (campaignId: string, section: NavSection) => {
    setSelectedCampaignId(campaignId);
    setActiveNav(section);
  };

  const value: CampaignContextValue = {
    state,
    activeNav,
    setActiveNav,
    selectedCampaignId,
    setSelectedCampaignId,
    metrics,
    hasDemoData,
    createBriefWithCampaign,
    updateBrief,
    runBriefAnalysis,
    approveBriefAnalysis,
    updateCampaignStatus,
    deleteCampaign,
    saveStrategy,
    generateCampaignStrategy,
    regenerateStrategySection,
    selectCreativeDirection,
    approveStrategy,
    saveCampaignDates,
    generateCampaignPlan,
    updatePlanPhases,
    approveCampaignPlan,
    addDeliverable,
    updateDeliverable,
    updateDeliverableStatus,
    deleteDeliverable,
    addMilestone,
    toggleMilestone,
    deleteMilestone,
    addTask,
    updateTask,
    updateTaskStatus,
    deleteTask,
    convertDeliverablesToTasks,
    addTeamMember,
    deleteTeamMember,
    runExecutionAssistant,
    assistantOpen,
    setAssistantOpen,
    assistantConversations,
    sendAssistantMessage,
    applyAssistantAction,
    dismissAssistantAction,
    resetAssistantConversation,
    clearDemoData,
    restoreDemoData,
    openCampaignInSection,
  };

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaignWorkspace(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error(
      'useCampaignWorkspace must be used inside CampaignProvider'
    );
  }
  return ctx;
}
