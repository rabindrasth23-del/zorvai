import Navbar from "@/components/landing/Navbar";
import HeroSection from "@/components/landing/HeroSection";
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
export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <HeroSection />

        {/* Hero (bg) → How It Works (bg) — same color, gentle wave for rhythm */}
        <WaveDivider
          fillColor="var(--color-bg)"
          bgColor="var(--color-bg)"
        />

        <HowItWorksSection />

        {/* How It Works (bg) → Features (surface) — subtle curve */}
        <SoftCurveDivider
          fillColor="var(--color-surface)"
          bgColor="var(--color-bg)"
        />

        <FeaturesSection />

        {/* Features (surface) → Parents (bg) — wave, flipped */}
        <WaveDivider
          fillColor="var(--color-bg)"
          bgColor="var(--color-surface)"
        />

        <ParentsSection />

        {/* Parents (bg) → Guarantee (teal) — dramatic angled cut */}
        <AngledDivider
          fillColor="#1B4F5C"
          bgColor="var(--color-bg)"
        />

        <GuaranteeSection />

        {/* Guarantee (teal) → Footer (dark) — angled, flipped */}
        <AngledDivider
          fillColor="var(--color-text)"
          bgColor="#1E5462"
          flip
        />
      </main>
      <Footer />
    </>
  );
}
