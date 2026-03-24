import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { industries, getIndustryBySlug, getAllIndustrySlugs } from "@/data/industries";
import Breadcrumbs from "@/components/Breadcrumbs";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import JsonLd from "@/components/JsonLd";
import FaqSection from "@/components/FaqSection";
import { industryFaqs } from "@/data/faqs";

export function generateStaticParams() {
  return getAllIndustrySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) return { title: "Industry Not Found" };

  return {
    title: industry.seo.title,
    description: industry.seo.description,
    keywords: industry.seo.keywords,
    alternates: { canonical: `/industries/${industry.slug}` },
    openGraph: {
      title: industry.seo.title,
      description: industry.seo.description,
    },
  };
}

export default async function IndustryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const industry = getIndustryBySlug(slug);
  if (!industry) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: `${industry.title} Operations & Integration`,
          provider: {
            "@type": "Organization",
            name: "Barron & Folly",
          },
          description: industry.seo.description,
        }}
      />

      {/* Hero */}
      <section className="pt-32 md:pt-40 pb-16 md:pb-20 relative">
        <div className="absolute inset-0 hero-dot-grid opacity-20 pointer-events-none" />
        <div className="absolute top-24 right-[5%] text-[20rem] font-light text-[#171614] leading-none select-none pointer-events-none hidden lg:block">
          {industry.num}
        </div>

        <div className="w-[90%] mx-auto relative z-10">
          <Breadcrumbs
            items={[
              { label: "Industries", href: "/industries" },
              { label: industry.title },
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-6">
            {industry.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs text-[#FF8400] border border-[#FF8400]/30 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight mb-6">
            {industry.headline}
          </h1>

          <p className="text-[#9E9E98] max-w-3xl text-lg md:text-xl leading-relaxed mb-12">
            {industry.longDesc}
          </p>

          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {industry.stats.map((stat) => (
              <div
                key={stat.label}
                className="p-4 rounded-xl border border-[#2A2A26]/50 bg-[#141412]"
              >
                <p className="text-2xl md:text-3xl font-light text-[#FF8400]">
                  {stat.value}
                </p>
                <p className="text-sm text-[#6E6E6A] mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain Points */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight mb-4">
              <span className="font-display text-[#6E6E6A]">The</span> Problem
            </h2>
            <p className="text-[#6E6E6A] text-lg max-w-2xl mb-12">
              Every acquisition compounds the operational chaos. Here&apos;s what
              we see across every {industry.title.toLowerCase()} roll-up.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {industry.painPoints.map((pain, idx) => (
              <AnimateIn key={pain.title} delay={idx * 0.1}>
                <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-8 md:p-10 h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-[#FF8400]/10 flex items-center justify-center shrink-0 mt-0.5">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 3V8.5M8 11.5V12M14 8C14 11.3137 11.3137 14 8 14C4.68629 14 2 11.3137 2 8C2 4.68629 4.68629 2 8 2C11.3137 2 14 4.68629 14 8Z"
                          stroke="#FF8400"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium">{pain.title}</h3>
                  </div>
                  <p className="text-[#9E9E98] leading-relaxed pl-12">
                    {pain.description}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Competitor Callout */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <div className="rounded-2xl border border-[#FF8400]/20 bg-gradient-to-br from-[#FF8400]/5 to-transparent p-8 md:p-12">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FF8400]/10 flex items-center justify-center shrink-0">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                  >
                    <path
                      d="M10 6V10M10 14H10.01M18 10C18 14.4183 14.4183 18 10 18C5.58172 18 2 14.4183 2 10C2 5.58172 5.58172 2 10 2C14.4183 2 18 5.58172 18 10Z"
                      stroke="#FF8400"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-[#FF8400] font-medium mb-2">
                    vs. {industry.competitorCallout.name}
                  </p>
                  <p className="text-[#9E9E98] text-lg leading-relaxed">
                    {industry.competitorCallout.problem}
                  </p>
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Solutions */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <AnimateIn>
              <div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight mb-4">
                  <span className="font-display text-[#6E6E6A]">What We</span>{" "}
                  Deploy
                </h2>
                <p className="text-[#6E6E6A] text-lg max-w-xl">
                  We don&apos;t sell software licenses. We build the systems
                  architecture, operational tooling, and brand infrastructure
                  that connects your portfolio.
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.15}>
              <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-8 md:p-10">
                <ul className="space-y-4">
                  {industry.solutions.map((solution) => (
                    <li key={solution} className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-1 shrink-0"
                      >
                        <path
                          d="M3 8L7 12L13 4"
                          stroke="#FF8400"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[#9E9E98]">{solution}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Other Industries */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight mb-12">
              <span className="font-display text-[#6E6E6A]">Other</span>{" "}
              Industries
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {industries
              .filter((i) => i.slug !== industry.slug)
              .map((i) => (
                <Link
                  key={i.slug}
                  href={`/industries/${i.slug}`}
                  className="group p-6 rounded-xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all"
                >
                  <span className="text-[#FF8400] text-sm font-light block mb-2">
                    {i.num}
                  </span>
                  <p className="text-white font-medium group-hover:text-[#FF8400] transition-colors mb-2">
                    {i.title}
                  </p>
                  <p className="text-sm text-[#6E6E6A] line-clamp-2">
                    {i.desc}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      {/* FAQs */}
      <FaqSection
        faqs={industryFaqs}
        heading="Questions"
        headingAccent="Industry"
      />

      <CTABanner
        title={`Ready to unify your ${industry.title.toLowerCase()} portfolio?`}
        subtitle="Deploy an execution engine that integrates acquisitions in weeks, not quarters. No contracts, cancel anytime."
        cta="Talk to Us"
        href="/contact"
      />
    </>
  );
}
