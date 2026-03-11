import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Terms of Service for Barron & Folly LC subscription-based product agency services.",
  alternates: { canonical: "/terms" },
};

export default function TermsPage() {
  return (
    <>
      <PageHero
        badge="Legal"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M4 2H12C12.5523 2 13 2.44772 13 3V13C13 13.5523 12.5523 14 12 14H4C3.44772 14 3 13.5523 3 13V3C3 2.44772 3.44772 2 4 2Z"
              stroke="#FF8400"
              strokeWidth="1.2"
            />
            <path d="M6 5H10M6 8H10M6 11H8" stroke="#FF8400" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
        }
        title="Terms of Service"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Terms of Service" },
        ]}
        subtitle="Last updated: March 11, 2026"
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto max-w-3xl">
          <div className="prose-legal space-y-10 text-[#9E9E98] text-sm leading-relaxed">

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">1. Agreement to Terms</h2>
              <p>
                These Terms of Service (&ldquo;Terms&rdquo;) constitute a legally binding agreement between you (&ldquo;Client,&rdquo; &ldquo;you,&rdquo; or &ldquo;your&rdquo;) and Barron & Folly LC (&ldquo;B&F,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;), a limited liability company organized under the laws of the State of Utah, with its principal place of business in American Fork, Utah.
              </p>
              <p className="mt-3">
                By subscribing to our services, accessing the B&F Console, or engaging with any deliverables produced by Barron & Folly, you agree to be bound by these Terms. If you are entering into these Terms on behalf of a company or other legal entity, you represent that you have the authority to bind that entity.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">2. Description of Services</h2>
              <p>
                Barron & Folly operates as a subscription-based agentic product agency. We deploy a combination of autonomous AI agents and senior human oversight to build, standardize, and scale digital infrastructure for our clients. Our services span software development, systems architecture, brand infrastructure, automations, integrations, and related digital execution work.
              </p>
              <p className="mt-3">
                Services are delivered on a continuous, asynchronous basis through our proprietary task queue and client portal (the &ldquo;B&F Console&rdquo;). The scope and nature of services available to you depend on your active subscription tier.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">3. Subscription Tiers &amp; Billing</h2>
              <p>
                Barron & Folly offers multiple subscription tiers, each with different levels of execution capability, strategic oversight, and service scope. Specific tier details, pricing, and included deliverables are presented on our pricing page and in any applicable order form.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Subscriptions are billed monthly in advance on a recurring basis.</li>
                <li>All fees are non-refundable except as expressly stated in these Terms or required by applicable law.</li>
                <li>We reserve the right to modify pricing with 30 days&apos; written notice. Continued use of services after a price change constitutes acceptance of the new pricing.</li>
                <li>You may upgrade or downgrade your subscription tier at any time. Changes take effect at the start of the next billing cycle.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">4. Cancellation &amp; Termination</h2>
              <p>
                Barron & Folly subscriptions operate on a no-contract basis. You may cancel your subscription at any time by providing written notice to us. Upon cancellation:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Your subscription remains active through the end of the current billing period.</li>
                <li>Any work in progress at the time of cancellation will be completed and delivered if reasonably feasible within the remaining subscription period.</li>
                <li>Access to the B&F Console will be maintained through the end of the billing period and for a 30-day grace period thereafter to allow you to export your data.</li>
              </ul>
              <p className="mt-3">
                We reserve the right to suspend or terminate your account if you breach these Terms, engage in prohibited conduct, or fail to pay applicable fees. We will provide reasonable notice before termination except in cases of material breach.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">5. Client Responsibilities</h2>
              <p>You agree to:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Provide accurate and complete information necessary for the execution of requested work.</li>
                <li>Respond to clarification requests, approval prompts, and other communications through the B&F Console in a timely manner.</li>
                <li>Ensure that any materials, credentials, access permissions, or content you provide to us do not violate the rights of any third party.</li>
                <li>Maintain the confidentiality of your B&F Console login credentials.</li>
                <li>Comply with our Appropriate Use Policy at all times.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">6. AI-Assisted Execution</h2>
              <p>
                You acknowledge and agree that Barron & Folly utilizes artificial intelligence systems, including autonomous AI agents, in the execution of client work. AI-generated outputs are reviewed and governed by human oversight processes as appropriate to the risk level and nature of the work.
              </p>
              <p className="mt-3">
                While we apply commercially reasonable quality controls, AI-generated work may occasionally require revision. We address such revisions as part of our standard service delivery at no additional cost within your active subscription.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">7. Intellectual Property</h2>
              <p>
                Upon full payment of applicable fees, all custom deliverables created specifically for you (including code, designs, copy, and configurations) are assigned to you. You receive full ownership of the final work product.
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Barron & Folly retains ownership of all proprietary tools, frameworks, templates, AI models, internal systems, and methodologies used in the delivery of services.</li>
                <li>We retain a non-exclusive license to use anonymized, generalized learnings from client engagements for internal improvement purposes.</li>
                <li>Third-party components (open-source libraries, stock assets, API integrations) remain subject to their respective licenses.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">8. Confidentiality</h2>
              <p>
                Both parties agree to maintain the confidentiality of proprietary information disclosed during the course of the engagement. Confidential information includes business strategies, technical specifications, credentials, financial data, and any materials marked or reasonably understood to be confidential.
              </p>
              <p className="mt-3">
                Barron & Folly implements reasonable security measures to protect client data and restricts access to authorized personnel and systems only. We will not disclose your confidential information to third parties except as required by law or with your prior written consent.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">9. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by applicable law, Barron & Folly LC shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, revenue, data, business opportunities, or goodwill, arising out of or related to these Terms or the services provided.
              </p>
              <p className="mt-3">
                Our total aggregate liability for any claims arising under these Terms shall not exceed the total fees paid by you to Barron & Folly during the three (3) months immediately preceding the event giving rise to the claim.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">10. Warranties &amp; Disclaimers</h2>
              <p>
                Barron & Folly warrants that services will be performed in a professional and workmanlike manner consistent with generally accepted industry standards. Beyond this express warranty, services are provided &ldquo;as is&rdquo; and &ldquo;as available.&rdquo;
              </p>
              <p className="mt-3">
                We do not warrant that any deliverable will achieve specific business results, revenue targets, or performance metrics. We disclaim all other warranties, whether express, implied, statutory, or otherwise, including implied warranties of merchantability, fitness for a particular purpose, and non-infringement.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">11. Indemnification</h2>
              <p>
                You agree to indemnify, defend, and hold harmless Barron & Folly LC, its members, employees, and agents from and against any claims, liabilities, damages, losses, and expenses (including reasonable attorneys&apos; fees) arising out of or in connection with: (a) your breach of these Terms; (b) your use of the services; (c) materials or content you provide to us; or (d) your violation of any applicable law or third-party rights.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">12. Governing Law &amp; Disputes</h2>
              <p>
                These Terms shall be governed by and construed in accordance with the laws of the State of Utah, without regard to its conflict of laws principles. Any disputes arising under or in connection with these Terms shall be resolved exclusively in the state or federal courts located in Utah County, Utah. Both parties consent to the personal jurisdiction of such courts.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">13. Modifications</h2>
              <p>
                We reserve the right to update or modify these Terms at any time. Material changes will be communicated via email or through the B&F Console with at least 14 days&apos; notice prior to taking effect. Your continued use of the services after the effective date of any modifications constitutes acceptance of the updated Terms.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">14. Severability</h2>
              <p>
                If any provision of these Terms is held to be invalid, illegal, or unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary to make it valid and enforceable while preserving its original intent.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">15. Contact</h2>
              <p>
                For questions about these Terms of Service, please contact us at{" "}
                <a href="mailto:start@barronfolly.com" className="text-[#FF8400] hover:underline">
                  start@barronfolly.com
                </a>
                .
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
