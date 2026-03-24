export interface IndustryPainPoint {
  title: string;
  description: string;
}

export interface IndustryStat {
  value: string;
  label: string;
}

export interface Industry {
  slug: string;
  num: string;
  title: string;
  headline: string;
  desc: string;
  longDesc: string;
  tags: string[];
  painPoints: IndustryPainPoint[];
  solutions: string[];
  stats: IndustryStat[];
  competitorCallout: {
    name: string;
    problem: string;
  };
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const industries: Industry[] = [
  {
    slug: "landscaping",
    num: "/01",
    title: "Landscaping",
    headline: "Roll-ups deserve better than Aspire.",
    desc: "PE-backed landscaping platforms are drowning in integration debt. Aspire by ServiceTitan costs a fortune and still can't unify 15 acquisitions. We can.",
    longDesc:
      "The landscaping industry is a $176B market with 30+ PE platforms racing to consolidate. Every acquisition adds another legacy system, another disconnected CRM, another ops team doing things their own way. Aspire by ServiceTitan charges premium rates while your portfolio companies still can't see unified data. Barron & Folly deploys the systems architecture, brand unification, and operational tooling that actually connects the dots — at a fraction of the cost.",
    tags: ["Roll-Up Integration", "Multi-Brand Unification", "Ops Standardization", "Portfolio Visibility", "CRM Consolidation"],
    painPoints: [
      {
        title: "15 acquisitions, 15 different systems",
        description: "Every tuck-in brings its own CRM, scheduling tool, and spreadsheet workflows. Nothing talks to anything. Your PE sponsor wants unified reporting yesterday.",
      },
      {
        title: "Aspire is expensive and still fragmented",
        description: "You're paying premium rates for ServiceTitan's Aspire platform, but each branch still runs its own way. The software doesn't solve the systems architecture problem.",
      },
      {
        title: "Brand chaos across the portfolio",
        description: "Acquired companies keep their old logos, websites, and customer-facing materials. There's no cohesive brand architecture, and it's hurting your market positioning.",
      },
      {
        title: "No real-time portfolio visibility",
        description: "The holding company can't see cross-brand performance, customer lifetime value, or operational metrics without manual spreadsheet consolidation every month.",
      },
    ],
    solutions: [
      "Unified CRM & workflow architecture across all portfolio brands",
      "Custom operational dashboards with real-time cross-brand visibility",
      "Brand consolidation system — scalable identity for acquisitions",
      "Automated reporting infrastructure for PE sponsor updates",
      "Integration layer connecting scheduling, billing, and field ops",
      "Customer portal standardization across all locations",
      "Multi-site web platform with location-specific landing pages",
      "Internal knowledge base and SOP automation",
    ],
    stats: [
      { value: "$176B", label: "Industry size" },
      { value: "30+", label: "PE platforms in market" },
      { value: "108", label: "Transactions in 2025" },
      { value: "70K+", label: "Aspire users paying premium" },
    ],
    competitorCallout: {
      name: "Aspire by ServiceTitan",
      problem: "35-45% of the LM150 use Aspire — managing $6.4B in revenue across 1,500 locations. They're paying enterprise rates for software that doesn't solve the integration problem. B&F builds the connective tissue Aspire can't.",
    },
    seo: {
      title: "Landscaping Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed landscaping platforms need unified systems, not more software licenses. We deploy CRM consolidation, brand architecture, and operational dashboards that connect your portfolio — faster and cheaper than Aspire.",
      keywords: [
        "landscaping roll up integration",
        "PE landscaping portfolio",
        "landscaping CRM consolidation",
        "Aspire alternative landscaping",
        "landscaping brand unification",
        "multi-location landscaping operations",
        "ServiceTitan alternative",
        "landscape company integration",
      ],
    },
  },
  {
    slug: "hvac-plumbing",
    num: "/02",
    title: "HVAC & Plumbing",
    headline: "Your portfolio runs on duct tape. We fix that.",
    desc: "PE-backed HVAC and plumbing roll-ups are scaling fast but operating on disconnected systems. ServiceTitan licenses are bleeding your margins. We build the infrastructure that actually integrates.",
    longDesc:
      "HVAC and plumbing roll-ups are the most active PE vertical in home services. But rapid acquisition creates rapid chaos — every company has its own dispatch system, pricing model, and customer database. ServiceTitan dominates the space but charges per-technician rates that crush margins at scale. Barron & Folly deploys unified systems architecture, cross-brand dashboards, and operational tooling that gives your holding company actual visibility and control.",
    tags: ["Dispatch Integration", "Technician Ops", "Service Agreement Systems", "Fleet Visibility", "Margin Optimization"],
    painPoints: [
      {
        title: "Per-technician software costs crushing margins",
        description: "ServiceTitan charges per tech, per month. At 500+ technicians across your portfolio, you're spending millions on software that still requires manual workarounds.",
      },
      {
        title: "Dispatch and scheduling chaos across brands",
        description: "Each acquired company runs its own dispatch system. Techs in the same city for different brands drive past each other's jobs. No route optimization across the portfolio.",
      },
      {
        title: "Service agreement revenue leaking",
        description: "Maintenance agreements are the recurring revenue PE loves, but each brand tracks them differently. No unified view of agreement penetration or renewal rates.",
      },
      {
        title: "No standardized pricing or quoting",
        description: "Every brand has its own pricing book. The same water heater install costs different amounts depending on which acquisition the customer called.",
      },
    ],
    solutions: [
      "Unified dispatch and scheduling architecture across brands",
      "Cross-portfolio performance dashboards for PE sponsors",
      "Service agreement tracking and renewal automation",
      "Standardized quoting and pricing system deployment",
      "Technician onboarding and certification tracking",
      "Multi-brand web presence with location-specific SEO",
      "Customer communication automation (booking, reminders, reviews)",
      "Fleet and inventory visibility across all locations",
    ],
    stats: [
      { value: "$150B+", label: "HVAC/Plumbing market" },
      { value: "50+", label: "PE platforms active" },
      { value: "$200+", label: "Per-tech/month for ServiceTitan" },
      { value: "78%", label: "Of transactions PE-backed" },
    ],
    competitorCallout: {
      name: "ServiceTitan",
      problem: "ServiceTitan's per-technician pricing model means costs scale linearly with every acquisition. At 500 techs, you're paying $100K+/month for a tool that still can't give you portfolio-wide visibility. B&F builds the layer above.",
    },
    seo: {
      title: "HVAC & Plumbing Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed HVAC and plumbing platforms need unified dispatch, standardized pricing, and real portfolio visibility — not more per-technician software costs. We build the integration layer.",
      keywords: [
        "HVAC roll up integration",
        "plumbing PE portfolio",
        "ServiceTitan alternative",
        "HVAC CRM consolidation",
        "plumbing dispatch integration",
        "home services roll up operations",
        "HVAC multi-location operations",
        "plumbing brand unification",
      ],
    },
  },
  {
    slug: "roofing",
    num: "/03",
    title: "Roofing",
    headline: "Scale the portfolio. Not the spreadsheets.",
    desc: "Roofing roll-ups are one of the fastest-growing PE verticals. But every acquisition adds another layer of operational chaos. AccuLynx and JobNimbus weren't built for multi-brand portfolios.",
    longDesc:
      "Roofing has become a PE magnet — storm restoration, insurance work, and recurring maintenance create predictable revenue at scale. But the technology stack hasn't kept up. AccuLynx, JobNimbus, and Roofr are designed for single-location operators, not 20-brand portfolios. Every acquisition brings its own CRM, its own sales process, and its own way of tracking jobs. Barron & Folly deploys the systems architecture that connects it all — unified reporting, standardized sales processes, and brand infrastructure that scales with every tuck-in.",
    tags: ["Storm Response Ops", "Insurance Workflow", "Sales Standardization", "Multi-Brand Architecture", "Job Costing"],
    painPoints: [
      {
        title: "CRM chaos across acquisitions",
        description: "Some brands use AccuLynx, others use JobNimbus, others use spreadsheets. There's no single source of truth for pipeline, job status, or customer history.",
      },
      {
        title: "Insurance and supplement workflows are manual",
        description: "Every branch handles insurance claims differently. Supplement tracking, photo documentation, and adjuster communication are all manual and inconsistent.",
      },
      {
        title: "No standardized sales process",
        description: "Each acquired company sells differently — different pitch decks, different financing options, different follow-up cadences. Win rates vary 3x across the portfolio.",
      },
      {
        title: "Storm response is reactive, not systematized",
        description: "When a hailstorm hits, it's scramble mode. No pre-built deployment playbook for canvassing, temporary labor, or rapid market entry.",
      },
    ],
    solutions: [
      "Unified CRM deployment replacing fragmented tools",
      "Insurance workflow automation — claims, supplements, documentation",
      "Standardized sales process and quoting system",
      "Storm response playbook and rapid deployment system",
      "Cross-portfolio job costing and margin dashboards",
      "Multi-brand web presence with storm/location targeting",
      "Automated review generation and reputation management",
      "Financing integration and customer portal",
    ],
    stats: [
      { value: "$65B+", label: "Roofing market size" },
      { value: "25+", label: "PE-backed platforms" },
      { value: "3x", label: "Win rate variance across brands" },
      { value: "$0", label: "Portfolio-wide CRM visibility" },
    ],
    competitorCallout: {
      name: "AccuLynx / JobNimbus",
      problem: "Built for single-location roofers, not PE portfolios. When you acquire company #15 on a different CRM, there's no migration path. B&F builds the unified layer these tools were never designed for.",
    },
    seo: {
      title: "Roofing Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed roofing platforms need unified CRM, standardized sales processes, and storm response systems — not single-location software. We deploy the integration infrastructure.",
      keywords: [
        "roofing roll up integration",
        "PE roofing portfolio",
        "roofing CRM consolidation",
        "AccuLynx alternative",
        "roofing multi-location operations",
        "roofing brand unification",
        "storm restoration operations",
        "roofing PE platform",
      ],
    },
  },
  {
    slug: "pest-control",
    num: "/04",
    title: "Pest Control",
    headline: "Recurring revenue is only valuable if you can see it.",
    desc: "Pest control roll-ups live and die on recurring service agreements. But when every acquisition tracks subscriptions differently, your portfolio's most valuable asset is invisible.",
    longDesc:
      "Pest control is the recurring revenue dream for PE — high-margin, subscription-based, and essential. But acquisition-driven growth creates a visibility nightmare. PestRoutes, FieldRoutes, and PestPac dominate individual operators, but none were designed for portfolio-level visibility across 20+ brands. Every acquisition adds another subscription database, another routing system, and another set of KPIs that don't align. Barron & Folly builds the infrastructure that turns fragmented subscription data into unified portfolio intelligence.",
    tags: ["Subscription Management", "Route Optimization", "Recurring Revenue Visibility", "Seasonal Scaling", "Customer Retention"],
    painPoints: [
      {
        title: "Subscription data trapped in silos",
        description: "Each brand tracks recurring customers differently — different billing cycles, different renewal dates, different cancellation definitions. Your actual MRR is a guess.",
      },
      {
        title: "Route optimization doesn't cross brands",
        description: "Two portfolio brands serve the same neighborhoods. Their techs drive right past each other because routing is brand-isolated.",
      },
      {
        title: "Seasonal scaling is chaotic",
        description: "Spring ramp-up means hiring, training, and deploying across all brands simultaneously. No standardized onboarding or territory management.",
      },
      {
        title: "Customer churn is measured differently everywhere",
        description: "One brand counts churn at 60 days, another at 90, another doesn't track it. The PE sponsor can't benchmark retention across the portfolio.",
      },
    ],
    solutions: [
      "Unified subscription and recurring revenue dashboard",
      "Cross-brand route optimization and territory mapping",
      "Standardized churn and retention metrics across portfolio",
      "Seasonal hiring and onboarding automation",
      "Multi-brand web presence with location-specific conversion funnels",
      "Automated customer lifecycle communication",
      "Service agreement renewal and upsell automation",
      "Portfolio-level KPI reporting for PE sponsors",
    ],
    stats: [
      { value: "$23B+", label: "Pest control market" },
      { value: "20+", label: "PE-backed platforms" },
      { value: "85%+", label: "Revenue from recurring" },
      { value: "40%+", label: "Use FieldRoutes/PestPac" },
    ],
    competitorCallout: {
      name: "FieldRoutes / PestPac",
      problem: "These platforms manage individual operator workflows but can't unify subscription data, routing, or retention metrics across a 20-brand portfolio. B&F builds the portfolio intelligence layer they don't offer.",
    },
    seo: {
      title: "Pest Control Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed pest control platforms need unified subscription visibility, cross-brand routing, and standardized retention metrics. We build the portfolio intelligence layer.",
      keywords: [
        "pest control roll up integration",
        "PE pest control portfolio",
        "pest control CRM consolidation",
        "FieldRoutes alternative",
        "pest control recurring revenue",
        "pest control multi-location",
        "PestPac alternative",
        "pest control PE platform",
      ],
    },
  },
  {
    slug: "electrical",
    num: "/05",
    title: "Electrical Services",
    headline: "Wire the portfolio together. Literally.",
    desc: "Electrical service roll-ups face unique complexity — licensing, permitting, and safety compliance vary by state. Your ops stack needs to handle regulatory chaos, not just scheduling.",
    longDesc:
      "Electrical services roll-ups operate in one of the most regulated home services verticals. Every state has different licensing requirements, permitting processes, and safety codes. When you acquire across state lines, the compliance burden multiplies while your scheduling and dispatch systems stay isolated. Housecall Pro and ServiceTitan handle single-market operations fine, but they weren't built for multi-state regulatory orchestration. Barron & Folly deploys the systems that handle both the operational and compliance layers.",
    tags: ["Compliance Tracking", "Multi-State Licensing", "Permit Automation", "Safety Systems", "Commercial/Residential Mix"],
    painPoints: [
      {
        title: "Multi-state licensing is a nightmare",
        description: "Every acquisition in a new state means new licenses, new CE requirements, and new compliance tracking. Nothing is centralized.",
      },
      {
        title: "Commercial and residential ops don't mix",
        description: "Some acquisitions are residential-focused, others are commercial. The scheduling, pricing, and project management needs are completely different.",
      },
      {
        title: "Permitting and inspection workflows are manual",
        description: "Every municipality has its own permitting process. Techs waste hours navigating different submission systems and tracking inspection schedules.",
      },
      {
        title: "No unified estimating across the portfolio",
        description: "Each brand estimates differently — different labor rates, different material markups, different overhead calculations. Margins are inconsistent.",
      },
    ],
    solutions: [
      "Centralized licensing and compliance tracking system",
      "Multi-state permit workflow automation",
      "Unified estimating and proposal system",
      "Dual-track scheduling for commercial and residential",
      "Safety incident tracking and reporting infrastructure",
      "Cross-portfolio performance dashboards",
      "Multi-brand web presence with service area targeting",
      "Technician certification and continuing education tracking",
    ],
    stats: [
      { value: "$225B+", label: "Electrical services market" },
      { value: "15+", label: "PE-backed platforms" },
      { value: "50", label: "States with different regs" },
      { value: "3-6mo", label: "Typical license processing" },
    ],
    competitorCallout: {
      name: "Housecall Pro / ServiceTitan",
      problem: "General-purpose field service tools that don't handle the regulatory complexity unique to electrical. Licensing, permitting, and safety compliance require purpose-built systems. B&F builds what off-the-shelf can't.",
    },
    seo: {
      title: "Electrical Services Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed electrical service platforms need multi-state compliance tracking, unified estimating, and regulatory automation. We build the systems that handle operational and compliance complexity.",
      keywords: [
        "electrical services roll up",
        "PE electrical portfolio",
        "electrical CRM consolidation",
        "electrical licensing compliance",
        "electrical multi-state operations",
        "electrical brand unification",
        "electrical contractor PE",
        "electrical services integration",
      ],
    },
  },
  {
    slug: "commercial-cleaning",
    num: "/06",
    title: "Commercial Cleaning",
    headline: "Clean operations start with clean systems.",
    desc: "Commercial cleaning roll-ups are margin-tight and labor-intensive. When every acquisition runs its own scheduling, quality tracking, and client communication differently, profitability bleeds out.",
    longDesc:
      "Commercial cleaning and janitorial services roll-ups compete on two things: consistency and margin. PE sponsors love the recurring revenue from commercial contracts, but every acquisition adds another layer of operational fragmentation. Swept, CleanTelligent, and Janitorial Manager handle single-operator needs but can't unify quality tracking, labor scheduling, or client communication across a 15-brand portfolio. Barron & Folly deploys the systems that standardize operations, protect margins, and give the holding company real visibility.",
    tags: ["Contract Management", "Quality Assurance", "Labor Scheduling", "Client Retention", "Margin Protection"],
    painPoints: [
      {
        title: "Labor scheduling across 15 brands is chaos",
        description: "Each acquisition manages its own shift scheduling, callout procedures, and backup staffing. Labor is your biggest cost and it's managed in silos.",
      },
      {
        title: "Quality inspections aren't standardized",
        description: "Some brands use apps, some use clipboards, some don't inspect at all. Client complaints surface inconsistently. No portfolio-level quality metrics.",
      },
      {
        title: "Contract pricing is inconsistent",
        description: "The same square footage in the same city gets quoted differently depending on which brand the client called. Margin variance is wild.",
      },
      {
        title: "Client retention is unmeasured",
        description: "Commercial contracts churn quietly. No standardized NPS, no automated satisfaction surveys, no early warning system for at-risk accounts.",
      },
    ],
    solutions: [
      "Unified labor scheduling and shift management system",
      "Standardized quality inspection and scoring platform",
      "Contract pricing engine with margin guardrails",
      "Client satisfaction automation and churn early warning",
      "Cross-portfolio labor utilization dashboards",
      "Multi-brand web presence with commercial targeting",
      "Automated onboarding for new facility contracts",
      "Supply chain and inventory management across locations",
    ],
    stats: [
      { value: "$90B+", label: "Commercial cleaning market" },
      { value: "15+", label: "PE-backed platforms" },
      { value: "60%+", label: "Labor cost ratio" },
      { value: "25%", label: "Avg annual contract churn" },
    ],
    competitorCallout: {
      name: "Swept / CleanTelligent",
      problem: "Built for single-operator janitorial companies, not multi-brand portfolios. They handle task management but can't unify labor scheduling, quality metrics, or contract pricing across acquisitions. B&F builds the portfolio layer.",
    },
    seo: {
      title: "Commercial Cleaning Roll-Up Operations | PE Portfolio Integration | Barron & Folly",
      description:
        "PE-backed commercial cleaning platforms need unified scheduling, standardized quality metrics, and contract pricing consistency. We build the operational infrastructure that protects margins at scale.",
      keywords: [
        "commercial cleaning roll up",
        "PE janitorial portfolio",
        "cleaning CRM consolidation",
        "janitorial operations integration",
        "commercial cleaning multi-location",
        "cleaning brand unification",
        "janitorial PE platform",
        "facilities management roll up",
      ],
    },
  },
];

export function getIndustryBySlug(slug: string): Industry | undefined {
  return industries.find((i) => i.slug === slug);
}

export function getAllIndustrySlugs(): string[] {
  return industries.map((i) => i.slug);
}
