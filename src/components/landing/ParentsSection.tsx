import FadeInSection from "./FadeInSection";
import { User } from "lucide-react";

export default function ParentsSection() {
  return (
    <section className="bg-[var(--color-bg)] py-[var(--space-20)] md:py-[var(--space-32)] px-[var(--space-6)] text-center relative z-20">
      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        <FadeInSection>
          <div className="font-sans text-[var(--text-caption)] font-semibold text-[var(--color-text-muted)] tracking-[0.05em] uppercase mb-[var(--space-4)]">
            FOR PARENTS & STUDENTS
          </div>
          <h2 className="heading-display mb-[var(--space-12)]">
            Built for <span className="italic text-[var(--color-primary)]">real progress</span>
          </h2>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          {/* A single, honest placeholder card instead of a fabricated collage */}
          <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-8)] md:p-[var(--space-12)] shadow-[var(--shadow-sm)] max-w-[600px] w-full text-center flex flex-col items-center gap-[var(--space-6)] relative mt-8">
            
            {/* Abstract Avatar (No fake stock photos) */}
            <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center text-[var(--color-text-muted)] border-4 border-[var(--color-surface)] shadow-sm absolute -top-8">
              <User size={28} />
            </div>

            <div className="mt-[var(--space-4)] font-sans text-[var(--text-h3)] leading-[var(--lh-h3)] text-[var(--color-text-muted)] font-medium italic">
              &ldquo;[Pilot feedback coming soon. Actual student and parent reviews will populate here after the pilot completes.]&rdquo;
            </div>

            <div className="flex flex-col gap-1 items-center mt-[var(--space-2)]">
              <div className="font-sans text-[var(--text-body-sm)] font-bold text-[var(--color-text)]">
                Student
              </div>
              <div className="font-sans text-[var(--text-caption)] text-[var(--color-text-muted)] uppercase tracking-wide">
                Central Point Academy
              </div>
            </div>
            
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
