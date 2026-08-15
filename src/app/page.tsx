import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import ProofSection from "@/components/landing/ProofSection";
import HowItWorksSection from "@/components/landing/HowItWorksSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import ParentsSection from "@/components/landing/ParentsSection";
import GuaranteeSection from "@/components/landing/GuaranteeSection";
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

        {/* Features (surface) → Parents (bg) — wave, flipped */}
        <WaveDivider
          bgColor="var(--color-surface)"
          fillColor="var(--color-bg)"
        />

        <ParentsSection />

        {/* Parents (bg) → Guarantee (teal) — dramatic angled cut */}
        <AngledDivider
          bgColor="var(--color-bg)"
          fillColor="#1B4F5C"
        />

        <GuaranteeSection />

        {/* Guarantee (teal) → Footer (dark) — angled, flipped */}
        <AngledDivider
          bgColor="#1B4F5C"
          fillColor="var(--color-text)"
          flip
        />
      </main>
      <Footer />
    </main>
  );
}
