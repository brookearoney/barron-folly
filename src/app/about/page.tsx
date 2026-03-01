import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import JsonLd from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "About | Autonomous Execution Engine for Growing Companies",
  description:
    "Barron & Folly is an agentic product agency that replaces fragmented teams with an autonomous execution engine for software, systems, and brand infrastructure. Based in American Fork, Utah.",
  keywords: [
    "agentic product agency",
    "autonomous execution engine",
    "AI product agency Utah",
    "subscription execution engine",
    "replace dev agency with AI",
  ],
  alternates: { canonical: "/about" },
};

const stats = [
  { label: "Systems Deployed", value: "50+" },
  { label: "Companies Served", value: "30+" },
  { label: "Vendors Replaced", value: "5+" },
  { label: "Avg Turnaround", value: "48hr" },
];

const values = [
  {
    title: "Execution Over Meetings",
    desc: "48-hour turnarounds aren't a marketing gimmick. We ship continuously because your growth can't wait for another discovery call.",
  },
  {
    title: "Systems Over Silos",
    desc: "We don't hand off between departments. AI agents and senior oversight work in a single execution loop — design, code, and automation together.",
  },
  {
    title: "AI-Led, Human-Guided",
    desc: "AI handles velocity — research, generation, iteration. Humans handle nuance — strategy, architecture, creative direction. Both run in parallel.",
  },
  {
    title: "Built for Operators",
    desc: "No contracts, no scope creep, no bloated proposals. Subscribe, deploy, ship. That's it.",
  },
];

export default function AboutPage() {
  return (
    <>
      <JsonLd data={localBusinessJsonLd()} />

      <PageHero
        badge="About Us"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="3" stroke="#FF8400" strokeWidth="1.2" />
            <path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="#FF8400" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        }
        title="Complexity"
        titleAccent="Growth Creates"
        subtitle="Barron & Folly is an agentic product agency that replaces fragmented teams with an autonomous execution engine for software, systems, and brand infrastructure. AI agents handle velocity. Senior oversight handles nuance. You get infrastructure that scales."
        breadcrumbs={[{ label: "About" }]}
      />

      {/* Founder Section */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <AnimateIn>
              <div>
                <div className="flex items-center gap-4 mb-8">
                  <Image
                    src="/images/brand/brooke.png"
                    alt="Brooke Roney"
                    width={80}
                    height={80}
                    className="rounded-full object-cover w-20 h-20"
                  />
                  <div>
                    <p className="text-xl font-medium text-white">Brooke Roney</p>
                    <p className="text-[#6E6E6A]">Founder & Creative Director</p>
                  </div>
                </div>

                <p className="text-lg text-[#9E9E98] leading-relaxed mb-6">
                  Based in American Fork, Utah — we&apos;ve deployed systems,
                  products, and brand infrastructure for growth-stage companies,
                  multi-location operators, PE-backed portfolios, and SaaS
                  companies across industries.
                </p>
                <p className="text-lg text-[#6E6E6A] leading-relaxed">
                  We built Barron & Folly because growing companies deserve better
                  than fragmented agencies, overloaded freelancers, and months of
                  waiting. AI agents handle the velocity. Senior product oversight
                  handles the nuance. Everything ships under one roof.
                </p>
              </div>
            </AnimateIn>

            {/* Stats Grid */}
            <AnimateIn direction="right">
              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="p-6 rounded-2xl border border-[#2A2A26]/50 bg-[#141412]"
                  >
                    <p className="text-3xl md:text-4xl font-light text-[#FF8400] mb-2">
                      {stat.value}
                    </p>
                    <p className="text-sm text-[#6E6E6A]">{stat.label}</p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-16">
              <span className="font-display text-[#6E6E6A]">Our</span> Values
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {values.map((value, i) => (
              <AnimateIn key={value.title} delay={i * 0.1}>
                <div className="p-8 md:p-10 rounded-2xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all duration-500">
                  <h3 className="text-xl font-semibold mb-3 text-white">
                    {value.title}
                  </h3>
                  <p className="text-[#6E6E6A] leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <CTABanner
        title="Replace five vendors with one execution engine."
        subtitle="Subscribe and start deploying software, systems, and brand infrastructure — continuously. No contracts. Cancel anytime."
        cta="Deploy Your Infrastructure"
      />
    </>
  );
}
