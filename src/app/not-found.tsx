import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 dot-grid opacity-30" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF8400]/5 rounded-full blur-[200px]" />

      <div className="relative z-10 text-center px-6">
        {/* 404 number */}
        <p className="text-[#FF8400] text-sm font-medium uppercase tracking-[0.2em] mb-6">
          Error 404
        </p>

        <h1 className="text-5xl sm:text-7xl md:text-8xl font-light leading-[1.05] tracking-tight mb-6">
          <span className="font-display text-[#6E6E6A]">Page</span> Not Found
        </h1>

        <p className="text-[#6E6E6A] text-lg md:text-xl max-w-md mx-auto mb-12 leading-relaxed">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        {/* Navigation links */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/"
            className="px-8 py-4 bg-[#FF8400] text-[#0A0A08] rounded-full font-medium text-sm hover:bg-[#FFB366] transition-all duration-300"
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            className="px-8 py-4 bg-white/5 border border-[#2A2A26] text-white rounded-full font-medium text-sm hover:bg-white/10 hover:border-[#FF8400]/30 transition-all duration-300"
          >
            Contact Us
          </Link>
        </div>

        {/* Quick links */}
        <div className="mt-16 flex flex-wrap items-center justify-center gap-6 text-sm text-[#6E6E6A]">
          <Link href="/services" className="hover:text-[#FF8400] transition-colors">
            Services
          </Link>
          <span className="text-[#2A2A26]">·</span>
          <Link href="/work" className="hover:text-[#FF8400] transition-colors">
            Work
          </Link>
          <span className="text-[#2A2A26]">·</span>
          <Link href="/pricing" className="hover:text-[#FF8400] transition-colors">
            Pricing
          </Link>
          <span className="text-[#2A2A26]">·</span>
          <Link href="/blog" className="hover:text-[#FF8400] transition-colors">
            Blog
          </Link>
        </div>
      </div>
    </div>
  );
}
