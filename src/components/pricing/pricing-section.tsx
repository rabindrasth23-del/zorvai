"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: { name: string; included: boolean }[];
  highlighted?: boolean;
  ctaText: string;
  ctaHref: string;
}

const tiers: PricingTier[] = [
  {
    name: "Basic",
    description: "Essential tools for students building a daily habit.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      { name: "Daily Check-ins", included: true },
      { name: "Basic Statistics", included: true },
      { name: "1 Subject Tracking", included: true },
      { name: "Parent Dashboard", included: false },
      { name: "Zorvai Guarantee", included: false },
    ],
    ctaText: "Get Started",
    ctaHref: "/signup",
  },
  {
    name: "Pro",
    description: "Advanced tracking and full parental visibility.",
    monthlyPrice: 12,
    yearlyPrice: 9, // $108/year
    highlighted: true,
    features: [
      { name: "Daily Check-ins", included: true },
      { name: "Advanced Statistics & Trends", included: true },
      { name: "Unlimited Subjects", included: true },
      { name: "Parent Dashboard", included: true },
      { name: "Zorvai Guarantee", included: false },
    ],
    ctaText: "Start 14-Day Free Trial",
    ctaHref: "/signup?plan=pro",
  },
  {
    name: "Guarantee",
    description: "Our ultimate plan. If they don't improve, you don't pay.",
    monthlyPrice: 29,
    yearlyPrice: 24, // $288/year
    features: [
      { name: "Everything in Pro", included: true },
      { name: "Zorvai Guarantee Eligibility", included: true },
      { name: "Weekly Custom Reports", included: true },
      { name: "Priority Support", included: true },
      { name: "1-on-1 Strategy Session", included: true },
    ],
    ctaText: "Join the Waitlist",
    ctaHref: "/waitlist",
  }
];

export function PricingSection() {
  const [isYearly, setIsYearly] = useState(true);

  return (
    <div className="flex flex-col items-center w-full max-w-6xl mx-auto py-12 px-4 gap-12">
      
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
            Save 20%
          </span>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
        {tiers.map((tier) => {
          const price = isYearly ? tier.yearlyPrice : tier.monthlyPrice;
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

              <div className="mb-8 flex items-baseline gap-1">
                <span className="text-4xl font-mono font-bold text-[var(--color-text)] tracking-tight">
                  ${price}
                </span>
                <span className="text-[var(--color-text-muted)] font-sans text-[var(--text-body-sm)]">
                  /month
                </span>
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
