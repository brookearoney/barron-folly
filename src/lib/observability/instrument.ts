import {
  createTrace,
  startSpan,
  endSpan,
  addSpanAttributes,
  addSpanEvent,
} from "./trace-context";
import type { TraceContext } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// withTracing – wrap any async function with automatic span tracking
// ---------------------------------------------------------------------------

export async function withTracing<T>(
  name: string,
  fn: (ctx: TraceContext) => Promise<T>,
  options?: {
    traceId?: string;
    parentSpanId?: string;
    attributes?: Record<string, unknown>;
    service?: string;
    operation?: string;
    taskId?: string;
    orgId?: string;
  }
): Promise<T> {
  let traceId = options?.traceId;
  let rootSpanId: string | undefined;

  // If no traceId provided, start a new trace
  if (!traceId) {
    const trace = await createTrace(name, options?.attributes);
    traceId = trace.traceId;
    rootSpanId = trace.spanId;
  }

  // Start a span for this operation
  const spanId = rootSpanId ?? await startSpan(traceId, name, options?.parentSpanId, {
    service: options?.service,
    operation: options?.operation,
    attributes: options?.attributes,
    taskId: options?.taskId,
    orgId: options?.orgId,
  });

  const ctx: TraceContext = {
    traceId,
    spanId,
    parentSpanId: options?.parentSpanId,
  };

  try {
    const result = await fn(ctx);
    await endSpan(spanId, "completed");
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await endSpan(spanId, "error", error);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// traceApiRoute – middleware-style tracer for API routes
// ---------------------------------------------------------------------------

export function traceApiRoute(
  handler: (req: Request, ctx: TraceContext) => Promise<Response>,
  options?: { name?: string; service?: string }
): (req: Request) => Promise<Response> {
  return async (req: Request): Promise<Response> => {
    const url = new URL(req.url);
    const routeName = options?.name ?? `${req.method} ${url.pathname}`;

    // Check for incoming trace context from headers
    const incomingTraceId = req.headers.get("x-trace-id") ?? undefined;
    const incomingSpanId = req.headers.get("x-parent-span-id") ?? undefined;

    const response = await withTracing(
      routeName,
      async (ctx) => {
        const res = await handler(req, ctx);
        // Attach trace context to response headers
        const headers = new Headers(res.headers);
        headers.set("x-trace-id", ctx.traceId);
        headers.set("x-span-id", ctx.spanId);
        return new Response(res.body, {
          status: res.status,
          statusText: res.statusText,
          headers,
        });
      },
      {
        traceId: incomingTraceId,
        parentSpanId: incomingSpanId,
        service: options?.service ?? "api",
        operation: routeName,
        attributes: {
          "http.method": req.method,
          "http.url": url.pathname,
        },
      }
    );

    return response;
  };
}

// ---------------------------------------------------------------------------
// traceOrchestratorOp – decorator for orchestrator operations
// ---------------------------------------------------------------------------

export async function traceOrchestratorOp(
  operation: string,
  taskId: string,
  traceId: string,
  fn: (spanId: string) => Promise<unknown>,
  options?: { parentSpanId?: string; attributes?: Record<string, unknown>; orgId?: string }
): Promise<unknown> {
  const spanId = await startSpan(
    traceId,
    `orchestrator.${operation}`,
    options?.parentSpanId,
    {
      service: "orchestrator",
      operation,
      attributes: { taskId, ...options?.attributes },
      taskId,
      orgId: options?.orgId,
    }
  );

  try {
    await addSpanEvent(spanId, `${operation}.started`, { taskId });
    const result = await fn(spanId);
    await addSpanEvent(spanId, `${operation}.completed`, { taskId });
    await endSpan(spanId, "completed");
    return result;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    await addSpanEvent(spanId, `${operation}.failed`, {
      taskId,
      error: error.message,
    });
    await endSpan(spanId, "error", error);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// createChildSpan – convenience for creating child spans
// ---------------------------------------------------------------------------

export async function createChildSpan(
  ctx: TraceContext,
  name: string,
  options?: {
    service?: string;
    operation?: string;
    attributes?: Record<string, unknown>;
    taskId?: string;
    orgId?: string;
  }
): Promise<string> {
  return startSpan(ctx.traceId, name, ctx.spanId, options);
}

// Re-export for convenience
export { endSpan, addSpanAttributes, addSpanEvent };
