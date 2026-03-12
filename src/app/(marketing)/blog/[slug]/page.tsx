import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  getBlogPostBySlug,
  getAllBlogSlugs,
  getRelatedPosts,
  getSortedPosts,
} from "@/lib/blog";
import AnimateIn from "@/components/AnimateIn";
import CTABanner from "@/components/CTABanner";
import JsonLd from "@/components/JsonLd";
import { SITE_URL, SITE_NAME } from "@/lib/constants";
import { breadcrumbJsonLd } from "@/lib/metadata";

export const revalidate = 300;

export async function generateStaticParams() {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.seo.title,
    description: post.seo.description,
    keywords: post.seo.keywords,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.seo.title,
      description: post.seo.description,
      url: `${SITE_URL}/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      authors: [post.author],
      siteName: SITE_NAME,
      images: [
        {
          url: `${SITE_URL}${post.heroImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
    },
  };
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const relatedPosts = await getRelatedPosts(post.relatedSlugs);

  // Find adjacent posts for nav (sorted by date, newest first)
  const sortedPosts = await getSortedPosts();
  const currentIndex = sortedPosts.findIndex((p) => p.slug === slug);
  const prevPost = currentIndex < sortedPosts.length - 1 ? sortedPosts[currentIndex + 1] : null;
  const nextPost = currentIndex > 0 ? sortedPosts[currentIndex - 1] : null;

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    url: `${SITE_URL}/blog/${post.slug}`,
    datePublished: post.date,
    dateModified: post.date,
    author: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/images/brand/logo-full.svg`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/blog/${post.slug}`,
    },
    image: `${SITE_URL}${post.heroImage}`,
    keywords: post.seo.keywords.join(", "),
    articleSection: post.category,
  };

  const breadcrumbs = [
    { name: "Home", href: "/" },
    { name: "Blog", href: "/blog" },
    { name: post.title },
  ];

  return (
    <>
      <JsonLd data={articleJsonLd} />
      <JsonLd data={breadcrumbJsonLd(breadcrumbs)} />

      {/* Article Header */}
      <article>
        <header className="pt-32 md:pt-40 pb-12 md:pb-16 relative">
          <div className="absolute inset-0 hero-dot-grid opacity-20 pointer-events-none" />

          <div className="w-[90%] mx-auto relative z-10">
            {/* Breadcrumbs */}
            <nav
              aria-label="Breadcrumb"
              className="flex items-center gap-2 text-sm text-[#6E6E6A] mb-8"
            >
              <Link
                href="/"
                className="hover:text-[#FF8400] transition-colors"
              >
                Home
              </Link>
              <span className="text-[#2A2A26]">/</span>
              <Link
                href="/blog"
                className="hover:text-[#FF8400] transition-colors"
              >
                Blog
              </Link>
              <span className="text-[#2A2A26]">/</span>
              <span className="text-[#9E9E98] truncate max-w-[200px] md:max-w-none">
                {post.title}
              </span>
            </nav>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full border border-[#FF8400]/30 bg-[#FF8400]/10 text-[#FF8400] text-xs font-medium uppercase tracking-wider">
                {post.category}
              </span>
              <span className="text-[#2A2A26]">|</span>
              <time dateTime={post.date} className="text-[#6E6E6A] text-sm">
                {formatDate(post.date)}
              </time>
              <span className="text-[#2A2A26]">|</span>
              <span className="text-[#6E6E6A] text-sm">{post.readTime}</span>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light leading-[1.1] tracking-tight mb-8 max-w-4xl">
              {post.title}
            </h1>

            {/* Excerpt as lead */}
            <p className="text-[#9E9E98] text-xl md:text-2xl leading-relaxed max-w-3xl font-light">
              {post.excerpt}
            </p>
          </div>
        </header>

        {/* Hero Image */}
        <div className="pb-12 md:pb-16">
          <div className="w-[90%] mx-auto">
            <AnimateIn>
              <div className="relative aspect-[21/9] rounded-2xl overflow-hidden border border-[#2A2A26]/30">
                <Image
                  src={post.heroImage}
                  alt={post.title}
                  fill
                  className="object-cover"
                  sizes="90vw"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A08]/30 to-transparent" />
              </div>
            </AnimateIn>
          </div>
        </div>

        {/* Divider */}
        <div className="w-[90%] mx-auto">
          <div className="h-px bg-gradient-to-r from-[#FF8400]/40 via-[#2A2A26]/50 to-transparent mb-12 md:mb-16" />
        </div>

        {/* Article Body */}
        <div className="pb-16 md:pb-24">
          <div className="w-[90%] mx-auto">
            <div className="max-w-3xl">
              {post.sections.map((section, index) => (
                <AnimateIn key={index} delay={index * 0.05}>
                  <div className="mb-10 md:mb-14">
                    {section.heading && (
                      <h2 className="text-2xl md:text-3xl font-light leading-snug tracking-tight mb-5 text-[#F5F5F0]">
                        {section.heading}
                      </h2>
                    )}
                    <div
                      className="text-[#9E9E98] text-lg leading-[1.8] [&_strong]:text-[#F5F5F0] [&_strong]:font-medium [&_a]:text-[#FF8400] [&_a]:hover:underline [&_a]:transition-colors [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-4 [&_ul]:space-y-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-4 [&_ol]:space-y-2 [&_li]:leading-[1.7] [&_p]:mb-4 [&_p:last-child]:mb-0 [&_h3]:text-[#F5F5F0] [&_h3]:text-xl [&_h3]:font-medium [&_h3]:mt-8 [&_h3]:mb-3 [&_blockquote]:border-l-2 [&_blockquote]:border-[#FF8400]/40 [&_blockquote]:pl-5 [&_blockquote]:my-6 [&_blockquote]:italic [&_code]:bg-[#1A1A18] [&_code]:px-2 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[#FF8400] [&_code]:text-base"
                      dangerouslySetInnerHTML={{ __html: section.content }}
                    />
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>
        </div>

        {/* Tags / Keywords */}
        <div className="pb-12 md:pb-16">
          <div className="w-[90%] mx-auto">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2">
                {post.seo.keywords.slice(0, 5).map((keyword) => (
                  <span
                    key={keyword}
                    className="px-3 py-1.5 rounded-full border border-[#2A2A26]/40 text-[#6E6E6A] text-xs"
                  >
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Post Navigation */}
        <div className="pb-16 md:pb-24">
          <div className="w-[90%] mx-auto">
            <div className="max-w-3xl">
              <div className="h-px bg-[#2A2A26]/30 mb-8" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {prevPost && (
                  <Link
                    href={`/blog/${prevPost.slug}`}
                    className="group flex flex-col p-5 rounded-xl border border-[#2A2A26]/30 hover:border-[#FF8400]/30 transition-all duration-300"
                  >
                    <span className="text-[#6E6E6A] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 16 16"
                        fill="none"
                      >
                        <path
                          d="M13 8H3M3 8L7 4M3 8L7 12"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      Previous
                    </span>
                    <span className="text-sm font-light group-hover:text-[#FF8400] transition-colors line-clamp-2">
                      {prevPost.title}
                    </span>
                  </Link>
                )}
                {nextPost && (
                  <Link
                    href={`/blog/${nextPost.slug}`}
                    className="group flex flex-col items-end text-right p-5 rounded-xl border border-[#2A2A26]/30 hover:border-[#FF8400]/30 transition-all duration-300 md:col-start-2"
                  >
                    <span className="text-[#6E6E6A] text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      Next
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
                    <span className="text-sm font-light group-hover:text-[#FF8400] transition-colors line-clamp-2">
                      {nextPost.title}
                    </span>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="pb-24 md:pb-32">
          <div className="w-[90%] mx-auto">
            <AnimateIn>
              <div className="flex items-center gap-4 mb-10">
                <div className="w-8 h-px bg-[#FF8400]" />
                <h2 className="text-sm uppercase tracking-widest text-[#6E6E6A]">
                  Continue Reading
                </h2>
              </div>
            </AnimateIn>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related, index) => (
                <AnimateIn key={related.slug} delay={index * 0.1}>
                  <Link
                    href={`/blog/${related.slug}`}
                    className="group flex flex-col h-full rounded-2xl border border-[#2A2A26]/50 bg-[#141412] overflow-hidden transition-all duration-500 hover:border-[#FF8400]/30 hover:translate-y-[-4px]"
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <Image
                        src={related.heroImage}
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#141412] via-transparent to-transparent" />
                    </div>

                    <div className="flex flex-col flex-1 p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="px-2.5 py-1 rounded-full border border-[#2A2A26] text-[#6E6E6A] text-[11px] uppercase tracking-wider">
                          {related.category}
                        </span>
                        <span className="text-[#6E6E6A] text-[11px]">
                          {related.readTime}
                        </span>
                      </div>

                      <h3 className="text-lg font-light leading-snug tracking-tight mb-3 group-hover:text-[#FF8400] transition-colors duration-500">
                        {related.title}
                      </h3>

                      <p className="text-[#6E6E6A] text-sm leading-relaxed flex-1 line-clamp-3">
                        {related.excerpt}
                      </p>

                      <div className="flex items-center justify-between pt-4 mt-4 border-t border-[#2A2A26]/30">
                        <span className="text-[#6E6E6A] text-xs">
                          {formatDate(related.date)}
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
      )}

      {/* Explore Services CTA */}
      <section className="pb-16 md:pb-24">
        <div className="w-[90%] mx-auto">
          <AnimateIn>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  title: "Agentic Execution",
                  desc: "AI agents deploy web platforms, automations, dashboards, and internal tools continuously.",
                  href: "/services/agentic-execution",
                },
                {
                  title: "Systems Architecture",
                  desc: "Workflow logic, information architecture, and data visibility layers that actually connect.",
                  href: "/services/systems-architecture",
                },
                {
                  title: "Brand & Experience",
                  desc: "Design systems, UX strategy, and brand architecture for companies that need nuance at scale.",
                  href: "/services/brand-experience",
                },
              ].map((service) => (
                <Link
                  key={service.href}
                  href={service.href}
                  className="group p-5 rounded-xl border border-[#2A2A26]/30 hover:border-[#FF8400]/20 transition-all duration-300"
                >
                  <h3 className="text-sm font-medium mb-2 group-hover:text-[#FF8400] transition-colors">
                    {service.title}
                  </h3>
                  <p className="text-[#6E6E6A] text-xs leading-relaxed">
                    {service.desc}
                  </p>
                </Link>
              ))}
            </div>
          </AnimateIn>
        </div>
      </section>

      <CTABanner />
    </>
  );
}
