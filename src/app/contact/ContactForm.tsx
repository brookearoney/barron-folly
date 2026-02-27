"use client";

import { useState } from "react";
import Image from "next/image";
import AnimateIn from "@/components/AnimateIn";
import { CONTACT, SOCIAL } from "@/lib/constants";

export default function ContactForm() {
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
    <section className="pb-28 md:pb-36 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#FF8400]/5 rounded-full blur-[150px]" />
      </div>

      <div className="w-[90%] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
          {/* Contact Info */}
          <AnimateIn>
            <div>
              <h2 className="text-3xl md:text-4xl font-light mb-8">
                No pitch decks. No discovery calls.{" "}
                <span className="text-[#6E6E6A]">Just results.</span>
              </h2>

              <div className="space-y-6 mb-12">
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="flex items-center gap-4 text-white hover:text-[#FF8400] transition-colors group"
                >
                  <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center group-hover:border-[#FF8400] transition-colors">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                      />
                      <path
                        d="M22 6L12 13L2 6"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  {CONTACT.email}
                </a>

                <div className="flex items-center gap-4 text-[#9E9E98]">
                  <span className="w-12 h-12 rounded-full border border-[#2A2A26] flex items-center justify-center">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                      />
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.5" />
                    </svg>
                  </span>
                  {CONTACT.address}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href={SOCIAL.instagram}
                  target="_blank"
                  rel="noopener"
                  className="w-10 h-10 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all"
                >
                  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                  </svg>
                </a>
                <a
                  href={SOCIAL.linkedin}
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
          </AnimateIn>

          {/* Contact Form */}
          <AnimateIn direction="right">
            <div className="bg-[#141412] rounded-2xl border border-[#2A2A26]/50 p-8 md:p-10">
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
                        rows={4}
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
                          <path
                            d="M3 8H13M13 8L9 4M13 8L9 12"
                            stroke="currentColor"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
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
    </section>
  );
}
