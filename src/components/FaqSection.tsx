import AnimateIn from "@/components/AnimateIn";
import FaqAccordionAnimated from "@/components/FaqAccordionAnimated";
import type { FaqItem } from "@/data/faqs";

export default function FaqSection({
  faqs,
  heading = "Questions",
  headingAccent = "Common",
}: {
  faqs: FaqItem[];
  heading?: string;
  headingAccent?: string;
}) {
  return (
    <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
      <div className="w-[90%] mx-auto">
        <AnimateIn>
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-16">
            <span className="font-display text-[#6E6E6A]">
              {headingAccent}
            </span>{" "}
            {heading}
          </h2>
        </AnimateIn>

        <div className="max-w-3xl">
          <FaqAccordionAnimated faqs={faqs} />
        </div>
      </div>
    </section>
  );
}
