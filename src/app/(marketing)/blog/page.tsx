import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Blog | Insights on Agentic Execution, Systems & AI",
  description:
    "Insights, case studies, and perspectives on agentic execution, systems architecture, AI-led development, and building scalable digital infrastructure.",
  alternates: { canonical: "/blog" },
};

export default function BlogPage() {
  return (
    <>
      <PageHero
        badge="Blog"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 3H14M2 7H10M2 11H12"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Soon"
        titleAccent="Coming"
        subtitle="We're putting together insights on agentic execution, systems architecture, AI-led development, and deploying scalable infrastructure. Check back soon."
        breadcrumbs={[{ label: "Blog" }]}
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-[#2A2A26]/30 bg-[#141412] p-8 h-64 flex items-center justify-center"
              >
                <p className="text-[#2A2A26] text-sm uppercase tracking-widest">
                  Coming Soon
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
