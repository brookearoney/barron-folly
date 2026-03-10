import { NextResponse } from "next/server";
import { processSyncQueue } from "@/lib/linear/sync";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron endpoint to retry failed Linear sync operations and clean up old data.
 * Protected by a shared secret in the Authorization header.
 * Call this on a schedule (e.g., every 5 minutes via Vercel Cron or external scheduler).
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await processSyncQueue();

    // Clean up webhook dedup entries older than 7 days
    const supabase = createAdminClient();
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("webhook_events")
      .delete()
      .lt("processed_at", cutoff);

    // Clean up completed sync queue entries older than 30 days
    const syncCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await supabase
      .from("sync_queue")
      .delete()
      .eq("status", "completed")
      .lt("completed_at", syncCutoff);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync queue processing error:", error);
    return NextResponse.json(
      { error: "Failed to process sync queue" },
      { status: 500 }
    );
  }
}
