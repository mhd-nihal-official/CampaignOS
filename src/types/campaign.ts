export type NavSection =
  | 'overview'
  | 'briefs'
  | 'strategy'
  | 'planner'
  | 'execution';

export type CampaignStatus =
  | 'draft'
  | 'in_review'
  | 'active'
  | 'completed';

export type ApprovalStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'changes_requested';

export type DeliverableStatus =
  | 'planned'
  | 'in_production'
  | 'pending_approval'
  | 'approved'
  | 'scheduled';

export type TaskStatus =
  | 'not_started'
  | 'in_progress'
  | 'in_review'
  | 'completed'
  | 'blocked';

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkspaceProfile {
  workspaceName: string;
  userName: string;
  userRole: string;
  userInitials: string;
}

export type BriefStatus =
  | 'draft'
  | 'ready_for_analysis'
  | 'analysed'
  | 'archived';

export type BriefInputMethod = 'manual' | 'upload' | 'paste';

export type FactClassification =
  | 'PROVIDED'
  | 'INFERRED'
  | 'MISSING'
  | 'CONFLICTING';

export interface ClassifiedField {
  value: string | null;
  classification: FactClassification;
  evidence?: string | null;
  note?: string | null;
}

export interface ClassifiedListField {
  items: string[];
  classification: FactClassification;
  evidence?: string | null;
  note?: string | null;
}

export type BriefReadinessStatus =
  | 'Ready'
  | 'Needs Clarification'
  | 'Incomplete';

export interface ConflictingItem {
  topic: string;
  statementA: string;
  statementB: string;
  explanation: string;
}

export interface MissingInfoItem {
  field: string;
  impact: string;
}

export interface ClarificationQuestion {
  question: string;
  targetField: string;
  reason: string;
}

export interface BriefAnalysisReport {
  id: string;
  briefId: string;
  model: string;
  analysedAt: string;
  approved: boolean;
  approvedAt?: string;
  briefSummary: string;
  clientAndBusiness: {
    clientName: ClassifiedField;
    industry: ClassifiedField;
    businessDescription: ClassifiedField;
    website: ClassifiedField;
    competitors: ClassifiedField;
  };
  campaignObjectives: {
    primaryObjective: ClassifiedField;
    unclearRequirements: string[];
  };
  productOrService: ClassifiedField;
  targetAudience: ClassifiedField;
  targetMarket: ClassifiedField;
  marketingChannels: ClassifiedListField;
  keyMessage: ClassifiedField;
  campaignTimeline: {
    startDate: ClassifiedField;
    endDate: ClassifiedField;
    durationOrNotes: ClassifiedField;
  };
  budget: ClassifiedField;
  missingInformation: MissingInfoItem[];
  conflictingInformation: ConflictingItem[];
  clarificationQuestions: ClarificationQuestion[];
  readinessAssessment: {
    status: BriefReadinessStatus;
    explanation: string;
    blockingGaps: string[];
  };
}

export interface ClientBrief {
  id: string;
  campaignId: string;
  // Client Information
  clientName: string;
  industry: string;
  businessDescription: string;
  website: string;
  // Campaign Information
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
  notes: string; // Additional Requirements
  // Intake & Lifecycle
  briefStatus: BriefStatus;
  inputMethod: BriefInputMethod;
  sourceFileName?: string;
  sourceText?: string;
  aiSubmissionNote?: string;
  analysis?: BriefAnalysisReport;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface StrategyPillar {
  id: string;
  title: string;
  description: string;
}

export type StrategySourceType = 'BRIEF_FACT' | 'STRATEGIC_RECOMMENDATION';

export type StrategySectionKey =
  | 'overview'
  | 'objective'
  | 'targetAudience'
  | 'painPoints'
  | 'positioning'
  | 'coreMessage'
  | 'creativeDirections'
  | 'contentPillars'
  | 'recommendedChannels'
  | 'campaignPhases'
  | 'successMetrics';

export interface StrategyTextBlock {
  content: string;
  sourceType: StrategySourceType;
  briefBasis: string;
  clarificationNeeded?: string | null;
}

export interface StrategyPainPoint {
  id: string;
  painPoint: string;
  whatToDo: string;
  whyRelevant: string;
  supportedObjective: string;
  deliverableIdea: string;
  sourceType: StrategySourceType;
}

export interface CreativeDirectionOption {
  id: string;
  conceptName: string;
  conceptDescription: string;
  mainMessage: string;
  suggestedVisualApproach: string;
  exampleContentExecution: string;
}

export interface StrategyContentPillar {
  id: string;
  title: string;
  whatToDo: string;
  whyRelevant: string;
  supportedObjective: string;
  deliverableIdea: string;
  sourceType: StrategySourceType;
}

export interface StrategyChannelRecommendation {
  id: string;
  channel: string;
  whatToDo: string;
  whyRelevant: string;
  supportedObjective: string;
  deliverableIdea: string;
  uncertaintyNote?: string | null;
}

export interface StrategyPhaseItem {
  id: string;
  phaseName: string;
  timeframe: string;
  whatToDo: string;
  whyRelevant: string;
  supportedObjective: string;
  deliverableIdea: string;
}

export interface StrategySuccessMetric {
  id: string;
  kpiName: string;
  whatItMeasures: string;
  supportedObjective: string;
  measurementSource: string;
  note: string;
}

export interface CampaignStrategy {
  id: string;
  campaignId: string;
  positioningStatement: string;
  audienceInsight: string;
  primaryChannels: string[];
  pillars: StrategyPillar[];
  approvalStatus: ApprovalStatus;
  updatedAt: string;
  // AI Strategy Generator fields
  model?: string;
  generatedAt?: string;
  approvedAt?: string;
  briefAnalysisId?: string;
  clarificationNotes?: string[];
  campaignOverview?: StrategyTextBlock;
  campaignObjective?: StrategyTextBlock;
  targetAudience?: StrategyTextBlock;
  audiencePainPoints?: StrategyPainPoint[];
  campaignPositioning?: StrategyTextBlock;
  coreCampaignMessage?: StrategyTextBlock;
  creativeDirections?: CreativeDirectionOption[];
  selectedCreativeDirectionId?: string | null;
  contentPillars?: StrategyContentPillar[];
  recommendedChannels?: StrategyChannelRecommendation[];
  campaignPhases?: StrategyPhaseItem[];
  successMetrics?: StrategySuccessMetric[];
}

export const SUPPORTED_CONTENT_FORMATS = [
  'Static Post',
  'Carousel',
  'Reel',
  'Video',
  'Story',
  'Blog Article',
  'Email',
  'Other',
] as const;

export type DeliverableContentFormat =
  (typeof SUPPORTED_CONTENT_FORMATS)[number];

export type DeliverablePriority = 'low' | 'normal' | 'high';

export interface ContentPlanDeliverable {
  id: string;
  campaignId: string;
  title: string;
  channel: string;
  format: DeliverableContentFormat | string;
  customFormat?: string;
  phase?: string;
  description?: string;
  objective?: string;
  relevanceNote?: string;
  productionDate?: string;
  publicationDate?: string;
  dueDate: string;
  ownerRole: string;
  priority?: DeliverablePriority;
  approvalStatus: DeliverableStatus;
  isSuggested?: boolean;
}

export interface CampaignPlanPhase {
  id: string;
  phaseName: string;
  startDate: string;
  endDate: string;
  objective: string;
  focus: string;
  isSuggested?: boolean;
}

export interface CampaignPlan {
  id: string;
  campaignId: string;
  strategyId: string;
  approvalStatus: ApprovalStatus;
  phases: CampaignPlanPhase[];
  planningNotes: string[];
  model?: string;
  generatedAt?: string;
  approvedAt?: string;
  updatedAt: string;
}

export interface TimelineMilestone {
  id: string;
  campaignId: string;
  phase: string;
  title: string;
  targetDate: string;
  completed: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  role?: string;
  createdAt: string;
}

export interface TaskHistoryEntry {
  id: string;
  timestamp: string;
  action: string;
  fromStatus?: TaskStatus;
  toStatus?: TaskStatus;
  summary: string;
}

export interface ExecutionTask {
  id: string;
  campaignId: string;
  deliverableId?: string;
  title: string;
  description: string;
  suggestedOwner: string;
  assigneeName: string;
  /** @deprecated legacy field kept optional for storage backwards compatibility */
  assigneeRole?: string;
  startDate: string;
  dueDate: string;
  status: TaskStatus;
  priority: TaskPriority;
  notes: string;
  createdAt: string;
  updatedAt: string;
  history: TaskHistoryEntry[];
}

export interface ExecutionOverdueItem {
  taskTitle: string;
  dueDate: string;
  currentStatus: string;
  impact: string;
}

export interface ExecutionScheduleConflictItem {
  topic: string;
  explanation: string;
  affectedTasks: string[];
}

export interface ExecutionPrioritySuggestion {
  taskTitle: string;
  currentPriority: string;
  suggestedPriority: TaskPriority;
  rationale: string;
}

export interface ExecutionAssistanceReport {
  id: string;
  campaignId: string;
  model: string;
  generatedAt: string;
  progressSummary: string;
  outstandingWorkSummary: string;
  overdueTasks: ExecutionOverdueItem[];
  schedulingConflicts: ExecutionScheduleConflictItem[];
  prioritizationSuggestions: ExecutionPrioritySuggestion[];
}

export interface CampaignRecord {
  id: string;
  clientName: string;
  title: string;
  status: CampaignStatus;
  launchDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface WorkspaceState {
  profile: WorkspaceProfile;
  campaigns: CampaignRecord[];
  briefs: ClientBrief[];
  strategies: CampaignStrategy[];
  plans: CampaignPlan[];
  deliverables: ContentPlanDeliverable[];
  milestones: TimelineMilestone[];
  tasks: ExecutionTask[];
  teamMembers: TeamMember[];
  executionReports: Record<string, ExecutionAssistanceReport>;
  demoDismissed: boolean;
}

export interface DashboardMetrics {
  totalCampaigns: number;
  activeCampaigns: number;
  pendingApprovals: number;
  upcomingDeliverables: number;
  statusCounts: Record<CampaignStatus, number>;
}

export type AssistantActionType =
  | 'create_task'
  | 'update_task'
  | 'change_suggested_deadline'
  | 'add_deliverable'
  | 'prepare_campaign_report';

export type AssistantActionStatus = 'pending' | 'applied' | 'dismissed';

export interface AssistantCreateTaskPayload {
  title: string;
  description: string;
  deliverableId?: string;
  suggestedOwner: string;
  assigneeName: string;
  startDate: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  notes: string;
}

export interface AssistantUpdateTaskPayload {
  taskId: string;
  taskTitle: string;
  updates: {
    status?: TaskStatus;
    priority?: TaskPriority;
    startDate?: string;
    dueDate?: string;
    assigneeName?: string;
    notes?: string;
  };
}

export interface AssistantDeadlinePayload {
  targetType: 'task' | 'deliverable';
  targetId: string;
  targetTitle: string;
  currentDueDate: string;
  proposedProductionDate?: string;
  proposedDueDate: string;
  rationale: string;
}

export interface AssistantAddDeliverablePayload {
  title: string;
  format: DeliverableContentFormat | string;
  channel: string;
  phase: string;
  description: string;
  objective: string;
  relevanceNote: string;
  productionDate: string;
  publicationDate: string;
  priority: DeliverablePriority;
  ownerRole: string;
}

export interface AssistantCampaignReportPayload {
  reportTitle: string;
  preparedFor: string;
  statusOverview: string;
  completedHighlights: string[];
  outstandingWork: string[];
  risksAndBlockers: string[];
  nextSteps: string[];
  markdownContent: string;
}

export type AssistantProposedAction =
  | {
      id: string;
      actionType: 'create_task';
      summary: string;
      status: AssistantActionStatus;
      appliedAt?: string;
      payload: AssistantCreateTaskPayload;
    }
  | {
      id: string;
      actionType: 'update_task';
      summary: string;
      status: AssistantActionStatus;
      appliedAt?: string;
      payload: AssistantUpdateTaskPayload;
    }
  | {
      id: string;
      actionType: 'change_suggested_deadline';
      summary: string;
      status: AssistantActionStatus;
      appliedAt?: string;
      payload: AssistantDeadlinePayload;
    }
  | {
      id: string;
      actionType: 'add_deliverable';
      summary: string;
      status: AssistantActionStatus;
      appliedAt?: string;
      payload: AssistantAddDeliverablePayload;
    }
  | {
      id: string;
      actionType: 'prepare_campaign_report';
      summary: string;
      status: AssistantActionStatus;
      appliedAt?: string;
      payload: AssistantCampaignReportPayload;
    };

export interface AssistantStructuredResponse {
  answer: string;
  recordedFacts: string[];
  suggestions: string[];
  missingOrUnavailable: string[];
  proposedActions: AssistantProposedAction[];
}

export interface AssistantMessage {
  id: string;
  campaignId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  moduleContext?: NavSection;
  recordedFacts?: string[];
  suggestions?: string[];
  missingOrUnavailable?: string[];
  proposedActions?: AssistantProposedAction[];
}

