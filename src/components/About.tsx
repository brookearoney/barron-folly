"use client";

import { useRef, useEffect, useState } from "react";
import AnimateIn from "./AnimateIn";
import Image from "next/image";

function Counter({ target, suffix = "+" }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          observer.unobserve(el);
          let start = 0;
          const duration = 2000;
          const increment = target / (duration / 16);
          const timer = setInterval(() => {
            start += increment;
            if (start >= target) {
              setCount(target);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, 16);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref} className="tabular-nums">
      {count}
      {suffix}
    </span>
  );
}

export default function About() {
  return (
    <section id="about" className="py-28 md:py-36 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#FF8400]/5 rounded-full blur-[200px]" />
      </div>

      <div className="w-[90%] mx-auto">
        <AnimateIn>
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#2A2A26] text-sm text-[#9E9E98]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="8" cy="8" r="3" stroke="#FF8400" strokeWidth="1.2"/>
                <path d="M8 1V3M8 13V15M1 8H3M13 8H15" stroke="#FF8400" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              About Us
            </span>
          </div>
        </AnimateIn>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <AnimateIn>
              <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight mb-8">
                Built to{" "}
                <span className="font-display text-[#FF8400]">
                  Outperform
                </span>
              </h2>
            </AnimateIn>

            <AnimateIn delay={0.1}>
              <p className="text-lg text-[#9E9E98] leading-relaxed mb-6">
                Barron & Folly is a product design and AI automation agency that
                operates on a subscription model. No bloated contracts. No scope
                creep negotiations. Just a dedicated design + AI crew working on
                your product every single day.
              </p>
            </AnimateIn>
            <AnimateIn delay={0.2}>
              <p className="text-lg text-[#6E6E6A] leading-relaxed mb-10">
                Based in American Fork, Utah — we&apos;ve shipped brands, apps, packaging,
                and AI systems for startups, CPG brands, and tech companies alike.
                From Beef Cakes to blockchain, Temple to XETA — we build whatever
                needs building, fast.
              </p>
            </AnimateIn>

            <AnimateIn delay={0.3}>
              <div className="flex items-center gap-4">
                <Image
                  src="/images/brand/brooke.png"
                  alt="Brooke Roney"
                  width={56}
                  height={56}
                  className="rounded-full object-cover w-14 h-14"
                />
                <div>
                  <p className="font-medium text-white">Brooke Roney</p>
                  <p className="text-sm text-[#6E6E6A]">Founder & Creative Director</p>
                </div>
              </div>
            </AnimateIn>
          </div>

          {/* Stats card */}
          <AnimateIn direction="right">
            <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-8 md:p-10 dot-grid">
              <div className="grid grid-cols-1 gap-10">
                {[
                  { label: "Projects Launched", value: 50 },
                  { label: "Brands Built", value: 20 },
                  { label: "Happy Clients", value: 30 },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-[#6E6E6A] uppercase tracking-wider">
                        {stat.label}
                      </span>
                      <div className="flex-1 mx-4 h-px bg-gradient-to-r from-[#2A2A26] to-[#FF8400]/40" />
                    </div>
                    <p className="text-5xl md:text-6xl font-light leading-[1.15] text-[#2A2A26] hover:text-[#FF8400] transition-colors duration-700 cursor-default">
                      <Counter target={stat.value} />
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
