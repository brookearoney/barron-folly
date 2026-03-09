import type { RequestCategory, RequestStatus, RequestPriority, RiskLevel, Tier, AiPhase, AiOnboardingStatus } from "./types";

export const CATEGORY_LABELS: Record<RequestCategory, string> = {
  web_platform: "Web Platform",
  automation: "Automation",
  design_system: "Design System",
  integration: "Integration",
  internal_tool: "Internal Tool",
  seo: "SEO",
  content: "Content",
  brand: "Brand",
  ai_agent: "AI Agent",
  other: "Other",
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: "Submitted",
  backlog: "Backlog",
  todo: "Todo",
  in_progress: "In Progress",
  in_review: "In Review",
  approved: "Approved",
  shipped: "Shipped",
  done: "Done",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  submitted: "bg-[#2A2A26] text-[#9E9E98]",
  backlog: "bg-[#2A2A26] text-[#9E9E98]",
  todo: "bg-blue-500/10 text-blue-400",
  in_progress: "bg-[#FF8400]/10 text-[#FF8400]",
  in_review: "bg-purple-500/10 text-purple-400",
  approved: "bg-emerald-500/10 text-emerald-400",
  shipped: "bg-emerald-500/10 text-emerald-400",
  done: "bg-emerald-500/20 text-emerald-300",
  cancelled: "bg-red-500/10 text-red-400",
};

export const PRIORITY_LABELS: Record<RequestPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

export const PRIORITY_COLORS: Record<RequestPriority, string> = {
  low: "text-[#6E6E6A]",
  medium: "text-blue-400",
  high: "text-[#FF8400]",
  urgent: "text-red-400",
};

export const RISK_COLORS: Record<RiskLevel, string> = {
  low: "bg-emerald-500/10 text-emerald-400",
  medium: "bg-[#FF8400]/10 text-[#FF8400]",
  high: "bg-red-500/10 text-red-400",
};

export const TIER_CONFIG: Record<Tier, { label: string; price: string; maxConcurrent: number }> = {
  copper: { label: "Copper", price: "$500/mo", maxConcurrent: 2 },
  steel: { label: "Steel", price: "$2,500/mo", maxConcurrent: 4 },
  titanium: { label: "Titanium", price: "$5,000/mo", maxConcurrent: 6 },
  tungsten: { label: "Tungsten", price: "$10,000/mo", maxConcurrent: 10 },
};

export const AI_PHASE_LABELS: Record<AiPhase, string> = {
  none: "Standard",
  clarifying: "AI Analyzing",
  clarified: "Ready to Plan",
  constructing: "Building Tasks",
  constructed: "Tasks Created",
  failed: "AI Error",
};

export const AI_PHASE_COLORS: Record<AiPhase, string> = {
  none: "bg-[#2A2A26] text-[#9E9E98]",
  clarifying: "bg-purple-500/10 text-purple-400",
  clarified: "bg-blue-500/10 text-blue-400",
  constructing: "bg-[#FF8400]/10 text-[#FF8400]",
  constructed: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export const AI_ONBOARDING_LABELS: Record<AiOnboardingStatus, string> = {
  pending: "Not Started",
  processing: "Analyzing...",
  completed: "Complete",
  failed: "Failed",
};

export const AI_ONBOARDING_COLORS: Record<AiOnboardingStatus, string> = {
  pending: "bg-[#2A2A26] text-[#9E9E98]",
  processing: "bg-[#FF8400]/10 text-[#FF8400]",
  completed: "bg-emerald-500/10 text-emerald-400",
  failed: "bg-red-500/10 text-red-400",
};

export const LINEAR_STATE_TO_STATUS: Record<string, RequestStatus> = {
  Triage: "submitted",
  Backlog: "backlog",
  Todo: "todo",
  "In Progress": "in_progress",
  "In Review": "in_review",
  Done: "done",
  Canceled: "cancelled",
};
