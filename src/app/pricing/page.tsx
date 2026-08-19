import { PricingSection } from "@/components/pricing/pricing-section";
import { PricingTable } from "@/components/pricing/pricing-table";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata = {
  title: "Pricing - Zorvai",
  description: "Transparent pricing for student success.",
};

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col pt-8 pb-24">
      {/* Header / Nav */}
      <div className="max-w-6xl mx-auto w-full px-4 mb-8">
        <Link 
          href="/" 
          className="inline-flex items-center text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors font-sans text-[var(--text-body-sm)]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>
      </div>

      {/* Hero Section */}
      <div className="text-center max-w-3xl mx-auto px-4 mb-8">
        <h1 className="text-4xl md:text-6xl font-display font-bold text-[var(--color-text)] tracking-tight mb-6">
          Invest in their success.
        </h1>
        <p className="text-lg md:text-xl font-sans text-[var(--color-text-muted)] leading-relaxed">
          Start building better study habits today. Upgrade when you're ready for deep analytics, parental tracking, and our guarantee.
        </p>
      </div>

      {/* Interactive Pricing Cards */}
      <PricingSection />

      {/* Feature Comparison */}
      <div className="mt-16 border-t border-border/50 pt-16">
        <PricingTable />
      </div>
    </div>
  );
}
