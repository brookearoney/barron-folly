// Phase 4.3: Full Observability (Traceability Chain)
//
// Usage:
//   import { withTracing, auditLog, checkHealth } from "@/lib/observability";
//
// Trace an async operation:
//   const result = await withTracing("myService.myOp", async (ctx) => {
//     // ctx.traceId, ctx.spanId available for passing to downstream calls
//     return doWork();
//   });
//
// Trace an API route:
//   export const GET = traceApiRoute(async (req, ctx) => {
//     return NextResponse.json({ ok: true });
//   }, { name: "GET /api/my-route" });
//
// Log an audit entry:
//   await auditLog({
//     traceId: ctx.traceId,
//     spanId: ctx.spanId,
//     taskId: null,
//     orgId: "org-uuid",
//     actorType: "agent",
//     actorId: null,
//     action: "tool.executed",
//     resource: "code-generator",
//     details: { input: "..." },
//     riskLevel: "low",
//     ip_address: null,
//   });

export {
  createTrace,
  startSpan,
  endSpan,
  addSpanEvent,
  addSpanAttributes,
  getTrace,
  getSpansByTask,
  searchTraces,
} from "./trace-context";

export {
  withTracing,
  traceApiRoute,
  traceOrchestratorOp,
  createChildSpan,
} from "./instrument";

export {
  auditLog,
  getAuditTrail,
  getAuditSummary,
} from "./audit";

export {
  checkHealth,
  checkServiceHealth,
  getErrorRate,
  getLatencyPercentiles,
  detectAnomalies,
} from "./health";
