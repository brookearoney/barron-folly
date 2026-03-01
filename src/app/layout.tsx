import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { organizationJsonLd } from "@/lib/metadata";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Autonomous Execution Engine for Growing Companies`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "Agentic product agency that replaces fragmented teams with an autonomous execution engine. Software, systems, and brand infrastructure — deployed on demand. No contracts.",
  keywords: [
    "agentic product agency",
    "autonomous execution engine",
    "AI-led product development",
    "subscription execution engine",
    "digital infrastructure agency",
    "AI agents for business",
    "scalable systems deployment",
    "replace dev agency with AI",
    "subscription product agency",
    "systems architecture agency",
  ],
  icons: {
    icon: "/images/brand/favicon.svg",
    apple: "/images/brand/webclip.svg",
  },
  openGraph: {
    title: `${SITE_NAME} | Deploy Digital Infrastructure at Scale`,
    description:
      "Agentic product agency that combines AI agents and senior product oversight to build, standardize, and scale the systems behind modern businesses. Subscription-based. No contracts.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Build. Standardize. Scale. On Demand.`,
    description:
      "Replace fragmented vendors with one autonomous execution engine. Software, systems, and brand infrastructure — deployed continuously.",
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
