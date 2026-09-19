import Link from "next/link";
import FadeInSection from "./FadeInSection";
import { ArrowRight } from "lucide-react";

export default function EarlyAdopterCTA() {
  return (
    <section className="bg-[var(--color-text)] py-[var(--space-20)] md:py-[var(--space-32)] px-[var(--space-6)] text-center relative z-20">
      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        <FadeInSection>
          <h2 className="heading-display mb-[var(--space-6)] text-white">
            Be one of our <span className="italic text-[var(--color-accent)]">first 100</span> students
          </h2>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          <p className="font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-white/80 max-w-[600px] mb-[var(--space-12)] mx-auto">
            We&apos;re running a closed pilot right now. Sign up and shape how Zorvai works — first 100 get 60% off, forever.
          </p>

          <Link
            href="/signup"
            className="inline-flex items-center gap-[var(--space-2)] font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-accent)] px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-full)] no-underline shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] transition-all duration-200"
          >
            Get started free
            <ArrowRight size={18} />
          </Link>
        </FadeInSection>
      </div>
    </section>
  );
}
