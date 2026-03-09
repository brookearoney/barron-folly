import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeUrl } from "@/lib/ai/scraper";
import { generateBusinessDossier, generateStyleGuide } from "@/lib/ai/claude";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const admin = createAdminClient();

  try {
    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Mark as processing
    await admin
      .from("organizations")
      .update({
        website_url: url,
        ai_onboarding_status: "processing",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    // Scrape the URL
    const scrapeResult = await scrapeUrl(url);

    // Generate business dossier
    const dossier = await generateBusinessDossier(scrapeResult.text, url);

    // Generate style guide using dossier as additional context
    const styleGuide = await generateStyleGuide(
      scrapeResult.rawHtml,
      url,
      JSON.stringify(dossier)
    );

    // Save results
    const { error } = await admin
      .from("organizations")
      .update({
        business_dossier: dossier,
        style_guide: styleGuide,
        ai_onboarding_status: "completed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ dossier, style_guide: styleGuide });
  } catch (err) {
    console.error("AI onboarding error:", err);

    // Mark as failed
    await admin
      .from("organizations")
      .update({
        ai_onboarding_status: "failed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    return NextResponse.json(
      { error: err instanceof Error ? err.message : "AI onboarding failed" },
      { status: 500 }
    );
  }
}
