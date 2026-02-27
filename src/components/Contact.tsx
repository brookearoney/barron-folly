"use client";

import { useState } from "react";
import AnimateIn from "./AnimateIn";
import Image from "next/image";

export default function Contact() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

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
                  <span className="font-display text-[#FF8400]">Build</span>
                </h2>
              </AnimateIn>

              <AnimateIn delay={0.1}>
                <p className="text-lg text-[#9E9E98] leading-relaxed mb-10 max-w-lg">
                  Ready to lock in your tier and start shipping? Drop us a line
                  and we&apos;ll get you set up within 24 hours. No pitch decks.
                  No discovery calls that waste your time. Just results.
                </p>
              </AnimateIn>

              <AnimateIn delay={0.2}>
                <div className="space-y-6">
                  <a
                    href="mailto:start@barronfolly.com"
                    className="flex items-center gap-4 text-white hover:text-[#FF8400] transition-colors group"
                  >
                    <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center group-hover:border-[#FF8400] transition-colors">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    start@barronfolly.com
                  </a>

                  <div className="flex items-center gap-4 text-[#9E9E98]">
                    <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" stroke="currentColor" strokeWidth="1.5" />
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                      </svg>
                    </span>
                    American Fork, Utah
                  </div>
                </div>
              </AnimateIn>
            </div>

            {/* Contact Form */}
            <AnimateIn direction="right">
              <div className="bg-[#0A0A08] rounded-2xl border border-[#2A2A26]/50 p-8 md:p-10">
                <div className="flex items-center gap-3 mb-8">
                  <Image
                    src="/images/brand/fox-icon.svg"
                    alt="Barron & Folly"
                    width={32}
                    height={32}
                  />
                  <span className="text-sm text-[#6E6E6A]">
                    Start your subscription
                  </span>
                </div>

                {status === "success" ? (
                  <div className="py-12 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#FF8400]/10 border border-[#FF8400]/30 flex items-center justify-center mx-auto mb-6">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                        <path d="M5 12L10 17L20 7" stroke="#FF8400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-medium text-white mb-2">
                      Message sent
                    </h3>
                    <p className="text-[#6E6E6A] text-sm">
                      We&apos;ll be in touch within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit}>
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                          <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                            Name *
                          </label>
                          <input
                            type="text"
                            name="name"
                            required
                            value={form.name}
                            onChange={handleChange}
                            placeholder="Your name"
                            className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                            Phone
                          </label>
                          <input
                            type="tel"
                            name="phone"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="(555) 000-0000"
                            className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                          Email *
                        </label>
                        <input
                          type="email"
                          name="email"
                          required
                          value={form.email}
                          onChange={handleChange}
                          placeholder="you@company.com"
                          className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-[#6E6E6A] uppercase tracking-wider mb-2.5 block">
                          What do you need? *
                        </label>
                        <textarea
                          name="message"
                          required
                          value={form.message}
                          onChange={handleChange}
                          placeholder="Tell us about your project..."
                          rows={3}
                          className="w-full bg-transparent border-b border-[#2A2A26] py-3 text-white placeholder:text-[#2A2A26] focus:border-[#FF8400] outline-none transition-colors resize-none"
                        />
                      </div>
                    </div>

                    {status === "error" && (
                      <p className="mt-4 text-sm text-red-400">
                        Something went wrong. Please try again or email us
                        directly.
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="mt-8 w-full py-4 bg-[#FF8400] text-[#0A0A08] rounded-full font-semibold hover:bg-[#FFB366] transition-colors duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <>
                          <svg
                            className="animate-spin h-4 w-4"
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                            />
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          Send Message
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                            <path d="M3 8H13M13 8L9 4M13 8L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </AnimateIn>
          </div>
        </div>
      </div>
    </section>
  );
}
