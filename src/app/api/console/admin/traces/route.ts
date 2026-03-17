import { NextResponse, type NextRequest } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { searchTraces, getTrace } from "@/lib/observability/trace-context";
import { getAuditTrail } from "@/lib/observability/audit";

export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { searchParams } = request.nextUrl;
    const traceId = searchParams.get("trace_id") ?? undefined;
    const taskId = searchParams.get("task_id") ?? undefined;
    const orgId = searchParams.get("org_id") ?? undefined;
    const service = searchParams.get("service") ?? undefined;
    const status = searchParams.get("status") ?? undefined;
    const since = searchParams.get("since") ?? undefined;
    const until = searchParams.get("until") ?? undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    // If a specific traceId is requested, return the full trace with audit entries
    if (traceId && !taskId && !service) {
      const spans = await getTrace(traceId);

      // Also fetch related audit entries
      let auditEntries: Awaited<ReturnType<typeof getAuditTrail>>["entries"] = [];
      if (orgId) {
        const auditResult = await getAuditTrail({ orgId, traceId, limit: 100 });
        auditEntries = auditResult.entries;
      }

      return NextResponse.json({
        traceId,
        spans,
        auditEntries,
        total: spans.length,
      });
    }

    const { spans, total } = await searchTraces({
      traceId,
      taskId,
      orgId,
      service,
      status,
      since,
      until,
      limit,
      offset,
    });

    // Group spans by trace to provide a trace-level view
    const traceMap = new Map<string, typeof spans>();
    for (const span of spans) {
      const existing = traceMap.get(span.traceId);
      if (existing) {
        existing.push(span);
      } else {
        traceMap.set(span.traceId, [span]);
      }
    }

    const traces = Array.from(traceMap.entries()).map(([id, traceSpans]) => {
      const root = traceSpans.find((s) => !s.parentSpanId) ?? traceSpans[0];
      const hasError = traceSpans.some((s) => s.status === "error");
      const totalDuration = traceSpans.reduce(
        (max, s) => Math.max(max, s.duration_ms ?? 0),
        0
      );

      return {
        traceId: id,
        name: root.name,
        service: root.service,
        status: hasError ? "error" : root.status,
        startTime: root.startTime,
        duration_ms: totalDuration,
        spanCount: traceSpans.length,
      };
    });

    return NextResponse.json({ traces, spans, total, page, limit });
  } catch (error) {
    console.error("Admin traces API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch traces" },
      { status: 500 }
    );
  }
}
