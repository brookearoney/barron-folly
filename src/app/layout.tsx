import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { organizationJsonLd } from "@/lib/metadata";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Agentic Product Agency for Growing Companies`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Subscription-based agentic product agency that builds and deploys scalable digital systems — software, AI automation, and brand infrastructure. No contracts. 48-hour turnarounds.",
  keywords: [
    "agentic product agency",
    "AI automation agency",
    "subscription product agency",
    "systems architecture",
    "brand infrastructure",
    "AI-led execution",
    "product development subscription",
    "scalable digital systems",
  ],
  icons: {
    icon: "/images/brand/favicon.svg",
    apple: "/images/brand/webclip.svg",
  },
  openGraph: {
    title: `${SITE_NAME} | Agentic Product Agency for Growing Companies`,
    description:
      "Subscription-based agentic product agency. We deploy AI agents and senior product oversight to build software, systems, and brand infrastructure. No contracts.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Idea to Infrastructure`,
    description:
      "Agentic product agency that builds and deploys scalable digital systems. Subscription-based. 48-hour turnarounds.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationJsonLd()),
          }}
        />
      </head>
      <body className="antialiased">
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
