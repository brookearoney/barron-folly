import { createAdminClient } from "@/lib/supabase/admin";
import type { TraceSpan, SpanEvent, TraceContext } from "@/lib/console/types";

// ---------------------------------------------------------------------------
// ID generation
// ---------------------------------------------------------------------------

function generateTraceId(): string {
  return crypto.randomUUID();
}

function generateSpanId(): string {
  // Shorter 16-char hex ID for spans
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// In-memory span cache for fast attribute/event additions
// ---------------------------------------------------------------------------

const activeSpans = new Map<string, TraceSpan>();

// ---------------------------------------------------------------------------
// createTrace
// ---------------------------------------------------------------------------

export async function createTrace(
  name: string,
  attributes?: Record<string, unknown>
): Promise<TraceContext> {
  const traceId = generateTraceId();
  const spanId = generateSpanId();
  const now = new Date().toISOString();

  const span: TraceSpan = {
    id: spanId,
    traceId,
    parentSpanId: null,
    name,
    service: "root",
    operation: "trace",
    status: "active",
    startTime: now,
    endTime: null,
    duration_ms: null,
    attributes: attributes ?? {},
    events: [],
  };

  activeSpans.set(spanId, span);
  await persistSpan(span);

  return { traceId, spanId };
}

// ---------------------------------------------------------------------------
// startSpan
// ---------------------------------------------------------------------------

export async function startSpan(
  traceId: string,
  name: string,
  parentSpanId?: string,
  options?: {
    service?: string;
    operation?: string;
    attributes?: Record<string, unknown>;
    taskId?: string;
    orgId?: string;
  }
): Promise<string> {
  const spanId = generateSpanId();
  const now = new Date().toISOString();

  // Parse service and operation from name if not provided
  // Convention: "service.operation" e.g. "orchestrator.dequeue"
  const parts = name.split(".");
  const service = options?.service ?? (parts.length > 1 ? parts[0] : "unknown");
  const operation = options?.operation ?? (parts.length > 1 ? parts.slice(1).join(".") : name);

  const span: TraceSpan = {
    id: spanId,
    traceId,
    parentSpanId: parentSpanId ?? null,
    name,
    service,
    operation,
    status: "active",
    startTime: now,
    endTime: null,
    duration_ms: null,
    attributes: options?.attributes ?? {},
    events: [],
  };

  activeSpans.set(spanId, span);
  await persistSpan(span, options?.taskId, options?.orgId);

  return spanId;
}

// ---------------------------------------------------------------------------
// endSpan
// ---------------------------------------------------------------------------

export async function endSpan(
  spanId: string,
  status: "completed" | "error" = "completed",
  error?: Error
): Promise<void> {
  const now = new Date().toISOString();
  const cached = activeSpans.get(spanId);

  const errorData = error
    ? { message: error.message, stack: error.stack, code: (error as unknown as { code?: string }).code }
    : undefined;

  if (cached) {
    cached.status = status;
    cached.endTime = now;
    cached.duration_ms = new Date(now).getTime() - new Date(cached.startTime).getTime();
    if (errorData) cached.error = errorData;
    activeSpans.delete(spanId);
  }

  const supabase = createAdminClient();

  const update: Record<string, unknown> = {
    status,
    end_time: now,
  };

  if (cached) {
    update.duration_ms = cached.duration_ms;
    update.events = cached.events;
    update.attributes = cached.attributes;
  } else {
    // If not cached, compute duration from DB
    const { data: existing } = await supabase
      .from("trace_spans")
      .select("start_time")
      .eq("id", spanId)
      .single();

    if (existing) {
      update.duration_ms = new Date(now).getTime() - new Date(existing.start_time).getTime();
    }
  }

  if (errorData) {
    update.error = errorData;
  }

  const { error: dbError } = await supabase
    .from("trace_spans")
    .update(update)
    .eq("id", spanId);

  if (dbError) {
    console.error("Failed to end span:", dbError);
  }
}

// ---------------------------------------------------------------------------
// addSpanEvent
// ---------------------------------------------------------------------------

export async function addSpanEvent(
  spanId: string,
  name: string,
  attributes?: Record<string, unknown>
): Promise<void> {
  const event: SpanEvent = {
    name,
    timestamp: new Date().toISOString(),
    attributes,
  };

  const cached = activeSpans.get(spanId);
  if (cached) {
    cached.events.push(event);
    // Flush to DB periodically is handled at endSpan; skip DB write here for perf
    return;
  }

  // Span not in cache — update DB directly
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("trace_spans")
    .select("events")
    .eq("id", spanId)
    .single();

  if (existing) {
    const events = [...(existing.events as SpanEvent[]), event];
    await supabase
      .from("trace_spans")
      .update({ events })
      .eq("id", spanId);
  }
}

// ---------------------------------------------------------------------------
// addSpanAttributes
// ---------------------------------------------------------------------------

export async function addSpanAttributes(
  spanId: string,
  attributes: Record<string, unknown>
): Promise<void> {
  const cached = activeSpans.get(spanId);
  if (cached) {
    cached.attributes = { ...cached.attributes, ...attributes };
    return;
  }

  // Not cached — update DB
  const supabase = createAdminClient();
  const { data: existing } = await supabase
    .from("trace_spans")
    .select("attributes")
    .eq("id", spanId)
    .single();

  if (existing) {
    const merged = { ...(existing.attributes as Record<string, unknown>), ...attributes };
    await supabase
      .from("trace_spans")
      .update({ attributes: merged })
      .eq("id", spanId);
  }
}

// ---------------------------------------------------------------------------
// getTrace
// ---------------------------------------------------------------------------

export async function getTrace(traceId: string): Promise<TraceSpan[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("trace_spans")
    .select("*")
    .eq("trace_id", traceId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to get trace:", error);
    return [];
  }

  return (data ?? []).map(rowToSpan);
}

// ---------------------------------------------------------------------------
// getSpansByTask
// ---------------------------------------------------------------------------

export async function getSpansByTask(taskId: string): Promise<TraceSpan[]> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("trace_spans")
    .select("*")
    .eq("task_id", taskId)
    .order("start_time", { ascending: true });

  if (error) {
    console.error("Failed to get spans by task:", error);
    return [];
  }

  return (data ?? []).map(rowToSpan);
}

// ---------------------------------------------------------------------------
// searchTraces
// ---------------------------------------------------------------------------

export async function searchTraces(params: {
  traceId?: string;
  taskId?: string;
  orgId?: string;
  service?: string;
  status?: string;
  since?: string;
  until?: string;
  limit?: number;
  offset?: number;
}): Promise<{ spans: TraceSpan[]; total: number }> {
  const supabase = createAdminClient();
  const limit = params.limit ?? 50;
  const offset = params.offset ?? 0;

  let query = supabase
    .from("trace_spans")
    .select("*", { count: "exact" });

  if (params.traceId) query = query.eq("trace_id", params.traceId);
  if (params.taskId) query = query.eq("task_id", params.taskId);
  if (params.orgId) query = query.eq("org_id", params.orgId);
  if (params.service) query = query.eq("service", params.service);
  if (params.status) query = query.eq("status", params.status);
  if (params.since) query = query.gte("start_time", params.since);
  if (params.until) query = query.lte("start_time", params.until);

  const { data, count, error } = await query
    .order("start_time", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Failed to search traces:", error);
    return { spans: [], total: 0 };
  }

  return {
    spans: (data ?? []).map(rowToSpan),
    total: count ?? 0,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function persistSpan(
  span: TraceSpan,
  taskId?: string,
  orgId?: string
): Promise<void> {
  const supabase = createAdminClient();

  const { error } = await supabase.from("trace_spans").insert({
    id: span.id,
    trace_id: span.traceId,
    parent_span_id: span.parentSpanId,
    name: span.name,
    service: span.service,
    operation: span.operation,
    status: span.status,
    start_time: span.startTime,
    end_time: span.endTime,
    duration_ms: span.duration_ms,
    attributes: span.attributes,
    events: span.events,
    error: span.error ?? null,
    task_id: taskId ?? (span.attributes.taskId as string) ?? null,
    org_id: orgId ?? (span.attributes.orgId as string) ?? null,
  });

  if (error) {
    console.error("Failed to persist span:", error);
  }
}

function rowToSpan(row: Record<string, unknown>): TraceSpan {
  return {
    id: row.id as string,
    traceId: row.trace_id as string,
    parentSpanId: (row.parent_span_id as string) ?? null,
    name: row.name as string,
    service: row.service as string,
    operation: row.operation as string,
    status: row.status as TraceSpan["status"],
    startTime: row.start_time as string,
    endTime: (row.end_time as string) ?? null,
    duration_ms: (row.duration_ms as number) ?? null,
    attributes: (row.attributes as Record<string, unknown>) ?? {},
    events: (row.events as SpanEvent[]) ?? [],
    error: row.error as TraceSpan["error"],
  };
}
