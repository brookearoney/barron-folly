import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Try to fetch existing preferences
    let { data: prefs } = await supabase
      .from("notification_preferences")
      .select("*")
      .eq("profile_id", user.id)
      .single();

    // Create defaults if none exist
    if (!prefs) {
      const { data: created, error } = await supabase
        .from("notification_preferences")
        .insert({ profile_id: user.id })
        .select("*")
        .single();

      if (error) {
        console.error("Failed to create default preferences:", error);
        return NextResponse.json(
          { error: "Failed to create preferences" },
          { status: 500 }
        );
      }
      prefs = created;
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Get preferences error:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Validate fields
    const allowedFields = [
      "email_enabled",
      "slack_enabled",
      "in_app_enabled",
      "type_overrides",
      "digest_enabled",
      "digest_frequency",
      "quiet_hours_start",
      "quiet_hours_end",
    ];

    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }

    // Validate digest_frequency if provided
    if (updates.digest_frequency) {
      const valid = ["hourly", "daily", "weekly"];
      if (!valid.includes(updates.digest_frequency as string)) {
        return NextResponse.json(
          { error: "Invalid digest_frequency" },
          { status: 400 }
        );
      }
    }

    // Validate quiet hours if provided
    if ("quiet_hours_start" in updates || "quiet_hours_end" in updates) {
      const start = updates.quiet_hours_start as number | null;
      const end = updates.quiet_hours_end as number | null;
      if (start !== null && (start < 0 || start > 23)) {
        return NextResponse.json(
          { error: "quiet_hours_start must be 0-23" },
          { status: 400 }
        );
      }
      if (end !== null && (end < 0 || end > 23)) {
        return NextResponse.json(
          { error: "quiet_hours_end must be 0-23" },
          { status: 400 }
        );
      }
    }

    // Upsert preferences
    const { data: prefs, error } = await supabase
      .from("notification_preferences")
      .upsert(
        { profile_id: user.id, ...updates },
        { onConflict: "profile_id" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("Update preferences error:", error);
      return NextResponse.json(
        { error: "Failed to update preferences" },
        { status: 500 }
      );
    }

    return NextResponse.json({ preferences: prefs });
  } catch (error) {
    console.error("Preferences update error:", error);
    return NextResponse.json(
      { error: "Failed to update preferences" },
      { status: 500 }
    );
  }
}
