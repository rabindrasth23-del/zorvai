import Link from "next/link";
import { ArrowRight } from "lucide-react";
import TestimonialArc from "./TestimonialArc";
import RecallRibbon from "./RecallRibbon";

export default function HeroSection() {
  return (
    <section className="pt-[calc(72px+var(--space-16))] pb-[var(--space-20)] bg-[var(--color-bg)] overflow-hidden relative">
      {/* Testimonial Arc - scaled up and bleeding off the left edge, but contained vertically */}
      <div className="absolute -left-[100px] md:-left-[150px] top-[15%] md:top-[20%] z-0 pointer-events-none">
        <TestimonialArc />
      </div>

      <div className="max-w-[1200px] mx-auto px-[var(--space-6)] flex flex-col items-center text-center relative z-10">
        <div className="font-sans text-[var(--text-caption)] font-semibold text-[var(--color-text-muted)] tracking-[0.05em] uppercase mb-[var(--space-6)]">
          Zorvai AI Study Coach
        </div>

        <h1 className="heading-display-xl mb-[var(--space-6)] w-full max-w-none px-[var(--space-2)]">
          Don&apos;t cram,<br />
          <span className="italic text-[var(--color-primary)]">
            actually learn.
          </span>
        </h1>

        <p className="font-sans text-[var(--text-h4)] leading-[var(--lh-body)] text-[var(--color-text-muted)] max-w-[600px] mb-[var(--space-8)]">
          The AI study coach that teaches you, tests what you remember, and
          won&apos;t let you move on until you&apos;ve actually got it.
        </p>

        <div className="flex flex-col items-center gap-[var(--space-3)] mb-[var(--space-12)]">
          <Link
            href="/signup"
            className="inline-flex items-center gap-[var(--space-2)] font-sans text-[var(--text-body)] font-semibold text-white bg-[var(--color-accent)] px-[var(--space-8)] py-[var(--space-4)] rounded-[var(--radius-full)] no-underline shadow-[var(--shadow-sm)] hover:shadow-[var(--shadow-md)] hover:-translate-y-[1px] transition-all duration-200"
          >
            Start your first session
            <ArrowRight size={18} />
          </Link>
        <div className="font-sans text-[var(--text-caption)] text-[var(--color-text-muted)]">
            Free baseline quiz · No credit card needed
          </div>
        </div>
      </div>

      {/* Edge-to-edge voice typing marquee */}
      <div className="absolute bottom-[2%] left-[-10%] right-[-10%] z-0 pointer-events-none">
        <RecallRibbon />
      </div>
    </section>
  );
}
