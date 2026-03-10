"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

interface UseRealtimeOptions {
  organizationId: string;
  onNotification?: () => void;
  onClarification?: () => void;
  onApproval?: () => void;
  onRequestUpdate?: () => void;
}

/**
 * Subscribes to Supabase Realtime for live updates.
 * Calls the appropriate callback when new rows are inserted/updated.
 */
export function useRealtimeNotifications({
  organizationId,
  onNotification,
  onClarification,
  onApproval,
  onRequestUpdate,
}: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Stable callback refs to avoid re-subscribing on every render
  const callbackRefs = useRef({ onNotification, onClarification, onApproval, onRequestUpdate });
  callbackRefs.current = { onNotification, onClarification, onApproval, onRequestUpdate };

  const subscribe = useCallback(() => {
    if (!organizationId) return;

    const supabase = createClient();

    // Clean up existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`console:${organizationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          callbackRefs.current.onNotification?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "clarifications",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          callbackRefs.current.onClarification?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "approvals",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          callbackRefs.current.onApproval?.();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "requests",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => {
          callbackRefs.current.onRequestUpdate?.();
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [organizationId]);

  useEffect(() => {
    subscribe();

    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [subscribe]);
}
