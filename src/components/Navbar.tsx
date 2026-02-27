"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { mainNav } from "@/data/navigation";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

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
          <Link href="/" className="flex items-center gap-3">
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
          </Link>

          <nav className="hidden md:flex items-center">
            <div
              className={`flex items-center gap-1 px-2 py-2 rounded-full transition-all duration-500 ${
                scrolled
                  ? "bg-[#171614]/60 border border-[#2A2A26]/40"
                  : "bg-[#171614]/40 border border-[#2A2A26]/20"
              }`}
            >
              {mainNav.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-5 py-2 text-sm transition-colors rounded-full ${
                    isActive(link.href)
                      ? "text-white bg-[#2A2A26]/50"
                      : "text-[#9E9E98] hover:text-white hover:bg-[#2A2A26]/40"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          <Link
            href="/contact"
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
          </Link>

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
          {mainNav.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-3xl font-light transition-colors ${
                isActive(link.href)
                  ? "text-[#FF8400]"
                  : "text-white hover:text-[#FF8400]"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/contact"
            className="mt-4 inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FF8400] text-[#0A0A08] rounded-full text-lg font-semibold"
          >
            Let&apos;s Chat!
          </Link>
        </nav>
      </div>
    </>
  );
}
