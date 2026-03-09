import { AI_PHASE_LABELS, AI_PHASE_COLORS } from "@/lib/console/constants";
import type { AiPhase } from "@/lib/console/types";

export default function AiPhaseBadge({ phase }: { phase: AiPhase }) {
  if (phase === "none") return null;

  const label = AI_PHASE_LABELS[phase] || phase;
  const color = AI_PHASE_COLORS[phase] || "bg-zinc-500/10 text-zinc-400";

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${color}`}
    >
      {(phase === "clarifying" || phase === "constructing") && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {label}
    </span>
  );
}
