import { createAdminClient } from "@/lib/supabase/admin";
import { getValueDelivered, getCycleTime } from "@/lib/console/metrics";
import type { Organization, Request } from "@/lib/console/types";

export interface MonthlyReport {
  orgId: string;
  orgName: string;
  period: { start: string; end: string };
  summary: {
    requestsSubmitted: number;
    requestsCompleted: number;
    tasksCompleted: number;
    avgCycleTimeHours: number;
    estimatedHoursSaved: number;
  };
  highlights: string[];
  requestBreakdown: Array<{
    title: string;
    category: string;
    status: string;
    completedAt: string | null;
  }>;
  categoryBreakdown: Record<string, number>;
}

function getMonthRange(month: Date): { start: Date; end: Date; days: number } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 0, 23, 59, 59, 999);
  const days = Math.ceil((end.getTime() - start.getTime()) / 86_400_000);
  return { start, end, days };
}

export async function generateMonthlyReport(
  orgId: string,
  month: Date,
): Promise<MonthlyReport> {
  const admin = createAdminClient();
  const { start, end, days } = getMonthRange(month);

  // Get org info
  const { data: org } = await admin
    .from("organizations")
    .select("name")
    .eq("id", orgId)
    .single();

  const orgName = (org as Pick<Organization, "name"> | null)?.name ?? "Unknown";

  // Get requests in the period
  const { data: requests } = await admin
    .from("requests")
    .select("id, title, category, status, created_at, updated_at")
    .eq("organization_id", orgId)
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  const reqs = (requests || []) as Pick<
    Request,
    "id" | "title" | "category" | "status" | "created_at" | "updated_at"
  >[];

  // Value + cycle time
  const [value, cycleTime] = await Promise.all([
    getValueDelivered({ orgId, periodDays: days }),
    getCycleTime({ orgId, periodDays: days }),
  ]);

  // Build request breakdown
  const requestBreakdown = reqs.map((r) => ({
    title: r.title,
    category: r.category,
    status: r.status,
    completedAt:
      r.status === "shipped" || r.status === "done" ? r.updated_at : null,
  }));

  // Generate highlights from data
  const highlights: string[] = [];

  if (value.completedRequests > 0) {
    highlights.push(
      `${value.completedRequests} request${value.completedRequests > 1 ? "s" : ""} completed this month.`,
    );
  }

  if (value.completedTasks > 0) {
    highlights.push(
      `${value.completedTasks} tasks delivered, saving an estimated ${value.estimatedHoursSaved} hours.`,
    );
  }

  if (cycleTime.avgHours > 0) {
    highlights.push(
      `Average cycle time: ${cycleTime.avgHours} hours (median: ${cycleTime.medianHours}h).`,
    );
  }

  if (value.totalAgentMinutes > 0) {
    highlights.push(
      `${value.totalAgentMinutes} minutes of AI agent time utilized.`,
    );
  }

  // Top category
  const topCategory = Object.entries(value.categories).sort(
    ([, a], [, b]) => b - a,
  )[0];
  if (topCategory) {
    highlights.push(
      `Most active category: ${topCategory[0].replace(/_/g, " ")} (${topCategory[1]} requests).`,
    );
  }

  if (value.totalRequests === 0) {
    highlights.push("No new requests submitted this month.");
  }

  return {
    orgId,
    orgName,
    period: { start: start.toISOString(), end: end.toISOString() },
    summary: {
      requestsSubmitted: value.totalRequests,
      requestsCompleted: value.completedRequests,
      tasksCompleted: value.completedTasks,
      avgCycleTimeHours: cycleTime.avgHours,
      estimatedHoursSaved: value.estimatedHoursSaved,
    },
    highlights,
    requestBreakdown,
    categoryBreakdown: value.categories,
  };
}

export async function generateAllMonthlyReports(
  month: Date,
): Promise<MonthlyReport[]> {
  const admin = createAdminClient();

  const { data: orgs } = await admin
    .from("organizations")
    .select("id")
    .order("name");

  if (!orgs?.length) return [];

  const reports = await Promise.all(
    orgs.map((org) => generateMonthlyReport(org.id, month)),
  );

  return reports;
}
