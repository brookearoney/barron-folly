import { PRIORITY_LABELS, PRIORITY_COLORS } from "@/lib/console/constants";
import type { RequestPriority } from "@/lib/console/types";

const PRIORITY_ICONS: Record<RequestPriority, string> = {
  low: "↓",
  medium: "→",
  high: "↑",
  urgent: "⚡",
};

export default function PriorityBadge({ priority }: { priority: RequestPriority }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${PRIORITY_COLORS[priority]}`}>
      <span>{PRIORITY_ICONS[priority]}</span>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}
