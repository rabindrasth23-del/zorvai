"use client";

import { useState } from "react";
import { Check, X, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: string;
  yearlyPrice: string;
  periodLabelMonthly: string;
  periodLabelYearly: string;
  features: { name: string; included: boolean }[];
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
}

const tiers: PricingTier[] = [
  {
    name: "Family Starter",
    description: "One child, one subject. Try it out for a week.",
    monthlyPrice: "12.99",
    yearlyPrice: "12.99",
    periodLabelMonthly: "/week",
    periodLabelYearly: "/week",
    features: [
      { name: "Full session access for 7 days", included: true },
      { name: "All subjects", included: false },
      { name: "Parent dashboard & alerts", included: false },
      { name: "Zorvai Guarantee", included: false },
    ],
    ctaText: "Start 7-Day Trial",
    ctaHref: "/signup?plan=family_starter",
  },
  {
    name: "Student Solo",
    description: "One student, self-managed. Build a daily habit.",
    monthlyPrice: "19.99",
    yearlyPrice: "19.99",
    periodLabelMonthly: "/month",
    periodLabelYearly: "/month",
    highlighted: false,
    features: [
      { name: "All subjects, full access", included: true },
      { name: "AI chatbot & plan maker", included: true },
      { name: "Zorvai Guarantee", included: true },
      { name: "Parent dashboard & alerts", included: false },
    ],
    ctaText: "Get Student Solo",
    ctaHref: "/signup?plan=student_solo",
  },
  {
    name: "Family Plan",
    description: "Up to 2 children. Full parental visibility and tracking.",
    monthlyPrice: "39.99",
    yearlyPrice: "24.92", // $299 / 12 months
    periodLabelMonthly: "/month",
    periodLabelYearly: "/month (billed $299/yr)",
    highlighted: true,
    features: [
      { name: "All subjects, full access", included: true },
      { name: "Parent dashboard", included: true },
      { name: "Missed-session alerts & digest", included: true },
      { name: "Zorvai Guarantee", included: true },
      { name: "Sibling add-on at 50% extra (Annual only)", included: true },
    ],
    ctaText: "Join Family Plan",
    ctaHref: "/signup?plan=family",
  }
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-12 px-4 gap-12">
      
      {/* Waitlist Banner */}
      <div className="w-full max-w-3xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 rounded-2xl p-6 flex items-start gap-4 shadow-sm mb-4">
        <ShieldAlert className="w-6 h-6 text-[var(--color-primary)] flex-shrink-0 mt-1" />
        <div>
          <h4 className="font-display font-semibold text-[var(--color-text)] text-lg">Waitlist Pricing Active</h4>
          <p className="font-sans text-[var(--color-text-muted)] text-[var(--text-body-sm)] mt-1 leading-relaxed">
            Tiered scarcity applies to Monthly and Annual plans: <strong>First 100 signups get 60% off forever</strong>. Signups 101-500 get 40% off forever. The discount is permanent and locks in your founding member rate.
          </p>
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-3">
        <span className={cn("font-sans text-[var(--text-body)]", !isYearly ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>
          Monthly
        </span>
        <button
          onClick={() => setIsYearly(!isYearly)}
          className="relative inline-flex h-8 w-16 items-center rounded-full bg-[var(--color-primary)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-2"
          role="switch"
          aria-checked={isYearly}
        >
          <span className="sr-only">Toggle billing period</span>
          <span
            className={cn(
              "inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-200 ease-in-out shadow-sm",
              isYearly ? "translate-x-9" : "translate-x-1"
            )}
          />
        </button>
        <div className="flex items-center gap-2">
          <span className={cn("font-sans text-[var(--text-body)]", isYearly ? "font-medium text-[var(--color-text)]" : "text-[var(--color-text-muted)]")}>
            Annually
          </span>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-[var(--color-success)]/10 text-[var(--color-success)]">
            Save ~38%
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {tiers.map((tier) => {
          const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
          const periodLabel = isYearly ? tier.periodLabelYearly : tier.periodLabelMonthly;
          return (
            <div 
              key={tier.name}
              className={cn(
                "relative flex flex-col rounded-3xl p-8 bg-surface shadow-[var(--shadow-sm)] transition-all duration-300 hover:shadow-[var(--shadow-md)]",
                tier.highlighted ? "border-2 border-[var(--color-accent)] transform md:-translate-y-4 shadow-[var(--shadow-md)]" : "border border-border mt-0 md:mt-4"
              )}
            >
              {tier.highlighted && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 px-4 py-1 bg-[var(--color-accent)] text-white text-[10px] font-bold uppercase tracking-widest rounded-full">
                  Most Popular
                </div>
              )}
              
              <div className="mb-6">
                <h3 className="font-display text-2xl font-semibold text-[var(--color-text)]">{tier.name}</h3>
                <p className="text-[var(--color-text-muted)] font-sans text-[var(--text-body-sm)] mt-2 min-h-[40px]">
                  {tier.description}
                </p>
              </div>

              <div className="mb-8 flex flex-col items-start justify-center gap-1 min-h-[72px]">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-mono font-bold text-[var(--color-text)] tracking-tight">
                    ${price}
                  </span>
                  <span className="text-[var(--color-text-muted)] font-sans text-[var(--text-body-sm)]">
                    {periodLabel.split(' ')[0]}
                  </span>
                </div>
                {periodLabel.includes('billed') && (
                  <span className="text-[var(--color-text-muted)] font-sans text-[12px] opacity-80 block">
                    {periodLabel.substring(periodLabel.indexOf('('))}
                  </span>
                )}
              </div>

              <div className="flex-1">
                <ul className="flex flex-col gap-4">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <div className={cn("mt-0.5 rounded-full p-0.5 flex-shrink-0", feature.included ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "text-[var(--color-text-muted)] opacity-50")}>
                        {feature.included ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                      </div>
                      <span className={cn("font-sans text-[var(--text-body-sm)]", feature.included ? "text-[var(--color-text)]" : "text-[var(--color-text-muted)] line-through opacity-70")}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <Button 
                asChild 
                className={cn(
                  "mt-8 w-full rounded-xl h-12 font-sans font-medium transition-opacity",
                  tier.highlighted ? "bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent)]/90" : "bg-[var(--color-primary)] text-white hover:opacity-90"
                )}
              >
                <Link href={tier.ctaHref}>
                  {tier.ctaText}
                </Link>
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
