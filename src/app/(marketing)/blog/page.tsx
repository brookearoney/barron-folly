import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { getSortedPosts, getFeaturedPosts, getAllCategories } from "@/lib/blog";
import PageHero from "@/components/PageHero";
import CTABanner from "@/components/CTABanner";
import AnimateIn from "@/components/AnimateIn";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Blog | Insights on Agentic Execution, Systems & AI | Barron & Folly",
  description:
    "Insights on agentic execution, AI-led development, systems architecture, design systems, and building scalable digital infrastructure. From the team at Barron & Folly.",
  keywords: [
    "agentic execution blog",
    "AI agency insights",
    "systems architecture articles",
    "AI-led development",
    "digital infrastructure blog",
    "autonomous execution engine",
    "subscription development agency",
    "design systems articles",
    "AI agents for business",
    "product agency blog",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog | Insights on Agentic Execution, Systems & AI",
    description:
      "Insights on agentic execution, AI-led development, systems architecture, and building scalable digital infrastructure.",
    url: `${SITE_URL}/blog`,
    type: "website",
  },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPage() {
  const sortedPosts = await getSortedPosts();
  const featured = await getFeaturedPosts();
  const categories = await getAllCategories();
  const latestPost = sortedPosts[0];
  const remainingPosts = sortedPosts.slice(1);

  const blogListJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: `${SITE_NAME} Blog`,
    description:
      "Insights on agentic execution, AI-led development, and systems architecture.",
    url: `${SITE_URL}/blog`,
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    blogPost: sortedPosts.map((post) => ({
      "@type": "BlogPosting",
      headline: post.title,
      description: post.excerpt,
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.date,
      author: {
        "@type": "Organization",
        name: SITE_NAME,
      },
    })),
  };

  return (
    <>
      <JsonLd data={blogListJsonLd} />

      <PageHero
        badge="Blog"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 3H14M2 7H10M2 11H12"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        }
        title="& Insights"
        titleAccent="Dispatches"
        subtitle="On agentic execution, systems architecture, AI-led development, and deploying scalable infrastructure for companies that refuse to slow down."
        breadcrumbs={[{ label: "Blog" }]}
      />

      {/* Featured / Latest Post — Large Hero Card */}
      <section className="pb-16 md:pb-24">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <Link
              href={`/blog/${latestPost.slug}`}
              className="group block relative rounded-2xl border border-[#2A2A26]/50 bg-[#141412] overflow-hidden transition-all duration-500 hover:border-[#FF8400]/30"
            >
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#FF8400]/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

              <div className="relative grid grid-cols-1 lg:grid-cols-2">
                {/* Hero Image */}
                <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[400px] overflow-hidden">
                  <Image
                    src={latestPost.heroImage}
                    alt={latestPost.title}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-[#141412]/20 to-transparent lg:bg-gradient-to-r lg:from-transparent lg:via-transparent lg:to-[#141412]" />
                </div>

                {/* Content */}
                <div className="relative p-8 md:p-12 lg:p-16 flex flex-col justify-center">
                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <span className="px-3 py-1 rounded-full bg-[#FF8400]/10 text-[#FF8400] text-xs font-medium uppercase tracking-wider">
                      Latest
                    </span>
                    <span className="px-3 py-1 rounded-full border border-[#2A2A26] text-[#6E6E6A] text-xs uppercase tracking-wider">
                      {latestPost.category}
                    </span>
                    <span className="text-[#2A2A26] text-xs">|</span>
                    <span className="text-[#6E6E6A] text-xs">
                      {formatDate(latestPost.date)}
                    </span>
                  </div>

                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-light leading-[1.1] tracking-tight mb-6 group-hover:text-[#FF8400] transition-colors duration-500">
                    {latestPost.title}
                  </h2>

                  <p className="text-[#6E6E6A] text-lg md:text-xl leading-relaxed max-w-3xl mb-8">
                    {latestPost.excerpt}
                  </p>

                  <div className="flex items-center gap-4">
                    <span className="inline-flex items-center gap-2 text-[#FF8400] font-medium text-sm group-hover:gap-3 transition-all duration-300">
                      Read Article
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M3 8H13M13 8L9 4M13 8L9 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                    <span className="text-[#2A2A26]">|</span>
                    <span className="text-[#6E6E6A] text-sm">
                      {latestPost.readTime}
                    </span>
                  </div>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#FF8400]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            </Link>
          </AnimateIn>
        </div>
      </section>

      {/* Category Filter Tags */}
      <section className="pb-12">
        <div className="w-[90%] mx-auto">
          <div className="flex flex-wrap gap-3">
            <span className="px-4 py-2 rounded-full bg-[#FF8400]/10 text-[#FF8400] text-sm font-medium border border-[#FF8400]/20 cursor-default">
              All Posts
            </span>
            {categories.map((cat) => (
              <span
                key={cat}
                className="px-4 py-2 rounded-full border border-[#2A2A26]/50 text-[#6E6E6A] text-sm hover:border-[#FF8400]/30 hover:text-[#9E9E98] transition-all duration-300 cursor-default"
              >
                {cat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Post Grid */}
      <section className="pb-24 md:pb-32">
        <div className="w-[90%] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {remainingPosts.map((post, index) => (
              <AnimateIn key={post.slug} delay={index * 0.08}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex flex-col h-full rounded-2xl border border-[#2A2A26]/50 bg-[#141412] overflow-hidden transition-all duration-500 hover:border-[#FF8400]/30 hover:translate-y-[-4px]"
                >
                  {/* Hero Image */}
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={post.heroImage}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-transparent to-transparent" />
                    <span className="absolute top-4 right-4 text-[#2A2A26]/60 text-5xl font-light leading-none font-display select-none">
                      {String(index + 2).padStart(2, "0")}
                    </span>
                  </div>

                  <div className="flex flex-col flex-1 p-6 pt-4">
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                      <span className="px-2.5 py-1 rounded-full border border-[#2A2A26] text-[#6E6E6A] text-[11px] uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-[#6E6E6A] text-[11px]">
                        {post.readTime}
                      </span>
                    </div>

                    <h3 className="text-xl md:text-2xl font-light leading-snug tracking-tight mb-3 group-hover:text-[#FF8400] transition-colors duration-500">
                      {post.title}
                    </h3>

                    <p className="text-[#6E6E6A] text-sm leading-relaxed mb-6 flex-1">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-[#2A2A26]/30">
                      <span className="text-[#6E6E6A] text-xs">
                        {formatDate(post.date)}
                      </span>
                      <span className="inline-flex items-center gap-1.5 text-[#FF8400] text-xs font-medium group-hover:gap-2.5 transition-all duration-300">
                        Read
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 16 16"
                          fill="none"
                        >
                          <path
                            d="M3 8H13M13 8L9 4M13 8L9 12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    </div>
                  </div>
                </Link>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Posts Ribbon */}
      {featured.length > 0 && (
        <section className="pb-24 md:pb-32">
          <div className="w-[90%] mx-auto">
            <AnimateIn>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-8 h-px bg-[#FF8400]" />
                <h2 className="text-sm uppercase tracking-widest text-[#6E6E6A]">
                  Featured Reading
                </h2>
              </div>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featured.map((post, index) => (
                <AnimateIn key={post.slug} delay={index * 0.1}>
                  <Link
                    href={`/blog/${post.slug}`}
                    className="group block relative p-6 rounded-2xl border border-[#FF8400]/20 bg-gradient-to-b from-[#FF8400]/5 to-transparent transition-all duration-500 hover:border-[#FF8400]/40 hover:from-[#FF8400]/10"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M8 2L10 6L14 6.5L11 9.5L12 14L8 12L4 14L5 9.5L2 6.5L6 6L8 2Z"
                          stroke="#FF8400"
                          strokeWidth="1.2"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-[#FF8400] text-xs uppercase tracking-wider font-medium">
                        Featured
                      </span>
                    </div>

                    <h3 className="text-lg font-light leading-snug tracking-tight mb-3 group-hover:text-[#FF8400] transition-colors duration-500">
                      {post.title}
                    </h3>

                    <p className="text-[#6E6E6A] text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                  </Link>
                </AnimateIn>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Newsletter / SEO-rich footer section */}
      <section className="pb-24 md:pb-32">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <div className="rounded-2xl border border-[#2A2A26]/30 bg-[#141412] p-8 md:p-12 lg:p-16 relative overflow-hidden">
              <div className="absolute inset-0 hero-dot-grid opacity-20 pointer-events-none" />

              <div className="relative z-10 max-w-2xl">
                <h2 className="text-3xl md:text-4xl font-light leading-[1.1] tracking-tight mb-4">
                  Built for companies that{" "}
                  <span className="font-display text-[#6E6E6A]">
                    ship weekly
                  </span>
                  , not quarterly.
                </h2>
                <p className="text-[#6E6E6A] text-lg leading-relaxed mb-8">
                  We write about the systems, tools, and execution models behind
                  modern digital infrastructure. From{" "}
                  <Link
                    href="/services/agentic-execution"
                    className="text-[#FF8400] hover:underline"
                  >
                    agentic execution
                  </Link>{" "}
                  to{" "}
                  <Link
                    href="/services/systems-architecture"
                    className="text-[#FF8400] hover:underline"
                  >
                    systems architecture
                  </Link>{" "}
                  to{" "}
                  <Link
                    href="/services/brand-experience"
                    className="text-[#FF8400] hover:underline"
                  >
                    brand systems
                  </Link>
                  .
                </p>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-3 px-6 py-3 bg-[#FF8400] text-[#0A0A08] rounded-full font-semibold text-sm hover:bg-[#FFB366] transition-all duration-300"
                >
                  Start a Conversation
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                  >
                    <path
                      d="M3 8H13M13 8L9 4M13 8L9 12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </Link>
              </div>
            </div>
          </AnimateIn>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
