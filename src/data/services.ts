export interface Service {
  slug: string;
  num: string;
  title: string;
  desc: string;
  longDesc: string;
  tags: string[];
  features: string[];
  deliverables: string[];
  turnaround: string;
  relatedProjects: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const services: Service[] = [
  {
    slug: "agentic-execution",
    num: "/01",
    title: "Agentic Execution",
    desc: "Autonomous AI agents deploy web platforms, applications, automations, internal tools, dashboards, integrations, CRM systems, conversion systems, technical SEO, and reporting infrastructure. Code-heavy tasks are no longer the bottleneck.",
    longDesc:
      "We deploy autonomous AI agents that handle the heavy lifting of digital execution. From building web platforms and applications to configuring CRM systems, deploying conversion systems, and creating reporting infrastructure \u2014 our agentic layer compresses timelines that used to take months into days. Every deployment is production-grade, scalable, and built to evolve with your business.",
    tags: ["Web Platforms", "Applications", "CRM Systems", "Automations", "Dashboards", "Technical SEO", "Integrations"],
    features: [
      "Unlimited AI-executed task queue (async model)",
      "Landing pages & microsites",
      "Web platform development",
      "CRM automations & routing",
      "Zapier / Make integrations",
      "Form logic & routing systems",
      "Dashboard & reporting builds",
      "Internal tool prototypes",
      "Technical SEO structure",
      "Blog & content production",
      "Ad creative variations",
      "UI component builds",
    ],
    deliverables: [
      "Production-ready web platforms",
      "Configured CRM & automation workflows",
      "Dashboard & reporting templates",
      "Integration documentation",
      "Technical SEO audit & implementation",
    ],
    turnaround: "Continuous async execution",
    relatedProjects: ["kalon", "temple", "parlay"],
    seo: {
      title: "Agentic Execution | AI-Powered Digital Deployment | Barron & Folly",
      description:
        "Autonomous AI agents deploy web platforms, applications, automations, and reporting infrastructure. Replace fragmented vendors with one execution engine.",
      keywords: [
        "agentic execution",
        "AI-powered development",
        "autonomous digital deployment",
        "AI agents for business",
        "automated web development",
        "AI execution engine",
      ],
    },
  },
  {
    slug: "systems-architecture",
    num: "/02",
    title: "Systems Architecture",
    desc: "We don\u2019t just build pages. We design workflow logic, information architecture, scalable frameworks, internal operational tooling, and data visibility layers. Infrastructure before aesthetics.",
    longDesc:
      "Every scaling company eventually outgrows its tools. We design the underlying systems that hold everything together \u2014 workflow logic, information architecture, scalable frameworks, and data visibility layers. This isn\u2019t about adding more software. It\u2019s about designing the connective tissue between your teams, tools, and growth targets.",
    tags: ["Workflow Logic", "Information Architecture", "Scalable Frameworks", "Data Visibility", "Operational Tooling"],
    features: [
      "Multi-site rollout architecture",
      "Design system implementation",
      "CRM & tool stack mapping",
      "Funnel architecture",
      "Conversion optimization sprints",
      "Sales & recruiting automation",
      "Data visibility dashboards",
      "Internal workflow automation",
      "Product feature expansion support",
      "Front-end refinement across platforms",
    ],
    deliverables: [
      "Systems architecture documentation",
      "Workflow & funnel maps",
      "Design system components",
      "Data dashboard configurations",
      "Integration & automation specs",
    ],
    turnaround: "Sprint-based delivery",
    relatedProjects: ["kalon", "temple", "tethre"],
    seo: {
      title: "Systems Architecture | Scalable Digital Infrastructure | Barron & Folly",
      description:
        "We design workflow logic, information architecture, and scalable frameworks that unify your tools, teams, and growth targets. Infrastructure before aesthetics.",
      keywords: [
        "systems architecture",
        "digital infrastructure design",
        "scalable frameworks",
        "workflow automation architecture",
        "information architecture agency",
        "operational tooling",
      ],
    },
  },
  {
    slug: "brand-experience",
    num: "/03",
    title: "Brand & Experience",
    desc: "When speed is handled, we refine precision. Identity systems, design systems, UX strategy, multi-product cohesion, and portfolio brand consolidation for companies that need nuance at scale.",
    longDesc:
      "Once the execution engine is running and systems are architected, we layer in human-led nuance. Custom UX system design, brand architecture from the ground up, design system creation, and multi-product unification. This is where products stop being functional and start being exceptional.",
    tags: ["Identity Systems", "Design Systems", "UX Strategy", "Brand Consolidation", "Multi-Product Cohesion"],
    features: [
      "Custom UX system design",
      "Full web & app design builds",
      "Design system creation from scratch",
      "Brand evolution strategy",
      "Internal SaaS product design",
      "Customer portal builds",
      "Executive dashboard architecture",
      "Advanced automation mapping",
      "Custom AI agents for your workflows",
      "Structured product roadmapping",
    ],
    deliverables: [
      "Complete design system",
      "Brand architecture & guidelines",
      "UX strategy documentation",
      "High-fidelity design builds",
      "Product roadmap & feature specs",
    ],
    turnaround: "Strategic sprint cycles",
    relatedProjects: ["crack-spice", "dime-beauty", "mad-bison"],
    seo: {
      title: "Brand & Experience Design | UX Strategy & Design Systems | Barron & Folly",
      description:
        "Identity systems, design systems, UX strategy, and brand consolidation for companies that need nuance at scale. Human-led precision layered on agentic speed.",
      keywords: [
        "brand experience design",
        "UX strategy agency",
        "design system creation",
        "brand architecture",
        "product design agency",
        "portfolio brand consolidation",
      ],
    },
  },
];

export function getServiceBySlug(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function getAllServiceSlugs(): string[] {
  return services.map((s) => s.slug);
}
