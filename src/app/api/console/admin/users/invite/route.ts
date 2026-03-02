import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  try {
    const { email, organization_id, full_name, role } = await req.json();

    if (!email || !organization_id) {
      return NextResponse.json(
        { error: "Email and organization_id are required" },
        { status: 400 }
      );
    }

    const admin = createAdminClient();

    // Verify org exists
    const { data: org } = await admin
      .from("organizations")
      .select("id, name")
      .eq("id", organization_id)
      .single();

    if (!org) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const { data: inviteData, error: inviteError } =
      await admin.auth.admin.inviteUserByEmail(email, {
        data: {
          organization_id,
          full_name: full_name || email,
          role: role || "client",
        },
      });

    if (inviteError) {
      return NextResponse.json(
        { error: inviteError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      user: inviteData.user,
      message: `Invite sent to ${email} for ${org.name}`,
    });
  } catch (error) {
    console.error("Admin invite error:", error);
    return NextResponse.json(
      { error: "Failed to send invite" },
      { status: 500 }
    );
  }
}
