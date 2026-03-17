import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateAllMonthlyReports } from "@/lib/console/report-generator";

/**
 * Monthly report generation cron job.
 * Runs on the 1st of each month. Generates reports for all orgs
 * and logs a summary to the activity_log.
 *
 * Protected by CRON_SECRET in the Authorization header.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Generate reports for previous month
    const now = new Date();
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const reports = await generateAllMonthlyReports(previousMonth);

    const admin = createAdminClient();

    // Log summary to activity_log for each org
    const logEntries = reports.map((report) => ({
      organization_id: report.orgId,
      request_id: null,
      actor_id: null,
      action: "monthly_report_generated",
      details: {
        period: report.period,
        summary: report.summary,
        highlights: report.highlights,
        generated_at: new Date().toISOString(),
      },
    }));

    if (logEntries.length > 0) {
      await admin.from("activity_log").insert(logEntries);
    }

    // Aggregate summary across all orgs for admin notification
    const totalRequests = reports.reduce(
      (s, r) => s + r.summary.requestsSubmitted,
      0,
    );
    const totalCompleted = reports.reduce(
      (s, r) => s + r.summary.requestsCompleted,
      0,
    );
    const totalTasks = reports.reduce(
      (s, r) => s + r.summary.tasksCompleted,
      0,
    );
    const totalHoursSaved = reports.reduce(
      (s, r) => s + r.summary.estimatedHoursSaved,
      0,
    );

    // Log admin-level summary
    const adminOrgResult = await admin
      .from("profiles")
      .select("organization_id")
      .eq("role", "admin")
      .limit(1)
      .single();

    if (adminOrgResult.data?.organization_id) {
      await admin.from("activity_log").insert({
        organization_id: adminOrgResult.data.organization_id,
        request_id: null,
        actor_id: null,
        action: "monthly_reports_summary",
        details: {
          month: previousMonth.toISOString().slice(0, 7),
          orgsReported: reports.length,
          totalRequests,
          totalCompleted,
          totalTasks,
          totalHoursSaved,
          generated_at: new Date().toISOString(),
        },
      });
    }

    return NextResponse.json({
      success: true,
      month: previousMonth.toISOString().slice(0, 7),
      reportsGenerated: reports.length,
      summary: {
        totalRequests,
        totalCompleted,
        totalTasks,
        totalHoursSaved,
      },
    });
  } catch (error) {
    console.error("Monthly report cron error:", error);
    return NextResponse.json(
      { error: "Failed to generate monthly reports" },
      { status: 500 },
    );
  }
}
