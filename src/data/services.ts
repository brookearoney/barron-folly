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
    slug: "product-design",
    num: "/01",
    title: "Product Design",
    desc: "End-to-end UX/UI from wireframes to high-fidelity screens. We build interfaces that convert and experiences users actually love.",
    longDesc:
      "We take products from zero to launch-ready with a full-spectrum design process. Starting with research and discovery, we map user flows, build wireframes, and iterate into pixel-perfect high-fidelity screens. Every decision is grounded in user behavior and business goals so your product doesn't just look good \u2014 it performs.",
    tags: ["UX Research", "UI Design", "Prototyping", "Design Systems"],
    features: [
      "User research & competitive analysis",
      "Information architecture & user flows",
      "Wireframing & low-fidelity concepts",
      "High-fidelity UI design",
      "Interactive prototyping",
      "Design system creation & maintenance",
      "Usability testing & iteration",
      "Developer handoff with specs & assets",
    ],
    deliverables: [
      "Figma design files with components",
      "Interactive prototypes",
      "Design system documentation",
      "User flow diagrams",
      "Asset exports & developer specs",
    ],
    turnaround: "48 hours per deliverable",
    relatedProjects: ["kalon", "temple", "parlay", "dime-beauty"],
    seo: {
      title: "Product Design Services | UX/UI Design Agency | Barron & Folly",
      description:
        "Expert product design and UX/UI services with 48-hour turnarounds. Wireframes, prototyping, design systems, and user research from Barron & Folly.",
      keywords: [
        "product design agency",
        "UX/UI design services",
        "rapid prototyping",
        "design systems agency",
        "user experience design",
      ],
    },
  },
  {
    slug: "ai-automation",
    num: "/02",
    title: "AI Automation",
    desc: "Custom AI agents, prompt engineering, and intelligent automations that eliminate busywork and scale your operations.",
    longDesc:
      "We build AI systems that actually work in production. From custom agents that handle complex workflows to prompt engineering that maximizes model performance, we help teams automate the tedious stuff and unlock new capabilities. No hype, no fluff \u2014 just AI that delivers measurable ROI.",
    tags: ["AI Agents", "Prompt Engineering", "Workflow Automation", "Custom Models"],
    features: [
      "Custom AI agent development",
      "Prompt engineering & optimization",
      "Workflow automation design",
      "AI-powered content generation",
      "Chatbot & conversational AI",
      "Data pipeline automation",
      "Model fine-tuning & evaluation",
      "Integration with existing tools",
    ],
    deliverables: [
      "Production-ready AI agents",
      "Prompt libraries & documentation",
      "Automation workflow diagrams",
      "Integration documentation",
      "Performance monitoring dashboards",
    ],
    turnaround: "48\u201372 hours per automation",
    relatedProjects: ["kalon", "temple"],
    seo: {
      title: "AI Automation Services | Custom AI Agents | Barron & Folly",
      description:
        "Custom AI agents, prompt engineering, and intelligent workflow automation. Barron & Folly builds AI systems that scale your operations with fast turnarounds.",
      keywords: [
        "AI automation agency",
        "custom AI agents",
        "prompt engineering services",
        "workflow automation",
        "AI development agency",
      ],
    },
  },
  {
    slug: "brand-identity",
    num: "/03",
    title: "Brand Identity",
    desc: "Logos, visual systems, and brand strategy that positions you to dominate your market. From concept to launch-ready assets.",
    longDesc:
      "Your brand is more than a logo \u2014 it's the promise you make and the feeling you deliver. We build complete brand systems that cut through the noise, connect with your audience, and scale across every touchpoint. Strategy-first, design-driven, built to last.",
    tags: ["Logo Design", "Brand Strategy", "Visual Identity", "Guidelines"],
    features: [
      "Brand strategy & positioning",
      "Logo design & wordmark development",
      "Color palette & typography systems",
      "Brand guidelines documentation",
      "Social media brand templates",
      "Presentation & pitch deck design",
      "Brand voice & messaging framework",
      "Competitive brand analysis",
    ],
    deliverables: [
      "Logo files (SVG, PNG, EPS)",
      "Brand guidelines PDF",
      "Color & typography specs",
      "Social media templates",
      "Business card & stationery design",
    ],
    turnaround: "48 hours per deliverable",
    relatedProjects: ["crack-spice", "mad-bison", "tethre", "dime-beauty"],
    seo: {
      title: "Brand Identity Design | Logo & Branding Agency | Barron & Folly",
      description:
        "Complete brand identity design including logos, visual systems, and brand strategy. Barron & Folly delivers launch-ready brand assets with 48-hour turnarounds.",
      keywords: [
        "brand identity agency",
        "logo design agency",
        "brand strategy",
        "visual identity design",
        "branding services",
      ],
    },
  },
  {
    slug: "packaging-design",
    num: "/04",
    title: "Packaging Design",
    desc: "Product packaging that pops off the shelf and sells itself. Dyelines, mockups, and retail-ready artwork.",
    longDesc:
      "Great packaging doesn't just protect your product \u2014 it sells it. We design packaging that commands attention on shelves, communicates value instantly, and builds brand recognition. From concept sketches to print-ready dielines, we handle every detail so your product launches flawlessly.",
    tags: ["Package Design", "Dyelines", "Mockups", "Retail Ready"],
    features: [
      "Structural packaging design",
      "Dieline creation & engineering",
      "Label & wrap design",
      "3D mockup rendering",
      "Print-ready artwork preparation",
      "Material & finish consultation",
      "Amazon & e-commerce packaging",
      "Retail display design",
    ],
    deliverables: [
      "Print-ready dieline files",
      "3D packaging mockups",
      "Label artwork files",
      "Material specification sheets",
      "Printer-ready PDFs",
    ],
    turnaround: "48 hours per deliverable",
    relatedProjects: ["crack-spice", "dyo", "mad-bison"],
    seo: {
      title: "Packaging Design Services | Product Packaging Agency | Barron & Folly",
      description:
        "Product packaging design that sells. Dielines, 3D mockups, and retail-ready artwork with 48-hour turnarounds from Barron & Folly.",
      keywords: [
        "packaging design agency",
        "product packaging design",
        "dieline design",
        "retail packaging",
        "Amazon packaging design",
      ],
    },
  },
  {
    slug: "marketing-content",
    num: "/05",
    title: "Marketing & Content",
    desc: "Social media graphics, ad creatives, video content, and campaigns that drive real engagement and conversions.",
    longDesc:
      "We create marketing content that stops the scroll and drives action. From social media campaigns to ad creatives and video content, everything we build is designed to convert. Data-informed, brand-consistent, and delivered fast enough to keep up with your growth.",
    tags: ["Social Media", "Ad Creative", "Video", "Campaigns"],
    features: [
      "Social media content design",
      "Paid ad creative (Meta, Google, TikTok)",
      "Email marketing design",
      "Video content & motion graphics",
      "Campaign strategy & planning",
      "A/B test creative variants",
      "Influencer collaboration assets",
      "Content calendar planning",
    ],
    deliverables: [
      "Social media post designs",
      "Ad creative sets with variants",
      "Email templates",
      "Video/motion graphics files",
      "Campaign briefs & strategies",
    ],
    turnaround: "48 hours per deliverable",
    relatedProjects: ["dime-beauty", "crack-spice"],
    seo: {
      title: "Marketing & Content Design | Ad Creative Agency | Barron & Folly",
      description:
        "Social media graphics, ad creatives, video content, and marketing campaigns with 48-hour turnarounds. Barron & Folly drives engagement and conversions.",
      keywords: [
        "marketing content agency",
        "ad creative design",
        "social media design agency",
        "campaign design services",
        "content creation agency",
      ],
    },
  },
  {
    slug: "web-app-development",
    num: "/06",
    title: "Web App Development",
    desc: "Full-stack web applications built for performance and scale. From SaaS platforms to complex web apps, delivered in record time.",
    longDesc:
      "We build web applications that are fast, scalable, and built to grow with your business. Whether you need a SaaS platform, an internal tool, or a complex web app, we handle the full stack \u2014 from architecture and design to deployment. Modern tech, clean code, rapid delivery.",
    tags: ["Next.js", "React", "Full-Stack", "SaaS"],
    features: [
      "Full-stack web application development",
      "SaaS platform architecture & build",
      "API design & development",
      "Database design & optimization",
      "Authentication & authorization systems",
      "Third-party integrations",
      "Performance optimization",
      "Deployment & DevOps setup",
    ],
    deliverables: [
      "Production-ready web application",
      "Source code with documentation",
      "API documentation",
      "Deployment pipeline setup",
      "Technical architecture docs",
    ],
    turnaround: "48\u201372 hours per sprint deliverable",
    relatedProjects: ["kalon", "temple", "parlay"],
    seo: {
      title: "Web App Development | Fast Turnaround Web Development | Barron & Folly",
      description:
        "Full-stack web app development with rapid turnarounds. Next.js, React, SaaS platforms, and custom web applications built by Barron & Folly.",
      keywords: [
        "web app development agency",
        "fast web development",
        "Next.js development agency",
        "SaaS development",
        "full-stack web development",
      ],
    },
  },
  {
    slug: "mobile-app-development",
    num: "/07",
    title: "Mobile App Development",
    desc: "Native and cross-platform mobile apps built fast. From concept to App Store, with design and development under one roof.",
    longDesc:
      "We design and build mobile apps that users love and businesses depend on. From iOS and Android native to cross-platform solutions with React Native, we handle the entire process \u2014 UX, UI, development, and launch. One team, one workflow, zero friction between design and code.",
    tags: ["React Native", "iOS", "Android", "Cross-Platform"],
    features: [
      "iOS & Android app development",
      "Cross-platform (React Native) development",
      "Mobile UX/UI design",
      "App Store optimization & submission",
      "Push notification systems",
      "Offline-first architecture",
      "Mobile analytics integration",
      "App performance optimization",
    ],
    deliverables: [
      "Production-ready mobile application",
      "App Store & Play Store listings",
      "Source code with documentation",
      "QA testing reports",
      "Analytics dashboard setup",
    ],
    turnaround: "48\u201372 hours per sprint deliverable",
    relatedProjects: ["kalon", "temple", "tethre"],
    seo: {
      title: "Mobile App Development | Fast Turnaround Apps | Barron & Folly",
      description:
        "Mobile app development with rapid turnarounds. iOS, Android, and cross-platform apps from concept to App Store launch by Barron & Folly.",
      keywords: [
        "mobile app development fast turnaround",
        "iOS app development agency",
        "React Native development",
        "cross-platform app development",
        "mobile app design and development",
      ],
    },
  },
  {
    slug: "landing-pages",
    num: "/08",
    title: "Landing Pages & Websites",
    desc: "High-conversion landing pages and marketing websites. Fast, responsive, SEO-optimized, and built to grow with you.",
    longDesc:
      "We build landing pages and marketing websites that convert visitors into customers. Every page is designed for speed, optimized for search engines, and built to look stunning on every device. Whether you need a single high-converting page or a full marketing site, we deliver fast.",
    tags: ["Landing Pages", "Webflow", "E-Commerce", "SEO"],
    features: [
      "High-conversion landing page design",
      "Responsive website development",
      "SEO optimization & technical setup",
      "E-commerce & Shopify integration",
      "CMS setup & content management",
      "Analytics & conversion tracking",
      "A/B testing implementation",
      "Speed & performance optimization",
    ],
    deliverables: [
      "Live, deployed website",
      "CMS documentation & training",
      "SEO audit & recommendations",
      "Analytics dashboard setup",
      "Performance benchmarks",
    ],
    turnaround: "48 hours per page",
    relatedProjects: ["parlay", "dime-beauty"],
    seo: {
      title: "Landing Page Design | Website Development | Barron & Folly",
      description:
        "High-conversion landing pages and marketing websites with 48-hour turnarounds. SEO-optimized, responsive, and built to convert by Barron & Folly.",
      keywords: [
        "landing page design agency",
        "website development fast turnaround",
        "high-conversion landing pages",
        "SEO website development",
        "marketing website agency",
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
