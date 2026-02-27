"use client";

import AnimateIn from "./AnimateIn";
import Image from "next/image";

export default function Contact() {
  return (
    <section id="contact" className="py-28 md:py-36 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF8400]/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-[90%] mx-auto">
        <div className="rounded-2xl border border-[#2A2A26]/50 bg-[#141412] p-10 md:p-16 lg:p-20 relative overflow-hidden">
          {/* Dot grid background */}
          <div className="absolute inset-0 dot-grid opacity-50" />

          <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <AnimateIn>
                <h2 className="text-5xl sm:text-6xl md:text-7xl font-light leading-[1.1] tracking-tight mb-8">
                  Let&apos;s{" "}
                  <span className="font-display text-[#FF8400]">
                    Build
                  </span>
                </h2>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <p className="text-lg text-[#9E9E98] leading-relaxed mb-10 max-w-lg">
                  Ready to lock in your tier and start shipping? Drop us a line and
                  we&apos;ll get you set up within 24 hours. No pitch decks. No
                  discovery calls that waste your time. Just results.
                </p>
              </AnimateIn>

              <AnimateIn delay={0.2}>
                <div className="space-y-6">
                  <a
                    href="mailto:hello@barronandfolly.com"
                    className="flex items-center gap-4 text-white hover:text-[#FF8400] transition-colors group"
                  >
                    <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center group-hover:border-[#FF8400] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                    hello@barronandfolly.com
                  </a>

                  <a
                    href="tel:+18012442118"
                    className="flex items-center gap-4 text-white hover:text-[#FF8400] transition-colors group"
                  >
                    <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center group-hover:border-[#FF8400] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M22 16.92V19.92C22 20.48 21.56 20.93 21 20.97C20.74 20.99 20.48 21 20.22 21C10.96 21 3 13.04 3 3.78C3 3.52 3.01 3.26 3.03 3C3.07 2.44 3.52 2 4.08 2H7.08C7.56 2 7.97 2.34 8.05 2.81C8.14 3.4 8.3 3.97 8.52 4.51L7.02 6.01C8.27 8.38 10.15 10.26 12.52 11.51L14.02 10.01C14.56 10.23 15.13 10.39 15.72 10.48C16.19 10.56 16.53 10.97 16.53 11.45V14.45" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                    </span>
                    (801) 244-2118
                  </a>

                  <div className="flex items-center gap-4 text-[#9E9E98]">
                    <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" stroke="currentColor" strokeWidth="1.5"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5"/>
                      </svg>
                    </span>
                    American Fork, Utah
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* CTA Card */}
            <AnimateIn direction="right">
              <div className="bg-[#0A0A08] rounded-2xl border border-[#2A2A26]/50 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <Image
                    src="/images/brand/fox-icon.svg"
                    alt="Barron & Folly"
                    width={32}
                    height={32}
                  />
                  <span className="text-sm text-[#6E6E6A]">Start your subscription</span>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                      Name
                    </label>
                    <input
                      type="text"
                      placeholder="Your name"
                      className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                      Email
                    </label>
                    <input
                      type="email"
                      placeholder="you@company.com"
                      className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                      What do you need?
                    </label>
                    <textarea
                      placeholder="Tell us about your project..."
                      rows={3}
                      className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors resize-none"
                    />
                  </div>
                </div>

                <button className="mt-8 w-full py-4 bg-[#FF8400] text-[#0A0A08] rounded-full font-semibold hover:bg-[#FFB366] transition-colors duration-300 flex items-center justify-center gap-2">
                  Send Message
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </AnimateIn>
          </div>
        </div>
      </div>
    </section>
  );
}
