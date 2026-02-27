import type { Metadata } from "next";
import { services } from "@/data/services";
import ServiceCard from "@/components/ServiceCard";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Services | Design, Development & AI Automation",
  description:
    "Full-service product design, mobile app development, web app development, AI automation, branding, and packaging. 48-hour turnarounds, unlimited requests.",
  keywords: [
    "product design services",
    "mobile app development",
    "web app development",
    "AI automation services",
    "brand identity design",
    "packaging design agency",
  ],
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        badge="Our Services"
        title="We Do"
        titleAccent="What"
        subtitle="We craft products, brands, apps, and AI systems from idea to launch — blending strategy, design, and engineering to build things that perform. 48-hour turnarounds on every deliverable."
        breadcrumbs={[{ label: "Services" }]}
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto">
          <div className="rounded-2xl border border-[#2A2A26]/50 overflow-hidden dot-grid">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service, i) => (
                <ServiceCard key={service.slug} service={service} index={i} />
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
