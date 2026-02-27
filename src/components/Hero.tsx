"use client";

import Image from "next/image";

const logos = [
  "BooHoo", "DYO", "Dime", "Hyper", "Mad-Bison", "Mvmt", "Norris",
  "Nu-Skin", "Parlay", "Seven-Brothers", "WeWork", "Hektic", "Dentive",
  "DoucheBags", "Nerd",
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col overflow-hidden">
      {/* ── Animated background effects ── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating gradient orbs */}
        <div className="absolute -top-32 left-[15%] w-[600px] h-[600px] bg-[#FF8400]/[0.07] rounded-full blur-[150px] animate-float-1" />
        <div className="absolute top-[20%] -right-32 w-[500px] h-[500px] bg-[#FF8400]/[0.05] rounded-full blur-[130px] animate-float-2" />
        <div className="absolute bottom-[10%] left-[40%] w-[700px] h-[350px] bg-[#FF8400]/[0.04] rounded-full blur-[160px] animate-float-3" />

        {/* Top edge warm glow line */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#FF8400]/30 to-transparent" />

        {/* Subtle dot grid overlay */}
        <div className="absolute inset-0 hero-dot-grid opacity-40" />

        {/* Animated wave / smoke shapes */}
        <svg
          className="absolute top-[15%] left-0 w-[200%] h-[200px] opacity-[0.03] animate-wave"
          viewBox="0 0 2400 200"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 100C200 60 400 140 600 100C800 60 1000 140 1200 100C1400 60 1600 140 1800 100C2000 60 2200 140 2400 100V200H0Z"
            fill="white"
          />
        </svg>
        <svg
          className="absolute top-[25%] left-0 w-[200%] h-[160px] opacity-[0.02] animate-wave"
          style={{ animationDuration: "35s", animationDirection: "reverse" }}
          viewBox="0 0 2400 160"
          fill="none"
          preserveAspectRatio="none"
        >
          <path
            d="M0 80C300 40 500 120 800 80C1100 40 1300 120 1600 80C1900 40 2100 120 2400 80V160H0Z"
            fill="white"
          />
        </svg>
      </div>

      {/* ── Hero image — absolutely positioned as background centerpiece ── */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        {/* Animated glow behind image */}
        <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 w-[60%] h-[50%] bg-[#FF8400]/[0.06] rounded-full blur-[100px] animate-pulse-glow" />

        <div className="relative w-[65%] max-w-[950px] aspect-[16/9] mb-[12%] rounded-2xl overflow-hidden border border-[#2A2A26]/20">
          <Image
            src="/images/portfolio/bf-hero-1.jpg"
            alt="Barron & Folly — Design & Automation"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlays — heavy fading into background on all edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A08] via-[#0A0A08]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0A0A08]/60 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-l from-[#0A0A08]/50 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A0A08]/50 via-transparent to-transparent" />
        </div>
      </div>

      {/* ── Content layer (on top of image) ── */}
      <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-20 w-full pt-28 md:pt-36 relative z-10 flex-1 flex flex-col">
        {/* Top row: Headline left, Description right */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Left: Big headline */}
          <div className="animate-fade-up">
            <h1 className="text-[3.5rem] sm:text-7xl md:text-8xl lg:text-[8.5rem] font-light leading-[1.05] tracking-tight">
              Design,
              <br />
              <span className="font-display text-[#FF8400]">Automate</span>
            </h1>
          </div>

          {/* Right: Description + CTA */}
          <div className="lg:pt-8 xl:pt-12 animate-fade-up-delay">
            <p className="text-base md:text-lg leading-relaxed max-w-md">
              <span className="text-white">
                We build brands, products, and AI systems
              </span>{" "}
              <span className="text-[#6E6E6A]">
                that move fast and hit hard. Subscription-based design and
                automation with zero contracts and 48-hour turnarounds.
              </span>
            </p>

            <div className="mt-6 h-px bg-[#2A2A26]" />

            <div className="mt-5 flex items-center justify-between">
              <a
                href="#contact"
                className="inline-flex items-center gap-3 text-white font-medium hover:text-[#FF8400] transition-colors group"
              >
                Contact Us
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 16 16"
                  fill="none"
                  className="transition-transform group-hover:translate-x-1"
                >
                  <path
                    d="M3 8H13M13 8L9 4M13 8L9 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>

              <div className="flex items-center gap-3">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Spacer — pushes bottom row to bottom of viewport */}
        <div className="flex-1" />

        {/* Bottom row: We do / Scroll indicator / Featured */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 pb-6 animate-fade-up-delay-3">
          {/* Left: We do + services */}
          <div>
            <span className="text-sm text-white uppercase tracking-widest">
              We do
            </span>
            <div className="mt-3 w-8 h-px bg-[#2A2A26]" />
            <div className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#6E6E6A]">
              <a href="#services" className="hover:text-[#9E9E98] transition-colors">
                Product Design
              </a>
              <span className="text-[#FF8400]">/</span>
              <a href="#services" className="hover:text-[#9E9E98] transition-colors">
                AI Automation
              </a>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-[#6E6E6A]">
              <a href="#services" className="hover:text-[#9E9E98] transition-colors">
                Branding
              </a>
              <span className="text-[#FF8400]">/</span>
              <a href="#services" className="hover:text-[#9E9E98] transition-colors">
                UX/UI
              </a>
            </div>
          </div>

          {/* Center: Scroll indicator */}
          <div className="hidden lg:flex justify-center items-end">
            <div className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center animate-bounce-slow">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                className="text-[#6E6E6A]"
              >
                <path
                  d="M8 3V13M8 13L4 9M8 13L12 9"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>

          {/* Right: Featured work preview */}
          <div className="flex flex-col items-end">
            <div className="flex items-center justify-between w-full max-w-[200px] mb-3">
              <span className="text-sm text-white">Featured</span>
              <span className="text-sm text-[#6E6E6A]">(02)</span>
            </div>
            <a
              href="#work"
              className="relative w-full max-w-[200px] aspect-[16/10] rounded-xl overflow-hidden border border-[#2A2A26]/50 group block"
            >
              <Image
                src="/images/portfolio/kalon.jpg"
                alt="Featured — Kalon"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A08]/60 to-transparent" />
            </a>
          </div>
        </div>
      </div>

      {/* ── Logo slider ── */}
      <div className="border-t border-b border-[#2A2A26]/30 py-8 overflow-hidden w-full relative z-10">
        <div className="flex logo-slider" style={{ width: "max-content" }}>
          {[0, 1].map((setIndex) => (
            <div key={setIndex} className="flex items-center gap-16 px-8 shrink-0">
              {logos.map((logo) => (
                <Image
                  key={`${setIndex}-${logo}`}
                  src={`/images/logos/${logo}.svg`}
                  alt={logo.replace(/-/g, " ")}
                  width={100}
                  height={32}
                  className="opacity-30 hover:opacity-60 transition-opacity h-6 w-auto grayscale"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
