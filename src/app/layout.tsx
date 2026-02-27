import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { organizationJsonLd } from "@/lib/metadata";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} | Product Design, App Development & AI Automation Agency`,
    template: `%s | ${SITE_NAME}`,
  },
  description:
    "We design products, build mobile and web apps, and automate with AI. Subscription-based agency with 48-hour turnarounds. No contracts. Based in Utah.",
  keywords: [
    "product design agency",
    "AI automation agency",
    "mobile app development",
    "web app development",
    "subscription design service",
    "48-hour design turnaround",
    "UX/UI design agency",
    "branding agency Utah",
  ],
  icons: {
    icon: "/images/brand/favicon.svg",
    apple: "/images/brand/webclip.svg",
  },
  openGraph: {
    title: `${SITE_NAME} | Product Design, App Development & AI Automation`,
    description:
      "Subscription-based product design, app development, and AI automation agency. No contracts. 48-hour turnarounds. Unlimited requests.",
    type: "website",
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: "summary_large_image",
    title: `${SITE_NAME} | Design, Build, Automate`,
    description:
      "Subscription-based product design, app development, and AI automation. 48-hour turnarounds.",
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
