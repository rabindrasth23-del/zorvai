import FadeInSection from "./FadeInSection";
import HowItWorksVisual from "./HowItWorksVisual";

export default function HowItWorksSection() {
  const steps = [
    { title: "Learn", description: "One topic, taught at your pace" },
    { title: "Recall", description: "Explain it back, no notes, AI just listens" },
    { title: "Challenge", description: "Four questions, increasing difficulty" },
    { title: "Feedback", description: "What you nailed, what's re-queued for next time" },
  ];

  return (
    <section id="how-it-works" className="bg-[var(--color-bg)] py-[var(--space-16)] md:py-[var(--space-20)] px-[var(--space-6)]">
      <div className="max-w-[1200px] mx-auto flex flex-col md:flex-row gap-[var(--space-12)] md:gap-[var(--space-20)] items-center">
        {/* Left column: Text */}
        <div className="flex-1 w-full text-left flex flex-col justify-between h-full">
          <FadeInSection>
            <div className="font-sans text-[var(--text-caption)] font-semibold text-[var(--color-text-muted)] tracking-[0.05em] uppercase mb-[var(--space-4)]">
              HOW IT WORKS
            </div>
            <h2 className="heading-display max-w-[500px] mb-[var(--space-12)] md:mb-0">
              Every session follows <span className="italic text-[var(--color-primary)]">one proven cycle</span>
            </h2>
          </FadeInSection>
          <div className="hidden md:block mt-auto pt-[var(--space-12)]">
            <FadeInSection delay={0.2}>
              <HowItWorksVisual />
            </FadeInSection>
          </div>
        </div>

        {/* Right column: Steps list */}
        <div className="flex-1 w-full flex flex-col">
          <div className="md:hidden mb-[var(--space-12)]">
            <HowItWorksVisual />
          </div>
          <div className="flex flex-col gap-[var(--space-6)]">
            {steps.map((step, index) => (
              <FadeInSection key={step.title} delay={index * 0.1}>
                {/* Singular accent bar per step, dropping the messy continuous connector */}
                <div className="relative pl-[var(--space-8)] py-[var(--space-2)] group">
                  <div className="absolute left-0 top-0 bottom-0 w-[4px] bg-[var(--color-border)] group-hover:bg-[var(--color-accent)] transition-colors duration-300 rounded-full" />
                  
                  {/* Semantic <h3> instead of <div> for screen reader outline */}
                  <h3 className="font-sans text-[var(--text-h3)] font-bold text-[var(--color-text)] mb-[var(--space-1)] m-0">
                    {index + 1}. {step.title}
                  </h3>
                  <div className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)]">
                    {step.description}
                  </div>
                </div>
              </FadeInSection>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
