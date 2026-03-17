export type AgentFlowType = 'dossier' | 'style_guide' | 'clarify' | 'construct' | 'suggestions' | 'scrape';
export type RunLogStatus = 'started' | 'completed' | 'failed' | 'cancelled';

export interface AgentRunLog {
  id: string;
  organization_id: string | null;
  request_id: string | null;
  flow: AgentFlowType;
  status: RunLogStatus;
  input_summary: string | null;
  output_summary: string | null;
  tokens_input: number;
  tokens_output: number;
  duration_ms: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  linear_task_id: string | null;
  created_at: string;
  completed_at: string | null;
}

export type AgentGroup = 'research' | 'content' | 'frontend' | 'integration' | 'data' | 'infra' | 'security' | 'qa' | 'ops';
export type QueueStatus = 'queued' | 'assigned' | 'running' | 'blocked' | 'completed' | 'failed' | 'cancelled';

export interface OrchestratorTask {
  id: string;
  organization_id: string;
  request_id: string | null;
  linear_issue_id: string | null;
  linear_issue_key: string | null;
  title: string;
  description: string | null;
  category: string | null;
  tier: Tier;
  priority: number;
  sla_deadline: string | null;
  agent_group: AgentGroup | null;
  risk_level: RiskLevel;
  status: QueueStatus;
  assigned_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  blocked_at: string | null;
  blocked_reason: string | null;
  attempt_count: number;
  max_attempts: number;
  last_error: string | null;
  result_summary: string | null;
  result_artifacts: Record<string, unknown>;
  requires_approval: boolean;
  approval_id: string | null;
  approved: boolean | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface QueueStats {
  total: number;
  queued: number;
  running: number;
  blocked: number;
  completed: number;
  failed: number;
  avgWaitTimeMs: number;
  avgProcessTimeMs: number;
}

export type UserRole = "client" | "admin";

export type Tier = "copper" | "steel" | "titanium" | "tungsten";

export type RequestCategory =
  | "web_platform"
  | "automation"
  | "design_system"
  | "integration"
  | "internal_tool"
  | "seo"
  | "content"
  | "brand"
  | "ai_agent"
  | "other";

export type RequestPriority = "low" | "medium" | "high" | "urgent";

export type RequestStatus =
  | "submitted"
  | "backlog"
  | "todo"
  | "in_progress"
  | "in_review"
  | "approved"
  | "shipped"
  | "done"
  | "cancelled";

export type ClarificationStatus = "pending" | "answered" | "resolved";

export type ApprovalDecision = "approved" | "denied" | "revision_requested";

export type RiskLevel = "low" | "medium" | "high";

export type AiPhase = "none" | "clarifying" | "clarified" | "constructing" | "constructed" | "failed";

export type AiOnboardingStatus = "pending" | "processing" | "completed" | "failed";

export interface BusinessDossier {
  name: string;
  tagline: string;
  business_model: string;
  industry: string;
  company_size: string;
  tech_stack: string[];
  key_products: string[];
  operational_complexity: string;
  likely_software_needs: string[];
  dossier: string;
}

export interface StyleGuide {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    neutral: string;
    background: string;
    text: string;
    notes: string;
  };
  typography: {
    heading_font: string;
    body_font: string;
    scale: string;
    weight_usage: string;
    notes: string;
  };
  brand_voice: {
    tone: string;
    style: string;
    audience: string;
    avoid: string[];
  };
  messaging: {
    tagline: string;
    value_prop: string;
    key_themes: string[];
  };
  ui_patterns: {
    layout: string;
    components: string[];
    density: string;
    interaction: string;
    mobile_first: boolean;
  };
  logo_url: string;
  design_directive: string;
}

export interface MemoryLogEntry {
  timestamp: string;
  request_id: string;
  request_title: string;
  summary: string;
  tags: string[];
  task_ids: string[];
}

export interface AiClarificationQuestion {
  id: string;
  question: string;
  why: string;
  type: "text" | "choice" | "boolean";
  options?: string[];
  answer?: string | null;
}

export interface AiClarificationData {
  request_summary: string;
  complexity: "simple" | "moderate" | "complex";
  estimated_tasks: number;
  questions: AiClarificationQuestion[];
  answered_at: string | null;
}

export interface AiPlannedTask {
  title: string;
  description: string;
  priority: "urgent" | "high" | "medium" | "low";
  estimate: number;
  labels: string[];
  dependencies: string[];
  is_epic?: boolean;
  subtasks?: AiPlannedTask[];
}

export interface AiTaskPlan {
  request_title: string;
  request_category: RequestCategory;
  request_priority: RequestPriority;
  session_summary: string;
  session_tags: string[];
  tasks: AiPlannedTask[];
}

export interface OrgSuggestion {
  id: string;
  organization_id: string;
  title: string;
  description: string;
  category: string | null;
  rationale: string | null;
  estimated_effort: string | null;
  status: "active" | "dismissed" | "requested";
  request_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  tier: Tier;
  tier_price: number;
  stripe_customer_id: string | null;
  linear_team_id: string | null;
  linear_project_id: string | null;
  max_concurrent_requests: number;
  website_url: string | null;
  business_dossier: BusinessDossier | null;
  style_guide: StyleGuide | null;
  memory_log: MemoryLogEntry[];
  ai_onboarding_status: AiOnboardingStatus;
  created_at: string;
}

export interface Profile {
  id: string;
  organization_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
}

export interface Request {
  id: string;
  organization_id: string;
  created_by: string;
  title: string;
  description: string;
  category: RequestCategory;
  priority: RequestPriority;
  status: RequestStatus;
  linear_issue_id: string | null;
  linear_issue_key: string | null;
  linear_issue_url: string | null;
  request_number: number;
  ai_phase: AiPhase;
  ai_clarification_data: AiClarificationData | null;
  created_at: string;
  updated_at: string;
}

export interface RequestAttachment {
  id: string;
  request_id: string;
  uploaded_by: string;
  file_name: string;
  file_size: number;
  mime_type: string;
  storage_path: string;
  created_at: string;
}

export interface Clarification {
  id: string;
  request_id: string;
  organization_id: string;
  question: string;
  answer: string | null;
  asked_by: string | null;
  answered_by: string | null;
  linear_comment_id: string | null;
  parent_id: string | null;
  status: ClarificationStatus;
  asked_at: string;
  answered_at: string | null;
  request?: Request;
  replies?: Clarification[];
}

export interface Approval {
  id: string;
  request_id: string;
  organization_id: string;
  title: string;
  summary: string;
  impact: string | null;
  artifacts_url: string | null;
  risk_level: RiskLevel;
  rollback_plan: string | null;
  decision: ApprovalDecision | null;
  decision_notes: string | null;
  decided_by: string | null;
  created_at: string;
  decided_at: string | null;
  request?: Request;
}

export interface ClientPolicy {
  id: string;
  organization_id: string;
  allowed_categories: RequestCategory[];
  blocked_categories: RequestCategory[];
  allowed_environments: string[];
  risk_level: RiskLevel;
  regulated: boolean;
  requires_human_approval_above: RiskLevel;
  auto_approve_categories: RequestCategory[];
  max_concurrent_agent_tasks: number;
  autopilot_enabled: boolean;
  autopilot_categories: RequestCategory[];
  code_conventions: Record<string, unknown>;
  do_not_do: string[];
  prod_change_blackout_hours: { start: number; end: number } | null;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessment {
  score: number; // 0-100
  level: RiskLevel;
  factors: string[];
  requires_approval: boolean;
  blocked: boolean;
  block_reason?: string;
}

export interface ActivityLog {
  id: string;
  request_id: string | null;
  organization_id: string;
  actor_id: string | null;
  action: string;
  details: Record<string, unknown>;
  created_at: string;
  profile?: Profile;
}

export interface UsageRecord {
  id: string;
  organization_id: string;
  period_start: string;
  period_end: string;
  requests_count: number;
  tasks_completed: number;
  agent_minutes: number;
  api_calls: number;
  tokens_used: number;
  created_at: string;
  updated_at: string;
}

export type DeployEnvironment = "preview" | "staging" | "production";
export type DeployStatus = "pending" | "building" | "ready" | "deployed" | "failed" | "rolled_back";
export type QAStatus = "pending" | "passed" | "failed" | "skipped";

export interface Deployment {
  id: string;
  organization_id: string;
  request_id: string | null;
  approval_id: string | null;
  vercel_deployment_id: string | null;
  vercel_deployment_url: string | null;
  vercel_project_id: string | null;
  git_branch: string | null;
  git_commit_sha: string | null;
  git_pr_url: string | null;
  git_pr_number: number | null;
  environment: DeployEnvironment;
  status: DeployStatus;
  rollback_deployment_id: string | null;
  rollback_available: boolean;
  rolled_back_at: string | null;
  rolled_back_by: string | null;
  qa_status: QAStatus;
  qa_notes: string | null;
  client_approved: boolean | null;
  client_approved_at: string | null;
  client_approved_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export type NotificationType = "clarification" | "approval" | "status_change" | "comment" | "completion";

export interface NotificationPreferences {
  id: string;
  profile_id: string;
  email_enabled: boolean;
  slack_enabled: boolean;
  in_app_enabled: boolean;
  type_overrides: Record<NotificationType, { email?: boolean; slack?: boolean; in_app?: boolean }>;
  digest_enabled: boolean;
  digest_frequency: "hourly" | "daily" | "weekly";
  digest_last_sent: string | null;
  quiet_hours_start: number | null;
  quiet_hours_end: number | null;
  created_at: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  organization_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  request_id: string | null;
  reference_id: string | null;
  read: boolean;
  read_at: string | null;
  created_at: string;
  request?: Pick<Request, "id" | "title" | "linear_issue_key" | "status">;
}
