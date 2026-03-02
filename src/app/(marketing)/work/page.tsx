import type { Metadata } from "next";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";

export const metadata: Metadata = {
  title: "Work | Deployed Systems & Infrastructure Portfolio",
  description:
    "Explore deployed systems, products, and brand infrastructure. Case studies in agentic execution, systems architecture, and brand design from Barron & Folly.",
  keywords: [
    "deployed systems portfolio",
    "agentic execution case studies",
    "product design portfolio",
    "AI-built infrastructure",
    "digital systems portfolio",
  ],
  alternates: { canonical: "/work" },
};

export default function WorkPage() {
  return (
    <>
      <PageHero
        badge="Selected Work"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="2" y="2" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2" />
            <rect x="9" y="2" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2" />
            <rect x="2" y="9" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2" />
            <rect x="9" y="9" width="5" height="5" rx="1" stroke="#FF8400" strokeWidth="1.2" />
          </svg>
        }
        title="Projects"
        titleAccent="Our"
        subtitle="From AI-powered platforms and scalable systems to premium brand infrastructure — here's what we've deployed."
        breadcrumbs={[{ label: "Work" }]}
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.map((project, i) => (
              <AnimateIn key={project.slug} delay={i * 0.1}>
                <ProjectCard project={project} />
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
