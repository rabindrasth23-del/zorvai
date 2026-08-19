import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = {
  title: "The Zorvai Guarantee",
  description: "Real improvement, or your money back. No fine print tricks.",
};

export default function GuaranteePage() {
  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <Navbar />
      
      <div className="flex-1 bg-[var(--color-bg)] pt-[var(--space-20)] pb-[var(--space-32)] px-[var(--space-6)] relative z-10">
        <div className="max-w-[800px] mx-auto">
          
          <h1 className="heading-display mb-[var(--space-16)] text-center text-[var(--color-text)]">
            The Zorvai Guarantee
          </h1>

          <div className="space-y-[var(--space-16)] font-sans text-[var(--text-body)] text-[var(--color-text-muted)] leading-[var(--lh-body)]">
            
            {/* Section 1 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Real improvement, or your money back.
              </h2>
              <p>
                Before your first session, you take a short baseline quiz. After completing the agreed number of sessions, you take a follow-up quiz on the same material. If your score hasn&apos;t improved by the amount we agreed on upfront, you get a full refund. No arguing, no judgment, no fine print tricks.
              </p>
            </section>

            {/* Section 2 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Exactly how it works
              </h2>
              <ol className="list-decimal pl-[var(--space-6)] space-y-[var(--space-2)]">
                <li>You take a baseline quiz when you sign up (5–10 questions, matched to your subject and confidence level)</li>
                <li>You complete a minimum of 12 full study sessions within 30 days</li>
                <li>At the end of 30 days, you take a follow-up quiz (same difficulty, different questions)</li>
                <li>If your follow-up score is not higher than your baseline score, submit a refund claim in the app</li>
                <li>We verify your session count automatically (takes seconds)</li>
                <li>If you qualify: full refund processed within 5 business days</li>
              </ol>
            </section>

            {/* Section 3 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                What you need to qualify
              </h2>
              <ul className="list-disc pl-[var(--space-6)] space-y-[var(--space-2)]">
                <li>Minimum 12 completed sessions in 30 days (a full Learn→Recall→Challenge→Feedback cycle counts as one session)</li>
                <li>Baseline quiz completed at signup</li>
                <li>Follow-up quiz completed within your 30-day window</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                What we will never do
              </h2>
              <ul className="list-disc pl-[var(--space-6)] space-y-[var(--space-2)]">
                <li>We will never judge whether you &quot;tried hard enough&quot;</li>
                <li>We will never ask you to prove you studied properly</li>
                <li>We will never publicly shame or list any customer</li>
                <li>The only criteria is two numbers: your before score and your after score</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section>
              <h2 className="text-[var(--text-h2)] font-bold text-[var(--color-text)] mb-[var(--space-4)]">
                Annual plan guarantee
              </h2>
              <p>
                On the annual plan, your guarantee resets every 90 days. Each 90-day window requires 12 sessions to qualify. You can claim at the end of any qualifying window.
              </p>
            </section>

          </div>

          <div className="mt-[var(--space-20)] flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-[var(--space-2)] font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-accent)] px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-full)] no-underline shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] transition-all duration-200"
            >
              Start your baseline quiz
              <ArrowRight size={18} />
            </Link>
          </div>

        </div>
      </div>
      
      <Footer />
    </main>
  );
}
