import { BookOpen, BrainCircuit } from "lucide-react";
import FadeInSection from "./FadeInSection";

export default function ProofSection() {
  return (
    <section className="bg-[var(--color-primary)] py-[var(--space-16)] md:py-[var(--space-20)] px-[var(--space-6)] text-center relative z-20">
      <div className="max-w-[1024px] mx-auto flex flex-col items-center">
        <FadeInSection>
          <h2 className="heading-display mb-[var(--space-6)] max-w-[800px] text-white">
            Study <span className="italic text-[var(--color-success)]">smarter,</span> not longer
          </h2>

          <p className="font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-white/90 max-w-[600px] mb-[var(--space-12)]">
            Most studying is rereading notes and hoping they stick. Zorvai forces
            the recall that actually builds memory.
          </p>
        </FadeInSection>

        <FadeInSection delay={0.15}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--space-6)] w-full max-w-[800px]">
            {/* Card 1: The passive problem */}
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-[var(--space-10)] shadow-[var(--shadow-md)] text-left flex flex-col justify-start gap-[var(--space-4)]">
              <div className="w-12 h-12 bg-[var(--color-border)] rounded-full flex items-center justify-center mb-2">
                <BookOpen size={24} className="text-[var(--color-text-muted)]" />
              </div>
              <div>
                <div className="font-sans text-[var(--text-body-sm)] font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-[var(--space-2)]">
                  Rereading notes
                </div>
                <div className="font-sans text-[var(--text-h3)] font-bold text-[var(--color-text)] leading-[1.3] text-opacity-80">
                  Passive review — hope it sticks
                </div>
              </div>
            </div>

            {/* Card 2: The active solution */}
            <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] p-[var(--space-10)] shadow-[var(--shadow-xl)] text-left flex flex-col justify-start gap-[var(--space-4)] border-2 border-[var(--color-success)] relative md:-translate-y-4">
              <div className="absolute top-0 right-[var(--space-6)] -translate-y-1/2 bg-[var(--color-success)] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                Zorvai Method
              </div>
              <div className="w-12 h-12 bg-success/10 rounded-full flex items-center justify-center mb-2">
                <BrainCircuit size={24} className="text-[var(--color-success)]" />
              </div>
              <div>
                <div className="font-sans text-[var(--text-body-sm)] font-semibold text-[var(--color-success)] uppercase tracking-wide mb-[var(--space-2)]">
                  Studying with Zorvai
                </div>
                <div className="font-sans text-[var(--text-h3)] font-bold text-[var(--color-text)] leading-[1.3]">
                  Mastery-gated — you don&apos;t move on until it sticks
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}

