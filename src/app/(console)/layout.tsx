import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    default: "B&F Console",
    template: "%s | B&F Console",
  },
  icons: {
    icon: "/images/brand/favicon.svg",
    apple: "/images/brand/webclip.svg",
  },
  robots: { index: false, follow: false },
};

export default function ConsoleRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
