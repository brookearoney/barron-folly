"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import type { FaqItem } from "@/data/faqs";

function AccordionItem({
  faq,
  index,
  isOpen,
  onToggle,
  delay,
}: {
  faq: FaqItem;
  index: number;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const itemRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  useEffect(() => {
    const el = itemRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1, rootMargin: "-20px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const num = String(index + 1).padStart(2, "0");

  return (
    <div
      ref={itemRef}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.6s ease ${delay}s, transform 0.6s ease ${delay}s`,
      }}
    >
      <div
        className={`group relative rounded-2xl border overflow-hidden transition-all duration-500 ${
          isOpen
            ? "border-[#FF8400]/30 bg-[#171614] shadow-[0_0_40px_rgba(255,132,0,0.06)]"
            : "border-[#2A2A26]/40 bg-[#141412] hover:border-[#2A2A26]/70"
        }`}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 h-[2px] bg-gradient-to-r from-[#FF8400] to-[#FF8400]/0 transition-all duration-500"
          style={{ width: isOpen ? "100%" : "0%" }}
        />

        <button
          onClick={onToggle}
          className="w-full flex items-center gap-5 p-6 md:p-7 text-left cursor-pointer"
        >
          {/* Number */}
          <span
            className={`text-sm font-medium tabular-nums tracking-wider transition-colors duration-300 ${
              isOpen ? "text-[#FF8400]" : "text-[#2A2A26]"
            }`}
          >
            {num}
          </span>

          {/* Question */}
          <span
            className={`flex-1 font-medium text-base md:text-lg transition-colors duration-300 ${
              isOpen
                ? "text-white"
                : "text-[#9E9E98] group-hover:text-white"
            }`}
          >
            {faq.question}
          </span>

          {/* Plus/Minus icon */}
          <div className="relative w-8 h-8 flex items-center justify-center shrink-0">
            <span
              className={`absolute w-4 h-[1.5px] rounded-full transition-all duration-300 ${
                isOpen ? "bg-[#FF8400] rotate-0" : "bg-[#6E6E6A]"
              }`}
            />
            <span
              className={`absolute w-4 h-[1.5px] rounded-full transition-all duration-300 ${
                isOpen
                  ? "bg-[#FF8400] rotate-0 opacity-0"
                  : "bg-[#6E6E6A] rotate-90"
              }`}
            />
          </div>
        </button>

        {/* Answer */}
        <div
          className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ height }}
        >
          <div ref={contentRef} className="px-6 md:px-7 pb-7">
            <div className="pl-[calc(0.875rem+1.25rem+0.375rem)]">
              <p className="text-[#9E9E98] leading-relaxed text-[15px]">
                {faq.answer}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FaqAccordionAnimated({
  faqs,
  staggerDelay = 0.08,
}: {
  faqs: FaqItem[];
  staggerDelay?: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback(
    (i: number) => setOpenIndex((prev) => (prev === i ? null : i)),
    []
  );

  return (
    <div className="space-y-3">
      {faqs.map((faq, i) => (
        <AccordionItem
          key={i}
          faq={faq}
          index={i}
          isOpen={openIndex === i}
          onToggle={() => toggle(i)}
          delay={i * staggerDelay}
        />
      ))}
    </div>
  );
}
