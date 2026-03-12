export interface BlogSection {
  heading?: string;
  content: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  featured: boolean;
  author: string;
  heroImage: string;
  sections: BlogSection[];
  relatedSlugs: string[];
  seo: {
    title: string;
    description: string;
    keywords: string[];
  };
}

export const blogPosts: BlogPost[] = [
  {
    slug: "claude-code-model-guide-opus-sonnet-haiku",
    title:
      "Claude Code and AI Model Selection: A Practical Guide to Opus, Sonnet, and Haiku",
    excerpt:
      "Not every AI task requires the same model. Claude Code gives you access to three distinct model tiers — Opus, Sonnet, and Haiku — each optimized for different types of work. Understanding when to use each one is the difference between burning tokens and building efficiently.",
    category: "Technology",
    date: "2026-03-11",
    readTime: "9 min read",
    featured: true,
    author: "Barron & Folly",
    heroImage: "/images/blog/claude-code-model-guide.png",
    sections: [
      {
        content:
          'AI coding tools have evolved past the point of novelty. They\'re operational infrastructure now. But most teams treat every AI interaction the same way — throwing their most expensive model at every task regardless of complexity. That\'s like hiring a senior architect to change a lightbulb. <strong>Claude Code</strong>, Anthropic\'s terminal-based AI coding agent, solves this by giving you access to three model tiers — Opus, Sonnet, and Haiku — each designed for a fundamentally different class of work. The teams and <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">execution engines</a> that understand model selection ship faster, spend less, and build more reliable systems than those running everything through a single model.',
      },
      {
        heading: "What Is Claude Code",
        content:
          'Claude Code is an agentic coding tool that lives in your terminal. Unlike browser-based AI assistants that operate in isolation, Claude Code connects directly to your codebase. It reads your files, understands your project structure, writes and edits code, runs shell commands, manages git workflows, and iterates until the task is complete — all through natural language conversation. You install it, authenticate through your browser, navigate to any project directory, and run <strong>claude</strong> in your terminal. From there, you\'re working with an AI agent that has full context of your repository. It\'s not autocomplete. It\'s not a chatbot pasted into a code editor. It\'s an autonomous execution agent that operates inside your actual development environment. For teams building <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">production systems</a>, this distinction matters. Claude Code doesn\'t just suggest — it executes.',
      },
      {
        heading: "The Three Model Tiers Explained",
        content:
          'Anthropic\'s Claude model family consists of three tiers, each optimized for different workloads. <strong>Opus</strong> is the most capable model in the family. It delivers the deepest reasoning, handles the most complex multi-step problems, and excels at tasks where missing an edge case costs hours of debugging downstream. It\'s slower and more expensive, but when you need comprehensive analysis or architectural decisions, Opus is the model that catches what others miss. <strong>Sonnet</strong> is the balanced workhorse. Anthropic\'s own recommendation is to start with Sonnet if you\'re unsure which model to use. It handles the vast majority of coding tasks — building features, refactoring, debugging, writing tests — with strong reasoning and fast enough response times for real-time collaboration. For most daily development work, Sonnet delivers roughly ninety percent of Opus\'s capability at significantly lower cost. <strong>Haiku</strong> is the speed specialist. It\'s the fastest and most affordable model in the lineup, purpose-built for high-throughput, well-defined tasks where execution speed matters more than deep analysis. Scaffolding components, generating boilerplate, running simple transformations, and handling classification tasks are where Haiku shines.',
      },
      {
        heading: "When to Use Each Model in Practice",
        content:
          'The biggest efficiency gain in any AI-assisted workflow is routing each task to the right model. Here\'s how that breaks down in practice. <strong>Use Opus for architectural decisions.</strong> When you\'re designing system architecture, planning a major refactor, reviewing complex pull requests before merge, or debugging issues that span multiple files and layers of abstraction — Opus is your safety net. The extra reasoning depth prevents downstream mistakes that cost far more than the token difference. <strong>Use Sonnet for daily development.</strong> Feature implementation, bug fixes, writing tests, code reviews, documentation, and most multi-file edits fall squarely in Sonnet\'s range. It\'s responsive enough for real-time iteration and capable enough that most problems won\'t outgrow it. This is the model you\'ll use eighty percent of the time. <strong>Use Haiku for defined, repetitive tasks.</strong> Generating boilerplate, scaffolding UI components from established patterns, bulk file transformations, quick data extraction, and any task where the solution space is clear and speed matters more than depth. Haiku excels when you know exactly what you need and just need it done fast. The pattern is simple: <strong>Haiku builds the scaffolding. Sonnet writes the logic. Opus reviews the architecture.</strong> Teams that internalize this model produce more output at lower cost than teams that default to a single model for everything.',
      },
      {
        heading: "Essential Claude Code Features for New Users",
        content:
          '<img src="/images/blog/claude-code-model-guide-inline.png" alt="A sleek monitor displaying code in a dark room with amber glow — representing the Claude Code development experience" class="w-full rounded-xl mb-8 border border-[#2A2A26]/30" />Beyond model selection, Claude Code includes features that compound your effectiveness once you learn to use them. <strong>Plan Mode</strong> is one of the most important features for new users. When you enter Plan Mode, Claude analyzes the problem, outlines a step-by-step approach, shows its reasoning, and waits for your approval before executing. This is critical for complex tasks where you want visibility into the approach before code gets written. <strong>CLAUDE.md</strong> is a markdown file at your project root that tells Claude Code how your project works — think of it as onboarding documentation for your AI agent. It should include your project structure, coding conventions, testing patterns, and deployment rules. Run <strong>/init</strong> to generate a starter version, then refine it as your project evolves. <strong>/clear</strong> resets your conversation context without losing your CLAUDE.md configuration. Use it often — every time you switch tasks, clear the context so you\'re not wasting tokens on irrelevant history. <strong>Subagents</strong> allow Claude Code to spawn parallel workers for independent tasks, dramatically accelerating multi-file operations. And <strong>memory</strong> lets Claude automatically record and recall important patterns across sessions, building institutional knowledge over time. These aren\'t convenience features. They\'re <a href="/blog/from-backlog-to-deployment-how-autonomous-execution-works" class="text-[#FF8400] hover:underline">workflow infrastructure</a> that turns a capable AI model into a predictable execution system.',
      },
      {
        heading: "Model Selection in Agentic Workflows",
        content:
          'Model selection becomes even more powerful in the context of <a href="/blog/how-ai-agents-are-replacing-traditional-dev-teams" class="text-[#FF8400] hover:underline">agentic execution</a>. When AI agents handle entire categories of work — content generation, frontend builds, QA verification, systems integration — the model powering each agent should match the complexity of the work it handles. A content agent generating blog post variants doesn\'t need Opus-level reasoning. A QA agent running acceptance tests against defined criteria doesn\'t need it either. But an architecture agent designing the data model for a new client portal absolutely does. This tiered approach is how modern <a href="/blog/what-is-an-agentic-product-agency" class="text-[#FF8400] hover:underline">agentic product agencies</a> optimize for both speed and quality. You\'re not choosing between a fast, cheap model and a slow, expensive one. You\'re deploying the right model for each task — automatically, at scale, within an orchestration layer that enforces the routing logic. The result is an execution pipeline that ships at Haiku speed, builds at Sonnet quality, and reviews at Opus depth.',
      },
      {
        heading: "Getting Started with the Right Approach",
        content:
          'If you\'re new to Claude Code, here\'s the practical starting sequence. Install Claude Code and run <strong>claude</strong> in your project directory. Start with an exploratory prompt like "what does this project do?" to let Claude analyze your codebase. Run <strong>/init</strong> to generate your CLAUDE.md file. Then start with Sonnet for your first few sessions — it\'s capable enough to handle most tasks and fast enough to keep your iteration speed high. As you develop intuition for which tasks need more reasoning depth, you\'ll naturally start routing complex work to Opus and repetitive work to Haiku. The mental model is straightforward: match the model to the task, not the task to the model. This principle extends beyond individual coding sessions. For teams building at scale — whether through internal development or <a href="/pricing" class="text-[#FF8400] hover:underline">subscription-based execution</a> — model selection is an infrastructure decision that affects speed, cost, and output quality across every task in the pipeline. <a href="/contact" class="text-[#FF8400] hover:underline">Get the routing right, and everything downstream accelerates.</a>',
      },
    ],
    relatedSlugs: [
      "claude-code-agent-teams-multi-agent-development",
      "how-ai-agents-are-replacing-traditional-dev-teams",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "Claude Code Guide: When to Use Opus vs Sonnet vs Haiku | Barron & Folly",
      description:
        "A practical guide to Claude Code and AI model selection. Learn when to use Opus, Sonnet, and Haiku for coding tasks, and how model routing accelerates development workflows.",
      keywords: [
        "Claude Code guide",
        "Claude Code tutorial",
        "Opus vs Sonnet vs Haiku",
        "Claude model selection",
        "AI coding tools",
        "Claude Code for beginners",
        "AI model use cases",
        "Claude Code models",
        "agentic coding",
        "AI development workflow",
      ],
    },
  },
  {
    slug: "what-is-an-agentic-product-agency",
    title: "What Is an Agentic Product Agency?",
    excerpt:
      "The agency model is broken. Agentic product agencies replace fragmented vendors with autonomous AI execution engines that build, standardize, and scale digital infrastructure on demand.",
    category: "Industry",
    date: "2025-03-10",
    readTime: "7 min read",
    featured: true,
    author: "Barron & Folly",
    heroImage: "/images/blog/agentic-product-agency.png",
    sections: [
      {
        content:
          'The traditional agency model was built for a different era. You hire a design agency, a dev shop, a marketing consultant, and a systems integrator — then spend months coordinating between them while your backlog grows. The result? Fragmented output, ballooning costs, and infrastructure that barely holds together. An <strong>agentic product agency</strong> replaces that entire chain with a single, autonomous execution engine. Instead of managing five vendors and hoping they align, you subscribe to a system that deploys coordinated AI agents alongside senior human oversight to build, standardize, and <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">scale your digital infrastructure</a> continuously.',
      },
      {
        heading: "How Agentic Execution Actually Works",
        content:
          'At the core of an agentic product agency is a fleet of specialized AI agents — each designed to handle a specific category of work. Content agents draft and optimize. Dev agents build and deploy. Automation agents configure workflows and integrations. QA agents test and verify. These agents don\'t work in isolation. They operate within an <strong>orchestration layer</strong> that manages queues, enforces client-specific policies, and routes tasks based on complexity and risk. Low-risk tasks like <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">landing pages, CRM automations, and dashboard builds</a> execute autonomously. Higher-risk work — production deploys, brand architecture, UX strategy — gets human review before shipping. This tiered autonomy model means you get the speed of AI execution with the judgment of senior product oversight. Nothing ships that shouldn\'t.',
      },
      {
        heading: "Why the Traditional Agency Model Fails at Scale",
        content:
          "Every scaling company hits the same wall: too many tools, too many vendors, too many disconnected systems. Growth creates operational drag. You hire more people to manage the complexity, which creates more complexity. Traditional agencies compound this problem. They operate in silos. The design team doesn't talk to the dev team. The marketing consultant doesn't understand the CRM architecture. Nobody owns the full picture. An agentic product agency owns the full picture by design. Every agent operates from the same source of truth, the same client profile, and the same policy store. The result is infrastructure that's consistent, scalable, and actually connected.",
      },
      {
        heading: "The Subscription Advantage",
        content:
          'Agentic product agencies typically operate on a <a href="/pricing" class="text-[#FF8400] hover:underline">subscription model</a> rather than project-based billing. This isn\'t just a pricing preference — it\'s structural. Subscriptions enable continuous execution. Instead of scoping a project, waiting for a proposal, negotiating timelines, and praying the deliverables match expectations, you submit requests into a queue. AI agents pick up work immediately. Tasks ship continuously. Your <a href="/blog/why-subscription-development-beats-project-pricing" class="text-[#FF8400] hover:underline">development velocity</a> is no longer gated by agency availability or project kickoff cycles.',
      },
      {
        heading: "Who This Model Serves",
        content:
          'The agentic model is purpose-built for companies moving faster than their infrastructure: growth-stage startups drowning in backlog, PE-backed portfolios standardizing across acquisitions, SaaS companies scaling product features, multi-location operators unifying their digital presence, and industrial organizations modernizing their systems. If your team has ever said "we need this built yesterday," you\'re the target profile. The question isn\'t whether you need the work done — it\'s whether your current model can keep up with the pace your business demands.',
      },
      {
        heading: "The Future Is Autonomous",
        content:
          'The shift from traditional agencies to agentic product agencies isn\'t incremental — it\'s structural. Companies that adopt this model compress timelines from months to days, reduce vendor complexity to a single subscription, and build infrastructure that actually scales with their growth. <a href="/contact" class="text-[#FF8400] hover:underline">The question is simple:</a> do you want to keep managing five vendors and hoping they align? Or do you want to deploy an execution engine that ships on demand?',
      },
    ],
    relatedSlugs: [
      "how-ai-agents-are-replacing-traditional-dev-teams",
      "why-subscription-development-beats-project-pricing",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "What Is an Agentic Product Agency? | AI-Powered Execution | Barron & Folly",
      description:
        "An agentic product agency replaces fragmented vendors with autonomous AI agents that build, standardize, and scale digital infrastructure. Learn how this model works and why it matters.",
      keywords: [
        "agentic product agency",
        "AI agency",
        "autonomous execution engine",
        "agentic AI services",
        "AI-powered agency",
        "subscription agency model",
        "digital infrastructure agency",
      ],
    },
  },
  {
    slug: "why-subscription-development-beats-project-pricing",
    title: "Why Subscription-Based Development Beats Project-Based Pricing",
    excerpt:
      "Project-based pricing creates misaligned incentives. Subscription development eliminates scope creep, accelerates delivery, and turns your dev team into an always-on execution engine.",
    category: "Business",
    date: "2025-03-05",
    readTime: "6 min read",
    featured: false,
    author: "Barron & Folly",
    heroImage: "/images/blog/subscription-development.png",
    sections: [
      {
        content:
          'Project-based pricing is the default in the agency world — and it\'s fundamentally broken. Scope gets defined before anyone truly understands the problem. Timelines inflate. Change requests stack up. And by the time you get the deliverable, the business has already moved on to the next priority. <strong>Subscription-based development</strong> flips this model entirely. Instead of buying a project, you subscribe to an execution engine — a continuous pipeline of design, development, automation, and systems work that ships weekly, not quarterly. It\'s the difference between ordering a single meal and having a private chef. One feeds you once. The other <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">keeps your business running</a>.',
      },
      {
        heading: "The Problem with Project-Based Pricing",
        content:
          "Project pricing creates three structural problems that compound over time. First, <strong>scope rigidity</strong>. Once a project is scoped and signed, any change becomes a negotiation. Your business evolves weekly, but your dev timeline was locked in months ago. Second, <strong>misaligned incentives</strong>. Agencies profit from scope creep and extended timelines. The longer a project takes, the more they bill. There's no structural incentive to ship fast. Third, <strong>delivery gaps</strong>. Projects end. And between the end of one project and the start of another, your backlog grows, your infrastructure stagnates, and momentum dies. You spend as much time managing vendors as you do building.",
      },
      {
        heading: "How Subscription Development Works",
        content:
          'With a subscription model, you submit requests into a prioritized queue. AI agents and senior product leads execute against that queue continuously. There\'s no scoping phase, no proposal cycle, no contract negotiation. You submit work. It gets built. It ships. <a href="/pricing" class="text-[#FF8400] hover:underline">Tiers scale</a> based on the complexity of work you need — from pure AI execution at the base layer to human-led architecture and brand strategy at the top. Every tier includes unlimited async task submission, meaning your pipeline never stops.',
      },
      {
        heading: "Predictable Cost, Unpredictable Output",
        content:
          "The counterintuitive advantage of subscriptions is that your cost becomes predictable while your output becomes unconstrained. You know exactly what you're spending each month. But the volume and variety of work you can push through the system is limited only by the queue — not by budget negotiations or project timelines. This is especially powerful for growth-stage companies where priorities shift weekly. A subscription model lets you redirect execution toward whatever matters most right now without renegotiating contracts or waiting for new SOWs.",
      },
      {
        heading: "The Compound Effect",
        content:
          'Project-based work is additive. Each project stands alone. Subscription-based work is <strong>compounding</strong>. Every week of execution builds on the last. Your <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">systems architecture</a> gets more refined. Your design system gets more robust. Your automations get more sophisticated. Your infrastructure doesn\'t just grow — it <strong>matures</strong>. Over six months, a subscription engagement produces not just a collection of deliverables, but an integrated, evolving system that would have taken years to build through traditional project cycles.',
      },
      {
        heading: "Making the Switch",
        content:
          'The transition from project-based to subscription-based development isn\'t just a pricing change — it\'s an operational upgrade. You stop thinking in terms of "projects" and start thinking in terms of <strong>continuous infrastructure deployment</strong>. Your backlog becomes a queue. Your vendors become an engine. And your business moves at the speed it actually needs to. <a href="/contact" class="text-[#FF8400] hover:underline">Ready to replace project chaos with continuous execution?</a>',
      },
    ],
    relatedSlugs: [
      "what-is-an-agentic-product-agency",
      "the-real-cost-of-fragmented-digital-infrastructure",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "Why Subscription Development Beats Project Pricing | Barron & Folly",
      description:
        "Project-based pricing creates scope creep and delivery gaps. Subscription-based development provides continuous execution, predictable costs, and compounding infrastructure.",
      keywords: [
        "subscription-based development",
        "subscription development agency",
        "productized services",
        "retainer vs project pricing",
        "continuous development model",
        "development subscription",
        "agency subscription model",
      ],
    },
  },
  {
    slug: "how-ai-agents-are-replacing-traditional-dev-teams",
    title: "How AI Agents Are Replacing Traditional Dev Teams",
    excerpt:
      "AI agents aren't replacing developers — they're replacing the bloated team structures that slow companies down. Autonomous execution compresses timelines and eliminates coordination overhead.",
    category: "Technology",
    date: "2025-02-26",
    readTime: "8 min read",
    featured: true,
    author: "Barron & Folly",
    heroImage: "/images/blog/ai-agents-replacing-teams.png",
    sections: [
      {
        content:
          'The headline is provocative, but the reality is nuanced. AI agents aren\'t making developers obsolete. They\'re making the <strong>traditional team structure</strong> obsolete. The model where you need a project manager, a designer, two frontend devs, a backend engineer, a QA tester, and a DevOps lead to ship a landing page — that model is dead. <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">Autonomous AI agents</a> compress that entire workflow into a single execution pipeline. Tasks that required six people and three weeks now ship in hours.',
      },
      {
        heading: "The Coordination Tax",
        content:
          "Most development time isn't spent writing code. It's spent in standups, Slack threads, ticket grooming, design reviews, QA handoffs, and deployment checklists. This is the <strong>coordination tax</strong> — the invisible overhead that makes every project take 3x longer than it should. AI agents eliminate the coordination tax because they don't need meetings. They don't need context-switching time. They don't have PTO or sprint commitments. They operate from a shared context, execute against defined policies, and ship continuously without the friction that plagues human teams.",
      },
      {
        heading: "What AI Agents Actually Do",
        content:
          'Modern AI agents handle the full spectrum of digital execution. <strong>Content agents</strong> generate SEO-optimized copy, blog posts, and ad variations. <strong>Dev agents</strong> build landing pages, configure CRM systems, deploy integrations, and scaffold internal tools. <strong>Automation agents</strong> wire up Zapier flows, Make scenarios, and custom webhook logic. <strong>QA agents</strong> run acceptance tests and verify deployment integrity. Each agent type operates within guardrails defined by a <a href="/blog/what-is-an-agentic-product-agency" class="text-[#FF8400] hover:underline">policy store</a> — a per-client configuration that specifies what agents can and can\'t do, what requires human approval, and what ships automatically.',
      },
      {
        heading: "The Human Layer Still Matters",
        content:
          'Here\'s what separates effective agentic execution from reckless automation: <strong>human oversight at the right altitude</strong>. Low-risk tasks — dashboard builds, content production, form configurations — run autonomously. But architectural decisions, UX strategy, brand evolution, and production infrastructure changes require human judgment. The <a href="/pricing" class="text-[#FF8400] hover:underline">tier system</a> reflects this. Lower tiers are AI-dominant execution. Upper tiers introduce human nuance — architecture, strategy, and custom thinking layered on top of the execution engine.',
      },
      {
        heading: "Speed as a Competitive Advantage",
        content:
          'When your execution engine can ship a landing page in hours instead of weeks, a CRM automation in a day instead of a sprint, and a full <a href="/services/brand-experience" class="text-[#FF8400] hover:underline">design system</a> in weeks instead of quarters — speed stops being an operational metric and becomes a competitive advantage. Companies using agentic execution don\'t just move faster. They iterate faster, learn faster, and compound their infrastructure faster than competitors still stuck in the proposal-approval-project cycle.',
      },
      {
        heading: "What This Means for Your Team",
        content:
          'AI agents don\'t replace your team. They <strong>amplify</strong> it. Your product lead stops managing vendor timelines and starts directing strategy. Your designer stops producing one-off mockups and starts architecting systems. Your engineers stop building CRUD apps and start solving the problems that actually require human ingenuity. The work that matters gets more attention. The work that doesn\'t gets automated. That\'s not a threat — it\'s a <a href="/contact" class="text-[#FF8400] hover:underline">force multiplier</a>.',
      },
    ],
    relatedSlugs: [
      "what-is-an-agentic-product-agency",
      "building-internal-tools-without-hiring-a-dev-team",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "How AI Agents Are Replacing Traditional Dev Teams | Barron & Folly",
      description:
        "AI agents compress entire development workflows into autonomous execution pipelines. Learn how agentic execution eliminates coordination overhead and ships faster.",
      keywords: [
        "AI agents development",
        "AI replacing developers",
        "autonomous AI agents",
        "AI execution engine",
        "AI development team",
        "agentic AI development",
        "automated software development",
      ],
    },
  },
  {
    slug: "the-real-cost-of-fragmented-digital-infrastructure",
    title: "The Real Cost of Fragmented Digital Infrastructure",
    excerpt:
      "Every disconnected tool, redundant vendor, and siloed system in your stack is costing you more than the subscription fee. Fragmented infrastructure creates compounding operational drag.",
    category: "Business",
    date: "2025-02-18",
    readTime: "6 min read",
    featured: false,
    author: "Barron & Folly",
    heroImage: "/images/blog/fragmented-infrastructure.png",
    sections: [
      {
        content:
          "Count the tools your company uses. Not just the ones you pay for — the ones people actually touch every day. The CRM that doesn't talk to your marketing platform. The project management tool that duplicates your issue tracker. The analytics dashboard that shows different numbers than your reporting tool. The form builder that feeds into a spreadsheet instead of your database. Every one of those disconnections has a cost. Not just the subscription fee — the <strong>operational cost</strong> of workarounds, manual syncing, context-switching, and the decisions made on inconsistent data.",
      },
      {
        heading: "The Compounding Cost of Tech Stack Sprawl",
        content:
          "Tech stack sprawl doesn't happen all at once. It compounds. You start with a CRM. Then add a marketing tool. Then a separate analytics platform. Then someone builds a dashboard in a spreadsheet because the data they need lives in three different systems. Each tool solves one problem and creates two integration challenges. Over time, you're spending more time maintaining the connections between tools than using the tools themselves. This isn't a technology problem — it's an <strong>architecture problem</strong>. And you can't solve an architecture problem by adding more tools.",
      },
      {
        heading: "The Hidden Costs Nobody Tracks",
        content:
          'The visible cost of fragmented infrastructure is the sum of your SaaS subscriptions. The hidden cost is exponentially larger: <strong>Decision latency</strong> — leadership makes slower decisions because data is scattered across platforms. <strong>Duplicate work</strong> — teams rebuild the same functionality in different tools. <strong>Onboarding friction</strong> — new hires spend weeks learning which tool does what. <strong>Integration maintenance</strong> — someone is always debugging a broken Zapier flow or stale webhook. <strong>Brand inconsistency</strong> — without a unified <a href="/services/brand-experience" class="text-[#FF8400] hover:underline">design system</a>, every touchpoint looks different.',
      },
      {
        heading: "Consolidation Through Systems Architecture",
        content:
          'The solution isn\'t replacing every tool with one monolithic platform. It\'s designing a <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">systems architecture</a> that connects the tools you actually need and eliminates the ones you don\'t. This means mapping your entire tool stack, identifying redundancies, designing integration logic, and building data visibility layers that give every team a single source of truth. The goal isn\'t fewer tools for the sake of it. It\'s <strong>fewer seams</strong>. Every integration point is a potential failure point. Reduce the seams, and you reduce the drag.',
      },
      {
        heading: "What Unified Infrastructure Looks Like",
        content:
          'Companies with unified infrastructure share a few traits. Their data flows in one direction — from source to dashboard without manual intervention. Their teams operate from shared definitions and consistent interfaces. Their automations run reliably because they\'re built on stable architecture, not duct-taped integrations. And their leadership makes decisions faster because the information they need is already consolidated and current. This isn\'t aspirational. It\'s what happens when you invest in architecture before adding more tools. <a href="/blog/what-is-an-agentic-product-agency" class="text-[#FF8400] hover:underline">An agentic product agency</a> can build this infrastructure continuously — not as a one-time project, but as an evolving system that adapts with your business.',
      },
      {
        heading: "Stop Adding. Start Architecting.",
        content:
          'Your next hire shouldn\'t be another developer to maintain another integration. Your next investment should be in the architecture that makes your existing tools actually work together. <a href="/contact" class="text-[#FF8400] hover:underline">Let\'s audit your stack</a> and design infrastructure that compounds instead of fragments.',
      },
    ],
    relatedSlugs: [
      "why-subscription-development-beats-project-pricing",
      "design-systems-why-your-brand-needs-one-before-scaling",
      "what-is-an-agentic-product-agency",
    ],
    seo: {
      title:
        "The Real Cost of Fragmented Digital Infrastructure | Barron & Folly",
      description:
        "Tech stack sprawl creates compounding operational drag. Learn the hidden costs of fragmented infrastructure and how systems architecture solves the problem.",
      keywords: [
        "fragmented digital infrastructure",
        "tech stack sprawl",
        "too many SaaS tools",
        "vendor consolidation",
        "systems architecture",
        "digital infrastructure cost",
        "tool sprawl business",
      ],
    },
  },
  {
    slug: "design-systems-why-your-brand-needs-one-before-scaling",
    title: "Design Systems: Why Your Brand Needs One Before Scaling",
    excerpt:
      "Scaling without a design system means scaling inconsistency. A design system isn't a luxury — it's the infrastructure layer that keeps your brand coherent as you grow.",
    category: "Design",
    date: "2025-02-10",
    readTime: "7 min read",
    featured: false,
    author: "Barron & Folly",
    heroImage: "/images/blog/design-systems.png",
    sections: [
      {
        content:
          'Your brand isn\'t your logo. It\'s the sum of every interaction a person has with your company — every page, every email, every dashboard, every form. And if those touchpoints were built by different people, at different times, with different assumptions about your brand, they look like it. A <strong>design system</strong> is the infrastructure layer that solves this. It\'s a codified set of components, patterns, tokens, and rules that ensure every interface your company produces looks, feels, and functions consistently. It\'s not a style guide sitting in a PDF. It\'s a <a href="/services/brand-experience" class="text-[#FF8400] hover:underline">living system</a> that developers and designers build with.',
      },
      {
        heading: "The Scaling Problem",
        content:
          "Without a design system, every new page, feature, or product is a fresh design exercise. Your marketing site uses one set of components. Your product dashboard uses another. Your client portal uses a third. Each was designed in isolation, by different people, with different interpretations of your brand. As you scale — more products, more markets, more team members — this inconsistency compounds. Onboarding new designers takes longer because there's no shared language. Building new features takes longer because there are no reusable components. And your brand starts to feel like a collection of disconnected experiments rather than a unified experience.",
      },
      {
        heading: "What a Design System Actually Contains",
        content:
          "A production-grade design system includes several layers. <strong>Design tokens</strong> — the atomic values that define your visual language: colors, spacing, typography scales, border radii, shadows. <strong>Component library</strong> — reusable UI components built to spec: buttons, inputs, cards, modals, navigation patterns. <strong>Layout patterns</strong> — page templates and grid systems that ensure structural consistency. <strong>Documentation</strong> — usage guidelines, accessibility requirements, and implementation notes. <strong>Governance rules</strong> — who can modify the system, how changes are proposed and reviewed, and how new components get added.",
      },
      {
        heading: "Design Systems Accelerate Development",
        content:
          'The ROI of a design system isn\'t just visual consistency — it\'s <strong>velocity</strong>. When your developers have a component library to build with, they stop recreating buttons and start building features. When your designers have established patterns, they stop debating padding values and start solving user problems. Estimates suggest that mature design systems can reduce UI development time by 30-50%. That\'s not a marginal improvement — it\'s a structural acceleration that compounds over every sprint, every feature, every product. Combined with <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">agentic execution</a>, a design system becomes the foundation for autonomous AI agents to build consistent, production-ready interfaces at scale.',
      },
      {
        heading: "When to Build One",
        content:
          'The right time to build a design system is <strong>before you need one</strong>. If you\'re a single-product company with one designer, you might not feel the pain yet. But the moment you hire a second designer, launch a second product, or expand to a second market — the inconsistency starts compounding. The ideal sequence: establish your <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">systems architecture</a> first. Then build your design system on top of that foundation. Then use both as the infrastructure layer for all future execution. This isn\'t a one-time project. It\'s a <a href="/blog/why-subscription-development-beats-project-pricing" class="text-[#FF8400] hover:underline">continuous investment</a> that pays dividends on every piece of work that follows.',
      },
      {
        heading: "Start With Infrastructure, Not Aesthetics",
        content:
          'A design system isn\'t about making things pretty. It\'s about building the infrastructure that enables your brand to scale without fracturing. It\'s the connective tissue between your products, your teams, and your customers. If you\'re planning to scale — and you don\'t have one yet — <a href="/contact" class="text-[#FF8400] hover:underline">that\'s where we\'d start</a>.',
      },
    ],
    relatedSlugs: [
      "the-real-cost-of-fragmented-digital-infrastructure",
      "what-is-an-agentic-product-agency",
      "building-internal-tools-without-hiring-a-dev-team",
    ],
    seo: {
      title:
        "Why Your Brand Needs a Design System Before Scaling | Barron & Folly",
      description:
        "A design system isn't a luxury — it's infrastructure. Learn why scaling without one means scaling inconsistency, and how to build a system that accelerates development.",
      keywords: [
        "design systems",
        "why you need a design system",
        "design system for startups",
        "brand consistency scaling",
        "design system agency",
        "component library",
        "design system ROI",
      ],
    },
  },
  {
    slug: "from-backlog-to-deployment-how-autonomous-execution-works",
    title: "From Backlog to Deployment: How Autonomous Execution Works",
    excerpt:
      "Your backlog isn't a strategy. Autonomous execution turns your growing list of requests into a continuous deployment pipeline with AI agents, human gates, and real-time observability.",
    category: "Process",
    date: "2025-02-03",
    readTime: "8 min read",
    featured: true,
    author: "Barron & Folly",
    heroImage: "/images/blog/backlog-to-deployment.png",
    sections: [
      {
        content:
          'Every growing company has a backlog. Features that need building. Automations that need configuring. Integrations that need connecting. Pages that need launching. The backlog isn\'t the problem — the <strong>execution model</strong> is. If your backlog grows faster than your team can ship, you don\'t need more people. You need a different approach to execution. <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">Autonomous execution</a> transforms your backlog from a growing list of guilt into a structured deployment pipeline.',
      },
      {
        heading: "Step 1: Intake",
        content:
          "Everything starts with a request. A client or team member submits a request through a portal — describing what they need, attaching references, and flagging priority. The system assigns a request ID and the work enters the pipeline. No meetings. No kickoff calls. No three-week scoping phase. Just a clear request into a structured intake system.",
      },
      {
        heading: "Step 2: Triage and Classification",
        content:
          'A work router — part AI, part logic engine — classifies the incoming request. It determines the type (design, development, automation, content, data, infrastructure), scores the complexity and risk, identifies dependencies, and generates clarifying questions if needed. This is where a generic task becomes a structured work item with clear acceptance criteria. The router also determines <a href="/pricing" class="text-[#FF8400] hover:underline">SLA routing</a> based on the client\'s tier — ensuring priority tasks get priority execution.',
      },
      {
        heading: "Step 3: Task Decomposition",
        content:
          "Complex requests get broken down into epics, tasks, and subtasks — each with defined acceptance criteria, a definition of done, and links to where the artifacts will live. A landing page request might decompose into: design mockup, component build, content population, SEO configuration, form integration, and QA verification. Each subtask is an independently executable unit of work.",
      },
      {
        heading: "Step 4: Agent Execution",
        content:
          'The orchestration engine pulls tasks from the queue and assigns them to the appropriate agent group. Low-risk agents — content, automation, QA — run with minimal oversight. Medium-risk agents — frontend builds, integration configuration — run with review checkpoints. High-risk agents — infrastructure changes, production deploys — never run without a human gate. Every agent logs its actions, inputs, and outputs. Every execution is <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">observable and reversible</a>.',
      },
      {
        heading: "Step 5: Approval Gates",
        content:
          "When a task crosses a risk threshold, the system generates a compact approval packet: what's being done, what will change, where the artifacts live, the risk level, and a rollback plan. The human reviewer — you or your designated approver — gets a clean summary with one decision to make: approve, pause, or request changes. This gate system ensures nothing risky ships without judgment while keeping low-risk work flowing at maximum velocity.",
      },
      {
        heading: "Step 6: Ship and Verify",
        content:
          'Approved work merges, deploys to staging, runs through QA verification, and ships to production. The system tracks every deployment — what changed, who approved it, and how to roll it back if needed. This isn\'t "done in chat." These are <strong>hard artifacts</strong>: code in Git repos, designs in component libraries, automations as exportable configs. Everything is versioned, reversible, and auditable.',
      },
      {
        heading: "The Result: Continuous Deployment",
        content:
          'Instead of quarterly releases, you get weekly shipments. Instead of managing vendors, you manage a queue. Instead of hoping your infrastructure evolves, you <strong>watch it compound</strong>. This is what <a href="/blog/what-is-an-agentic-product-agency" class="text-[#FF8400] hover:underline">agentic execution</a> looks like in practice — not a buzzword, but a structured pipeline that turns backlog into deployed infrastructure. <a href="/contact" class="text-[#FF8400] hover:underline">Deploy your infrastructure</a>.',
      },
    ],
    relatedSlugs: [
      "what-is-an-agentic-product-agency",
      "how-ai-agents-are-replacing-traditional-dev-teams",
      "why-subscription-development-beats-project-pricing",
    ],
    seo: {
      title:
        "How Autonomous Execution Works: Backlog to Deployment | Barron & Folly",
      description:
        "Transform your backlog into a continuous deployment pipeline. Learn the 6-step autonomous execution process from intake to production with AI agents and human gates.",
      keywords: [
        "autonomous execution",
        "continuous deployment",
        "ship faster development",
        "async development model",
        "agentic execution process",
        "development pipeline",
        "automated deployment workflow",
      ],
    },
  },
  {
    slug: "building-internal-tools-without-hiring-a-dev-team",
    title: "Building Internal Tools Without Hiring a Dev Team",
    excerpt:
      "Internal tools are the infrastructure nobody sees and everyone depends on. You don't need a dedicated dev team to build them — you need an execution engine that ships them continuously.",
    category: "Technology",
    date: "2025-01-27",
    readTime: "7 min read",
    featured: false,
    author: "Barron & Folly",
    heroImage: "/images/blog/building-internal-tools.png",
    sections: [
      {
        content:
          "Behind every efficient company is a stack of internal tools that nobody outside the organization ever sees. Admin dashboards. Reporting systems. Onboarding workflows. Inventory trackers. Approval systems. Client portals. These tools aren't products — they're <strong>operational infrastructure</strong>. And most companies either build them poorly (spreadsheets held together with formulas) or don't build them at all (manual processes that drain hours every week). The traditional solution is hiring developers. But hiring a developer to build internal tools means competing with every tech company for the same talent, managing a full development lifecycle for tools that aren't revenue-generating, and hoping the developer stays long enough to maintain what they built.",
      },
      {
        heading: "The Internal Tool Gap",
        content:
          "Most companies have a massive gap between the internal tools they need and the internal tools they have. Sales teams run on spreadsheets because nobody built them a proper pipeline dashboard. Operations teams manually reconcile data between three systems because nobody built the integration. Client-facing teams answer the same questions repeatedly because nobody built a self-service portal. This gap exists because internal tools sit at the bottom of every priority list. Revenue-generating features come first. Customer-facing bugs come second. Internal tooling comes... eventually. Maybe.",
      },
      {
        heading: "How Agentic Execution Solves This",
        content:
          'An <a href="/services/agentic-execution" class="text-[#FF8400] hover:underline">agentic execution engine</a> eliminates the tradeoff between customer-facing work and internal tooling. Because AI agents execute asynchronously against a queue, you can submit internal tool requests alongside feature requests alongside content requests — and they all get built. A client portal, a reporting dashboard, and a landing page aren\'t competing for the same developer\'s time. They\'re executing in parallel across specialized agents.',
      },
      {
        heading: "What Can Be Built This Way",
        content:
          'The range of internal tools that can be deployed through agentic execution is broad: <strong>Admin dashboards</strong> — centralized views of your business data. <strong>Reporting builds</strong> — automated reports that pull from your actual systems instead of manually compiled spreadsheets. <strong>Workflow automation</strong> — approval flows, routing logic, notification systems. <strong>Client portals</strong> — self-service interfaces for your customers to check status, submit requests, and review deliverables. <strong>Integration layers</strong> — connective tissue between your existing tools via <a href="/services/systems-architecture" class="text-[#FF8400] hover:underline">systems architecture</a>. <strong>Internal prototypes</strong> — scaffolded apps for testing operational ideas before investing in full builds.',
      },
      {
        heading: "The Subscription Model for Internal Tooling",
        content:
          'Building internal tools through a <a href="/pricing" class="text-[#FF8400] hover:underline">subscription model</a> means you\'re not paying for a one-time build that immediately starts going stale. You\'re investing in continuous improvement. Dashboard needs a new metric? Submit a request. Workflow needs a new approval step? Submit a request. Portal needs a new feature? Submit a request. Your internal tools evolve with your business instead of calcifying the moment the project ends. And because the execution engine already understands your <a href="/blog/the-real-cost-of-fragmented-digital-infrastructure" class="text-[#FF8400] hover:underline">systems architecture</a>, every new tool integrates cleanly with what already exists.',
      },
      {
        heading: "Stop Building in Spreadsheets",
        content:
          'If your operations run on spreadsheets, manual processes, and workarounds — that\'s not resourcefulness. That\'s technical debt accumulating daily. Every hour spent on a manual process is an hour not spent on growth. The tools you need aren\'t complex. They just haven\'t been built yet. <a href="/contact" class="text-[#FF8400] hover:underline">Let\'s change that</a>.',
      },
    ],
    relatedSlugs: [
      "how-ai-agents-are-replacing-traditional-dev-teams",
      "the-real-cost-of-fragmented-digital-infrastructure",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "Building Internal Tools Without Hiring a Dev Team | Barron & Folly",
      description:
        "Internal tools are operational infrastructure most companies neglect. Learn how agentic execution builds admin dashboards, portals, and automation without hiring developers.",
      keywords: [
        "building internal tools",
        "internal tools without developers",
        "custom internal software",
        "admin dashboard builder",
        "internal tool development",
        "low-code internal tools",
        "business automation tools",
      ],
    },
  },
  {
    slug: "claude-code-agent-teams-multi-agent-development",
    title:
      "Claude Code Agent Teams: Multi-Agent Development Explained",
    excerpt:
      "Anthropic's new Agent Teams feature lets you orchestrate multiple Claude Code instances working together on a shared codebase — with independent context windows, direct inter-agent communication, and a shared task list. Here's what they are, how they work, and why they matter.",
    category: "Technology",
    date: "2026-03-12",
    readTime: "9 min read",
    featured: true,
    author: "Barron & Folly",
    heroImage: "/images/blog/claude-code-agent-teams.png",
    sections: [
      {
        content:
          '<p>For the past two years, AI coding assistants have operated as solo agents. One model, one conversation, one context window — working through tasks sequentially, no matter how large the project.</p><p>That constraint shaped everything about how teams use AI for development. You could send a single agent off to build a feature, but if the task spanned multiple layers of your stack — frontend, backend, tests, documentation — the agent had to work through each piece one at a time.</p><p>Subagents helped, but they were still tethered to the parent session and couldn\'t talk to each other.</p><p>In February 2026, Anthropic shipped something that changes this equation entirely: <strong>Agent Teams</strong> in Claude Code.</p><p>It\'s a multi-agent coordination system that lets you spin up a team of independent Claude Code instances, each with their own context window, working in parallel on a shared codebase. They communicate directly with each other, claim tasks from a shared list, and self-coordinate — without routing everything through a single bottleneck.</p><p>This isn\'t an incremental feature update. It\'s the beginning of a structural shift in how <a href="/services/agentic-execution">software gets built at scale</a>.</p>',
      },
      {
        heading: "What Are Claude Code Agent Teams?",
        content:
          '<p>Agent Teams is an experimental feature in Claude Code that lets you orchestrate multiple Claude Code sessions working together on a shared project.</p><p>The architecture has four core components:</p><ul><li><strong>Team Lead</strong> — The main Claude Code session that creates the team, spawns teammates, assigns tasks, and synthesizes results</li><li><strong>Teammates</strong> — Fully independent Claude Code instances, each with their own context window, that can read/write files, run commands, and interact with your codebase</li><li><strong>Shared Task List</strong> — A coordinated list of work items with dependency tracking that teammates claim and complete autonomously</li><li><strong>Mailbox System</strong> — Built-in messaging that lets teammates communicate directly with each other and with the lead</li></ul><p>Here\'s what makes it powerful: the team lead creates tasks, teammates self-claim them, and when a blocking task completes, downstream tasks <strong>automatically unblock</strong>. Teammates pick up the next available task as soon as they finish their current one.</p><p>This is real multi-agent coordination — not a single model pretending to multitask.</p>',
      },
      {
        heading: "How Agent Teams Differ from Traditional Subagents",
        content:
          '<img src="/images/blog/claude-code-agent-teams-inline.png" alt="A robotic AI agent typing code on a keyboard — representing Claude Code autonomous coding execution" class="w-full rounded-xl mb-8 border border-[#2A2A26]/30" /><p>If you\'ve used Claude Code before, you\'re probably familiar with <a href="/blog/claude-code-model-guide-opus-sonnet-haiku">subagents</a> — the lightweight worker sessions that Claude Code spawns to handle focused tasks in parallel.</p><p>Subagents are useful, but they have a fundamental limitation: <strong>they can only report results back to the parent agent.</strong> They can\'t communicate with each other, share discoveries mid-task, or coordinate without the main agent acting as intermediary.</p><p>Think of subagents as <strong>contractors</strong> who each do their job and submit a final report. Agent Teams are a <strong>coordinated squad</strong> that talks to each other in real time.</p><h3>The Key Differences</h3><ul><li><strong>Context:</strong> Subagents share the caller\'s context and return summarized results. Agent Teams members each have fully independent context windows.</li><li><strong>Communication:</strong> Subagents report back to the parent only. Agent Teams members message each other directly.</li><li><strong>Coordination:</strong> Subagents rely on the parent to manage everything. Agent Teams use a shared task list with self-coordination and dependency tracking.</li><li><strong>Best for:</strong> Subagents excel at focused tasks where only the result matters. Agent Teams handle complex work requiring discussion and collaboration.</li><li><strong>Token cost:</strong> Subagents are cheaper since results get summarized back. Agent Teams use more tokens because each teammate is a full Claude instance.</li></ul><blockquote>Use subagents when you need quick workers that report back. Use Agent Teams when the task demands that multiple agents share findings, challenge each other\'s assumptions, and coordinate autonomously.</blockquote>',
      },
      {
        heading: "How to Enable and Set Up Agent Teams",
        content:
          '<p>Agent Teams are experimental and disabled by default. Enabling them takes one configuration change.</p><h3>Step 1: Enable the Feature</h3><p>Add the following to your <code>settings.json</code> file:</p><p>Set <code>CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS</code> to <code>"1"</code> inside the <code>env</code> object. Alternatively, set it as an environment variable in your shell.</p><h3>Step 2: Describe Your Team</h3><p>Once enabled, you start a team by describing the task and team structure in natural language. For example:</p><blockquote>Create an agent team with three teammates — one focused on frontend components, one on API endpoints, and one on test coverage.</blockquote><p>Claude creates the team, spawns the teammates, and begins coordinating work based on your prompt.</p><h3>Step 3: Configure Your Preferences</h3><p>You have several options to fine-tune how your team operates:</p><ul><li><strong>Model selection</strong> — Specify which model each teammate should use (e.g., Sonnet for speed, Opus for depth)</li><li><strong>Plan approval</strong> — Require teammates to outline their approach in read-only mode before writing any code</li><li><strong>Display mode</strong> — Choose in-process (all teammates in one terminal, navigate with Shift+Down) or split panes (each teammate in its own tmux/iTerm2 pane)</li></ul><p>For teams working on sensitive or complex codebases, the <strong>plan approval workflow</strong> is worth using. It adds a layer of architectural review that prevents wasted effort on the wrong approach before any code gets written.</p>',
      },
      {
        heading: "Best Use Cases for Agent Teams",
        content:
          '<p>Agent Teams add coordination overhead, so they\'re not the right tool for every task. They deliver the most value when <strong>parallel exploration genuinely adds something</strong> that sequential work can\'t.</p><h3>Research and Review</h3><p>This is where Agent Teams shine immediately. Spin up three reviewers on a pull request:</p><ul><li>One focused on <strong>security implications</strong></li><li>One checking <strong>performance impact</strong></li><li>One validating <strong>test coverage</strong></li></ul><p>Each reviewer applies a different filter to the same code, and the lead synthesizes findings across all three. A single reviewer gravitates toward one issue type at a time. Three independent reviewers with distinct mandates catch what a solo pass misses.</p><h3>New Modules and Features</h3><p>Features with clear boundaries are ideal. If you\'re building something that spans frontend, backend, and tests — assign each layer to a different teammate. They work in parallel without stepping on each other\'s files.</p><h3>Debugging with Competing Hypotheses</h3><p>This is arguably the most powerful application. Instead of one agent chasing a single theory and anchoring to it, spawn five investigators with different hypotheses. Tell them to <strong>actively try to disprove each other\'s theories</strong>.</p><p>The hypothesis that survives genuine adversarial testing is far more likely to be the actual root cause.</p><h3>Cross-Layer Coordination</h3><p>Changes that span the full stack benefit from having each layer owned by a specialist teammate who communicates directly with the others as dependencies emerge.</p><blockquote>The practical sweet spot is <strong>3–5 teammates</strong> with 5–6 tasks per teammate. Start there and scale only when the work genuinely benefits from additional parallelism.</blockquote>',
      },
      {
        heading: "What This Means for Software Development",
        content:
          '<p>Agent Teams represent more than a feature release. They signal a shift in the developer\'s role:</p><p><strong>From writing code → to orchestrating systems.</strong></p><p>When you can describe an architecture, define constraints, establish quality gates, and deploy a team of agents to execute — the bottleneck moves from implementation to strategy.</p><p>This is the same pattern emerging across the entire AI-assisted development ecosystem. Multiple companies are building toward multi-agent coordination because the single-agent model has a ceiling. Complex projects require:</p><ul><li>Parallel exploration across multiple domains</li><li>Adversarial review that challenges assumptions</li><li>Cross-domain coordination that a single context window can\'t handle</li></ul><p>The teams already seeing the most impact from Agent Teams are treating it like <strong>managing a real engineering squad</strong>:</p><ul><li>Clear task definitions with explicit ownership boundaries</li><li>Quality gates before merge</li><li>Regular check-ins to redirect approaches that aren\'t working</li><li>The developer as architect, reviewer, and project manager</li></ul><p>For <a href="/blog/how-ai-agents-are-replacing-traditional-dev-teams">organizations already running agentic workflows</a>, Agent Teams is the next logical step. For teams still debating whether AI coding tools are production-ready — this is the clearest signal yet that the answer is yes.</p>',
      },
      {
        heading: "The Bigger Picture for Agentic Execution",
        content:
          '<p>Agent Teams inside Claude Code is one implementation of a broader pattern: <strong>coordinated autonomous execution</strong>.</p><p>The same principles — specialized agents, shared task coordination, inter-agent communication, human oversight at critical gates — apply far beyond coding:</p><ul><li>Content production</li><li><a href="/services/systems-architecture">Systems architecture</a></li><li>QA workflows</li><li>Data pipeline builds</li><li>CRM automation</li><li>Design system implementation</li></ul><p>An <a href="/blog/what-is-an-agentic-product-agency">agentic product agency</a> is essentially this pattern scaled to an entire business operation:</p><ul><li><strong>Specialized AI agents</strong> handle distinct domains of work</li><li><strong>An orchestration layer</strong> manages queues, enforces policies, and routes tasks by complexity and risk</li><li><strong>Senior human oversight</strong> governs strategy, approvals, and quality</li><li><strong>The whole system ships continuously</strong> rather than in fragmented project cycles</li></ul><p>Claude Code Agent Teams gives individual developers a taste of what full-scale agentic execution looks like.</p><p>The companies that internalize this model — whether through their own tooling or through <a href="/pricing">subscription-based execution partners</a> — will operate at a velocity that traditionally staffed teams simply cannot match.</p><p>The shift isn\'t coming. <a href="/contact">It\'s already here.</a></p>',
      },
    ],
    relatedSlugs: [
      "claude-code-model-guide-opus-sonnet-haiku",
      "how-ai-agents-are-replacing-traditional-dev-teams",
      "from-backlog-to-deployment-how-autonomous-execution-works",
    ],
    seo: {
      title:
        "Claude Code Agent Teams: Multi-Agent Development Explained | Barron & Folly",
      description:
        "Learn what Claude Code Agent Teams are, how they differ from subagents, how to set them up, and why multi-agent coordination is reshaping software development workflows.",
      keywords: [
        "Claude Code agent teams",
        "Claude Code multi-agent",
        "agent teams vs subagents",
        "multi-agent development",
        "Claude Code tutorial",
        "AI coding tools",
        "parallel AI agents",
        "Claude Code setup",
        "agentic coding",
        "multi-agent coordination",
        "Claude Code 2026",
        "AI software development",
      ],
    },
  },
];

/** All posts sorted by date, newest first */
export function getSortedPosts(): BlogPost[] {
  return [...blogPosts].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | undefined {
  return blogPosts.find((p) => p.slug === slug);
}

export function getAllBlogSlugs(): string[] {
  return blogPosts.map((p) => p.slug);
}

export function getRelatedPosts(slugs: string[]): BlogPost[] {
  return slugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((p): p is BlogPost => p !== undefined);
}

/** Returns 3 featured posts: the most recent post + its 2 most related posts */
export function getFeaturedPosts(): BlogPost[] {
  const sorted = getSortedPosts();
  const latest = sorted[0];
  if (!latest) return [];

  const related = latest.relatedSlugs
    .map((slug) => getBlogPostBySlug(slug))
    .filter((p): p is BlogPost => p !== undefined)
    .slice(0, 2);

  return [latest, ...related];
}

export function getPostsByCategory(category: string): BlogPost[] {
  return blogPosts.filter((p) => p.category === category);
}

export function getAllCategories(): string[] {
  return [...new Set(blogPosts.map((p) => p.category))];
}
