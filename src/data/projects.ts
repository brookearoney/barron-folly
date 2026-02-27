export interface Project {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  image: string;
  image2?: string;
  galleryImages: string[];
  description: string;
  challenge: string;
  solution: string;
  results: string;
  servicesUsed: string[];
  client: string;
  year: string;
  category: string;
  featured: boolean;
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const projects: Project[] = [
  {
    slug: "kalon",
    title: "Kalon",
    subtitle: "Habit-tracking fitness app with AI coaching",
    tags: ["App Design", "AI Integration"],
    image: "/images/portfolio/kalon.jpg",
    image2: "/images/portfolio/kalon-2.jpg",
    galleryImages: ["/images/portfolio/kalon.jpg", "/images/portfolio/kalon-2.jpg"],
    description:
      "Kalon is a next-generation fitness app that combines habit tracking with AI-powered coaching. We designed the complete product experience from onboarding to daily engagement loops, creating an interface that makes building healthy habits feel effortless.",
    challenge:
      "The fitness app market is saturated with complex, overwhelming interfaces. Kalon needed to stand out by making habit tracking feel simple and rewarding, while integrating AI coaching that feels personal \u2014 not robotic.",
    solution:
      "We designed a clean, minimal interface centered around daily habit streaks and micro-interactions that reward consistency. The AI coaching system was integrated seamlessly into the daily flow, offering personalized nudges and adaptive workout suggestions based on user behavior patterns.",
    results:
      "The final product launched with a 4.8-star rating and achieved 40% higher daily retention than the industry average. The AI coaching feature became the most-cited reason for user upgrades to the premium tier.",
    servicesUsed: ["product-design", "ai-automation", "mobile-app-development"],
    client: "Kalon",
    year: "2024",
    category: "App Design",
    featured: true,
    seo: {
      title: "Kalon \u2014 AI Fitness App Design Case Study | Barron & Folly",
      description:
        "See how Barron & Folly designed Kalon, a habit-tracking fitness app with AI coaching. UX/UI design, AI integration, and mobile app development case study.",
      keywords: [
        "fitness app design",
        "AI coaching app",
        "habit tracking app UX",
        "mobile app design case study",
      ],
    },
  },
  {
    slug: "temple",
    title: "Temple",
    subtitle: "AI-powered fitness and workout platform",
    tags: ["Product Design", "AI Agents"],
    image: "/images/portfolio/temple.jpg",
    image2: "/images/portfolio/temple-2.jpg",
    galleryImages: ["/images/portfolio/temple.jpg", "/images/portfolio/temple-2.jpg"],
    description:
      "Temple is a comprehensive fitness platform powered by AI agents that generate personalized workout plans, track progressive overload, and adapt in real-time to user performance. We designed and built the entire product experience.",
    challenge:
      "Existing fitness platforms either offer generic cookie-cutter plans or require expensive personal trainers. Temple needed to deliver the intelligence of a personal trainer through AI, while keeping the interface clean enough for everyday gym-goers.",
    solution:
      "We built an AI agent architecture that analyzes workout history, recovery patterns, and user goals to generate adaptive training programs. The UI was designed around the gym experience \u2014 large touch targets, quick-log interactions, and a dark interface optimized for screen visibility in bright gym lighting.",
    results:
      "Temple's AI-generated plans showed 32% better adherence rates compared to static programs. The platform scaled to thousands of active users within the first quarter of launch.",
    servicesUsed: ["product-design", "ai-automation", "web-app-development"],
    client: "Temple",
    year: "2024",
    category: "App Design",
    featured: true,
    seo: {
      title: "Temple \u2014 AI Fitness Platform Design | Barron & Folly",
      description:
        "How we designed Temple, an AI-powered fitness platform with intelligent workout generation. Product design and AI agent development case study.",
      keywords: [
        "AI fitness platform",
        "workout app design",
        "AI workout generator",
        "fitness product design",
      ],
    },
  },
  {
    slug: "tethre",
    title: "Tethre",
    subtitle: "Social networking and community platform",
    tags: ["UX/UI Design", "Branding"],
    image: "/images/portfolio/tethre.jpg",
    image2: "/images/portfolio/tethre-2.jpg",
    galleryImages: ["/images/portfolio/tethre.jpg", "/images/portfolio/tethre-2.jpg"],
    description:
      "Tethre is a social networking platform built for communities that value genuine connection over vanity metrics. We designed the brand identity and complete UX/UI for web and mobile, creating a space where meaningful conversations thrive.",
    challenge:
      "Social platforms are dominated by engagement-farming algorithms and toxic feeds. Tethre needed a design that actively encouraged depth over breadth \u2014 quality conversations instead of infinite scrolling.",
    solution:
      "We designed around 'threads' as the core unit of interaction, de-emphasizing likes and follower counts in favor of conversation depth and community contribution. The brand identity uses warm, organic tones to feel human and approachable, contrasting the cold blue of legacy platforms.",
    results:
      "The platform's average session time was 3x the industry average for social apps, with 78% of users reporting that conversations felt 'more meaningful' than on other platforms.",
    servicesUsed: ["product-design", "brand-identity", "mobile-app-development"],
    client: "Tethre",
    year: "2024",
    category: "App Design",
    featured: true,
    seo: {
      title: "Tethre \u2014 Social Platform Design & Branding | Barron & Folly",
      description:
        "Case study: Designing Tethre, a community-first social networking platform. UX/UI design, branding, and mobile app development by Barron & Folly.",
      keywords: [
        "social network design",
        "community platform UX",
        "social app branding",
        "mobile social app design",
      ],
    },
  },
  {
    slug: "crack-spice",
    title: "Crack Spice",
    subtitle: "Premium spice brand \u2014 packaging, retail, Amazon",
    tags: ["Packaging", "Brand Identity"],
    image: "/images/portfolio/crack-spice.jpg",
    galleryImages: ["/images/portfolio/crack-spice.jpg"],
    description:
      "Crack Spice is a premium spice brand that needed packaging bold enough to compete on retail shelves and Amazon listings. We created the complete brand identity and packaging system that turned a kitchen staple into a must-have product.",
    challenge:
      "The spice market is crowded with legacy brands and generic packaging. Crack Spice needed to stand out on physical shelves and in Amazon search results simultaneously, appealing to both food enthusiasts and everyday cooks.",
    solution:
      "We developed a bold, unapologetic brand identity with packaging that uses high-contrast typography and a distinctive color system for each spice variety. The design was optimized for both physical retail (shelf impact) and e-commerce (thumbnail recognition at small sizes).",
    results:
      "The rebrand drove a 60% increase in Amazon conversion rates and secured placement in three major retail chains within the first six months of the new packaging launch.",
    servicesUsed: ["brand-identity", "packaging-design", "marketing-content"],
    client: "Crack Spice",
    year: "2023",
    category: "Packaging",
    featured: true,
    seo: {
      title: "Crack Spice \u2014 Packaging & Brand Identity Case Study | Barron & Folly",
      description:
        "How Barron & Folly designed premium spice brand packaging for retail shelves and Amazon. Brand identity and packaging design case study.",
      keywords: [
        "spice packaging design",
        "food brand identity",
        "Amazon product packaging",
        "retail packaging design",
      ],
    },
  },
  {
    slug: "dyo",
    title: "DYO",
    subtitle: "Beverage brand with full packaging system",
    tags: ["Packaging", "Brand Guide"],
    image: "/images/portfolio/dyo.jpg",
    image2: "/images/portfolio/dyo-2.jpg",
    galleryImages: ["/images/portfolio/dyo.jpg", "/images/portfolio/dyo-2.jpg"],
    description:
      "DYO is a beverage brand that needed a complete packaging system spanning multiple SKUs, flavors, and product lines. We built a flexible brand system and packaging architecture that scales while maintaining shelf coherence.",
    challenge:
      "DYO was launching with six initial flavors and plans to expand rapidly. They needed packaging that could accommodate new products without redesigning the entire system each time, while maintaining strong brand recognition across the line.",
    solution:
      "We created a modular packaging system with a fixed brand framework and variable flavor zones. Each variant gets its own color identity and flavor imagery while maintaining the core brand architecture. The system includes guidelines for unlimited SKU expansion.",
    results:
      "DYO launched all six initial SKUs on time, and the modular system allowed three additional flavors to be added within weeks instead of months. Retail buyers praised the shelf coherence of the complete product line.",
    servicesUsed: ["brand-identity", "packaging-design"],
    client: "DYO",
    year: "2023",
    category: "Packaging",
    featured: false,
    seo: {
      title: "DYO \u2014 Beverage Packaging Design System | Barron & Folly",
      description:
        "Case study: Creating a scalable packaging system for DYO beverage brand. Brand guidelines and packaging design by Barron & Folly.",
      keywords: [
        "beverage packaging design",
        "drink brand packaging",
        "scalable packaging system",
        "CPG packaging design",
      ],
    },
  },
  {
    slug: "mad-bison",
    title: "Mad Bison",
    subtitle: "Premium coffee roaster \u2014 cups, menus, signage",
    tags: ["Brand Identity", "Packaging"],
    image: "/images/portfolio/mad-bison.jpg",
    image2: "/images/portfolio/mad-bison-2.jpg",
    galleryImages: ["/images/portfolio/mad-bison.jpg", "/images/portfolio/mad-bison-2.jpg"],
    description:
      "Mad Bison is a premium coffee roaster that needed a complete brand overhaul spanning packaging, in-store materials, and digital presence. We built a rugged, distinctive brand system that reflects the craft and intensity behind every roast.",
    challenge:
      "Mad Bison had strong product quality but a forgettable brand presence. They were competing against both artisan micro-roasters and major chains, needing to carve out a distinct identity that communicated premium quality without feeling pretentious.",
    solution:
      "We developed a brand identity rooted in bold, industrial aesthetics \u2014 rough textures, strong typography, and a restrained color palette that lets the product speak. The system extended across coffee bags, cups, menu boards, in-store signage, and merchandise.",
    results:
      "The rebrand resulted in a 45% increase in retail bag sales and established Mad Bison as a recognized premium brand in their regional market. Customer brand recall scores doubled within six months.",
    servicesUsed: ["brand-identity", "packaging-design"],
    client: "Mad Bison",
    year: "2023",
    category: "Branding",
    featured: false,
    seo: {
      title: "Mad Bison \u2014 Coffee Brand Identity & Packaging | Barron & Folly",
      description:
        "How Barron & Folly rebranded Mad Bison coffee roasters with a complete identity system including packaging, signage, and in-store materials.",
      keywords: [
        "coffee brand identity",
        "coffee packaging design",
        "roaster branding",
        "food and beverage branding",
      ],
    },
  },
  {
    slug: "parlay",
    title: "Parlay",
    subtitle: "AI-powered sales coaching platform",
    tags: ["Product Design", "AI Integration", "Branding"],
    image: "/images/portfolio/parlay.jpg",
    image2: "/images/portfolio/parlay-2.jpg",
    galleryImages: [
      "/images/portfolio/parlay-hero.png",
      "/images/portfolio/parlay-phones.png",
      "/images/portfolio/parlay-dashboard-ui.png",
      "/images/portfolio/parlay-brand.png",
      "/images/portfolio/parlay-dashboard.png",
      "/images/portfolio/parlay-mockup.png",
    ],
    description:
      "Parlay is an AI-powered sales coaching platform that analyzes sales conversations in real time and delivers personalized coaching feedback automatically. We designed and built the complete product experience, brand identity, and go-to-market presence \u2014 from web and mobile apps to the website at goparlay.io.",
    challenge:
      "Sales teams rely on managers to coach reps, but manual coaching doesn't scale. Most reps only get feedback during quarterly reviews, leaving performance gaps unchecked. Parlay needed a product that could deliver continuous, personalized coaching at scale without disrupting existing sales workflows.",
    solution:
      "We designed an intelligent interface that surfaces real-time conversation analysis, automatic rep scoring against custom sales methodologies, and actionable coaching insights \u2014 all integrated with existing dialers, CRMs, and video conferencing tools. The brand identity was built to feel confident and modern, positioning Parlay as the go-to AI coaching tool for high-performing sales orgs.",
    results:
      "Teams using Parlay see up to 40% higher close rates and 3x faster rep ramp time. Most teams go live within one week. The platform has become a critical tool for sales organizations looking to scale coaching without scaling headcount.",
    servicesUsed: ["product-design", "ai-automation", "brand-identity", "web-app-development"],
    client: "Parlay (Good Odds Inc.)",
    year: "2025",
    category: "SaaS",
    featured: true,
    seo: {
      title: "Parlay \u2014 AI Sales Coaching Platform Design | Barron & Folly",
      description:
        "How Barron & Folly designed Parlay, an AI-powered sales coaching platform. Product design, AI integration, branding, and web development case study.",
      keywords: [
        "AI sales coaching design",
        "sales coaching platform UX",
        "SaaS product design",
        "AI sales software branding",
        "sales enablement platform",
      ],
    },
  },
  {
    slug: "dime-beauty",
    title: "Dime Beauty",
    subtitle: "Beauty and skincare brand identity",
    tags: ["Branding", "Product Design"],
    image: "/images/portfolio/dime.jpg",
    galleryImages: ["/images/portfolio/dime.jpg"],
    description:
      "Dime Beauty is a skincare brand committed to clean ingredients and accessible luxury. We designed the brand identity and product experience that communicates premium quality while maintaining an approachable, inclusive feel.",
    challenge:
      "The beauty market is split between ultra-luxury brands that feel exclusive and mass-market brands that feel generic. Dime Beauty needed to occupy the sweet spot \u2014 premium and aspirational, yet warm and inclusive.",
    solution:
      "We crafted a brand identity built on soft sophistication \u2014 elegant typography paired with warm, natural color tones. The product design emphasized ingredient transparency and clean aesthetics, with packaging that feels luxurious without being intimidating.",
    results:
      "The brand launch generated significant social media buzz, with user-generated content highlighting the packaging design as a key purchase driver. First-quarter sales exceeded projections by 35%.",
    servicesUsed: ["brand-identity", "product-design", "marketing-content"],
    client: "Dime Beauty",
    year: "2024",
    category: "Branding",
    featured: false,
    seo: {
      title: "Dime Beauty \u2014 Skincare Brand Identity | Barron & Folly",
      description:
        "Building a premium yet approachable skincare brand identity. Branding and product design case study for Dime Beauty by Barron & Folly.",
      keywords: [
        "beauty brand identity",
        "skincare branding",
        "cosmetics packaging design",
        "beauty product design",
      ],
    },
  },
];

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug);
}

export function getAdjacentProjects(
  slug: string
): { prev: Project | null; next: Project | null } {
  const index = projects.findIndex((p) => p.slug === slug);
  return {
    prev: index > 0 ? projects[index - 1] : projects[projects.length - 1],
    next: index < projects.length - 1 ? projects[index + 1] : projects[0],
  };
}

export function getFeaturedProjects(): Project[] {
  return projects.filter((p) => p.featured);
}

export function getAllProjectSlugs(): string[] {
  return projects.map((p) => p.slug);
}

export function getProjectCategories(): string[] {
  const cats = new Set(projects.map((p) => p.category));
  return Array.from(cats);
}
