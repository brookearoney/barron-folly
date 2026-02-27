import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Barron & Folly | Product Design & AI Automation Agency",
  description:
    "We design products that dominate and build AI that scales. Subscription-based product design, branding, UX/UI, and AI automation agency based in Utah.",
  icons: {
    icon: "/images/brand/favicon.svg",
    apple: "/images/brand/webclip.svg",
  },
  openGraph: {
    title: "Barron & Folly | Product Design & AI Automation",
    description:
      "Subscription-based product design, branding, and AI automation agency. No contracts. Fast turnarounds. Unlimited design.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
