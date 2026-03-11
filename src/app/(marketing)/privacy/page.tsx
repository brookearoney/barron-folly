import type { Metadata } from "next";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Privacy Policy for Barron & Folly LC. Learn how we collect, use, and protect your data.",
  alternates: { canonical: "/privacy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <PageHero
        badge="Legal"
        badgeIcon={
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="6" r="3" stroke="#FF8400" strokeWidth="1.2" />
            <path
              d="M3 14C3 11.2386 5.23858 9 8 9C10.7614 9 13 11.2386 13 14"
              stroke="#FF8400"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        }
        title="Privacy Policy"
        breadcrumbs={[
          { label: "Home", href: "/" },
          { label: "Privacy Policy" },
        ]}
        subtitle="Last updated: March 11, 2026"
      />

      <section className="pb-28 md:pb-36">
        <div className="w-[90%] mx-auto max-w-3xl">
          <div className="prose-legal space-y-10 text-[#9E9E98] text-sm leading-relaxed">

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">1. Introduction</h2>
              <p>
                Barron & Folly LC (&ldquo;B&F,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;) respects your privacy and is committed to protecting the personal information you share with us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website at barronfolly.com, use the B&F Console, or engage with our services.
              </p>
              <p className="mt-3">
                By using our website or services, you consent to the data practices described in this policy. If you do not agree with these practices, please do not use our website or services.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">2. Information We Collect</h2>

              <h3 className="text-sm font-semibold text-[#E8E4D9] mt-4 mb-2">Information You Provide</h3>
              <ul className="list-disc list-inside space-y-2 text-[#6E6E6A]">
                <li><strong className="text-[#9E9E98]">Contact information:</strong> Name, email address, phone number, and company name submitted through our contact forms or during onboarding.</li>
                <li><strong className="text-[#9E9E98]">Account information:</strong> Email address and authentication details when you create a B&F Console account.</li>
                <li><strong className="text-[#9E9E98]">Service-related data:</strong> Project requests, briefs, attachments, feedback, approval decisions, and communications submitted through the B&F Console.</li>
                <li><strong className="text-[#9E9E98]">Credentials and access:</strong> System credentials, API keys, or access tokens you voluntarily share with us to perform services on your behalf.</li>
                <li><strong className="text-[#9E9E98]">Payment information:</strong> Billing details processed through our third-party payment processor. We do not store full credit card numbers on our servers.</li>
              </ul>

              <h3 className="text-sm font-semibold text-[#E8E4D9] mt-4 mb-2">Information Collected Automatically</h3>
              <ul className="list-disc list-inside space-y-2 text-[#6E6E6A]">
                <li><strong className="text-[#9E9E98]">Usage data:</strong> Pages visited, time spent on pages, referring URLs, and navigation patterns on our website.</li>
                <li><strong className="text-[#9E9E98]">Device information:</strong> Browser type, operating system, screen resolution, and general device category.</li>
                <li><strong className="text-[#9E9E98]">Log data:</strong> IP addresses, access timestamps, and server logs generated when you interact with our website or the B&F Console.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">3. How We Use Your Information</h2>
              <p>We use the information we collect to:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Deliver, manage, and improve our subscription services and client deliverables.</li>
                <li>Operate and maintain the B&F Console, including authentication, request routing, and notifications.</li>
                <li>Communicate with you about your account, service updates, and respond to inquiries.</li>
                <li>Process subscription payments and manage billing.</li>
                <li>Execute work on your behalf, including deploying AI agents to build, design, and automate systems.</li>
                <li>Ensure security, detect fraud, and prevent abuse of our services.</li>
                <li>Analyze website usage patterns to improve user experience and service delivery.</li>
                <li>Comply with legal obligations and enforce our Terms of Service.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">4. AI Processing</h2>
              <p>
                As an agentic product agency, we use AI systems to process and act upon client requests. This means:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Project requests and related data may be processed by AI models to classify, scope, and execute work.</li>
                <li>AI agents may access credentials or systems you have authorized us to work with, strictly for the purpose of delivering the requested services.</li>
                <li>We maintain audit trails of AI agent actions for quality assurance, security, and accountability purposes.</li>
                <li>We do not use your proprietary data to train AI models. Client data is used solely for service delivery.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">5. How We Share Your Information</h2>
              <p>We do not sell your personal information. We may share your information only in the following circumstances:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li><strong className="text-[#9E9E98]">Service providers:</strong> We use trusted third-party tools and platforms (including hosting providers, payment processors, email services, and project management tools) that process data on our behalf to deliver our services.</li>
                <li><strong className="text-[#9E9E98]">AI service providers:</strong> Client request data may be processed through third-party AI APIs for task execution. These providers are bound by their own privacy and data handling policies.</li>
                <li><strong className="text-[#9E9E98]">Legal requirements:</strong> We may disclose information if required by law, subpoena, or governmental request, or to protect our legal rights.</li>
                <li><strong className="text-[#9E9E98]">Business transfers:</strong> In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that transaction. We will notify you before your information becomes subject to a different privacy policy.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">6. Data Security</h2>
              <p>
                We implement commercially reasonable technical and organizational measures to protect your information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>Encryption of data in transit (TLS/SSL) and at rest.</li>
                <li>Access controls restricting data access to authorized personnel and systems only.</li>
                <li>Secure credential storage with encryption for any client credentials we hold.</li>
                <li>Regular review of security practices and infrastructure.</li>
              </ul>
              <p className="mt-3">
                No method of transmission over the internet or electronic storage is 100% secure. While we strive to protect your information, we cannot guarantee absolute security.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">7. Data Retention</h2>
              <p>
                We retain your personal information for as long as your account is active or as needed to provide you services. After account termination:
              </p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li>We retain basic account records and transaction history for up to 3 years for legal and accounting purposes.</li>
                <li>Project data and deliverables are available for export during a 30-day post-cancellation grace period, after which they may be deleted.</li>
                <li>Shared credentials are purged within 7 days of subscription termination.</li>
                <li>Server logs and usage data are retained for up to 12 months.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">8. Cookies &amp; Tracking</h2>
              <p>
                Our website uses essential cookies required for basic functionality (such as authentication and session management). We may also use analytics tools to understand website usage patterns.
              </p>
              <p className="mt-3">
                We do not use third-party advertising cookies or sell data to advertisers. You can control cookie preferences through your browser settings. Disabling essential cookies may affect the functionality of the B&F Console.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">9. Your Rights</h2>
              <p>Depending on your location, you may have the following rights regarding your personal information:</p>
              <ul className="list-disc list-inside space-y-2 mt-3 text-[#6E6E6A]">
                <li><strong className="text-[#9E9E98]">Access:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong className="text-[#9E9E98]">Correction:</strong> Request that we correct inaccurate or incomplete personal information.</li>
                <li><strong className="text-[#9E9E98]">Deletion:</strong> Request that we delete your personal information, subject to legal retention requirements.</li>
                <li><strong className="text-[#9E9E98]">Portability:</strong> Request a machine-readable copy of your data.</li>
                <li><strong className="text-[#9E9E98]">Objection:</strong> Object to certain processing activities.</li>
              </ul>
              <p className="mt-3">
                To exercise any of these rights, please contact us at{" "}
                <a href="mailto:start@barronfolly.com" className="text-[#FF8400] hover:underline">
                  start@barronfolly.com
                </a>
                . We will respond to your request within 30 days.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">10. Children&apos;s Privacy</h2>
              <p>
                Our services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal information from a child, we will take steps to delete that information promptly.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">11. Third-Party Links</h2>
              <p>
                Our website may contain links to third-party websites or services. We are not responsible for the privacy practices or content of those third-party sites. We encourage you to review the privacy policies of any third-party service before providing personal information.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">12. Changes to This Policy</h2>
              <p>
                We may update this Privacy Policy from time to time. Material changes will be posted on this page with an updated effective date and communicated via email to active subscribers. Your continued use of our services after changes are posted constitutes acceptance of the updated policy.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-[#E8E4D9] mb-3">13. Contact Us</h2>
              <p>
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <p className="mt-3 text-[#6E6E6A]">
                Barron & Folly LC<br />
                American Fork, UT 84003<br />
                <a href="mailto:start@barronfolly.com" className="text-[#FF8400] hover:underline">
                  start@barronfolly.com
                </a>
              </p>
            </div>

          </div>
        </div>
      </section>
    </>
  );
}
