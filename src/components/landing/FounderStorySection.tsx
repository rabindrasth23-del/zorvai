import FadeInSection from "./FadeInSection";

export default function FounderStorySection() {
  return (
    <section className="bg-[var(--color-surface)] py-[var(--space-20)] md:py-[var(--space-32)] px-[var(--space-6)] text-center relative z-20">
      <div className="max-w-[800px] mx-auto flex flex-col items-center">
        <FadeInSection>
          <h2 className="heading-display mb-[var(--space-10)] text-[var(--color-text)]">
            Why we built this
          </h2>
        </FadeInSection>

        <FadeInSection delay={0.1}>
          <div className="text-left font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-[var(--color-text-muted)] space-y-[var(--space-6)] mb-[var(--space-16)] max-w-[700px] mx-auto bg-[var(--color-bg)] p-[var(--space-8)] rounded-[var(--radius-xl)] shadow-sm border border-[var(--color-border)]">
            <p>
              Prince and Rabindra grew up in Nepal without access to a private tutor. One day in a classroom, Prince realized he understood almost nothing from the lesson — not because he wasn&apos;t paying attention, but because there was no one to explain it back to him, check if he&apos;d understood, or push him to think harder about it.
            </p>
            <p>
              He searched everywhere for a voice AI tutor that could teach the way a real teacher would — one topic at a time, patiently, checking real understanding before moving on. He couldn&apos;t find one.
            </p>
            <p className="font-semibold text-[var(--color-text)]">
              So they built it.
            </p>
          </div>
        </FadeInSection>

        <FadeInSection delay={0.2}>
          <div className="flex flex-col sm:flex-row justify-center gap-[var(--space-6)] w-full">
            {/* Card 1: Prince */}
            <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] p-[var(--space-6)] flex items-center gap-[var(--space-4)] border border-[var(--color-border)] shadow-sm flex-1 max-w-[300px]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center font-display text-[1.5rem] font-bold text-[var(--color-text)]">
                P
              </div>
              <div className="text-left">
                <div className="font-sans text-[var(--text-body)] font-bold text-[var(--color-text)]">
                  Prince
                </div>
                <div className="font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                  Co-founder
                </div>
                <div className="font-sans text-[var(--text-caption)] text-[var(--color-text-muted)] mt-1">
                  Nepal 🇳🇵
                </div>
              </div>
            </div>

            {/* Card 2: Rabindra */}
            <div className="bg-[var(--color-bg)] rounded-[var(--radius-lg)] p-[var(--space-6)] flex items-center gap-[var(--space-4)] border border-[var(--color-border)] shadow-sm flex-1 max-w-[300px]">
              <div className="w-16 h-16 rounded-full bg-[var(--color-muted)] flex items-center justify-center font-display text-[1.5rem] font-bold text-[var(--color-text)]">
                R
              </div>
              <div className="text-left">
                <div className="font-sans text-[var(--text-body)] font-bold text-[var(--color-text)]">
                  Rabindra
                </div>
                <div className="font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)]">
                  Co-founder
                </div>
                <div className="font-sans text-[var(--text-caption)] text-[var(--color-text-muted)] mt-1">
                  Nepal 🇳🇵
                </div>
              </div>
            </div>
          </div>
        </FadeInSection>
      </div>
    </section>
  );
}
