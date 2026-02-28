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
    desc: "For companies that just need things built. Fast. AI-heavy, task-driven, output-focused.",
    features: [
      "Unlimited AI-Executed Task Queue",
      "Landing Pages & Microsites",
      "CRM Workflow Automations",
      "Zapier / Make Integrations",
      "Form Logic & Routing Systems",
      "Dashboard Templates",
      "Technical SEO Structure",
      "Blog & Content Production",
    ],
    cta: "Get Started",
    popular: false,
    href: "https://buy.stripe.com/fZe16leej8jv08MfYY",
  },
  {
    name: "Steel",
    price: "$2,500",
    priceValue: 2500,
    desc: "Now we organize and unify. Everything in Copper, plus strategic standardization across your stack.",
    features: [
      "Everything in Copper, plus:",
      "Multi-Site Rollouts",
      "Design System Implementation",
      "CRM & Tool Stack Mapping",
      "Funnel Architecture",
      "Conversion Optimization Sprints",
      "Sales Automation Systems",
      "Data Visibility Dashboards",
    ],
    cta: "Get Started",
    popular: false,
    href: "https://buy.stripe.com/cN2aGV3zF43fbRu4gm",
  },
  {
    name: "Titanium",
    price: "$5,000",
    priceValue: 5000,
    desc: "Human-led nuance enters the picture. Custom UX, feature architecture, brand evolution, and AI agents built around your workflows.",
    features: [
      "Everything in Steel, plus:",
      "Custom UX System Design",
      "New Feature Architecture",
      "Full Web/App Design Builds",
      "Design System Creation",
      "Brand Evolution Strategy",
      "Custom AI Agents",
      "Structured Product Roadmapping",
    ],
    cta: "Get Started",
    popular: true,
    href: "https://buy.stripe.com/5kAdT7eejarDaNq6ox",
  },
  {
    name: "Tungsten",
    price: "$10,000",
    priceValue: 10000,
    desc: "We become your infrastructure partner. Dedicated AI stack, full systems architecture, and embedded strategic oversight.",
    features: [
      "Everything in Titanium, plus:",
      "Dedicated AI Stack",
      "Custom-Trained Internal AI Agents",
      "Full Systems Architecture Redesign",
      "Brand Architecture from Ground Up",
      "Enterprise-Grade Internal Tooling",
      "Dedicated Strategist Oversight",
      "Priority Sprint Cycles",
    ],
    cta: "Book a Call",
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
  { icon: "M8 2V14M2 8H14", label: "AI-Led Velocity" },
  { icon: "M12 6L8 10L4 6", label: "Cross-Functional" },
  { icon: "M2 4H14V12H2V4Z", label: "Built for Operators" },
];

export interface FaqItem {
  question: string;
  answer: string;
}

export const faqs: FaqItem[] = [
  {
    question: "How does the subscription model work?",
    answer:
      "Choose a tier and your execution engine deploys immediately. Tasks flow through an async queue \u2014 AI agents handle execution while senior oversight ensures quality. No contracts, pause or cancel anytime.",
  },
  {
    question: "What\u2019s the difference between tiers?",
    answer:
      "Lower tiers are AI-dominant execution \u2014 fast, task-driven output. Upper tiers introduce human-led nuance: custom architecture, brand strategy, dedicated oversight, and command-level infrastructure partnership.",
  },
  {
    question: "Who is this for?",
    answer:
      "Growth-stage companies, multi-location operators, PE-backed portfolios, SaaS companies scaling quickly, consumer brands expanding channels, and any team drowning in backlog that says \u2018we need this built yesterday.\u2019",
  },
  {
    question: "How fast do things ship?",
    answer:
      "Most individual deliverables ship within days. Complex builds are broken into sprint cycles with weekly shipping cadence. The AI-led execution model compresses timelines that traditionally take months.",
  },
  {
    question: "What does \u2018agentic execution\u2019 actually mean?",
    answer:
      "We deploy autonomous AI agents that handle code-heavy tasks \u2014 building pages, configuring automations, setting up integrations, generating content. Senior product oversight ensures everything meets production standards.",
  },
  {
    question: "Can I upgrade or downgrade my tier?",
    answer:
      "Yes. Move between tiers as your needs evolve. Start with Copper for raw execution speed, scale to Tungsten when you need full infrastructure partnership. Your billing adjusts immediately.",
  },
];
