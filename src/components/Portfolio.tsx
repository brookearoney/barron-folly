"use client";

import AnimateIn from "./AnimateIn";
import Image from "next/image";

const projects = [
  {
    title: "Kalon",
    subtitle: "Habit-tracking fitness app with AI coaching",
    tags: ["App Design", "AI Integration"],
    image: "/images/portfolio/kalon.jpg",
    image2: "/images/portfolio/kalon-2.jpg",
  },
  {
    title: "Temple",
    subtitle: "AI-powered fitness and workout platform",
    tags: ["Product Design", "AI Agents"],
    image: "/images/portfolio/temple.jpg",
    image2: "/images/portfolio/temple-2.jpg",
  },
  {
    title: "Tethre",
    subtitle: "Social networking and community platform",
    tags: ["UX/UI Design", "Branding"],
    image: "/images/portfolio/tethre.jpg",
    image2: "/images/portfolio/tethre-2.jpg",
  },
  {
    title: "Crack Spice",
    subtitle: "Premium spice brand — packaging, retail, Amazon",
    tags: ["Packaging", "Brand Identity"],
    image: "/images/portfolio/crack-spice.jpg",
  },
  {
    title: "DYO",
    subtitle: "Beverage brand with full packaging system",
    tags: ["Packaging", "Brand Guide"],
    image: "/images/portfolio/dyo.jpg",
    image2: "/images/portfolio/dyo-2.jpg",
  },
  {
    title: "Mad Bison",
    subtitle: "Premium coffee roaster — cups, menus, signage",
    tags: ["Brand Identity", "Packaging"],
    image: "/images/portfolio/mad-bison.jpg",
    image2: "/images/portfolio/mad-bison-2.jpg",
  },
  {
    title: "Parlay",
    subtitle: "AI-powered sales coaching platform",
    tags: ["Product Design", "AI Integration", "Branding"],
    image: "/images/portfolio/parlay.jpg",
    image2: "/images/portfolio/parlay-2.jpg",
  },
  {
    title: "Dime Beauty",
    subtitle: "Beauty and skincare brand identity",
    tags: ["Branding", "Product Design"],
    image: "/images/portfolio/dime.jpg",
  },
];

export default function Portfolio() {
  return (
    <section id="work" className="py-28 md:py-36">
      <div className="w-[90%] mx-auto">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="2" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2"/>
                <rect x="9" y="2" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2"/>
                <rect x="2" y="9" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2"/>
                <rect x="9" y="9" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2"/>
              </svg>
              Selected Work
            </span>
          </div>
        </AnimateIn>

        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-16">
          <AnimateIn>
            <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight">
              <span className="font-display text-[#6E6E6A]">Our</span>{" "}
              Projects
            </h2>
          </AnimateIn>
        </div>

        {/* Project cards - large format like inspiration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project, i) => (
            <AnimateIn key={project.title} delay={i * 0.1}>
              <div className="group relative rounded-2xl overflow-hidden border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all duration-700">
                {/* Image */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={project.image}
                    alt={project.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-[#141412]/20 to-transparent" />

                  {/* Tags overlay */}
                  <div className="absolute top-4 left-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1.5 text-xs bg-[#0A0A08]/70 backdrop-blur-sm border border-[#2A2A26]/50 rounded-full text-[#9E9E98]"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Info */}
                <div className="p-6 md:p-8">
                  <p className="text-sm text-[#6E6E6A] mb-2">{project.subtitle}</p>
                  <h3 className="text-2xl md:text-3xl font-light group-hover:text-[#FF8400] transition-colors duration-500">
                    {project.title}
                  </h3>
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
