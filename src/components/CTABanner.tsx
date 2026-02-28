import Link from "next/link";

export default function CTABanner({
  title = "Your backlog isn\u2019t a strategy.",
  subtitle = "Subscribe to an execution engine that ships software, systems, and brand infrastructure — continuously.",
  cta = "Deploy Your Infrastructure",
  href = "/contact",
}: {
  title?: string;
  subtitle?: string;
  cta?: string;
  href?: string;
}) {
  return (
    <section className="py-24 md:py-32 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF8400]/5 rounded-full blur-[200px]" />
      </div>

      <div className="w-[90%] mx-auto text-center relative z-10">
        <h2 className="text-4xl sm:text-5xl md:text-6xl font-light leading-[1.1] tracking-tight mb-6">
          {title}
        </h2>
        <p className="text-[#6E6E6A] text-lg max-w-xl mx-auto mb-10">
          {subtitle}
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-3 px-8 py-4 bg-[#FF8400] text-[#0A0A08] rounded-full font-semibold hover:bg-[#FFB366] transition-all duration-300"
        >
          {cta}
          <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
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
    </section>
  );
}
