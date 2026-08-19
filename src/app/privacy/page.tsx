import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

export const metadata = {
  title: "Privacy Policy | Zorvai",
  description: "Zorvai Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <Navbar />
      
      <div className="flex-1 bg-[var(--color-bg)] pt-[var(--space-20)] pb-[var(--space-32)] px-[var(--space-6)] relative z-10">
        <div className="max-w-[800px] mx-auto">
          
          <h1 className="heading-display mb-[var(--space-2)] text-center text-[var(--color-text)]">
            Privacy Policy
          </h1>
          <p className="font-sans text-center text-[var(--text-body-sm)] text-[var(--color-text-muted)] mb-[var(--space-16)]">
            Last updated: August 2026
          </p>

          <div className="space-y-[var(--space-16)] font-sans text-[var(--text-body)] text-[var(--color-text-muted)] leading-[var(--lh-body)]">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                What we collect
              </h2>
              <ul className="list-disc pl-[var(--space-6)] space-y-[var(--space-2)]">
                <li>Your name, email, and phone number when you sign up</li>
                <li>Your study profile (country, subjects, confidence level, goals)</li>
                <li>Session data (topics studied, quiz scores, session duration)</li>
                <li>For students under the linked parent feature: the parent&apos;s email and their stated goal for their child</li>
                <li>Payment information (processed by Stripe or Razorpay — we never store your card details directly)</li>
              </ul>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                What we don&apos;t collect
              </h2>
              <ul className="list-disc pl-[var(--space-6)] space-y-[var(--space-2)]">
                <li>We do not sell your data to advertisers or third parties</li>
                <li>We do not share your child&apos;s session content with anyone except the linked parent account</li>
                <li>Emotional check-in responses are private to the student and are never shown to parents unless an escalation is triggered (see below)</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                The escalation policy
              </h2>
              <p>
                We&apos;re building an escalation feature that will notify a linked parent (without sharing the content of what was said) if a check-in suggests a student may be in serious distress. <strong>This feature is not yet active.</strong> Please do not rely on Zorvai for crisis support. If your child is in immediate distress, please reach out to them directly or contact local emergency or crisis services.
              </p>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Data storage
              </h2>
              <p>
                Your data is stored in Supabase (PostgreSQL), hosted on AWS infrastructure in the region closest to you. All data is encrypted at rest and in transit.
              </p>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Your rights
              </h2>
              <p>
                You can request deletion of your account and all associated data at any time by emailing privacy@zorvai.ai. We will process deletion requests within 14 days.
              </p>
            </section>

            {/* Section 6 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Children&apos;s privacy
              </h2>
              <p>
                Students under 13 must have a parent account linked before accessing Zorvai. Parents can review and request deletion of their child&apos;s data at any time.
              </p>
            </section>

            {/* Section 7 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Contact
              </h2>
              <p>
                Questions? Email us at <a href="mailto:privacy@zorvai.ai" className="text-[var(--color-primary)] hover:underline">privacy@zorvai.ai</a>
              </p>
            </section>

          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
