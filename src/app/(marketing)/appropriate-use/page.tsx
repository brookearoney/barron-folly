import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Appropriate Use Policy",
  description:
    "Appropriate Use Policy for Barron & Folly LC services, AI agents, and client portal.",
  alternates: { canonical: "/appropriate-use" },
};

export default function AppropriateUsePage() {
  return (
    <>
      <PageHero
        badge="Legal"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M8 1L14 4V7.5C14 11 11.5 13.5 8 15C4.5 13.5 2 11 2 7.5V4L8 1Z"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
            <path d="M6 8L7.5 9.5L10.5 6.5" stroke="#FF8400" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        }
        title="Appropriate Use"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Appropriate Use" },
        ]}
        subtitle="Last updated: March 11, 2026"
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto max-w-3xl">
          <div className="prose-legal space-y-10 text-[#9E9E98] text-sm leading-relaxed">

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">1. Purpose</h2>
              <p>
                This Appropriate Use Policy (&ldquo;Policy&rdquo;) defines the acceptable boundaries for using Barron & Folly LC (&ldquo;B&F&rdquo;) services, including our AI-powered execution systems, the B&F Console, and any deliverables produced during the course of your subscription. This Policy supplements our Terms of Service and applies to all clients and authorized users.
              </p>
              <p className="mt-3">
                Barron & Folly deploys autonomous AI agents alongside senior human oversight to execute work on behalf of our clients. Because of the autonomous nature of these systems, it is essential that all parties operate within clear, responsible boundaries.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">2. Permitted Use</h2>
              <p>Our services are designed for legitimate business purposes, including but not limited to:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Building, deploying, and maintaining websites, web applications, and digital platforms.</li>
                <li>Designing and implementing systems architecture, workflow automation, and internal tooling.</li>
                <li>Creating brand identity systems, design systems, and user experience strategies.</li>
                <li>Configuring CRM systems, integrations, dashboards, and reporting infrastructure.</li>
                <li>Developing content, technical SEO structures, and conversion optimization systems.</li>
                <li>Building internal SaaS products, customer portals, and data visibility layers.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">3. Prohibited Use</h2>
              <p>You may not use Barron & Folly services to:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Build or deploy systems that facilitate illegal activity, fraud, or deception.</li>
                <li>Create malware, phishing infrastructure, spam systems, or tools designed to exploit individuals or organizations.</li>
                <li>Develop systems that unlawfully discriminate against individuals based on race, gender, religion, sexual orientation, disability, or other protected characteristics.</li>
                <li>Generate, store, or distribute content that exploits minors, promotes violence, or constitutes hate speech.</li>
                <li>Circumvent, disable, or interfere with security features of any system, service, or network.</li>
                <li>Misrepresent AI-generated content as human-created in contexts where such disclosure is legally required.</li>
                <li>Use our AI agents or systems to generate content that impersonates real individuals without their consent.</li>
                <li>Reverse-engineer, decompile, or attempt to extract proprietary methods, tools, or AI models used by Barron & Folly.</li>
                <li>Resell, sublicense, or redistribute Barron & Folly services to third parties without written authorization.</li>
                <li>Submit requests designed to probe, test, or exploit our internal AI systems for purposes unrelated to legitimate service delivery.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">4. AI Systems &amp; Responsible Use</h2>
              <p>
                Barron & Folly utilizes AI agents across multiple execution domains, including code generation, content creation, design, research, and operational automation. Clients should be aware of the following principles governing our use of AI:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>AI-generated outputs are subject to human review commensurate with the risk level of the task.</li>
                <li>High-risk operations (production deployments, infrastructure changes, security-related work) require explicit human approval before execution.</li>
                <li>We maintain audit trails of AI agent actions for transparency and accountability.</li>
                <li>Clients are encouraged to review deliverables and report any concerns about AI-generated output quality or accuracy.</li>
              </ul>
              <p className="mt-3">
                We do not guarantee that AI-generated outputs will be free from errors, biases, or inaccuracies. Clients should exercise their own professional judgment when deploying deliverables in production environments.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">5. Client Portal (B&F Console) Use</h2>
              <p>When using the B&F Console, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Use the portal only for its intended purpose of submitting requests, reviewing status, providing approvals, and communicating with the B&F team.</li>
                <li>Not attempt to access data, accounts, or systems belonging to other clients.</li>
                <li>Not upload malicious files, scripts, or content through the portal&apos;s attachment or communication features.</li>
                <li>Maintain the security of your account credentials and promptly notify us of any unauthorized access.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">6. Credentials &amp; Access</h2>
              <p>
                In the course of providing services, you may share system credentials, API keys, or other access permissions with Barron & Folly. You are responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Providing only the minimum level of access required for the work being performed.</li>
                <li>Revoking access when it is no longer needed or when your subscription ends.</li>
                <li>Notifying us immediately if any shared credentials are compromised.</li>
              </ul>
              <p className="mt-3">
                We handle all shared credentials with commercially reasonable security practices, including encryption at rest and restricted access controls.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">7. Content Standards</h2>
              <p>
                All content submitted to Barron & Folly for execution or publication must comply with applicable laws and regulations. You are solely responsible for ensuring that content you provide or request us to create does not infringe on third-party intellectual property rights, violate privacy laws, or contravene advertising regulations.
              </p>
              <p className="mt-3">
                We reserve the right to decline requests that, in our reasonable judgment, would result in content or systems that violate this Policy, applicable law, or professional ethical standards.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">8. Enforcement</h2>
              <p>
                Violations of this Policy may result in:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Refusal to execute specific requests.</li>
                <li>Suspension of your account and access to the B&F Console.</li>
                <li>Termination of your subscription without refund.</li>
                <li>Reporting to appropriate legal authorities where required by law.</li>
              </ul>
              <p className="mt-3">
                We will make reasonable efforts to notify you of any policy violations and provide an opportunity to remedy the issue before taking enforcement action, except in cases of egregious or unlawful conduct.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">9. Reporting Concerns</h2>
              <p>
                If you become aware of any use of Barron & Folly services that violates this Policy, or if you have concerns about the output of our AI systems, please contact us immediately at{" "}
                <a href="mailto:start@barronfolly.com" className="text-[#FF8400] hover:underline">
                  start@barronfolly.com
                </a>
                .
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">10. Modifications</h2>
              <p>
                We may update this Policy from time to time to reflect changes in our services, technology, or legal requirements. Material changes will be communicated with at least 14 days&apos; notice. Continued use of our services after the effective date of any changes constitutes your acceptance of the updated Policy.
              </p>
              <p className="mt-3 text-[#6E6E6A]">
                Barron & Folly LC<br />
                American Fork, UT 84003
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
