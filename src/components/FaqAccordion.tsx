"use client";

import { useState } from "react";
import type { FaqItem } from "@/data/pricing";

export default function FaqAccordion({ faqs }: { faqs: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {faqs.map((faq, i) => (
        <div
          key={i}
          className="rounded-xl border border-[#2A2A26]/50 bg-[#141412] overflow-hidden"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-[#171614]/60 transition-colors"
          >
            <span className="text-white font-medium pr-4">{faq.question}</span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 16 16"
              fill="none"
              className={`text-[#6E6E6A] shrink-0 transition-transform duration-300 ${
                openIndex === i ? "rotate-180" : ""
              }`}
            >
              <path
                d="M4 6L8 10L12 6"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
          <div
            className={`overflow-hidden transition-all duration-300 ${
              openIndex === i ? "max-h-96" : "max-h-0"
            }`}
          >
            <p className="px-6 pb-6 text-[#6E6E6A] leading-relaxed">
              {faq.answer}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
