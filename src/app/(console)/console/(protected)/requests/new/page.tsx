"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  AiClarificationData,
  AiClarificationQuestion,
} from "@/lib/console/types";

type Phase = "form" | "clarifying" | "answering" | "constructing" | "complete";

export default function NewRequestPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Multi-step AI flow state
  const [phase, setPhase] = useState<Phase>("form");
  const [requestId, setRequestId] = useState<string | null>(null);
  const [streamText, setStreamText] = useState("");
  const [clarificationData, setClarificationData] =
    useState<AiClarificationData | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const streamRef = useRef<HTMLDivElement>(null);

  // Pre-populate from suggestion URL params
  const prefillDescription = searchParams.get("description") || "";

  // Auto-scroll stream output
  useEffect(() => {
    if (streamRef.current) {
      streamRef.current.scrollTop = streamRef.current.scrollHeight;
    }
  }, [streamText]);

  // Extract JSON from AI response that may be wrapped in markdown code blocks
  function extractJSON(text: string): string {
    const trimmed = text.trim();
    const fenceMatch = trimmed.match(/^```(?:json)?\s*\n?([\s\S]*?)\n?\s*```$/);
    if (fenceMatch) return fenceMatch[1].trim();
    const jsonStart = trimmed.indexOf("{");
    const jsonEnd = trimmed.lastIndexOf("}");
    if (jsonStart !== -1 && jsonEnd > jsonStart) {
      return trimmed.slice(jsonStart, jsonEnd + 1);
    }
    return trimmed;
  }

  // Parse clarification data once streaming completes
  const parseClarificationData = useCallback((text: string) => {
    try {
      const parsed = JSON.parse(extractJSON(text)) as AiClarificationData;
      setClarificationData(parsed);
      // Pre-populate answers object
      const initial: Record<string, string> = {};
      for (const q of parsed.questions) {
        initial[q.id] = "";
      }
      setAnswers(initial);
      setPhase("answering");
    } catch {
      setError("Failed to parse AI response. Please try again.");
      setPhase("form");
    }
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const description = form.get("description") as string;

    try {
      const res = await fetch("/api/console/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create request");
      }

      const { request, ai_enabled } = await res.json();

      if (ai_enabled) {
        // AI flow: start clarification
        setRequestId(request.id);
        setPhase("clarifying");
        setStreamText("");
        setLoading(false);

        // Stream clarification questions
        const clarifyRes = await fetch("/api/console/ai/clarify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ request_id: request.id }),
        });

        if (!clarifyRes.ok) {
          throw new Error("Failed to start AI clarification");
        }

        const reader = clarifyRes.body?.getReader();
        const decoder = new TextDecoder();
        let fullText = "";

        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            fullText += chunk;
            setStreamText(fullText);
          }
        }

        parseClarificationData(fullText);
      } else {
        // Non-AI flow: redirect to detail page
        router.push(`/console/requests/${request.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      if (phase !== "form") setPhase("form");
    }
  }

  async function handleAnswerSubmit() {
    if (!requestId) return;
    setLoading(true);
    setError("");

    try {
      const answerPayload = Object.entries(answers).map(([id, answer]) => ({
        id,
        answer,
      }));

      const res = await fetch("/api/console/ai/clarify/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          request_id: requestId,
          answers: answerPayload,
          clarification_data: clarificationData,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to submit answers");
      }

      // Move to task construction phase
      setPhase("constructing");
      setStreamText("");

      const constructRes = await fetch("/api/console/ai/construct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ request_id: requestId }),
      });

      if (!constructRes.ok) {
        throw new Error("Failed to start task construction");
      }

      const reader = constructRes.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullText += chunk;
          setStreamText(fullText);
        }
      }

      setPhase("complete");
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setLoading(false);
      setPhase("form");
    }
  }

  function renderQuestionInput(q: AiClarificationQuestion) {
    if (q.type === "boolean") {
      return (
        <div className="flex gap-3 mt-2">
          {["Yes", "No"].map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [q.id]: opt }))
              }
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                answers[q.id] === opt
                  ? "border-orange bg-orange/10 text-foreground"
                  : "border-dark-border bg-dark text-muted hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    if (q.type === "choice" && q.options && q.options.length > 0) {
      return (
        <div className="flex flex-wrap gap-2 mt-2">
          {q.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() =>
                setAnswers((prev) => ({ ...prev, [q.id]: opt }))
              }
              className={`px-4 py-2 rounded-lg border text-sm transition-colors ${
                answers[q.id] === opt
                  ? "border-orange bg-orange/10 text-foreground"
                  : "border-dark-border bg-dark text-muted hover:text-foreground"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      );
    }

    // Default: text input
    return (
      <textarea
        value={answers[q.id] || ""}
        onChange={(e) =>
          setAnswers((prev) => ({ ...prev, [q.id]: e.target.value }))
        }
        rows={2}
        className="w-full mt-2 px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y text-sm"
        placeholder="Your answer..."
      />
    );
  }

  // ─── Phase: AI Clarifying (streaming) ─────────────────────────────────
  if (phase === "clarifying") {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Analyzing your request
          </h1>
          <p className="text-muted text-sm mt-1">
            Our AI is analyzing your request to ask the right questions...
          </p>
        </div>

        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span className="text-foreground text-sm font-medium">
              AI is thinking...
            </span>
          </div>
          <div
            ref={streamRef}
            className="text-muted text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap"
          >
            {streamText || "Connecting to AI..."}
          </div>
        </div>
      </div>
    );
  }

  // ─── Phase: Answering Clarification Questions ─────────────────────────
  if (phase === "answering" && clarificationData) {
    const allAnswered = clarificationData.questions.every(
      (q) => answers[q.id]?.trim()
    );

    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            A few quick questions
          </h1>
          <p className="text-muted text-sm mt-1">
            Help us understand your request better so we can build exactly what
            you need.
          </p>
        </div>

        {/* Request summary */}
        <div className="bg-dark rounded-lg border border-dark-border p-5 mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-foreground text-sm font-medium">
              Request Summary
            </span>
            <div className="flex items-center gap-2">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  clarificationData.complexity === "simple"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : clarificationData.complexity === "moderate"
                    ? "bg-orange/10 text-orange"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {clarificationData.complexity}
              </span>
              <span className="text-muted text-xs">
                ~{clarificationData.estimated_tasks} tasks
              </span>
            </div>
          </div>
          <p className="text-muted-light text-sm">
            {clarificationData.request_summary}
          </p>
        </div>

        {/* Questions */}
        <div className="space-y-6">
          {clarificationData.questions.map((q, i) => (
            <div
              key={q.id}
              className="bg-dark rounded-lg border border-dark-border p-5"
            >
              <div className="flex items-start gap-3">
                <span className="text-orange text-sm font-semibold mt-0.5">
                  Q{i + 1}
                </span>
                <div className="flex-1">
                  <p className="text-foreground text-sm font-medium">
                    {q.question}
                  </p>
                  <p className="text-muted text-xs mt-1">{q.why}</p>
                  {renderQuestionInput(q)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="flex items-center gap-3 pt-6">
          <button
            onClick={handleAnswerSubmit}
            disabled={!allAnswered || loading}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Processing..." : "Submit answers"}
          </button>
          <button
            type="button"
            onClick={() => {
              setPhase("form");
              setRequestId(null);
              setClarificationData(null);
            }}
            className="text-muted hover:text-foreground text-sm py-3 px-4 transition-colors"
          >
            Start over
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase: Task Construction (streaming) ─────────────────────────────
  if (phase === "constructing") {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            Building your task plan
          </h1>
          <p className="text-muted text-sm mt-1">
            AI is constructing detailed Linear tasks from your request...
          </p>
        </div>

        <div className="bg-dark rounded-lg border border-dark-border p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-2 h-2 rounded-full bg-orange animate-pulse" />
            <span className="text-foreground text-sm font-medium">
              Constructing tasks...
            </span>
          </div>
          <div
            ref={streamRef}
            className="text-muted text-xs font-mono max-h-64 overflow-y-auto whitespace-pre-wrap"
          >
            {streamText || "Building task plan..."}
          </div>
        </div>

        {error && <p className="text-red-400 text-sm mt-4">{error}</p>}

        <div className="pt-4">
          <button
            type="button"
            onClick={() => {
              setPhase("form");
              setRequestId(null);
              setClarificationData(null);
              setStreamText("");
              setError("");
              setLoading(false);
            }}
            className="text-muted hover:text-foreground text-sm py-3 px-4 transition-colors"
          >
            Cancel and start over
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase: Complete ──────────────────────────────────────────────────
  if (phase === "complete" && requestId) {
    return (
      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Tasks created
              </h1>
              <p className="text-muted text-sm mt-0.5">
                Your request has been analyzed and Linear tasks have been
                created.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/console/requests/${requestId}`)}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-3 rounded-lg transition-colors"
          >
            View request
          </button>
          <button
            onClick={() => router.push("/console/dashboard")}
            className="text-muted hover:text-foreground text-sm py-3 px-4 transition-colors"
          >
            Back to dashboard
          </button>
        </div>
      </div>
    );
  }

  // ─── Phase: Form (initial) ────────────────────────────────────────────
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-foreground">New Request</h1>
        <p className="text-muted text-sm mt-1">
          Describe what you need and our AI will handle the rest.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label
            htmlFor="description"
            className="block text-sm text-muted-light mb-2"
          >
            What do you need?
          </label>
          <textarea
            id="description"
            name="description"
            required
            rows={6}
            defaultValue={prefillDescription}
            placeholder="Describe your request in as much detail as possible. Include goals, context, references, and any constraints. Our AI will ask follow-up questions to fill in any gaps."
            className="w-full px-4 py-3 bg-dark border border-dark-border rounded-lg text-foreground placeholder:text-muted focus:outline-none focus:border-orange transition-colors resize-y"
          />
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-orange hover:bg-orange-dark text-dark font-semibold text-sm px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Submitting..." : "Submit request"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-muted hover:text-foreground text-sm py-3 px-4 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
