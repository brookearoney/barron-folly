import AnimateIn from "@/components/AnimateIn";
import FaqAccordionAnimated from "@/components/FaqAccordionAnimated";
import type { FaqCategory } from "@/data/faqs";

export default function FaqCategorySection({
  category,
  index,
}: {
  category: FaqCategory;
  index: number;
}) {
  const isEven = index % 2 === 0;

  return (
    <section
      id={`faq-${category.slug}`}
      className="py-16 md:py-24 border-t border-[#2A2A26]/30 relative scroll-mt-28"
    >
      {/* Alternating subtle glow */}
      {isEven && (
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 -translate-y-1/2 -left-[200px] w-[500px] h-[500px] bg-[#FF8400]/[0.02] rounded-full blur-[150px]" />
        </div>
      )}

      <div className="w-[90%] mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-12 lg:gap-20">
          {/* Category Header — sticky sidebar on desktop */}
          <AnimateIn direction="left">
            <div className="lg:sticky lg:top-32">
              <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FF8400] mb-3 block">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2 className="text-3xl sm:text-4xl font-light leading-[1.15] tracking-tight mb-3 text-white">
                {category.title}
              </h2>
              <p className="text-[#6E6E6A] text-sm leading-relaxed">
                {category.description}
              </p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-[#2A2A26] text-xs">
                  {category.faqs.length} questions
                </span>
              </div>
            </div>
          </AnimateIn>

          {/* FAQs */}
          <div>
            <FaqAccordionAnimated faqs={category.faqs} />
          </div>
        </div>
      </div>
    </section>
  );
}
