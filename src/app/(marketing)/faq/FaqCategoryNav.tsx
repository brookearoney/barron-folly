"use client";

import { useEffect, useRef, useState } from "react";
import type { FaqCategory } from "@/data/faqs";

export default function FaqCategoryNav({
  categories,
}: {
  categories: FaqCategory[];
}) {
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ids = categories.map((c) => c.slug);
    const observers: IntersectionObserver[] = [];

    ids.forEach((slug) => {
      const el = document.getElementById(`faq-${slug}`);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSlug(slug);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  const scrollTo = (slug: string) => {
    const el = document.getElementById(`faq-${slug}`);
    if (el) {
      const offset = 120;
      const top = el.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: "smooth" });
    }
  };

  return (
    <div
      ref={navRef}
      className="flex flex-wrap gap-3"
    >
      {categories.map((cat) => {
        const isActive = activeSlug === cat.slug;
        return (
          <button
            key={cat.slug}
            onClick={() => scrollTo(cat.slug)}
            className={`relative px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer ${
              isActive
                ? "bg-[#FF8400] text-[#0A0A08]"
                : "bg-[#141412] border border-[#2A2A26]/50 text-[#6E6E6A] hover:text-white hover:border-[#2A2A26]"
            }`}
          >
            {cat.title}
            <span
              className={`ml-2 text-xs transition-colors duration-300 ${
                isActive
                  ? "text-[#0A0A08]/60"
                  : "text-[#2A2A26]"
              }`}
            >
              {cat.faqs.length}
            </span>
          </button>
        );
      })}
    </div>
  );
}
