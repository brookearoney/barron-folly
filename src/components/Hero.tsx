"use client";

import Image from "next/image";

const logos = [
  "BooHoo", "DYO", "Dime", "Hyper", "Mad-Bison", "Mvmt", "Norris",
  "Nu-Skin", "Parlay", "Seven-Brothers", "WeWork", "Hektic", "Dentive",
  "DoucheBags", "Nerd",
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center overflow-hidden pt-36 pb-12">
      {/* Background gradient orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-[#FF8400]/8 rounded-full blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-[#FF8400]/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-[1440px] mx-auto px-8 md:px-16 lg:px-20 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          {/* Left: Big headline */}
          <div>
            <h1
              className="text-6xl sm:text-7xl md:text-8xl lg:text-[7rem] font-light leading-[1.1] tracking-tight animate-fade-up"
            >
              Design,
              <br />
              <span className="font-display text-[#FF8400]">
                Automate
              </span>
            </h1>

            <div
              className="mt-12 flex flex-col sm:flex-row items-start sm:items-center gap-4 animate-fade-up-delay"
            >
              <span className="text-sm text-[#6E6E6A] uppercase tracking-widest">
                We do
              </span>
              <span className="w-8 h-px bg-[#FF8400] hidden sm:block" />
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#9E9E98]">
                <span>Product Design</span>
                <span className="text-[#FF8400]">/</span>
                <span>AI Automation</span>
                <span className="text-[#FF8400]">/</span>
                <span>Branding</span>
                <span className="text-[#FF8400]">/</span>
                <span>UX/UI</span>
              </div>
            </div>
          </div>

          {/* Right: Description + CTA */}
          <div className="lg:pl-12 animate-fade-up-delay-2">
            <p className="text-lg md:text-xl text-[#9E9E98] leading-relaxed max-w-lg mb-2">
              We build brands, products, and AI systems that move fast and hit
              hard. Subscription-based design and automation with zero
              contracts and 48-hour turnarounds.
            </p>

            <div className="mt-8 h-px bg-[#2A2A26]" />

            <div className="mt-8 flex items-center justify-between">
              <a
                href="#contact"
                className="inline-flex items-center gap-3 text-white font-medium hover:text-[#FF8400] transition-colors group"
              >
                Start a Project
                <svg width="20" height="20" viewBox="0 0 16 16" fill="none" className="transition-transform group-hover:translate-x-1">
                  <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>

              <div className="flex items-center gap-4">
                <a href="https://instagram.com" target="_blank" rel="noopener" className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener" className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all">
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Featured work preview */}
        <div className="mt-20 lg:mt-28 relative animate-fade-up-delay-3">
          <div className="relative rounded-2xl overflow-hidden border border-[#2A2A26]/50 aspect-[21/9]">
            <Image src="/images/portfolio/bf-hero-1.jpg" alt="Barron & Folly Featured Work" fill className="object-cover" priority />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A08] via-transparent to-transparent" />
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center animate-bounce-slow">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#6E6E6A]">
              <path d="M8 3V13M8 13L4 9M8 13L12 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* Logo slider */}
      <div className="mt-20 lg:mt-28 border-t border-b border-[#2A2A26]/30 py-8 overflow-hidden w-full">
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
