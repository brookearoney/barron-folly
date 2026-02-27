"use client";

import AnimateIn from "./AnimateIn";

const services = [
  {
    num: "/01",
    title: "Product Design",
    desc: "End-to-end UX/UI from wireframes to high-fidelity screens. We build interfaces that convert and experiences users actually love.",
    tags: ["UX Research", "UI Design", "Prototyping", "Design Systems"],
  },
  {
    num: "/02",
    title: "AI Automation",
    desc: "Custom AI agents, prompt engineering, and intelligent automations that eliminate busywork and scale your operations.",
    tags: ["AI Agents", "Prompt Engineering", "Workflow Automation", "Custom Models"],
  },
  {
    num: "/03",
    title: "Brand Identity",
    desc: "Logos, visual systems, and brand strategy that positions you to dominate your market. From concept to launch-ready assets.",
    tags: ["Logo Design", "Brand Strategy", "Visual Identity", "Guidelines"],
  },
  {
    num: "/04",
    title: "Packaging Design",
    desc: "Product packaging that pops off the shelf and sells itself. Dyelines, mockups, and retail-ready artwork.",
    tags: ["Package Design", "Dyelines", "Mockups", "Retail Ready"],
  },
  {
    num: "/05",
    title: "Marketing & Content",
    desc: "Social media graphics, ad creatives, video content, and campaigns that drive real engagement and conversions.",
    tags: ["Social Media", "Ad Creative", "Video", "Campaigns"],
  },
  {
    num: "/06",
    title: "Web Development",
    desc: "High-performance websites and landing pages built to convert. Fast, responsive, and designed to grow with you.",
    tags: ["Next.js", "Webflow", "Landing Pages", "E-Commerce"],
  },
];

export default function Services() {
  return (
    <section id="services" className="py-28 md:py-36">
      <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-20">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6L14 6.5L11 9.5L12 14L8 12L4 14L5 9.5L2 6.5L6 6L8 2Z" stroke="#FF8400" strokeWidth="1.2" strokeLinejoin="round"/>
              </svg>
              Our Services
            </span>
          </div>
        </AnimateIn>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <AnimateIn>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-light tracking-tight">
              <span className="font-display text-[#6E6E6A]">What</span>{" "}
              We Do
            </h2>
          </AnimateIn>
          <AnimateIn delay={0.2}>
            <p className="text-[#6E6E6A] max-w-md text-lg">
              We craft products, brands, and AI systems from idea to launch — blending
              strategy, design, and engineering to build things that perform.
            </p>
          </AnimateIn>
        </div>

        {/* Services grid - matching inspiration's 4-column card layout */}
        <div className="rounded-2xl border border-[#2A2A26]/50 overflow-hidden dot-grid">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service, i) => (
              <AnimateIn key={service.num} delay={i * 0.1}>
                <div className="group p-8 md:p-10 border-b border-r border-[#2A2A26]/30 hover:bg-[#171614]/60 transition-all duration-500 h-full">
                  <div className="mb-8 w-16 h-16 rounded-xl bg-[#171614] border border-[#2A2A26]/50 flex items-center justify-center group-hover:border-[#FF8400]/30 transition-colors">
                    <span className="text-[#FF8400] text-lg font-light">{service.num}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-3 group-hover:text-[#FF8400] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[#6E6E6A] text-sm leading-relaxed mb-6">
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
