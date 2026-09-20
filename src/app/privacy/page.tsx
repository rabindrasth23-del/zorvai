import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import { ShieldCheck, EyeOff, Lock, UserCheck } from "lucide-react";

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
          
          <div className="text-center mb-[var(--space-16)]">
            <h1 className="heading-display mb-[var(--space-4)] text-[var(--color-text)]">
              Privacy by <span className="italic text-[var(--color-accent)]">Default</span>
            </h1>
            <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)] max-w-2xl mx-auto">
              We built Zorvai to help students study, not to mine their data. Here is exactly what we collect, what we don&apos;t, and who can see it.
            </p>
          </div>

          <div className="space-y-[var(--space-12)] font-sans text-[var(--text-body)] text-[var(--color-text-muted)] leading-[var(--lh-body)]">
            
            {/* Section 1 */}
            <section className="bg-surface border border-border p-8 rounded-3xl shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary)]/10 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-[var(--color-primary)]" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-[var(--color-text)]">
                  What we collect
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-2 mb-4">
                <li><strong className="text-[var(--color-text)]">Account info:</strong> Name, email, and phone number when you sign up.</li>
                <li><strong className="text-[var(--color-text)]">Study profile:</strong> Country, language, grade level, subjects, and weekly goals to personalize the AI.</li>
                <li><strong className="text-[var(--color-text)]">Session data:</strong> Topics studied, quiz scores, duration, and AI conversation history to track progress.</li>
                <li><strong className="text-[var(--color-text)]">Check-in mood:</strong> Selected mood at the start of sessions to adjust the teaching approach.</li>
              </ul>
              <p className="text-[var(--text-body-sm)]">
                * Payment information is processed securely by Stripe or Razorpay. We never store your card details on our servers.
              </p>
            </section>

            {/* Section 2 */}
            <section className="bg-surface border border-border p-8 rounded-3xl shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-success)]/10 flex items-center justify-center">
                  <EyeOff className="w-5 h-5 text-[var(--color-success)]" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-[var(--color-text)]">
                  What we explicitly DO NOT collect
                </h2>
              </div>
              <ul className="list-disc pl-6 space-y-3">
                <li><strong className="text-[var(--color-text)]">Check-in text:</strong> Any free-text typed during emotional check-ins is analyzed in memory for safety keywords and immediately discarded. It is never saved to our database.</li>
                <li><strong className="text-[var(--color-text)]">Recall transcripts:</strong> Voice transcripts generated when a student explains a topic are deleted immediately after the AI generates follow-up questions. They are not stored.</li>
                <li><strong className="text-[var(--color-text)]">Biometrics:</strong> We do not collect or store biometric voiceprints. Voice processing is transient.</li>
                <li><strong className="text-[var(--color-text)]">Data selling:</strong> We do not sell data to advertisers or data brokers. We do not use third-party tracking pixels (like Meta or Google Analytics).</li>
              </ul>
            </section>

            {/* Section 3 */}
            <section className="bg-surface border border-border p-8 rounded-3xl shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-accent)]/10 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-[var(--color-accent)]" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-[var(--color-text)]">
                  Parent Dashboard Boundaries
                </h2>
              </div>
              <p className="mb-4">
                If a student account is linked to a parent (Family Plan), the parent has access to academic progress but NOT private study content.
              </p>
              <div className="grid md:grid-cols-2 gap-6 mt-6">
                <div className="bg-success/5 border border-success/20 p-4 rounded-xl">
                  <strong className="text-[var(--color-success)] block mb-2 font-sans">Parents CAN see:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-text)]">
                    <li>Session dates and duration</li>
                    <li>Topics studied and mastery (pass/fail)</li>
                    <li>Goal progress and daily streaks</li>
                    <li>Guarantee eligibility status</li>
                  </ul>
                </div>
                <div className="bg-warning/5 border border-warning/20 p-4 rounded-xl">
                  <strong className="text-[var(--color-warning)] block mb-2 font-sans">Parents CANNOT see:</strong>
                  <ul className="list-disc pl-5 space-y-1 text-sm text-[var(--color-text)]">
                    <li>Check-in mood or text responses</li>
                    <li>Chatbot conversation history</li>
                    <li>Any voice transcripts</li>
                    <li>Free-text inputs inside sessions</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section className="bg-surface border border-border p-8 rounded-3xl shadow-[var(--shadow-sm)]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[var(--color-warning)]/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-[var(--color-warning)]" />
                </div>
                <h2 className="text-2xl font-display font-semibold text-[var(--color-text)]">
                  Safety Escalations
                </h2>
              </div>
              <p>
                Student safety is our top priority. If a student selects a "not okay" mood during a check-in AND uses specific high-risk language in their free-text response, the system will trigger an escalation.
              </p>
              <p className="mt-4">
                <strong>How it works:</strong> The AI flags the high-risk pattern in memory. A generic notification flag is sent to the linked parent (e.g., "Your student shared something concerning today, please check in on them"). <strong>The actual text the student wrote is never stored or sent to the parent.</strong>
              </p>
            </section>

            {/* Section 5 & 6 Compact */}
            <div className="grid md:grid-cols-2 gap-6">
              <section className="bg-surface border border-border p-6 rounded-3xl shadow-[var(--shadow-sm)]">
                <h3 className="text-lg font-display font-semibold text-[var(--color-text)] mb-3">
                  Children&apos;s Privacy (COPPA)
                </h3>
                <p className="text-sm">
                  Students under 13 must have a parent account linked and verified before accessing Zorvai. Data from under-13 accounts is heavily restricted and is never used for anonymized AI improvements. Parents can request deletion at any time.
                </p>
              </section>

              <section className="bg-surface border border-border p-6 rounded-3xl shadow-[var(--shadow-sm)]">
                <h3 className="text-lg font-display font-semibold text-[var(--color-text)] mb-3">
                  Your Rights & Data Deletion
                </h3>
                <p className="text-sm mb-4">
                  You have the right to export or delete your data at any time via your Account Settings. Account deletion triggers a full cascade deletion of all your data within 14 days.
                </p>
                <a href="mailto:privacy@zorvai.ca" className="font-medium text-[var(--color-primary)] hover:underline">
                  privacy@zorvai.ca
                </a>
              </section>
            </div>

          </div>
        </div>
      </div>
      
      <Footer />
    </main>
  );
}
