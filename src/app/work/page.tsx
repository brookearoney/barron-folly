import type { Metadata } from "next";
import { projects } from "@/data/projects";
import ProjectCard from "@/components/ProjectCard";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";

export const metadata: Metadata = {
  title: "Work | Design & Development Portfolio",
  description:
    "Explore our portfolio of product design, mobile app development, web app development, branding, and packaging projects. Case studies from Barron & Folly.",
  keywords: [
    "design portfolio",
    "app design case studies",
    "product design portfolio",
    "branding portfolio",
    "mobile app development portfolio",
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
        subtitle="From fitness apps and fintech platforms to premium packaging and brand identities — here's what we've shipped."
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
