import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { advanceApprovalChain } from "@/lib/console/approval-chains";
import { dispatchNotification } from "@/lib/console/notification-dispatcher";

/**
 * Cron endpoint to auto-approve expired approvals.
 * Finds approvals where auto_approve_at has passed and decision is still null,
 * auto-approves them, advances the chain, and logs activity.
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
    const admin = createAdminClient();
    const now = new Date().toISOString();

    // Find approvals that should be auto-approved
    const { data: expiredApprovals, error } = await admin
      .from("approvals")
      .select("id, request_id, organization_id, title, step_number, total_steps, auto_approve_at")
      .is("decision", null)
      .lt("auto_approve_at", now);

    if (error) throw error;

    const autoApproved: string[] = [];

    if (expiredApprovals?.length) {
      for (const approval of expiredApprovals) {
        // Auto-approve
        await admin
          .from("approvals")
          .update({
            decision: "approved",
            decision_notes: "Auto-approved (no response within time limit)",
            decided_at: now,
          })
          .eq("id", approval.id);

        autoApproved.push(approval.id);

        // Log activity
        await admin.from("activity_log").insert({
          request_id: approval.request_id,
          organization_id: approval.organization_id,
          actor_id: null,
          action: "auto_approved",
          details: {
            approval_id: approval.id,
            auto_approve_at: approval.auto_approve_at,
          },
        });

        // Send notification
        await dispatchNotification({
          organizationId: approval.organization_id,
          type: "approval",
          title: `Auto-approved: ${approval.title}`,
          body: `This approval was automatically approved after the response window expired.`,
          requestId: approval.request_id || undefined,
          referenceId: approval.id,
        });

        // Advance the chain if part of one
        if ((approval.total_steps || 1) > 1) {
          try {
            const { chainComplete } = await advanceApprovalChain(approval.id);

            if (chainComplete && approval.request_id) {
              await admin
                .from("requests")
                .update({ status: "approved", updated_at: now })
                .eq("id", approval.request_id);

              await dispatchNotification({
                organizationId: approval.organization_id,
                type: "approval",
                title: `Approval chain complete: ${approval.title}`,
                body: "All approval steps have been completed (final step auto-approved).",
                requestId: approval.request_id,
                referenceId: approval.id,
              });
            }
          } catch (chainErr) {
            console.error("Chain advancement error during auto-approve:", chainErr);
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      autoApprovedCount: autoApproved.length,
      autoApprovedIds: autoApproved,
    });
  } catch (error) {
    console.error("Auto-approve cron error:", error);
    return NextResponse.json(
      { error: "Failed to process auto-approvals" },
      { status: 500 }
    );
  }
}
