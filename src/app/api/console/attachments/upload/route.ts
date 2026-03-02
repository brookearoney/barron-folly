import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const requestId = formData.get("request_id") as string | null;

    if (!file || !requestId) {
      return NextResponse.json(
        { error: "File and request_id are required" },
        { status: 400 }
      );
    }

    // Verify request belongs to user's org
    const { data: request } = await supabase
      .from("requests")
      .select("id")
      .eq("id", requestId)
      .eq("organization_id", profile.organization_id)
      .single();

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    const ext = file.name.split(".").pop() || "bin";
    const storagePath = `${profile.organization_id}/${requestId}/${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("request-attachments")
      .upload(storagePath, file);

    if (uploadError) throw uploadError;

    const { data: attachment, error: dbError } = await supabase
      .from("request_attachments")
      .insert({
        request_id: requestId,
        uploaded_by: user.id,
        file_name: file.name,
        file_size: file.size,
        mime_type: file.type,
        storage_path: storagePath,
      })
      .select()
      .single();

    if (dbError) throw dbError;

    return NextResponse.json({ attachment }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    );
  }
}
