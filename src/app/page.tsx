import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProofSection from "@/components/landing/ProofSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import EarlyAdopterCTA from "@/components/landing/EarlyAdopterCTA";
import FounderStorySection from "@/components/landing/FounderStorySection";
import GuaranteeSection from "@/components/landing/GuaranteeSection";
import WaitlistBanner from "@/components/landing/WaitlistBanner";
import WaitlistSection from "@/components/landing/WaitlistSection";
import Footer from "@/components/landing/Footer";
import {
  WaveDivider,
  AngledDivider,
  SoftCurveDivider,
} from "@/components/landing/SectionDividers";

/**
 * Landing page — Server Component.
 *
 * Section dividers sit BETWEEN sections to break flat horizontal
 * color transitions. Each divider's fillColor matches the section
 * below it, bgColor matches the section above.
 */
export default function LandingPage() {
  return (
    <main className="flex flex-col min-h-screen bg-bg">
      <Navbar />
      <WaitlistBanner />
      <main>
        <HeroSection />

        {/* Hero (bg) → Proof (primary) */}
        <WaveDivider
          bgColor="var(--color-bg)"
          fillColor="var(--color-primary)"
        />

        <ProofSection />

        {/* Proof (primary) → How It Works (bg) */}
        <WaveDivider
          bgColor="var(--color-primary)"
          fillColor="var(--color-bg)"
        />

        <HowItWorksSection />

        {/* How It Works (bg) → Features (surface) — subtle curve */}
        <SoftCurveDivider
          bgColor="var(--color-bg)"
          fillColor="var(--color-surface)"
        />

        <FeaturesSection />

        {/* Features (surface) → Early Adopter CTA (dark) — wave, flipped */}
        <WaveDivider
          bgColor="var(--color-surface)"
          fillColor="var(--color-text)"
        />

        <EarlyAdopterCTA />

        {/* Early Adopter CTA (dark) → Guarantee (teal) — dramatic angled cut */}
        <AngledDivider
          bgColor="var(--color-text)"
          fillColor="var(--color-primary)"
        />

        <GuaranteeSection />

        {/* Guarantee (teal) → Founder Story (surface) — angled, flipped */}
        <AngledDivider
          bgColor="var(--color-primary)"
          fillColor="var(--color-surface)"
          flip
        />

        <FounderStorySection />

        {/* Founder Story (surface) → Waitlist (bg) — curve */}
        <SoftCurveDivider
          bgColor="var(--color-surface)"
          fillColor="var(--color-bg)"
        />

        <WaitlistSection />

        {/* Waitlist (bg) → Footer (dark) — wave */}
        <WaveDivider
          bgColor="var(--color-bg)"
          fillColor="var(--color-text)"
        />
      </main>
      <Footer />
    </main>
  );
}
