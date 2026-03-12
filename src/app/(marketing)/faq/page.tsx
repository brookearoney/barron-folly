import type { Metadata } from "next";
import { faqCategories, allFaqs } from "@/data/faqs";
import { faqPageJsonLd } from "@/lib/metadata";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import FaqCategoryNav from "./FaqCategoryNav";
import FaqCategorySection from "./FaqCategorySection";
import JsonLd from "@/components/JsonLd";

export const metadata: Metadata = {
  title: "FAQ | Frequently Asked Questions",
  description:
    "Everything you need to know about Barron & Folly — how we work, pricing, services, and what makes our agentic execution engine different from traditional agencies.",
  keywords: [
    "barron folly FAQ",
    "agentic execution questions",
    "subscription agency FAQ",
    "AI product agency questions",
    "autonomous execution FAQ",
  ],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "FAQ | Frequently Asked Questions",
    description:
      "Everything you need to know about Barron & Folly — how we work, pricing, services, and what makes our agentic execution engine different.",
  },
};

export default function FaqPage() {
  const totalQuestions = allFaqs.length;

  return (
    <>
      <JsonLd data={faqPageJsonLd(allFaqs)} />

      <PageHero
        badge="FAQ"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle
              cx="8"
              cy="8"
              r="5.5"
              stroke="#FF8400"
              strokeWidth="1.2"
            />
            <path
              d="M6.5 6.5C6.5 5.67 7.17 5 8 5C8.83 5 9.5 5.67 9.5 6.5C9.5 7.17 9.05 7.5 8.5 7.83C8.2 8.01 8 8.28 8 8.62V9"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <circle cx="8" cy="10.75" r="0.75" fill="#FF8400" />
          </svg>
        }
        title="Questions, Answered"
        titleAccent="Your"
        subtitle={`${totalQuestions} answers across ${faqCategories.length} categories. Everything you need to know about how we work, what we deploy, and why it's different.`}
        breadcrumbs={[{ label: "FAQ" }]}
      />

      {/* Category Quick-Nav */}
      <section className="pb-16 md:pb-20">
        <div className="w-[90%] mx-auto">
          <FaqCategoryNav categories={faqCategories} />
        </div>
      </section>

      {/* FAQ Categories */}
      <div className="space-y-0">
        {faqCategories.map((category, i) => (
          <FaqCategorySection
            key={category.slug}
            category={category}
            index={i}
          />
        ))}
      </div>

      <CTABanner
        title="Still have questions?"
        subtitle="Reach out and we'll get back to you within 24 hours. No sales pitch — just answers."
        cta="Get in Touch"
      />
    </>
  );
}
