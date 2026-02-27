"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

const navLinks = [
  { href: "#services", label: "Services" },
  { href: "#work", label: "Work" },
  { href: "#about", label: "About" },
  { href: "#pricing", label: "Pricing" },
  { href: "#contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 animate-fade-up ${
          scrolled
            ? "bg-[#0A0A08]/80 backdrop-blur-xl border-b border-[#2A2A26]/50"
            : "bg-transparent"
        }`}
      >
        <div className="w-[90%] mx-auto flex items-center justify-between h-20">
          <a href="#" className="flex items-center gap-3">
            <Image
              src="/images/brand/fox-icon.svg"
              alt="Barron & Folly"
              width={36}
              height={36}
            />
            <Image
              src="/images/brand/logo-full.svg"
              alt="Barron & Folly"
              width={160}
              height={24}
              className="hidden sm:block"
            />
          </a>

          <nav className="hidden md:flex items-center">
            <div
              className={`flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ${
                scrolled
                  ? "bg-[#171614]/60 border border-[#2A2A26]/40"
                  : "bg-[#171614]/40 border border-[#2A2A26]/20"
              }`}
            >
              {navLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-5 py-2 text-sm text-[#9E9E98] hover:text-white transition-colors rounded-full hover:bg-[#2A2A26]/40"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>

          <a
            href="#contact"
            className="hidden md:flex items-center gap-2 px-6 py-3 bg-white text-[#0A0A08] rounded-full text-sm font-medium hover:bg-[#FF8400] hover:text-[#0A0A08] transition-all duration-300"
          >
            Let&apos;s Chat!
            <svg
              width="16"
              height="16"
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

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex flex-col gap-1.5 p-2"
            aria-label="Menu"
          >
            <span
              className={`w-6 h-0.5 bg-white transition-all ${
                mobileOpen ? "rotate-45 translate-y-2" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all ${
                mobileOpen ? "opacity-0" : ""
              }`}
            />
            <span
              className={`w-6 h-0.5 bg-white transition-all ${
                mobileOpen ? "-rotate-45 -translate-y-2" : ""
              }`}
            />
          </button>
        </div>
      </header>

      {/* Mobile menu */}
      <div
        className={`fixed inset-0 z-40 bg-[#0A0A08]/95 backdrop-blur-xl pt-24 px-8 transition-all duration-300 ${
          mobileOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <nav className="flex flex-col gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className="text-3xl font-light text-white hover:text-[#FF8400] transition-colors"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#contact"
            onClick={() => setMobileOpen(false)}
            className="mt-4 inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF8400] text-[#0A0A08] rounded-full text-lg font-semibold"
          >
            Let&apos;s Chat!
          </a>
        </nav>
      </div>
    </>
  );
}
