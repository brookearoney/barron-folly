export interface PricingTier {
  name: string;
  price: string;
  priceValue: number;
  desc: string;
  features: string[];
  cta: string;
  popular: boolean;
  href: string;
}

export const tiers: PricingTier[] = [
  {
    name: "Copper",
    price: "$500",
    priceValue: 500,
    desc: "Solo founders and small projects that need quality design and development on a lean budget.",
    features: [
      "Unlimited Design Requests",
      "Basic UX/UI Design",
      "Landing Page Development",
      "One Active Request at a Time",
      "Dedicated Slack Channel",
      "72-Hour Turnarounds",
    ],
    cta: "Get Started",
    popular: false,
    href: "https://buy.stripe.com/fZe16leej8jv08MfYY",
  },
  {
    name: "Steel",
    price: "$2,500",
    priceValue: 2500,
    desc: "Lean teams and early-stage products that need core design, development & AI muscle without the fluff.",
    features: [
      "Everything in Copper, plus:",
      "Product Discovery & Research",
      "Flow Mapping & User Journeys",
      "Rapid Prototyping",
      "Basic AI Agent Setup",
      "Web & Mobile App Development",
      "48-Hour Turnarounds",
    ],
    cta: "Get Started",
    popular: false,
    href: "https://buy.stripe.com/cN2aGV3zF43fbRu4gm",
  },
  {
    name: "Titanium",
    price: "$5,000",
    priceValue: 5000,
    desc: "Growing products that need priority treatment, full-stack development, and advanced AI chops.",
    features: [
      "Everything in Steel, plus:",
      "Advanced Brand & Market Strategy",
      "AI Architecture & Prompt Engineering",
      "Full-Stack Web App Development",
      "Mobile App Development (iOS + Android)",
      "Weekly Strategy Huddle",
      "Priority Request Handling",
      "Go-to-Market Gameplans",
    ],
    cta: "Get Started",
    popular: true,
    href: "https://buy.stripe.com/5kAdT7eejarDaNq6ox",
  },
  {
    name: "Tungsten",
    price: "$7,500",
    priceValue: 7500,
    desc: "High-stakes products that demand the ultimate design, development & AI arsenal and zero downtime.",
    features: [
      "Everything in Titanium, plus:",
      "End-to-End Branding & Packaging",
      "Custom AI Model Development",
      "Complex Web & Mobile App Builds",
      "In-Depth User Testing & Analytics",
      "On-Demand Design & Dev Emergencies",
      "Midnight Tweaks & Crisis Pivots",
      "Dedicated Creative Director",
    ],
    cta: "Get Started",
    popular: false,
    href: "https://buy.stripe.com/cN27uJ7PV7frbRu5ks",
  },
];

export interface Perk {
  icon: string;
  label: string;
}

export const perks: Perk[] = [
  { icon: "M3 8H13", label: "No Contracts" },
  { icon: "M8 2V14M2 8H14", label: "Unlimited Requests" },
  { icon: "M12 6L8 10L4 6", label: "48hr Turnaround" },
  { icon: "M2 4H14V12H2V4Z", label: "Dedicated Slack" },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "How does the subscription work?",
    answer:
      "Choose a plan and submit unlimited design and development requests. We work through them one at a time, delivering most within 48 hours. No contracts \u2014 pause or cancel anytime.",
  },
  {
    question: "What does '48-hour turnaround' actually mean?",
    answer:
      "Most individual requests are completed within 48 hours. Complex builds like full apps are broken into sprint deliverables, each turned around within 48\u201372 hours.",
  },
  {
    question: "Can you build mobile apps?",
    answer:
      "Yes. We build iOS, Android, and cross-platform mobile apps using React Native and native technologies. Design and development happen under one roof for seamless delivery.",
  },
  {
    question: "Do you build full web applications?",
    answer:
      "Absolutely. We build full-stack web apps, SaaS platforms, and complex web applications using Next.js, React, and modern frameworks. From architecture to deployment.",
  },
  {
    question: "What if I don't like a design?",
    answer:
      "We'll revise it until you love it. Unlimited revisions are included in every plan. We work closely with you to nail the direction from the start.",
  },
  {
    question: "Can I pause my subscription?",
    answer:
      "Yes. If you have a lighter month, pause your subscription and pick back up when you need us. Your billing cycle freezes until you reactivate.",
  },
];
