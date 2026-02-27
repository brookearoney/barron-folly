import type { Metadata } from "next";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import JsonLd from "@/components/JsonLd";
import { localBusinessJsonLd } from "@/lib/metadata";

export const metadata: Metadata = {
  title: "About | Product Design & AI Automation Agency",
  description:
    "Barron & Folly is a subscription-based product design, app development, and AI automation agency based in American Fork, Utah. No contracts, 48-hour turnarounds.",
  keywords: [
    "design agency Utah",
    "product design agency American Fork",
    "subscription design agency",
    "AI automation agency Utah",
  ],
  alternates: { canonical: "/about" },
};

const stats = [
  { label: "Projects Launched", value: "50+" },
  { label: "Brands Built", value: "20+" },
  { label: "Happy Clients", value: "30+" },
  { label: "Avg Turnaround", value: "48hr" },
];

const values = [
  {
    title: "Speed Over Bureaucracy",
    desc: "48-hour turnarounds aren't a marketing gimmick. It's how we operate. We move fast because your product can't wait.",
  },
  {
    title: "Design With Intent",
    desc: "Every pixel, interaction, and line of code serves a purpose. We don't do decoration — we do design that drives results.",
  },
  {
    title: "AI-First Thinking",
    desc: "We integrate AI into everything we build. Not as a buzzword, but as a force multiplier that makes products smarter and faster.",
  },
  {
    title: "No BS Partnerships",
    desc: "No contracts, no scope creep negotiations, no bloated proposals. Just a team that ships great work, every single day.",
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
        title="Outperform"
        titleAccent="Built to"
        subtitle="Barron & Folly is a product design, app development, and AI automation agency that operates on a subscription model. No bloated contracts. No scope creep. Just a dedicated crew shipping your product every single day."
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
                  Based in American Fork, Utah — we&apos;ve shipped brands, apps,
                  packaging, and AI systems for startups, CPG brands, and tech
                  companies alike.
                </p>
                <p className="text-lg text-[#6E6E6A] leading-relaxed">
                  We design products, build mobile and web apps, and automate with AI.
                  From concept to launch, design to deployment — everything happens
                  under one roof with one team, moving at the speed your business demands.
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
        title="Ready to work with us?"
        subtitle="No contracts. No discovery calls. Just a team that ships great work, fast."
      />
    </>
  );
}
