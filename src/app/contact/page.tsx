import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | Get Started With Your Subscription",
  description:
    "Ready to start shipping? Contact Barron & Folly to subscribe and start receiving unlimited design and development requests with 48-hour turnarounds.",
  keywords: [
    "hire design agency",
    "contact design agency",
    "start design subscription",
    "design agency contact",
  ],
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <PageHero
        badge="Contact"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M2 4L8 9L14 4"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="2"
              y="3"
              width="12"
              height="10"
              rx="1.5"
              stroke="#FF8400"
              strokeWidth="1.2"
            />
          </svg>
        }
        title="Build"
        titleAccent="Let's"
        subtitle="Ready to lock in your tier and start shipping? Drop us a line and we'll get you set up within 24 hours."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <ContactForm />
    </>
  );
}
