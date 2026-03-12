import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SITE_URL } from "@/lib/constants";

export const revalidate = 3600; // revalidate every hour

export async function GET() {
  const supabase = createAdminClient();
  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug, title, seo_description, excerpt")
    .eq("published", true)
    .order("date", { ascending: false });

  const articles = (posts ?? [])
    .map(
      (p) =>
        `- **${p.title}** — ${p.seo_description || p.excerpt} ${SITE_URL}/blog/${p.slug}`
    )
    .join("\n");

  const body = `# Barron & Folly

> Agentic product agency that replaces fragmented teams with an autonomous execution engine. Software, systems, and brand infrastructure — deployed on demand.

## About

Barron & Folly is a subscription-based agentic product agency based in American Fork, Utah. We combine autonomous AI agents with senior product oversight to build, standardize, and scale the digital infrastructure behind modern businesses. No contracts. Cancel anytime.

## Services

- **Agentic Execution**: Autonomous AI agents deploy web platforms, applications, automations, internal tools, dashboards, integrations, CRM systems, conversion systems, technical SEO, and reporting infrastructure.
- **Systems Architecture**: Workflow logic, information architecture, scalable frameworks, internal operational tooling, and data visibility layers. Infrastructure before aesthetics.
- **Brand & Experience**: Identity systems, design systems, UX strategy, multi-product cohesion, and portfolio brand consolidation for companies that need nuance at scale.

## Pricing

Subscription tiers from $500/mo to $10,000/mo:

- **Copper ($500/mo)**: AI-heavy execution layer. Landing pages, CRM automations, integrations, dashboards, technical SEO, content production.
- **Steel ($2,500/mo)**: Standardization layer. Multi-site rollouts, design systems, funnel architecture, conversion optimization, workflow automation.
- **Titanium ($5,000/mo)**: Product & experience layer. Custom UX, feature architecture, brand evolution, AI agents for your workflows. Most popular.
- **Tungsten ($10,000/mo)**: Command layer. Dedicated AI stack, full systems architecture, brand architecture, enterprise tooling, strategic oversight.

## Who We Serve

Growth-stage companies, multi-location operators, PE-backed portfolios, SaaS companies scaling quickly, industrial and defense organizations, consumer brands expanding channels, and founders building internal tools.

## Blog

Insights on agentic execution, AI-led development, systems architecture, and deploying scalable infrastructure.

### Articles

${articles || "No articles published yet."}

## Key Pages

- Homepage: ${SITE_URL}
- Services: ${SITE_URL}/services
- Agentic Execution: ${SITE_URL}/services/agentic-execution
- Systems Architecture: ${SITE_URL}/services/systems-architecture
- Brand & Experience: ${SITE_URL}/services/brand-experience
- Work / Portfolio: ${SITE_URL}/work
- Pricing: ${SITE_URL}/pricing
- About: ${SITE_URL}/about
- Blog: ${SITE_URL}/blog
- FAQ: ${SITE_URL}/faq
- Contact: ${SITE_URL}/contact

## Contact

- Email: start@barronfolly.com
- Location: American Fork, UT 84003
- Instagram: https://instagram.com/barronfolly
- LinkedIn: https://www.linkedin.com/company/barron-folly
`;

  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
