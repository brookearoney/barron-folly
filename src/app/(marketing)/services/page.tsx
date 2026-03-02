import type { Metadata } from "next";
import { services } from "@/data/services";
import ServiceCard from "@/components/ServiceCard";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";

export const metadata: Metadata = {
  title: "Services | Software, Systems & Brand Infrastructure",
  description:
    "Three deployment pillars: Agentic Execution, Systems Architecture, and Brand & Experience. AI agents deploy software, systems, and brand infrastructure on demand.",
  keywords: [
    "agentic execution",
    "systems architecture",
    "brand infrastructure",
    "AI-led product development",
    "autonomous execution engine",
    "digital infrastructure deployment",
  ],
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <PageHero
        badge="What We Deploy"
        title="an Execution Engine"
        titleAccent="Deploy"
        subtitle="You don't need more people. You need coordinated execution. Three pillars — Agentic Execution, Systems Architecture, and Brand & Experience — deployed as a single, continuous operation."
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

      <CTABanner
        title="What would shipping weekly feel like?"
        subtitle="Subscribe to an execution engine that deploys software, systems, and brand infrastructure — continuously. No contracts."
        cta="Deploy Your Infrastructure"
      />
    </>
  );
}
