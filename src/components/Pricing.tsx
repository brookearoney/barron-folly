"use client";

import AnimateIn from "./AnimateIn";

const tiers = [
  {
    name: "Steel",
    price: "$2,500",
    desc: "Lean teams and early-stage products that need core design & AI muscle without the fluff.",
    features: [
      "Product Discovery & Research",
      "Unlimited UX/UI Design",
      "Flow Mapping & User Journeys",
      "Rapid Prototyping",
      "Basic AI Agent Setup",
      "Dedicated Slack Channel",
      "48-Hour Turnarounds",
    ],
    cta: "Get Started",
    popular: false,
  },
  {
    name: "Titanium",
    price: "$5,000",
    desc: "Growing products that need priority treatment, strategic depth, and advanced AI chops.",
    features: [
      "Everything in Steel, plus:",
      "Advanced Brand & Market Strategy",
      "AI Architecture & Prompt Engineering",
      "Weekly Strategy Huddle",
      "AI-Powered User Testing",
      "Priority Request Handling",
      "Go-to-Market Gameplans",
    ],
    cta: "Get Started",
    popular: true,
  },
  {
    name: "Tungsten",
    price: "$7,500",
    desc: "High-stakes products that demand the ultimate design + AI arsenal and zero downtime.",
    features: [
      "Everything in Titanium, plus:",
      "End-to-End Branding & Packaging",
      "Custom AI Model Development",
      "In-Depth User Testing & Analytics",
      "On-Demand Design & AI Emergencies",
      "Midnight Tweaks & Crisis Pivots",
      "Dedicated Creative Director",
    ],
    cta: "Get Started",
    popular: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="py-28 md:py-36 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#FF8400]/5 rounded-full blur-[200px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-20">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 1V15M12 4H6C4.895 4 4 4.895 4 6C4 7.105 4.895 8 6 8H10C11.105 8 12 8.895 12 10C12 11.105 11.105 12 10 12H4" stroke="#FF8400" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Pricing
            </span>
          </div>
        </AnimateIn>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <AnimateIn>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight">
              <span className="font-display text-[#6E6E6A]">Pick</span>{" "}
              Your Tier
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <p className="text-[#6E6E6A] max-w-md text-lg">
              No contracts. Cancel anytime. Most requests done within 48 hours.
              Unlimited design requests on every plan.
            </p>
          </AnimateIn>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  <span className="text-5xl font-light leading-[1.15] text-white">{tier.price}</span>
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
                      <span className={tier.popular ? "text-[#F5F5F0]" : "text-[#9E9E98]"}>
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <a
                  href="#contact"
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

        {/* Common perks */}
        <AnimateIn>
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { icon: "M3 8H13", label: "No Contracts" },
              { icon: "M8 2V14M2 8H14", label: "Unlimited Requests" },
              { icon: "M12 6L8 10L4 6", label: "48hr Turnaround" },
              { icon: "M2 4H14V12H2V4Z", label: "Dedicated Slack" },
            ].map((perk) => (
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
  );
}
