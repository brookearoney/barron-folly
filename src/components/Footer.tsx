"use client";

import Image from "next/image";
import Link from "next/link";
import { footerNav } from "@/data/navigation";
import { CONTACT, SOCIAL } from "@/lib/constants";

export default function Footer() {
  return (
    <footer className="border-t border-[#2A2A26]/30">
      <div className="w-[90%] mx-auto py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <Image
                src="/images/brand/fox-icon.svg"
                alt="Barron & Folly"
                width={32}
                height={32}
              />
              <Image
                src="/images/brand/logo-full.svg"
                alt="Barron & Folly"
                width={140}
                height={20}
              />
            </Link>
            <p className="text-[#6E6E6A] max-w-sm text-sm leading-relaxed">
              Agentic product agency that replaces fragmented teams with an
              autonomous execution engine for software, systems, and brand
              infrastructure. Subscription-based. No contracts.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-[#9E9E98] uppercase tracking-wider mb-4">
              Navigate
            </h4>
            <ul className="space-y-3">
              {footerNav.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-[#6E6E6A] hover:text-[#FF8400] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-[#9E9E98] uppercase tracking-wider mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm text-[#6E6E6A]">
              <li>
                <a
                  href={`mailto:${CONTACT.email}`}
                  className="hover:text-[#FF8400] transition-colors"
                >
                  {CONTACT.email}
                </a>
              </li>
              <li>{CONTACT.address}</li>
            </ul>

            <div className="flex items-center gap-3 mt-6">
              {[
                {
                  href: SOCIAL.instagram,
                  label: "Instagram",
                  path: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z",
                },
                {
                  href: SOCIAL.linkedin,
                  label: "LinkedIn",
                  path: "M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z",
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener"
                  aria-label={social.label}
                  className="w-9 h-9 rounded-full border border-[#2A2A26] flex items-center justify-center text-[#6E6E6A] hover:text-[#FF8400] hover:border-[#FF8400] transition-all"
                >
                  <svg
                    width="14"
                    height="14"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d={social.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-[#2A2A26]/30 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-[#6E6E6A]">
            &copy; {new Date().getFullYear()} Barron & Folly LC. All rights
            reserved.
          </p>
          <p className="text-xs text-[#2A2A26]">
            Designed & Built by Barron & Folly
          </p>
        </div>
      </div>
    </footer>
  );
}
