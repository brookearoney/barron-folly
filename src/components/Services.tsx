"use client";

import AnimateIn from "./AnimateIn";

const services = [
  {
    num: "/01",
    title: "Agentic Execution",
    desc: "Autonomous AI agents deploy web platforms, applications, automations, internal tools, dashboards, integrations, and reporting infrastructure. Code-heavy tasks are no longer the bottleneck.",
    tags: ["Web Platforms", "Applications", "CRM Systems", "Automations", "Dashboards", "Technical SEO"],
  },
  {
    num: "/02",
    title: "Systems Architecture",
    desc: "We don\u2019t just build pages. We design workflow logic, information architecture, scalable frameworks, internal operational tooling, and data visibility layers. Infrastructure before aesthetics.",
    tags: ["Workflow Logic", "Information Architecture", "Scalable Frameworks", "Data Visibility"],
  },
  {
    num: "/03",
    title: "Brand & Experience",
    desc: "When speed is handled, we refine precision. Identity systems, design systems, UX strategy, multi-product cohesion, and portfolio brand consolidation for companies that need nuance at scale.",
    tags: ["Identity Systems", "Design Systems", "UX Strategy", "Brand Consolidation"],
  },
];

export default function Services() {
  return (
    <section id="services" className="py-28 md:py-36">
      <div className="w-[90%] mx-auto">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 12L4 14L5 9.5L2 6.5L6 6L8 2Z" stroke="#FF8400" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              What We Deploy
            </span>
          </div>
        </AnimateIn>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <AnimateIn>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight">
              <span className="font-display text-[#6E6E6A]">Deploy</span>{" "}
              an Execution Engine
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <p className="text-[#6E6E6A] max-w-md text-lg">
              You don&apos;t need more vendors. You need infrastructure. Three pillars
              that replace fragmented teams with scalable systems.
            </p>
          </AnimateIn>
        </div>

        {/* Services grid - matching inspiration's 4-column card layout */}
        <div className="rounded-2xl border border-[#2A2A26]/50 overflow-hidden dot-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <AnimateIn key={service.num} delay={i * 0.1}>
                <div className="group p-8 md:p-10 border-b border-r border-[#2A2A26]/30 hover:bg-[#171614]/60 transition-all duration-500 h-full">
                  <div className="mb-6 w-14 h-14 rounded-xl bg-[#171614] border border-[#2A2A26]/50 flex items-center justify-center group-hover:border-[#FF8400]/30 transition-colors">
                    <span className="text-[#FF8400] text-base font-light">{service.num}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 leading-snug group-hover:text-[#FF8400] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[#6E6E6A] text-sm leading-relaxed mb-5">
                    {service.desc}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {service.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 text-xs text-[#6E6E6A] border border-[#2A2A26]/50 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
