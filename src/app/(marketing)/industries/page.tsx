import type { Metadata } from "next";
import Link from "next/link";
import { industries } from "@/data/industries";
import AnimateIn from "@/components/AnimateIn";
import CTABanner from "@/components/CTABanner";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "Industries | PE-Backed Roll-Up Operations | Barron & Folly",
  description:
    "We deploy systems architecture, brand infrastructure, and operational tooling for PE-backed service roll-ups. Landscaping, HVAC, roofing, pest control, electrical, and commercial cleaning.",
  keywords: [
    "PE roll up operations",
    "home services integration",
    "service business roll up",
    "PE portfolio integration",
    "multi-location operations",
    "service business technology",
  ],
  alternates: { canonical: "/industries" },
};

export default function IndustriesPage() {
  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Industries We Serve",
          description: metadata.description,
        }}
      />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 relative">
        <div className="absolute inset-0 hero-dot-grid opacity-20 pointer-events-none" />

        <div className="w-[90%] mx-auto relative z-10">
          <AnimateIn>
            <span className="inline-block px-4 py-1.5 text-sm text-[#FF8400] border border-[#FF8400]/30 rounded-full mb-6">
              Industries
            </span>
          </AnimateIn>

          <AnimateIn delay={0.1}>
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.05] tracking-tight mb-8">
              <span className="font-display text-[#6E6E6A]">Built for</span>
              <br />
              roll-ups.
            </h1>
          </AnimateIn>

          <AnimateIn delay={0.2}>
            <p className="text-[#9E9E98] max-w-2xl text-lg md:text-xl leading-relaxed">
              PE-backed service businesses scale through acquisition. But every
              acquisition adds operational chaos. We deploy the systems
              architecture, brand infrastructure, and operational tooling that
              turns fragmented portfolios into unified platforms.
            </p>
          </AnimateIn>
        </div>
      </section>

      {/* Industry Grid */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, idx) => (
              <AnimateIn key={industry.slug} delay={idx * 0.08}>
                <Link
                  href={`/industries/${industry.slug}`}
                  className="group block rounded-2xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all h-full"
                >
                  <div className="p-8 md:p-10">
                    <span className="text-[#FF8400] text-sm font-light block mb-4">
                      {industry.num}
                    </span>

                    <h2 className="text-2xl font-light group-hover:text-[#FF8400] transition-colors mb-3">
                      {industry.title}
                    </h2>

                    <p className="text-[#9E9E98] text-sm leading-relaxed mb-6">
                      {industry.desc}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-6">
                      {industry.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 text-xs text-[#6E6E6A] border border-[#2A2A26]/50 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Stats preview */}
                    <div className="grid grid-cols-2 gap-3 pt-6 border-t border-[#2A2A26]/30">
                      {industry.stats.slice(0, 2).map((stat) => (
                        <div key={stat.label}>
                          <p className="text-lg font-light text-[#FF8400]">
                            {stat.value}
                          </p>
                          <p className="text-xs text-[#6E6E6A]">
                            {stat.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="px-8 md:px-10 py-4 border-t border-[#2A2A26]/30 flex items-center justify-between">
                    <span className="text-sm text-[#6E6E6A] group-hover:text-[#FF8400] transition-colors">
                      View details
                    </span>
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 16 16"
                      fill="none"
                      className="text-[#6E6E6A] group-hover:text-[#FF8400] transition-colors"
                    >
                      <path
                        d="M3 8H13M13 8L9 4M13 8L9 12"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Value Prop */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <AnimateIn>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight">
                <span className="font-display text-[#6E6E6A]">
                  Why roll-ups
                </span>{" "}
                choose us
              </h2>
            </AnimateIn>

            <AnimateIn delay={0.15}>
              <div className="space-y-8">
                {[
                  {
                    title: "Fraction of the cost",
                    desc: "ServiceTitan, Aspire, and FieldRoutes charge per-user, per-location, per-month. We deploy systems at flat subscription rates that don't scale with your headcount.",
                  },
                  {
                    title: "Integration, not just software",
                    desc: "Off-the-shelf tools manage individual locations. We build the connective tissue between locations — unified data, standardized processes, portfolio visibility.",
                  },
                  {
                    title: "Ship in weeks, not quarters",
                    desc: "AI-powered execution compresses 6-month integration timelines into weeks. Every acquisition gets standardized faster, creating value sooner.",
                  },
                  {
                    title: "PE-native reporting",
                    desc: "We build dashboards and reporting infrastructure designed for PE sponsors — portfolio-level KPIs, brand-level drill-downs, and board-ready exports.",
                  },
                ].map((item) => (
                  <div
                    key={item.title}
                    className="pb-8 border-b border-[#2A2A26]/30 last:border-0 last:pb-0"
                  >
                    <h3 className="text-lg font-medium mb-2">{item.title}</h3>
                    <p className="text-[#9E9E98] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      <CTABanner
        title="Your portfolio deserves better ops."
        subtitle="Deploy an execution engine that integrates acquisitions in weeks, not quarters. No contracts, cancel anytime."
        cta="Talk to Us"
        href="/contact"
      />
    </>
  );
}
