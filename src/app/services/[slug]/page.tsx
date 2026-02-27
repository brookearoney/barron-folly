import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { services, getServiceBySlug, getAllServiceSlugs } from "@/data/services";
import { getProjectBySlug } from "@/data/projects";
import Breadcrumbs from "@/components/Breadcrumbs";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import JsonLd from "@/components/JsonLd";
import { serviceJsonLd } from "@/lib/metadata";

export function generateStaticParams() {
  return getAllServiceSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) return { title: "Service Not Found" };

  return {
    title: service.seo.title,
    description: service.seo.description,
    keywords: service.seo.keywords,
    alternates: { canonical: `/services/${service.slug}` },
    openGraph: {
      title: service.seo.title,
      description: service.seo.description,
    },
  };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const service = getServiceBySlug(slug);
  if (!service) notFound();

  const relatedProjects = service.relatedProjects
    .map(getProjectBySlug)
    .filter(Boolean);

  return (
    <>
      <JsonLd data={serviceJsonLd({ title: service.title, description: service.longDesc })} />

      <section className="pt-32 md:pt-40 pb-16 md:pb-20 relative">
        <div className="absolute inset-0 hero-dot-grid opacity-20 pointer-events-none" />

        {/* Large number watermark */}
        <div className="absolute top-24 right-[5%] text-[20rem] font-light text-[#171614] leading-none select-none pointer-events-none hidden lg:block">
          {service.num}
        </div>

        <div className="w-[90%] mx-auto relative z-10">
          <Breadcrumbs
            items={[
              { label: "Services", href: "/services" },
              { label: service.title },
            ]}
          />

          <div className="flex flex-wrap gap-2 mb-6">
            {service.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 text-xs text-[#FF8400] border border-[#FF8400]/30 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light leading-[1.1] tracking-tight mb-8">
            {service.title}
          </h1>

          <p className="text-[#9E9E98] max-w-3xl text-lg md:text-xl leading-relaxed">
            {service.longDesc}
          </p>
        </div>
      </section>

      {/* Features + Deliverables */}
      <section className="pb-20 md:pb-28">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Features */}
            <AnimateIn>
              <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-8 md:p-10">
                <h2 className="text-2xl font-semibold mb-8">What We Do</h2>
                <ul className="space-y-4">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-1 shrink-0"
                      >
                        <path
                          d="M3 8L7 12L13 4"
                          stroke="#FF8400"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[#9E9E98]">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </AnimateIn>

            {/* Deliverables */}
            <AnimateIn delay={0.15}>
              <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-8 md:p-10">
                <h2 className="text-2xl font-semibold mb-8">What You Get</h2>
                <ul className="space-y-4">
                  {service.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-3">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        className="mt-1 shrink-0"
                      >
                        <rect
                          x="3"
                          y="3"
                          width="10"
                          height="10"
                          rx="2"
                          stroke="#FF8400"
                          strokeWidth="1.2"
                        />
                      </svg>
                      <span className="text-[#9E9E98]">{d}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-8 p-4 rounded-xl bg-[#0A0A08] border border-[#2A2A26]/30">
                  <p className="text-sm text-[#6E6E6A]">
                    <span className="text-[#FF8400] font-medium">Turnaround:</span>{" "}
                    {service.turnaround}
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
        </div>
      </section>

      {/* Related Projects */}
      {relatedProjects.length > 0 && (
        <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
          <div className="w-[90%] mx-auto">
            <AnimateIn>
              <h2 className="text-4xl sm:text-5xl font-light leading-[1.1] tracking-tight mb-12">
                <span className="font-display text-[#6E6E6A]">Related</span>{" "}
                Projects
              </h2>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedProjects.map(
                (project) =>
                  project && (
                    <AnimateIn key={project.slug}>
                      <Link
                        href={`/work/${project.slug}`}
                        className="group block rounded-2xl overflow-hidden border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all"
                      >
                        <div className="relative aspect-[4/3] overflow-hidden">
                          <Image
                            src={project.image}
                            alt={project.title}
                            fill
                            className="object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-[#141412] to-transparent" />
                        </div>
                        <div className="p-6">
                          <p className="text-sm text-[#6E6E6A] mb-1">
                            {project.subtitle}
                          </p>
                          <p className="text-xl font-light group-hover:text-[#FF8400] transition-colors">
                            {project.title}
                          </p>
                        </div>
                      </Link>
                    </AnimateIn>
                  )
              )}
            </div>
          </div>
        </section>
      )}

      {/* Other Services */}
      <section className="py-20 md:py-28 border-t border-[#2A2A26]/30">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <h2 className="text-4xl sm:text-5xl font-light leading-[1.1] tracking-tight mb-12">
              <span className="font-display text-[#6E6E6A]">Other</span>{" "}
              Services
            </h2>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {services
              .filter((s) => s.slug !== service.slug)
              .slice(0, 4)
              .map((s) => (
                <Link
                  key={s.slug}
                  href={`/services/${s.slug}`}
                  className="group p-6 rounded-xl border border-[#2A2A26]/30 bg-[#141412] hover:border-[#FF8400]/20 transition-all"
                >
                  <span className="text-[#FF8400] text-sm font-light block mb-2">
                    {s.num}
                  </span>
                  <p className="text-white font-medium group-hover:text-[#FF8400] transition-colors">
                    {s.title}
                  </p>
                </Link>
              ))}
          </div>
        </div>
      </section>

      <CTABanner
        title={`Need ${service.title.toLowerCase()}?`}
        subtitle="Subscribe and start getting deliverables within 48 hours. No contracts, cancel anytime."
      />
    </>
  );
}
