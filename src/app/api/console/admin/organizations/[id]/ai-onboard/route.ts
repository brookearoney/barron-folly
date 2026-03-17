import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/console/admin-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { scrapeWithFirecrawl } from "@/lib/scraping/firecrawl";
import { generateBusinessDossier, generateStyleGuide } from "@/lib/ai/claude";
import { withRunLogging } from "@/lib/ai/with-logging";

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

    // Scrape the URL (with run logging)
    const scrapeResult = await withRunLogging(
      { orgId: id, flow: "scrape", inputSummary: `Scraping ${url}` },
      () => scrapeWithFirecrawl(url)
    );

    // Generate business dossier (with run logging)
    const dossier = await withRunLogging(
      { orgId: id, flow: "dossier", inputSummary: `Generating dossier from ${url}` },
      () => generateBusinessDossier(scrapeResult.text, url)
    );

    // Generate style guide using dossier as additional context (with run logging)
    const styleGuide = await withRunLogging(
      { orgId: id, flow: "style_guide", inputSummary: `Generating style guide from ${url}` },
      () => generateStyleGuide(scrapeResult.rawHtml, url, JSON.stringify(dossier))
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
