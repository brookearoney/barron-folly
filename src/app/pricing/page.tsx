import type { Metadata } from "next";
import { tiers, perks, faqs } from "@/data/pricing";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import FaqAccordion from "@/components/FaqAccordion";

export const metadata: Metadata = {
  title: "Pricing | From Execution to Command",
  description:
    "Subscription tiers from $500/mo to $10,000/mo. Lower tiers are AI-dominant execution, upper tiers add human nuance and architecture. No contracts. Cancel anytime.",
  keywords: [
    "agentic execution pricing",
    "subscription execution engine",
    "AI-led product development pricing",
    "autonomous execution subscription",
    "digital infrastructure pricing",
  ],
  alternates: { canonical: "/pricing" },
};

export default function PricingPage() {
  return (
    <>
      <PageHero
        badge="Pricing"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1V15M12 4H6C4.895 4 4 4.895 4 6C4 7.105 4.895 8 6 8H10C11.105 8 12 8.895 12 10C12 11.105 11.105 12 10 12H4"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        }
        title="Your Tier"
        titleAccent="Pick"
        subtitle="From execution to command — deploy the layer your business requires. Lower tiers are AI-dominant execution. Upper tiers add human nuance, architecture, and strategic oversight. No contracts. Cancel anytime."
        breadcrumbs={[{ label: "Pricing" }]}
      />

      {/* Pricing Cards */}
      <section className="pb-20 md:pb-28 relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF8400]/5 rounded-full blur-[200px]" />
        </div>

        <div className="w-[90%] mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier, i) => (
              <AnimateIn key={tier.name} delay={i * 0.15}>
                <div
                  className={`relative rounded-2xl border p-8 md:p-10 h-full flex flex-col transition-all duration-500 hover:translate-y-[-4px] ${
                    tier.popular
                      ? "border-[#FF8400]/40 bg-[#141412] glow-orange"
                      : "border-[#2A2A26]/50 bg-[#141412] hover:border-[#2A2A26]"
                  }`}
                >
                  {tier.popular && (
                    <span className="absolute -top-3 left-8 px-4 py-1 bg-[#FF8400] text-[#0A0A08] text-xs font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}

                  <h3 className="text-lg font-semibold text-[#9E9E98] mb-3 uppercase tracking-wider">
                    {tier.name}
                  </h3>

                  <div className="flex items-baseline gap-1 mb-5">
                    <span className="text-5xl font-light leading-[1.15] text-white">
                      {tier.price}
                    </span>
                    <span className="text-[#6E6E6A]">/month</span>
                  </div>

                  <p className="text-[#6E6E6A] text-sm leading-relaxed mb-7">
                    {tier.desc}
                  </p>

                  <div className="h-px bg-[#2A2A26]/50 mb-7" />

                  <ul className="flex-1 space-y-3.5 mb-10">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <svg
                          width="16"
                          height="16"
                          viewBox="0 0 16 16"
                          fill="none"
                          className="mt-0.5 flex-shrink-0"
                        >
                          <path
                            d="M3 8L7 12L13 4"
                            stroke={tier.popular ? "#FF8400" : "#6E6E6A"}
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                        <span
                          className={
                            tier.popular ? "text-[#F5F5F0]" : "text-[#9E9E98]"
                          }
                        >
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <a
                    href={tier.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`block text-center py-4 rounded-full font-medium text-sm transition-all duration-300 ${
                      tier.popular
                        ? "bg-[#FF8400] text-[#0A0A08] hover:bg-[#FFB366]"
                        : "bg-white/5 border border-[#2A2A26] text-white hover:bg-white/10 hover:border-[#FF8400]/30"
                    }`}
                  >
                    {tier.cta}
                  </a>
                </div>
              </AnimateIn>
            ))}
          </div>

          {/* Perks */}
          <AnimateIn>
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
              {perks.map((perk) => (
                <div
                  key={perk.label}
                  className="text-center py-6 px-4 rounded-xl border border-[#2A2A26]/30 bg-[#141412]/50"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="mx-auto mb-3"
                  >
                    <path
                      d={perk.icon}
                      stroke="#FF8400"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <p className="text-sm text-[#9E9E98]">{perk.label}</p>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-16">
              <span className="font-display text-[#6E6E6A]">Common</span>{" "}
              Questions
            </h2>
          </AnimateIn>

          <div className="max-w-3xl">
            <FaqAccordion faqs={faqs} />
          </div>
        </div>
      </section>

      <CTABanner
        title="Still waiting months for development?"
        subtitle="Subscribe to an execution engine that deploys software, systems, and brand infrastructure — continuously. No contracts."
        cta="Deploy Your Infrastructure"
      />
    </>
  );
}
