"use client";

import { useState, useCallback } from "react";
import { useRealtimeNotifications } from "./useRealtimeNotifications";

interface PendingCounts {
  clarifications: number;
  approvals: number;
  unreadNotifications: number;
}

/**
 * Provides live-updating pending counts by subscribing to Supabase Realtime
 * and refetching counts when relevant changes occur.
 */
export function useLivePendingCounts(
  organizationId: string,
  initial: { clarifications: number; approvals: number }
) {
  const [counts, setCounts] = useState<PendingCounts>({
    clarifications: initial.clarifications,
    approvals: initial.approvals,
    unreadNotifications: 0,
  });

  const refetchCounts = useCallback(async () => {
    try {
      const [notifRes, clarifRes, approvalRes] = await Promise.all([
        fetch("/api/console/notifications?filter=unread&limit=1"),
        fetch("/api/console/clarifications"),
        fetch("/api/console/approvals"),
      ]);

      const [notifData, clarifData, approvalData] = await Promise.all([
        notifRes.json(),
        clarifRes.json(),
        approvalRes.json(),
      ]);

      const pendingClarifications = (clarifData.clarifications || []).filter(
        (c: { status: string }) => c.status === "pending"
      ).length;

      const pendingApprovals = (approvalData.approvals || []).filter(
        (a: { decision: string | null }) => !a.decision
      ).length;

      setCounts({
        clarifications: pendingClarifications,
        approvals: pendingApprovals,
        unreadNotifications: notifData.unread_count ?? 0,
      });
    } catch (err) {
      console.error("Failed to refetch pending counts:", err);
    }
  }, []);

  useRealtimeNotifications({
    organizationId,
    onNotification: refetchCounts,
    onClarification: refetchCounts,
    onApproval: refetchCounts,
    onRequestUpdate: refetchCounts,
  });

  return counts;
}
