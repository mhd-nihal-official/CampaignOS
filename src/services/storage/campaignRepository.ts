import type {
  ApprovalStatus,
  BriefAnalysisReport,
  BriefInputMethod,
  BriefStatus,
  CampaignPlan,
  CampaignPlanPhase,
  CampaignRecord,
  CampaignStatus,
  CampaignStrategy,
  ClientBrief,
  ContentPlanDeliverable,
  DeliverableStatus,
  ExecutionAssistanceReport,
  ExecutionTask,
  TaskHistoryEntry,
  TaskPriority,
  TaskStatus,
  TeamMember,
  TimelineMilestone,
  WorkspaceState,
} from '@/src/types/campaign';

const STORAGE_KEY = 'campaignos_workspace_v1';

function getRelativeIsoDate(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().slice(0, 10);
}

export function createDemoSeedData(): Omit<WorkspaceState, 'profile' | 'demoDismissed'> {
  const now = new Date().toISOString();
  const demoCampaignId = 'demo_campaign_01';
  const demoBriefId = 'demo_brief_01';
  const demoStrategyId = 'demo_strategy_01';

  const campaign: CampaignRecord = {
    id: demoCampaignId,
    clientName: 'DEMO — Horizon Acoustics',
    title: 'DEMO: Studio Monitor Launch',
    status: 'active',
    launchDate: getRelativeIsoDate(5),
    endDate: getRelativeIsoDate(45),
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  };

  const brief: ClientBrief = {
    id: demoBriefId,
    campaignId: demoCampaignId,
    clientName: 'DEMO — Horizon Acoustics',
    industry: 'Audio Hardware & Studio Equipment',
    businessDescription:
      'Independent acoustic engineering company designing nearfield reference monitors for mastering and post-production rooms.',
    website: 'https://demo-horizon-acoustics.example',
    campaignTitle: 'DEMO: Studio Monitor Launch',
    objective:
      'Drive product awareness and pre-launch demo bookings among independent mastering engineers and boutique studios.',
    productOrService: 'Reference M4 Nearfield Studio Monitor',
    targetAudience:
      'Audio engineers, music producers, and post-production studio leads aged 26–48.',
    targetLocation: 'North America & Western Europe',
    launchDate: getRelativeIsoDate(5),
    endDate: getRelativeIsoDate(45),
    channels: ['LinkedIn', 'YouTube', 'Email', 'Paid Search'],
    budget: '$45,000 (DEMO)',
    keyMessage:
      'Reference-grade acoustic accuracy engineered for small untreated rooms.',
    competitors: 'DEMO Competitor A, DEMO Competitor B',
    notes:
      'Sample brief demonstrating how CampaignOS structures client intake into strategy, deliverables, and execution tasks.',
    briefStatus: 'ready_for_analysis',
    inputMethod: 'manual',
    createdAt: now,
    updatedAt: now,
    isDemo: true,
  };

  const strategy: CampaignStrategy = {
    id: demoStrategyId,
    campaignId: demoCampaignId,
    positioningStatement:
      'Position the Reference M4 monitor as the reliable acoustic benchmark for modern project studios.',
    audienceInsight:
      'Independent producers distrust exaggerated frequency claims and respond to unedited studio comparison sessions.',
    primaryChannels: ['YouTube', 'LinkedIn', 'Email'],
    pillars: [
      {
        id: 'demo_pillar_1',
        title: 'Acoustic Proof',
        description:
          'Side-by-side frequency response walkthroughs led by working engineers.',
      },
      {
        id: 'demo_pillar_2',
        title: 'Room Calibration',
        description:
          'Practical setup guides showing immediate improvements in compact spaces.',
      },
    ],
    approvalStatus: 'pending_approval',
    updatedAt: now,
  };

  const deliverables: ContentPlanDeliverable[] = [
    {
      id: 'demo_deliv_1',
      campaignId: demoCampaignId,
      title: 'Launch Keynote & Acoustic Walkthrough Video',
      channel: 'YouTube',
      format: 'Long-form Video (4 min)',
      dueDate: getRelativeIsoDate(3),
      ownerRole: 'Creative Director',
      approvalStatus: 'pending_approval',
    },
    {
      id: 'demo_deliv_2',
      campaignId: demoCampaignId,
      title: 'Pre-Launch Studio Waitlist Sequence',
      channel: 'Email',
      format: '3-Part Email Flow',
      dueDate: getRelativeIsoDate(7),
      ownerRole: 'Copywriter',
      approvalStatus: 'approved',
    },
    {
      id: 'demo_deliv_3',
      campaignId: demoCampaignId,
      title: 'Engineer Case Study Carousel',
      channel: 'LinkedIn',
      format: 'Document Carousel',
      dueDate: getRelativeIsoDate(12),
      ownerRole: 'Social Strategist',
      approvalStatus: 'in_production',
    },
  ];

  const milestones: TimelineMilestone[] = [
    {
      id: 'demo_ms_1',
      campaignId: demoCampaignId,
      phase: 'Phase 1 · Strategy & Sign-off',
      title: 'Client approval on messaging pillars and channel mix',
      targetDate: getRelativeIsoDate(2),
      completed: false,
    },
    {
      id: 'demo_ms_2',
      campaignId: demoCampaignId,
      phase: 'Phase 2 · Launch Window',
      title: 'Publish launch walkthrough and open studio demo bookings',
      targetDate: getRelativeIsoDate(5),
      completed: false,
    },
  ];

  const tasks: ExecutionTask[] = [
    {
      id: 'demo_task_1',
      campaignId: demoCampaignId,
      deliverableId: 'demo_deliv_1',
      title: 'Finalize acoustic walkthrough script and shot list',
      description:
        'Prepare storyboard cues, frequency sweep segments, and studio camera angles for the 4-minute launch video.',
      suggestedOwner: 'Copywriter',
      assigneeName: 'Unassigned',
      startDate: getRelativeIsoDate(0),
      dueDate: getRelativeIsoDate(2),
      status: 'in_review',
      priority: 'high',
      notes: 'Requires engineering spec confirmation before studio shoot.',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: 'demo_hist_1',
          timestamp: now,
          action: 'Task created',
          toStatus: 'in_review',
          summary: 'Sample task initialized in In Review.',
        },
      ],
    },
    {
      id: 'demo_task_2',
      campaignId: demoCampaignId,
      deliverableId: 'demo_deliv_2',
      title: 'Configure waitlist segmentation tags and QA links',
      description:
        'Set up 3-part waitlist sequence triggers and verify tracking URLs before studio booking opens.',
      suggestedOwner: 'Lifecycle Specialist',
      assigneeName: 'Unassigned',
      startDate: getRelativeIsoDate(1),
      dueDate: getRelativeIsoDate(4),
      status: 'in_progress',
      priority: 'medium',
      notes: '',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: 'demo_hist_2',
          timestamp: now,
          action: 'Task created',
          toStatus: 'in_progress',
          summary: 'Sample task initialized in In Progress.',
        },
      ],
    },
    {
      id: 'demo_task_3',
      campaignId: demoCampaignId,
      deliverableId: 'demo_deliv_3',
      title: 'Design LinkedIn carousel templates in dark studio palette',
      description:
        'Lay out 6-slide engineer case study deck using approved visual direction.',
      suggestedOwner: 'Brand Designer',
      assigneeName: 'Unassigned',
      startDate: getRelativeIsoDate(2),
      dueDate: getRelativeIsoDate(9),
      status: 'not_started',
      priority: 'medium',
      notes: '',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: 'demo_hist_3',
          timestamp: now,
          action: 'Task created',
          toStatus: 'not_started',
          summary: 'Sample task initialized in Not Started.',
        },
      ],
    },
  ];

  return {
    campaigns: [campaign],
    briefs: [brief],
    strategies: [strategy],
    plans: [],
    deliverables,
    milestones,
    tasks,
    teamMembers: [],
    executionReports: {},
  };
}

export function createDefaultWorkspaceState(): WorkspaceState {
  const demo = createDemoSeedData();
  return {
    profile: {
      workspaceName: 'Agency Workspace',
      userName: 'Account Lead',
      userRole: 'Campaign Strategist',
      userInitials: 'AL',
    },
    ...demo,
    demoDismissed: false,
  };
}

export interface BriefFormInput {
  clientName: string;
  industry: string;
  businessDescription: string;
  website: string;
  campaignTitle: string;
  objective: string;
  productOrService: string;
  targetAudience: string;
  targetLocation: string;
  launchDate: string;
  endDate: string;
  channels: string[];
  budget: string;
  keyMessage: string;
  competitors: string;
  notes: string;
  briefStatus: BriefStatus;
  inputMethod: BriefInputMethod;
  sourceFileName?: string;
  sourceText?: string;
}

export type CreateBriefInput = BriefFormInput;

export interface CampaignRepository {
  load(): WorkspaceState;
  save(state: WorkspaceState): void;
  createBriefWithCampaign(
    state: WorkspaceState,
    input: CreateBriefInput
  ): WorkspaceState;
  updateBrief(
    state: WorkspaceState,
    briefId: string,
    input: BriefFormInput
  ): WorkspaceState;
  saveBriefAnalysis(
    state: WorkspaceState,
    briefId: string,
    analysis: BriefAnalysisReport
  ): WorkspaceState;
  approveBriefAnalysis(
    state: WorkspaceState,
    briefId: string
  ): WorkspaceState;
  updateCampaignStatus(
    state: WorkspaceState,
    campaignId: string,
    status: CampaignStatus
  ): WorkspaceState;
  deleteCampaign(state: WorkspaceState, campaignId: string): WorkspaceState;
  saveStrategy(
    state: WorkspaceState,
    campaignId: string,
    updates: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>>
  ): WorkspaceState;
  saveCampaignDates(
    state: WorkspaceState,
    campaignId: string,
    launchDate: string,
    endDate: string
  ): WorkspaceState;
  saveGeneratedPlan(
    state: WorkspaceState,
    campaignId: string,
    params: {
      strategyId: string;
      phases: CampaignPlanPhase[];
      planningNotes: string[];
      model: string;
      generatedAt: string;
      deliverables: Array<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>;
    }
  ): WorkspaceState;
  updatePlanPhases(
    state: WorkspaceState,
    campaignId: string,
    phases: CampaignPlanPhase[]
  ): WorkspaceState;
  approveCampaignPlan(state: WorkspaceState, campaignId: string): WorkspaceState;
  addDeliverable(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<ContentPlanDeliverable, 'id' | 'campaignId'>
  ): WorkspaceState;
  updateDeliverable(
    state: WorkspaceState,
    deliverableId: string,
    updates: Partial<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>
  ): WorkspaceState;
  updateDeliverableStatus(
    state: WorkspaceState,
    deliverableId: string,
    approvalStatus: DeliverableStatus
  ): WorkspaceState;
  deleteDeliverable(
    state: WorkspaceState,
    deliverableId: string
  ): WorkspaceState;
  addMilestone(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<TimelineMilestone, 'id' | 'campaignId'>
  ): WorkspaceState;
  toggleMilestone(state: WorkspaceState, milestoneId: string): WorkspaceState;
  deleteMilestone(state: WorkspaceState, milestoneId: string): WorkspaceState;
  addTask(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<
      ExecutionTask,
      'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
    >
  ): WorkspaceState;
  updateTask(
    state: WorkspaceState,
    taskId: string,
    updates: Partial<
      Omit<
        ExecutionTask,
        'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
      >
    >,
    changeSummary?: string
  ): WorkspaceState;
  updateTaskStatus(
    state: WorkspaceState,
    taskId: string,
    status: TaskStatus
  ): WorkspaceState;
  deleteTask(state: WorkspaceState, taskId: string): WorkspaceState;
  convertDeliverablesToTasks(
    state: WorkspaceState,
    campaignId: string,
    deliverables: ContentPlanDeliverable[]
  ): WorkspaceState;
  addTeamMember(
    state: WorkspaceState,
    name: string,
    role?: string
  ): WorkspaceState;
  deleteTeamMember(state: WorkspaceState, memberId: string): WorkspaceState;
  saveExecutionReport(
    state: WorkspaceState,
    campaignId: string,
    report: ExecutionAssistanceReport
  ): WorkspaceState;
  clearDemoData(state: WorkspaceState): WorkspaceState;
  restoreDemoData(state: WorkspaceState): WorkspaceState;
}

function generateId(prefix: string): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
}

function normalizeTaskStatus(raw: unknown): TaskStatus {
  if (raw === 'todo' || raw === 'not_started') return 'not_started';
  if (raw === 'done' || raw === 'completed') return 'completed';
  if (raw === 'in_progress' || raw === 'in_review' || raw === 'blocked') {
    return raw;
  }
  return 'not_started';
}

function normalizeTaskPriority(raw: unknown): TaskPriority {
  if (raw === 'normal') return 'medium';
  if (
    raw === 'low' ||
    raw === 'medium' ||
    raw === 'high' ||
    raw === 'urgent'
  ) {
    return raw;
  }
  return 'medium';
}

export class LocalStorageCampaignRepository implements CampaignRepository {
  public load(): WorkspaceState {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        const initial = createDefaultWorkspaceState();
        this.save(initial);
        return initial;
      }
      const parsed = JSON.parse(raw) as Partial<WorkspaceState>;
      const fallback = createDefaultWorkspaceState();
      const now = new Date().toISOString();
      return {
        profile: parsed.profile ?? fallback.profile,
        campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
        briefs: Array.isArray(parsed.briefs)
          ? parsed.briefs.map((b) => ({
              ...b,
              industry: b.industry ?? '',
              businessDescription: b.businessDescription ?? '',
              website: b.website ?? '',
              productOrService: b.productOrService ?? '',
              targetLocation: b.targetLocation ?? '',
              budget: b.budget ?? '',
              competitors: b.competitors ?? '',
              briefStatus: b.briefStatus ?? 'draft',
              inputMethod: b.inputMethod ?? 'manual',
            }))
          : [],
        strategies: Array.isArray(parsed.strategies) ? parsed.strategies : [],
        plans: Array.isArray(parsed.plans) ? parsed.plans : [],
        deliverables: Array.isArray(parsed.deliverables)
          ? parsed.deliverables.map((d) => ({
              ...d,
              publicationDate: d.publicationDate ?? d.dueDate,
              productionDate: d.productionDate ?? d.dueDate,
              priority: d.priority ?? 'normal',
            }))
          : [],
        milestones: Array.isArray(parsed.milestones) ? parsed.milestones : [],
        tasks: Array.isArray(parsed.tasks)
          ? parsed.tasks.map((t) => ({
              ...t,
              description: t.description ?? '',
              suggestedOwner: t.suggestedOwner ?? t.assigneeRole ?? 'Unassigned',
              assigneeName: t.assigneeName || 'Unassigned',
              startDate: t.startDate ?? t.dueDate ?? now.slice(0, 10),
              dueDate: t.dueDate ?? now.slice(0, 10),
              status: normalizeTaskStatus(t.status),
              priority: normalizeTaskPriority(t.priority),
              notes: t.notes ?? '',
              createdAt: t.createdAt ?? now,
              updatedAt: t.updatedAt ?? now,
              history: Array.isArray(t.history) ? t.history : [],
            }))
          : [],
        teamMembers: Array.isArray(parsed.teamMembers)
          ? parsed.teamMembers
          : [],
        executionReports:
          parsed.executionReports &&
          typeof parsed.executionReports === 'object' &&
          !Array.isArray(parsed.executionReports)
            ? parsed.executionReports
            : {},
        demoDismissed: Boolean(parsed.demoDismissed),
      };
    } catch {
      return createDefaultWorkspaceState();
    }
  }

  public save(state: WorkspaceState): void {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota errors gracefully
    }
  }

  public createBriefWithCampaign(
    state: WorkspaceState,
    input: CreateBriefInput
  ): WorkspaceState {
    const now = new Date().toISOString();
    const campaignId = generateId('cmp');
    const briefId = generateId('brf');
    const strategyId = generateId('str');

    const newCampaign: CampaignRecord = {
      id: campaignId,
      clientName: input.clientName.trim(),
      title: input.campaignTitle.trim(),
      status: 'draft',
      launchDate: input.launchDate,
      endDate: input.endDate,
      createdAt: now,
      updatedAt: now,
      isDemo: false,
    };

    const newBrief: ClientBrief = {
      id: briefId,
      campaignId,
      clientName: input.clientName.trim(),
      industry: input.industry.trim(),
      businessDescription: input.businessDescription.trim(),
      website: input.website.trim(),
      campaignTitle: input.campaignTitle.trim(),
      objective: input.objective.trim(),
      productOrService: input.productOrService.trim(),
      targetAudience: input.targetAudience.trim(),
      targetLocation: input.targetLocation.trim(),
      launchDate: input.launchDate,
      endDate: input.endDate,
      channels: input.channels,
      budget: input.budget.trim(),
      keyMessage: input.keyMessage.trim(),
      competitors: input.competitors.trim(),
      notes: input.notes.trim(),
      briefStatus: input.briefStatus,
      inputMethod: input.inputMethod,
      sourceFileName: input.sourceFileName,
      sourceText: input.sourceText,
      createdAt: now,
      updatedAt: now,
      isDemo: false,
    };

    const emptyStrategy: CampaignStrategy = {
      id: strategyId,
      campaignId,
      positioningStatement: '',
      audienceInsight: '',
      primaryChannels: input.channels,
      pillars: [],
      approvalStatus: 'draft',
      updatedAt: now,
    };

    const next: WorkspaceState = {
      ...state,
      campaigns: [newCampaign, ...state.campaigns],
      briefs: [newBrief, ...state.briefs],
      strategies: [emptyStrategy, ...state.strategies],
    };
    this.save(next);
    return next;
  }

  public updateBrief(
    state: WorkspaceState,
    briefId: string,
    input: BriefFormInput
  ): WorkspaceState {
    const now = new Date().toISOString();
    const existing = state.briefs.find((b) => b.id === briefId);
    if (!existing) return state;

    const briefs = state.briefs.map((b) =>
      b.id === briefId
        ? {
            ...b,
            clientName: input.clientName.trim(),
            industry: input.industry.trim(),
            businessDescription: input.businessDescription.trim(),
            website: input.website.trim(),
            campaignTitle: input.campaignTitle.trim(),
            objective: input.objective.trim(),
            productOrService: input.productOrService.trim(),
            targetAudience: input.targetAudience.trim(),
            targetLocation: input.targetLocation.trim(),
            launchDate: input.launchDate,
            endDate: input.endDate,
            channels: input.channels,
            budget: input.budget.trim(),
            keyMessage: input.keyMessage.trim(),
            competitors: input.competitors.trim(),
            notes: input.notes.trim(),
            briefStatus: input.briefStatus,
            inputMethod: input.inputMethod,
            sourceFileName: input.sourceFileName ?? b.sourceFileName,
            sourceText: input.sourceText ?? b.sourceText,
            analysis: b.analysis
              ? { ...b.analysis, approved: false, approvedAt: undefined }
              : undefined,
            updatedAt: now,
          }
        : b
    );

    const campaigns = state.campaigns.map((c) =>
      c.id === existing.campaignId
        ? {
            ...c,
            clientName: input.clientName.trim(),
            title: input.campaignTitle.trim(),
            launchDate: input.launchDate,
            endDate: input.endDate,
            updatedAt: now,
          }
        : c
    );

    const strategies = state.strategies.map((s) =>
      s.campaignId === existing.campaignId && s.approvalStatus === 'approved'
        ? {
            ...s,
            approvalStatus: 'pending_approval' as ApprovalStatus,
            approvedAt: undefined,
            updatedAt: now,
          }
        : s
    );

    const plans = state.plans.map((p) =>
      p.campaignId === existing.campaignId && p.approvalStatus === 'approved'
        ? {
            ...p,
            approvalStatus: 'pending_approval' as ApprovalStatus,
            approvedAt: undefined,
            updatedAt: now,
          }
        : p
    );

    const next: WorkspaceState = {
      ...state,
      briefs,
      campaigns,
      strategies,
      plans,
    };
    this.save(next);
    return next;
  }

  public saveBriefAnalysis(
    state: WorkspaceState,
    briefId: string,
    analysis: BriefAnalysisReport
  ): WorkspaceState {
    const now = new Date().toISOString();
    const briefs = state.briefs.map((b) =>
      b.id === briefId
        ? {
            ...b,
            briefStatus: 'analysed' as BriefStatus,
            aiSubmissionNote: undefined,
            analysis: {
              ...analysis,
              approved: false,
              approvedAt: undefined,
            },
            updatedAt: now,
          }
        : b
    );

    const next: WorkspaceState = { ...state, briefs };
    this.save(next);
    return next;
  }

  public approveBriefAnalysis(
    state: WorkspaceState,
    briefId: string
  ): WorkspaceState {
    const now = new Date().toISOString();
    const briefs = state.briefs.map((b) => {
      if (b.id !== briefId || !b.analysis) return b;
      return {
        ...b,
        briefStatus: 'analysed' as BriefStatus,
        analysis: {
          ...b.analysis,
          approved: true,
          approvedAt: now,
        },
        updatedAt: now,
      };
    });

    const next: WorkspaceState = { ...state, briefs };
    this.save(next);
    return next;
  }

  public updateCampaignStatus(
    state: WorkspaceState,
    campaignId: string,
    status: CampaignStatus
  ): WorkspaceState {
    const now = new Date().toISOString();
    const next: WorkspaceState = {
      ...state,
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId ? { ...c, status, updatedAt: now } : c
      ),
    };
    this.save(next);
    return next;
  }

  public deleteCampaign(
    state: WorkspaceState,
    campaignId: string
  ): WorkspaceState {
    const deleted = state.campaigns.find((c) => c.id === campaignId);
    const remainingReports = { ...state.executionReports };
    delete remainingReports[campaignId];
    const next: WorkspaceState = {
      ...state,
      campaigns: state.campaigns.filter((c) => c.id !== campaignId),
      briefs: state.briefs.filter((b) => b.campaignId !== campaignId),
      strategies: state.strategies.filter((s) => s.campaignId !== campaignId),
      plans: state.plans.filter((p) => p.campaignId !== campaignId),
      deliverables: state.deliverables.filter((d) => d.campaignId !== campaignId),
      milestones: state.milestones.filter((m) => m.campaignId !== campaignId),
      tasks: state.tasks.filter((t) => t.campaignId !== campaignId),
      executionReports: remainingReports,
      demoDismissed: deleted?.isDemo ? true : state.demoDismissed,
    };
    this.save(next);
    return next;
  }

  public saveStrategy(
    state: WorkspaceState,
    campaignId: string,
    updates: Partial<Omit<CampaignStrategy, 'id' | 'campaignId' | 'updatedAt'>>
  ): WorkspaceState {
    const now = new Date().toISOString();
    const exists = state.strategies.some((s) => s.campaignId === campaignId);

    const strategies = exists
      ? state.strategies.map((s) => {
          if (s.campaignId !== campaignId) return s;
          const nextApproval = updates.approvalStatus ?? s.approvalStatus;
          return {
            ...s,
            ...updates,
            approvalStatus: nextApproval,
            approvedAt:
              nextApproval === 'approved'
                ? updates.approvedAt ?? s.approvedAt ?? now
                : undefined,
            updatedAt: now,
          };
        })
      : [
          ...state.strategies,
          {
            id: generateId('str'),
            campaignId,
            positioningStatement: updates.positioningStatement ?? '',
            audienceInsight: updates.audienceInsight ?? '',
            primaryChannels: updates.primaryChannels ?? [],
            pillars: updates.pillars ?? [],
            approvalStatus: updates.approvalStatus ?? 'draft',
            ...updates,
            approvedAt:
              updates.approvalStatus === 'approved'
                ? updates.approvedAt ?? now
                : undefined,
            updatedAt: now,
          },
        ];

    const campaigns = state.campaigns.map((c) =>
      c.id === campaignId ? { ...c, updatedAt: now } : c
    );

    const next: WorkspaceState = { ...state, strategies, campaigns };
    this.save(next);
    return next;
  }

  public saveCampaignDates(
    state: WorkspaceState,
    campaignId: string,
    launchDate: string,
    endDate: string
  ): WorkspaceState {
    const now = new Date().toISOString();
    const next: WorkspaceState = {
      ...state,
      campaigns: state.campaigns.map((c) =>
        c.id === campaignId ? { ...c, launchDate, endDate, updatedAt: now } : c
      ),
      briefs: state.briefs.map((b) =>
        b.campaignId === campaignId
          ? { ...b, launchDate, endDate, updatedAt: now }
          : b
      ),
    };
    this.save(next);
    return next;
  }

  public saveGeneratedPlan(
    state: WorkspaceState,
    campaignId: string,
    params: {
      strategyId: string;
      phases: CampaignPlanPhase[];
      planningNotes: string[];
      model: string;
      generatedAt: string;
      deliverables: Array<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>;
    }
  ): WorkspaceState {
    const now = new Date().toISOString();
    const existingPlan = state.plans.find((p) => p.campaignId === campaignId);
    const planRecord: CampaignPlan = {
      id: existingPlan?.id ?? generateId('pln'),
      campaignId,
      strategyId: params.strategyId,
      approvalStatus: 'pending_approval',
      phases: params.phases,
      planningNotes: params.planningNotes,
      model: params.model,
      generatedAt: params.generatedAt,
      approvedAt: undefined,
      updatedAt: now,
    };

    const plans = existingPlan
      ? state.plans.map((p) => (p.campaignId === campaignId ? planRecord : p))
      : [planRecord, ...state.plans];

    const newDeliverables: ContentPlanDeliverable[] = params.deliverables.map(
      (item) => {
        const pubDate = item.publicationDate || item.dueDate;
        return {
          ...item,
          id: generateId('del'),
          campaignId,
          publicationDate: pubDate,
          dueDate: pubDate,
          isSuggested: true,
        };
      }
    );

    const otherDeliverables = state.deliverables.filter(
      (d) => d.campaignId !== campaignId
    );

    const next: WorkspaceState = {
      ...state,
      plans,
      deliverables: [...otherDeliverables, ...newDeliverables],
    };
    this.save(next);
    return next;
  }

  public updatePlanPhases(
    state: WorkspaceState,
    campaignId: string,
    phases: CampaignPlanPhase[]
  ): WorkspaceState {
    const now = new Date().toISOString();
    const existing = state.plans.find((p) => p.campaignId === campaignId);
    const strategy = state.strategies.find((s) => s.campaignId === campaignId);

    const plans = existing
      ? state.plans.map((p) =>
          p.campaignId === campaignId
            ? {
                ...p,
                phases,
                approvalStatus: 'pending_approval' as ApprovalStatus,
                approvedAt: undefined,
                updatedAt: now,
              }
            : p
        )
      : [
          {
            id: generateId('pln'),
            campaignId,
            strategyId: strategy?.id ?? '',
            approvalStatus: 'pending_approval' as ApprovalStatus,
            phases,
            planningNotes: [],
            updatedAt: now,
          },
          ...state.plans,
        ];

    const next: WorkspaceState = { ...state, plans };
    this.save(next);
    return next;
  }

  public approveCampaignPlan(
    state: WorkspaceState,
    campaignId: string
  ): WorkspaceState {
    const now = new Date().toISOString();
    const existing = state.plans.find((p) => p.campaignId === campaignId);
    const strategy = state.strategies.find((s) => s.campaignId === campaignId);

    const approvedPhases = (existing?.phases ?? []).map((ph) => ({
      ...ph,
      isSuggested: false,
    }));

    const plans = existing
      ? state.plans.map((p) =>
          p.campaignId === campaignId
            ? {
                ...p,
                phases: approvedPhases,
                approvalStatus: 'approved' as ApprovalStatus,
                approvedAt: now,
                updatedAt: now,
              }
            : p
        )
      : [
          {
            id: generateId('pln'),
            campaignId,
            strategyId: strategy?.id ?? '',
            approvalStatus: 'approved' as ApprovalStatus,
            phases: approvedPhases,
            planningNotes: [],
            approvedAt: now,
            updatedAt: now,
          },
          ...state.plans,
        ];

    const deliverables = state.deliverables.map((d) =>
      d.campaignId === campaignId ? { ...d, isSuggested: false } : d
    );

    const next: WorkspaceState = {
      ...state,
      plans,
      deliverables,
    };
    this.save(next);
    return next;
  }

  public addDeliverable(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<ContentPlanDeliverable, 'id' | 'campaignId'>
  ): WorkspaceState {
    const now = new Date().toISOString();
    const pubDate = input.publicationDate || input.dueDate;
    const deliverable: ContentPlanDeliverable = {
      ...input,
      id: generateId('del'),
      campaignId,
      publicationDate: pubDate,
      dueDate: pubDate,
      isSuggested: input.isSuggested ?? true,
    };
    const plans = state.plans.map((p) =>
      p.campaignId === campaignId && p.approvalStatus === 'approved'
        ? {
            ...p,
            approvalStatus: 'pending_approval' as ApprovalStatus,
            approvedAt: undefined,
            updatedAt: now,
          }
        : p
    );
    const next: WorkspaceState = {
      ...state,
      plans,
      deliverables: [...state.deliverables, deliverable],
    };
    this.save(next);
    return next;
  }

  public updateDeliverable(
    state: WorkspaceState,
    deliverableId: string,
    updates: Partial<Omit<ContentPlanDeliverable, 'id' | 'campaignId'>>
  ): WorkspaceState {
    const target = state.deliverables.find((d) => d.id === deliverableId);
    if (!target) return state;

    const now = new Date().toISOString();
    const deliverables = state.deliverables.map((d) => {
      if (d.id !== deliverableId) return d;
      const pubDate =
        updates.publicationDate ?? updates.dueDate ?? d.publicationDate ?? d.dueDate;
      return {
        ...d,
        ...updates,
        publicationDate: pubDate,
        dueDate: pubDate,
      };
    });

    const plans = state.plans.map((p) =>
      p.campaignId === target.campaignId && p.approvalStatus === 'approved'
        ? {
            ...p,
            approvalStatus: 'pending_approval' as ApprovalStatus,
            approvedAt: undefined,
            updatedAt: now,
          }
        : p
    );

    const next: WorkspaceState = { ...state, deliverables, plans };
    this.save(next);
    return next;
  }

  public updateDeliverableStatus(
    state: WorkspaceState,
    deliverableId: string,
    approvalStatus: DeliverableStatus
  ): WorkspaceState {
    const next: WorkspaceState = {
      ...state,
      deliverables: state.deliverables.map((d) =>
        d.id === deliverableId ? { ...d, approvalStatus } : d
      ),
    };
    this.save(next);
    return next;
  }

  public deleteDeliverable(
    state: WorkspaceState,
    deliverableId: string
  ): WorkspaceState {
    const target = state.deliverables.find((d) => d.id === deliverableId);
    const now = new Date().toISOString();
    const next: WorkspaceState = {
      ...state,
      deliverables: state.deliverables.filter((d) => d.id !== deliverableId),
      plans: target
        ? state.plans.map((p) =>
            p.campaignId === target.campaignId && p.approvalStatus === 'approved'
              ? {
                  ...p,
                  approvalStatus: 'pending_approval' as ApprovalStatus,
                  approvedAt: undefined,
                  updatedAt: now,
                }
              : p
          )
        : state.plans,
      tasks: state.tasks.map((t) =>
        t.deliverableId === deliverableId ? { ...t, deliverableId: undefined } : t
      ),
    };
    this.save(next);
    return next;
  }

  public addMilestone(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<TimelineMilestone, 'id' | 'campaignId'>
  ): WorkspaceState {
    const milestone: TimelineMilestone = {
      id: generateId('ms'),
      campaignId,
      ...input,
    };
    const next: WorkspaceState = {
      ...state,
      milestones: [...state.milestones, milestone],
    };
    this.save(next);
    return next;
  }

  public toggleMilestone(
    state: WorkspaceState,
    milestoneId: string
  ): WorkspaceState {
    const next: WorkspaceState = {
      ...state,
      milestones: state.milestones.map((m) =>
        m.id === milestoneId ? { ...m, completed: !m.completed } : m
      ),
    };
    this.save(next);
    return next;
  }

  public deleteMilestone(
    state: WorkspaceState,
    milestoneId: string
  ): WorkspaceState {
    const next: WorkspaceState = {
      ...state,
      milestones: state.milestones.filter((m) => m.id !== milestoneId),
    };
    this.save(next);
    return next;
  }

  public addTask(
    state: WorkspaceState,
    campaignId: string,
    input: Omit<
      ExecutionTask,
      'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
    >
  ): WorkspaceState {
    const now = new Date().toISOString();
    const task: ExecutionTask = {
      ...input,
      id: generateId('tsk'),
      campaignId,
      assigneeName: input.assigneeName?.trim() || 'Unassigned',
      suggestedOwner: input.suggestedOwner?.trim() || 'Unassigned',
      createdAt: now,
      updatedAt: now,
      history: [
        {
          id: generateId('hist'),
          timestamp: now,
          action: 'Task created',
          toStatus: input.status,
          summary: `Created task "${input.title.trim()}" (${input.status}).`,
        },
      ],
    };
    const next: WorkspaceState = {
      ...state,
      tasks: [...state.tasks, task],
    };
    this.save(next);
    return next;
  }

  public updateTask(
    state: WorkspaceState,
    taskId: string,
    updates: Partial<
      Omit<
        ExecutionTask,
        'id' | 'campaignId' | 'createdAt' | 'updatedAt' | 'history'
      >
    >,
    changeSummary?: string
  ): WorkspaceState {
    const now = new Date().toISOString();
    const next: WorkspaceState = {
      ...state,
      tasks: state.tasks.map((t) => {
        if (t.id !== taskId) return t;
        const statusChanged =
          updates.status !== undefined && updates.status !== t.status;
        const entry: TaskHistoryEntry = {
          id: generateId('hist'),
          timestamp: now,
          action: statusChanged ? 'Status changed' : 'Task updated',
          fromStatus: statusChanged ? t.status : undefined,
          toStatus: statusChanged ? updates.status : undefined,
          summary:
            changeSummary ||
            (statusChanged
              ? `Status changed from ${t.status} to ${updates.status}.`
              : 'Task details updated and confirmed by user.'),
        };
        return {
          ...t,
          ...updates,
          assigneeName:
            updates.assigneeName !== undefined
              ? updates.assigneeName.trim() || 'Unassigned'
              : t.assigneeName || 'Unassigned',
          suggestedOwner:
            updates.suggestedOwner !== undefined
              ? updates.suggestedOwner.trim() || 'Unassigned'
              : t.suggestedOwner || 'Unassigned',
          updatedAt: now,
          history: [entry, ...(t.history ?? [])],
        };
      }),
    };
    this.save(next);
    return next;
  }

  public updateTaskStatus(
    state: WorkspaceState,
    taskId: string,
    status: TaskStatus
  ): WorkspaceState {
    return this.updateTask(state, taskId, { status });
  }

  public deleteTask(state: WorkspaceState, taskId: string): WorkspaceState {
    const next: WorkspaceState = {
      ...state,
      tasks: state.tasks.filter((t) => t.id !== taskId),
    };
    this.save(next);
    return next;
  }

  public convertDeliverablesToTasks(
    state: WorkspaceState,
    campaignId: string,
    deliverables: ContentPlanDeliverable[]
  ): WorkspaceState {
    const now = new Date().toISOString();
    const todayIso = now.slice(0, 10);
    const existingLinkedIds = new Set(
      state.tasks
        .filter((t) => t.campaignId === campaignId && t.deliverableId)
        .map((t) => t.deliverableId!)
    );

    const newTasks: ExecutionTask[] = [];
    for (const del of deliverables) {
      if (existingLinkedIds.has(del.id)) continue;
      const startDate =
        del.productionDate && del.productionDate <= (del.publicationDate || del.dueDate)
          ? del.productionDate
          : todayIso;
      const dueDate = del.productionDate || del.publicationDate || del.dueDate || todayIso;
      const mappedPriority: TaskPriority =
        del.priority === 'high'
          ? 'high'
          : del.priority === 'low'
            ? 'low'
            : 'medium';
      const suggestedOwner = del.ownerRole?.trim() || 'Unassigned';

      newTasks.push({
        id: generateId('tsk'),
        campaignId,
        deliverableId: del.id,
        title: `Produce: ${del.title}`,
        description:
          del.description?.trim() ||
          `Produce ${del.format} asset for ${del.channel} (${del.phase || 'Campaign'}).`,
        suggestedOwner,
        assigneeName: 'Unassigned',
        startDate,
        dueDate,
        status: 'not_started',
        priority: mappedPriority,
        notes: del.relevanceNote?.trim()
          ? `Strategy alignment: ${del.relevanceNote.trim()}`
          : '',
        createdAt: now,
        updatedAt: now,
        history: [
          {
            id: generateId('hist'),
            timestamp: now,
            action: 'Converted from deliverable',
            toStatus: 'not_started',
            summary: `Created from approved deliverable "${del.title}".`,
          },
        ],
      });
    }

    if (newTasks.length === 0) return state;

    const next: WorkspaceState = {
      ...state,
      tasks: [...state.tasks, ...newTasks],
    };
    this.save(next);
    return next;
  }

  public addTeamMember(
    state: WorkspaceState,
    name: string,
    role?: string
  ): WorkspaceState {
    const trimmed = name.trim();
    if (!trimmed) return state;
    const exists = state.teamMembers.some(
      (m) => m.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) return state;

    const member: TeamMember = {
      id: generateId('mbr'),
      name: trimmed,
      role: role?.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    const next: WorkspaceState = {
      ...state,
      teamMembers: [...state.teamMembers, member],
    };
    this.save(next);
    return next;
  }

  public deleteTeamMember(
    state: WorkspaceState,
    memberId: string
  ): WorkspaceState {
    const target = state.teamMembers.find((m) => m.id === memberId);
    const now = new Date().toISOString();
    const next: WorkspaceState = {
      ...state,
      teamMembers: state.teamMembers.filter((m) => m.id !== memberId),
      tasks: target
        ? state.tasks.map((t) =>
            t.assigneeName === target.name
              ? {
                  ...t,
                  assigneeName: 'Unassigned',
                  updatedAt: now,
                  history: [
                    {
                      id: generateId('hist'),
                      timestamp: now,
                      action: 'Owner removed',
                      summary: `Team member "${target.name}" removed; task reset to Unassigned.`,
                    },
                    ...(t.history ?? []),
                  ],
                }
              : t
          )
        : state.tasks,
    };
    this.save(next);
    return next;
  }

  public saveExecutionReport(
    state: WorkspaceState,
    campaignId: string,
    report: ExecutionAssistanceReport
  ): WorkspaceState {
    const next: WorkspaceState = {
      ...state,
      executionReports: {
        ...state.executionReports,
        [campaignId]: report,
      },
    };
    this.save(next);
    return next;
  }

  public clearDemoData(state: WorkspaceState): WorkspaceState {
    const demoIds = new Set(
      state.campaigns.filter((c) => c.isDemo).map((c) => c.id)
    );
    const remainingReports = { ...state.executionReports };
    for (const id of demoIds) {
      delete remainingReports[id];
    }
    const next: WorkspaceState = {
      ...state,
      campaigns: state.campaigns.filter((c) => !c.isDemo),
      briefs: state.briefs.filter((b) => !b.isDemo && !demoIds.has(b.campaignId)),
      strategies: state.strategies.filter((s) => !demoIds.has(s.campaignId)),
      plans: state.plans.filter((p) => !demoIds.has(p.campaignId)),
      deliverables: state.deliverables.filter((d) => !demoIds.has(d.campaignId)),
      milestones: state.milestones.filter((m) => !demoIds.has(m.campaignId)),
      tasks: state.tasks.filter((t) => !demoIds.has(t.campaignId)),
      executionReports: remainingReports,
      demoDismissed: true,
    };
    this.save(next);
    return next;
  }

  public restoreDemoData(state: WorkspaceState): WorkspaceState {
    const cleaned = this.clearDemoData(state);
    const demo = createDemoSeedData();
    const next: WorkspaceState = {
      ...cleaned,
      campaigns: [...demo.campaigns, ...cleaned.campaigns],
      briefs: [...demo.briefs, ...cleaned.briefs],
      strategies: [...demo.strategies, ...cleaned.strategies],
      plans: [...demo.plans, ...cleaned.plans],
      deliverables: [...demo.deliverables, ...cleaned.deliverables],
      milestones: [...demo.milestones, ...cleaned.milestones],
      tasks: [...demo.tasks, ...cleaned.tasks],
      demoDismissed: false,
    };
    this.save(next);
    return next;
  }
}

export const campaignRepository: CampaignRepository =
  new LocalStorageCampaignRepository();
