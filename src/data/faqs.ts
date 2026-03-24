export interface FaqItem {
  question: string;
  answer: string;
}

export interface FaqCategory {
  title: string;
  slug: string;
  description: string;
  faqs: FaqItem[];
}

/* ─── General / Company ─── */
export const generalFaqs: FaqItem[] = [
  {
    question: "What is Barron & Folly?",
    answer:
      "Barron & Folly is an agentic product agency that replaces fragmented teams with an autonomous execution engine. AI agents handle velocity — building, deploying, and iterating. Senior product oversight handles nuance — strategy, architecture, and creative direction. You get infrastructure that scales without the overhead.",
  },
  {
    question: "How is this different from a traditional agency?",
    answer:
      "Traditional agencies rely on large teams, long timelines, and bloated proposals. We deploy AI agents alongside senior oversight to compress months into days. No discovery phases. No scope creep. No 6-week kickoff cycles. You subscribe, we ship.",
  },
  {
    question: "Do I get a dedicated team?",
    answer:
      "You get a dedicated execution engine. Senior oversight stays consistent across your engagement, while AI agents scale up or down based on your task queue. Upper tiers (Titanium, Tungsten) include dedicated strategist oversight for deeper partnership.",
  },
  {
    question: "What industries do you work with?",
    answer:
      "Growth-stage companies, multi-location operators, PE-backed portfolios, SaaS companies, industrial and defense organizations, consumer brands, and founders building internal tools. If you have a backlog and need things built fast, we're the right fit.",
  },
];

/* ─── Services ─── */
export const servicesFaqs: FaqItem[] = [
  {
    question: "What does 'agentic execution' actually mean?",
    answer:
      "We deploy autonomous AI agents that handle code-heavy tasks — building pages, configuring automations, setting up integrations, generating content, creating dashboards, and deploying internal tools. Senior product oversight ensures everything meets production standards.",
  },
  {
    question: "What's the typical turnaround time?",
    answer:
      "Most individual deliverables ship within 48 hours. Complex builds are broken into sprint cycles with weekly shipping cadence. The AI-led execution model compresses timelines that traditionally take months into days.",
  },
  {
    question: "Can you handle both design and development?",
    answer:
      "Yes. Our three pillars — Agentic Execution, Systems Architecture, and Brand & Experience — cover the full spectrum. From custom UX design and brand systems to full-stack development, automations, and internal tooling. Everything ships under one roof.",
  },
  {
    question: "What if I only need one type of service?",
    answer:
      "That's exactly how most clients start. Subscribe at any tier and queue the tasks you need — whether that's landing pages, CRM automations, or a complete brand overhaul. You're never locked into a predefined scope.",
  },
  {
    question: "How do revisions work?",
    answer:
      "Revisions flow through the same async queue as new tasks. There's no cap on revisions — if something needs adjustment, queue it up. AI agents handle rapid iteration while senior oversight ensures alignment with your goals.",
  },
];

/* ─── Pricing ─── */
export const pricingFaqs: FaqItem[] = [
  {
    question: "How does the subscription model work?",
    answer:
      "Choose a tier and your execution engine deploys immediately. Tasks flow through an async queue — AI agents handle execution while senior oversight ensures quality. No contracts, pause or cancel anytime. No project chaos. Predictable cost. Ongoing execution.",
  },
  {
    question: "What's the difference between tiers?",
    answer:
      "Lower tiers (Copper, Steel) are AI-dominant execution — fast, task-driven output focused on building and standardizing. Upper tiers (Titanium, Tungsten) introduce human-led nuance: custom architecture, brand strategy, dedicated oversight, and command-level infrastructure partnership. From execution to command — deploy the layer your business requires.",
  },
  {
    question: "Who is this for?",
    answer:
      "Growth-stage companies, multi-location operators, PE-backed portfolios, SaaS companies scaling quickly, industrial and defense organizations, consumer brands expanding channels, founders building internal tools, and any team drowning in backlog. Anyone who says: 'we need this built yesterday.'",
  },
  {
    question: "How fast do things ship?",
    answer:
      "Most individual deliverables ship within days, not months. Complex builds are broken into sprint cycles with weekly shipping cadence. The AI-led execution model massively compresses timelines that traditionally take months.",
  },
  {
    question: "Can I upgrade or downgrade my tier?",
    answer:
      "Yes. Move between tiers as your needs evolve. Start with Copper for raw execution speed, scale to Tungsten when you need full infrastructure partnership. Your billing adjusts immediately.",
  },
  {
    question: "Is there a contract or minimum commitment?",
    answer:
      "No contracts. No minimum commitment. Subscribe month-to-month and cancel anytime. We earn your business every sprint cycle, not through legal lock-in.",
  },
];

/* ─── About ─── */
export const aboutFaqs: FaqItem[] = [
  {
    question: "Where is Barron & Folly based?",
    answer:
      "We're based in American Fork, Utah. But our execution engine is remote-first — we deploy systems and infrastructure for companies across the United States and beyond.",
  },
  {
    question: "How big is the team?",
    answer:
      "We're lean by design. Senior product oversight handles strategy, architecture, and creative direction. AI agents handle the velocity — building, iterating, and deploying at scale. This structure lets us outship teams 10x our size.",
  },
  {
    question: "What's the company's background?",
    answer:
      "Barron & Folly was built because growing companies deserve better than fragmented agencies, overloaded freelancers, and months of waiting. We've deployed systems, products, and brand infrastructure for growth-stage companies, multi-location operators, and PE-backed portfolios across industries.",
  },
  {
    question: "How do you ensure quality with AI-led execution?",
    answer:
      "Every deliverable passes through senior product oversight before it ships. AI handles the heavy lifting — code, content, configuration — while humans handle the nuance — strategy, architecture, creative judgment. Both run in parallel, not in sequence.",
  },
];

/* ─── Work / Portfolio ─── */
export const workFaqs: FaqItem[] = [
  {
    question: "Can I see examples relevant to my industry?",
    answer:
      "Our portfolio spans SaaS platforms, multi-location operators, consumer brands, and industrial organizations. If you don't see your exact industry, reach out — we likely have relevant case studies that aren't publicly listed.",
  },
  {
    question: "How long do projects typically take?",
    answer:
      "Individual deliverables ship in days. Full system builds — like a complete web platform or brand infrastructure overhaul — typically deploy in 2-4 week sprint cycles. The AI-led model compresses what traditionally takes months.",
  },
  {
    question: "Do you build custom solutions or use templates?",
    answer:
      "Everything is custom-built for your specific needs. No templates, no cookie-cutter solutions. Our AI agents generate original code, designs, and systems architecture tailored to your business requirements.",
  },
  {
    question: "What happens after a project launches?",
    answer:
      "That's the beauty of the subscription model. After launch, your execution engine keeps running — handling iterations, new features, optimizations, and expansions. There's no 'project end' — just continuous deployment.",
  },
];

/* ─── Industries ─── */
export const industryFaqs: FaqItem[] = [
  {
    question: "Do you only work with PE-backed roll-ups?",
    answer:
      "No — but roll-ups are our sweet spot. Any multi-location service business dealing with integration complexity, brand fragmentation, or operational chaos is a fit. That said, PE-backed portfolios see the fastest ROI because we compress integration timelines that directly impact EBITDA multiples.",
  },
  {
    question: "How is this different from just buying ServiceTitan or Aspire?",
    answer:
      "ServiceTitan, Aspire, FieldRoutes, and similar tools manage individual location workflows — scheduling, dispatch, invoicing. They don't solve the portfolio-level integration problem: unified data across brands, standardized processes, cross-brand visibility, and brand infrastructure. We build the connective tissue these tools were never designed for — often at a fraction of the per-user licensing cost.",
  },
  {
    question: "How fast can you integrate a new acquisition?",
    answer:
      "Most acquisitions can be onboarded onto your standardized systems within 2-4 weeks using our AI-powered execution model. Traditional consultancies quote 3-6 months for the same work. We compress timelines because AI agents handle the heavy lifting while senior oversight ensures nothing breaks.",
  },
  {
    question: "What if each portfolio company uses different software?",
    answer:
      "That's exactly the problem we solve. We build an integration and data layer that sits above your existing tools — unifying data from ServiceTitan, Housecall Pro, spreadsheets, and everything in between. You don't have to rip and replace on day one. We normalize the chaos first, then standardize over time.",
  },
  {
    question: "Do you replace our existing field service software?",
    answer:
      "Not necessarily. We can build on top of your existing tools or deploy replacements — it depends on your situation. The goal is unified operations and visibility, not software loyalty. If your current tools work at the location level, we build the portfolio layer above them.",
  },
  {
    question: "What does PE-native reporting mean?",
    answer:
      "We build dashboards and reporting infrastructure designed for how PE sponsors actually consume data — portfolio-level KPIs, brand-level drill-downs, cohort analysis, board-ready exports, and the metrics that move valuation multiples. Not just operational reports that field managers use.",
  },
];

/* ─── All categories for the main FAQ page ─── */
export const faqCategories: FaqCategory[] = [
  {
    title: "General",
    slug: "general",
    description: "What Barron & Folly is and how we operate.",
    faqs: generalFaqs,
  },
  {
    title: "Services",
    slug: "services",
    description: "What we deploy and how it works.",
    faqs: servicesFaqs,
  },
  {
    title: "Pricing",
    slug: "pricing",
    description: "Tiers, billing, and subscriptions.",
    faqs: pricingFaqs,
  },
  {
    title: "About",
    slug: "about",
    description: "The team, the mission, the approach.",
    faqs: aboutFaqs,
  },
  {
    title: "Portfolio",
    slug: "portfolio",
    description: "Our work and project process.",
    faqs: workFaqs,
  },
  {
    title: "Industries",
    slug: "industries",
    description: "How we work with PE-backed roll-ups.",
    faqs: industryFaqs,
  },
];

/* ─── Flat array for JSON-LD ─── */
export const allFaqs: FaqItem[] = faqCategories.flatMap((cat) => cat.faqs);
