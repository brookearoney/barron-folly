"use client";

import AnimateIn from "./AnimateIn";

const steps = [
  {
    num: "01",
    title: "Subscribe",
    desc: "Pick your tier — Copper, Steel, Titanium, or Tungsten. No contracts, cancel anytime. You're deployed within 48 hours.",
  },
  {
    num: "02",
    title: "Deploy",
    desc: "AI agents spin up immediately on your task queue. We prioritize, execute, and ship — asynchronously and continuously.",
  },
  {
    num: "03",
    title: "Ship",
    desc: "Most deliverables land within days, not months. Complex builds are broken into sprint cycles with weekly shipping cadence.",
  },
  {
    num: "04",
    title: "Scale",
    desc: "As your business grows, your execution engine grows with it. Move up tiers to unlock architecture, brand strategy, and command-level oversight.",
  },
];

export default function Process() {
  return (
    <section className="py-28 md:py-36">
      <div className="w-[90%] mx-auto">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M2 8C2 8 4 4 8 4C12 4 14 8 14 8C14 8 12 12 8 12C4 12 2 8 2 8Z" stroke="#FF8400" strokeWidth="1.2" strokeLinejoin="round"/>
                <circle cx="8" cy="8" r="2" stroke="#FF8400" strokeWidth="1.2"/>
              </svg>
              How It Works
            </span>
          </div>
        </AnimateIn>

        <AnimateIn>
          <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight mb-6">
            <span className="font-display text-[#6E6E6A]">How</span>{" "}
            It Works
          </h2>
        </AnimateIn>

        <AnimateIn delay={0.1}>
          <p className="text-[#6E6E6A] max-w-2xl text-lg mb-16">
            Subscribe to an execution engine. Deploy AI agents instantly. Ship weekly. Standardize continuously. Build. Standardize. Scale. On demand.
          </p>
        </AnimateIn>

        {/* Process steps - horizontal on desktop */}
        <div className="rounded-2xl border border-[#2A2A26]/50 overflow-hidden dot-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((step, i) => (
              <AnimateIn key={step.num} delay={i * 0.15}>
                <div className="group p-8 md:p-10 border-b lg:border-b-0 border-r border-[#2A2A26]/30 hover:bg-[#171614]/60 transition-all duration-500 h-full relative">
                  {/* Connecting line */}
                  {i < steps.length - 1 && (
                    <div className="hidden lg:block absolute top-14 right-0 w-0 h-0 border-t-[6px] border-t-transparent border-b-[6px] border-b-transparent border-l-[8px] border-l-[#FF8400]/30 translate-x-1" />
                  )}
                  <span className="text-4xl font-light leading-[1.2] text-[#2A2A26] group-hover:text-[#FF8400]/30 transition-colors duration-500 block mb-5">
                    {step.num}
                  </span>
                  <h3 className="text-xl font-semibold mb-3 leading-snug group-hover:text-[#FF8400] transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-[#6E6E6A] text-sm leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
