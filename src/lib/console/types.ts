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
  status: ClarificationStatus;
  asked_at: string;
  answered_at: string | null;
  request?: Request;
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
