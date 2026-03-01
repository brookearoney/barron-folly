import type { Metadata } from "next";
import PageHero from "@/components/PageHero";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact | Deploy Your Execution Engine",
  description:
    "Ready to deploy your infrastructure? Contact Barron & Folly to subscribe and start shipping software, systems, and brand infrastructure within 48 hours.",
  keywords: [
    "deploy execution engine",
    "agentic product agency contact",
    "start infrastructure subscription",
    "AI-led development agency",
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
        title="Deploy"
        titleAccent="Let's"
        subtitle="Ready to deploy your execution engine? Drop us a line and we'll have you shipping within 48 hours. No pitch decks. No discovery calls. Just infrastructure."
        breadcrumbs={[{ label: "Contact" }]}
      />

      <ContactForm />
    </>
  );
}
