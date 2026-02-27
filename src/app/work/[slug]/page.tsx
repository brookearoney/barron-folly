import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  projects,
  getProjectBySlug,
  getAdjacentProjects,
  getAllProjectSlugs,
} from "@/data/projects";
import { getServiceBySlug } from "@/data/services";
import Breadcrumbs from "@/components/Breadcrumbs";
import ProjectNav from "@/components/ProjectNav";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";

export function generateStaticParams() {
  return getAllProjectSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) return { title: "Project Not Found" };

  return {
    title: project.seo.title,
    description: project.seo.description,
    keywords: project.seo.keywords,
    alternates: { canonical: `/work/${project.slug}` },
    openGraph: {
      title: project.seo.title,
      description: project.seo.description,
      images: [{ url: project.image }],
    },
  };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProjectBySlug(slug);
  if (!project) notFound();

  const { prev, next } = getAdjacentProjects(slug);

  const linkedServices = project.servicesUsed
    .map(getServiceBySlug)
    .filter(Boolean);

  return (
    <>
      {/* Hero Image */}
      <section className="pt-24 md:pt-28">
        <div className="w-[90%] mx-auto">
          <Breadcrumbs
            items={[
              { label: "Work", href: "/work" },
              { label: project.title },
            ]}
          />
        </div>

        <div className="w-[90%] mx-auto mt-4">
          <div className="relative w-full aspect-[16/9] md:aspect-[21/9] rounded-2xl overflow-hidden">
            <Image
              src={project.image}
              alt={project.title}
              fill
              priority
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A08] via-[#0A0A08]/30 to-transparent" />

            {/* Title overlay */}
            <div className="absolute bottom-8 left-8 md:bottom-12 md:left-12">
              <div className="flex flex-wrap gap-2 mb-4">
                {project.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1.5 text-xs bg-[#0A0A08]/70 backdrop-blur-sm border border-[#2A2A26]/50 rounded-full text-[#9E9E98]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-7xl font-light leading-[1.1] tracking-tight text-white">
                {project.title}
              </h1>
              <p className="text-lg text-[#9E9E98] mt-3">{project.subtitle}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Project Info Bar */}
      <section className="py-12 border-b border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2">
                Client
              </p>
              <p className="text-white font-medium">{project.client}</p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2">
                Year
              </p>
              <p className="text-white font-medium">{project.year}</p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2">
                Category
              </p>
              <p className="text-white font-medium">{project.category}</p>
            </div>
            <div>
              <p className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2">
                Services
              </p>
              <div className="flex flex-wrap gap-2">
                {linkedServices.map(
                  (s) =>
                    s && (
                      <Link
                        key={s.slug}
                        href={`/services/${s.slug}`}
                        className="text-sm text-[#FF8400] hover:underline"
                      >
                        {s.title}
                      </Link>
                    )
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Overview */}
      <section className="py-20 md:py-28">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <div className="max-w-3xl">
              <h2 className="text-3xl md:text-4xl font-light mb-8">
                <span className="font-display text-[#6E6E6A]">Project</span>{" "}
                Overview
              </h2>
              <p className="text-lg text-[#9E9E98] leading-relaxed">
                {project.description}
              </p>
            </div>
          </AnimateIn>
        </div>
      </section>

      {/* Challenge / Solution / Results */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <AnimateIn>
              <div className="p-8 md:p-10 rounded-2xl border border-[#2A2A26]/50 bg-[#141412] h-full">
                <div className="w-12 h-12 rounded-xl bg-[#171614] border border-[#2A2A26]/50 flex items-center justify-center mb-6">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 2V14M2 8H14"
                      stroke="#FF8400"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">The Challenge</h3>
                <p className="text-[#6E6E6A] leading-relaxed">
                  {project.challenge}
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.15}>
              <div className="p-8 md:p-10 rounded-2xl border border-[#FF8400]/20 bg-[#141412] h-full">
                <div className="w-12 h-12 rounded-xl bg-[#171614] border border-[#FF8400]/30 flex items-center justify-center mb-6">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M2 8C2 8 4 4 8 4C12 4 14 8 14 8C14 8 12 12 8 12C4 12 2 8 2 8Z"
                      stroke="#FF8400"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <circle cx="8" cy="8" r="2" stroke="#FF8400" strokeWidth="1.2" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">The Solution</h3>
                <p className="text-[#9E9E98] leading-relaxed">
                  {project.solution}
                </p>
              </div>
            </AnimateIn>

            <AnimateIn delay={0.3}>
              <div className="p-8 md:p-10 rounded-2xl border border-[#2A2A26]/50 bg-[#141412] h-full">
                <div className="w-12 h-12 rounded-xl bg-[#171614] border border-[#2A2A26]/50 flex items-center justify-center mb-6">
                  <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M3 8L7 12L13 4"
                      stroke="#FF8400"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-4">The Results</h3>
                <p className="text-[#6E6E6A] leading-relaxed">
                  {project.results}
                </p>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Image Gallery */}
      {project.galleryImages.length > 1 && (
        <section className="pb-20 md:pb-28">
          <div className="w-[90%] mx-auto">
            <AnimateIn>
              <h2 className="text-3xl md:text-4xl font-light mb-10">
                <span className="font-display text-[#6E6E6A]">Project</span>{" "}
                Gallery
              </h2>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.galleryImages.map((img, i) => (
                <AnimateIn key={img} delay={i * 0.1}>
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2A2A26]/30">
                    <Image
                      src={img}
                      alt={`${project.title} — Image ${i + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Project Navigation */}
      <ProjectNav prev={prev} next={next} />

      <CTABanner
        title="Want results like this?"
        subtitle="Subscribe and start getting deliverables within 48 hours. No contracts, cancel anytime."
      />
    </>
  );
}
