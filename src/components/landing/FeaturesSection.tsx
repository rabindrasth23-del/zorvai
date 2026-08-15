import FadeInSection from "./FadeInSection";

export default function FeaturesSection() {
  return (
    <section className="bg-[var(--color-bg)] py-[var(--space-16)] md:py-[var(--space-24)] px-[var(--space-6)] relative z-20">
      <div className="max-w-[1200px] mx-auto flex flex-col gap-[var(--space-20)] md:gap-[var(--space-32)]">
        
        {/* Feature 1: Subject Adaptation */}
        <div className="flex flex-col-reverse md:flex-row items-center gap-[var(--space-12)] md:gap-[var(--space-20)]">
          
          {/* Left card: Sage/soft background with tags */}
          <div className="flex-1 w-full">
            <FadeInSection>
              <div className="bg-[var(--color-success)]/10 border border-[var(--color-success)]/20 rounded-[var(--radius-xl)] p-[var(--space-10)] md:p-[var(--space-16)] flex flex-wrap gap-[var(--space-3)] justify-center items-center min-h-[300px] shadow-[var(--shadow-sm)]">
                <span className="bg-white text-[var(--color-text)] font-sans font-medium text-[var(--text-body-sm)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] shadow-sm">
                  Organic Chemistry
                </span>
                <span className="bg-white text-[var(--color-text)] font-sans font-medium text-[var(--text-body-sm)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] shadow-sm">
                  Calculus II
                </span>
                <span className="bg-white text-[var(--color-text)] font-sans font-medium text-[var(--text-body-sm)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)] shadow-sm">
                  Nepali Grammar
                </span>
                {/* Changed to a static span to clearly signal it's a mockup representation, not a functional button */}
                <span className="bg-transparent border border-dashed border-[var(--color-text-muted)] text-[var(--color-text-muted)] font-sans font-medium text-[var(--text-body-sm)] px-[var(--space-4)] py-[var(--space-2)] rounded-[var(--radius-full)]">
                  + Add a subject
                </span>
              </div>
            </FadeInSection>
          </div>

          {/* Right side text */}
          <div className="flex-1 w-full">
            <FadeInSection delay={0.2}>
              <h2 className="heading-display mb-[var(--space-6)]">
                Zorvai learns <span className="italic text-[var(--color-primary)]">what you&apos;re studying</span>
              </h2>
              <p className="font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-[var(--color-text-muted)]">
                Your plan adapts to your subjects, your deadline, and your confidence level — not a generic syllabus. Tell it what you&apos;re stuck on and Day 1 starts there.
              </p>
            </FadeInSection>
          </div>
        </div>

        {/* Feature 2: Mastery Tracking */}
        {/* Changed to flex-col-reverse so mobile is consistently Text top / Visual bottom across both features */}
        <div className="flex flex-col-reverse md:flex-row-reverse items-center gap-[var(--space-12)] md:gap-[var(--space-20)]">
          
          {/* Visual Card (on right for desktop, bottom for mobile) */}
          <div className="flex-1 w-full">
            <FadeInSection delay={0.2}>
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-[var(--space-8)] md:p-[var(--space-16)] flex flex-col gap-[var(--space-4)] justify-center min-h-[300px] shadow-[var(--shadow-sm)]">
                
                {/* Understood row */}
                <div className="flex items-center justify-between bg-white p-[var(--space-4)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-success)]" />
                    <span className="font-sans font-medium text-[var(--color-text)]">Action Potentials</span>
                  </div>
                  {/* Status text uses the dark --color-text for accessible contrast, 
                      relying on the colored dot to carry the semantic hue */}
                  <span className="font-sans text-[var(--text-caption)] font-bold text-[var(--color-text)] uppercase tracking-wide">
                    Understood
                  </span>
                </div>

                {/* Re-queued row */}
                <div className="flex items-center justify-between bg-white p-[var(--space-4)] rounded-[var(--radius-md)] shadow-[var(--shadow-sm)]">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-accent)]" />
                    <span className="font-sans font-medium text-[var(--color-text)]">Cellular Respiration</span>
                  </div>
                  <span className="font-sans text-[var(--text-caption)] font-bold text-[var(--color-text)] uppercase tracking-wide">
                    Re-queued
                  </span>
                </div>

                {/* Missed row */}
                {/* Dropped full-row opacity reduction to preserve WCAG contrast. 
                    Uses --color-warning for the dot, and muted text for the topic name. */}
                <div className="flex items-center justify-between bg-[var(--color-bg)] p-[var(--space-4)] rounded-[var(--radius-md)] border border-[var(--color-border)]">
                  <div className="flex items-center gap-[var(--space-3)]">
                    <div className="w-3 h-3 rounded-full bg-[var(--color-warning)]" />
                    <span className="font-sans font-medium text-[var(--color-text-muted)]">Krebs Cycle</span>
                  </div>
                  <span className="font-sans text-[var(--text-caption)] font-bold text-[var(--color-text)] uppercase tracking-wide">
                    Missed
                  </span>
                </div>

              </div>
            </FadeInSection>
          </div>

          {/* Text (on left for desktop, top for mobile) */}
          <div className="flex-1 w-full">
            <FadeInSection>
              <h2 className="heading-display mb-[var(--space-6)]">
                Track what you&apos;ve <span className="italic text-[var(--color-primary)]">actually mastered</span>
              </h2>
              <p className="font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-[var(--color-text-muted)]">
                Every topic is marked understood, missed, or re-queued — so review time goes to what you don&apos;t know yet, not what you already do.
              </p>
            </FadeInSection>
          </div>

        </div>

      </div>
    </section>
  );
}
