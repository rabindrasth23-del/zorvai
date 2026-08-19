import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { name: "Daily Study Check-ins", basic: true, pro: true, guarantee: true },
  { name: "Subject Mastery Tracking", basic: "1 Subject", pro: "Unlimited", guarantee: "Unlimited" },
  { name: "Streak Tracking", basic: true, pro: true, guarantee: true },
  { name: "Parent Dashboard", basic: false, pro: true, guarantee: true },
  { name: "Advanced Analytics & Trends", basic: false, pro: true, guarantee: true },
  { name: "Zorvai Guarantee Eligibility", basic: false, pro: false, guarantee: true },
  { name: "Weekly Custom Reports", basic: false, pro: false, guarantee: true },
  { name: "1-on-1 Strategy Session", basic: false, pro: false, guarantee: true },
];

export function PricingTable() {
  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4">
      <div className="text-center mb-12">
        <h2 className="text-3xl font-display font-semibold text-[var(--color-text)]">Compare Plans</h2>
        <p className="text-[var(--color-text-muted)] font-sans mt-3 max-w-2xl mx-auto">
          See exactly what's included in each tier and find the right fit for your student's learning journey.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[600px]">
          <thead>
            <tr>
              <th className="w-1/3 p-4 border-b border-border bg-surface font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-medium">Features</th>
              <th className="w-1/5 p-4 border-b border-border bg-surface font-display text-lg text-[var(--color-text)] font-semibold text-center">Basic</th>
              <th className="w-1/5 p-4 border-b border-border bg-surface/50 font-display text-lg text-[var(--color-text)] font-semibold text-center relative">
                <div className="absolute inset-0 border-t-2 border-x-2 border-[var(--color-accent)] rounded-t-xl z-0 bg-[var(--color-accent)]/5 pointer-events-none"></div>
                <span className="relative z-10">Pro</span>
              </th>
              <th className="w-1/5 p-4 border-b border-border bg-surface font-display text-lg text-[var(--color-text)] font-semibold text-center">Guarantee</th>
            </tr>
          </thead>
          <tbody className="bg-surface">
            {features.map((feature, idx) => (
              <tr key={idx} className="group hover:bg-muted/30 transition-colors">
                <td className="p-4 border-b border-border font-sans text-[var(--text-body)] text-[var(--color-text)]">
                  {feature.name}
                </td>
                <td className="p-4 border-b border-border text-center">
                  <FeatureValue value={feature.basic} />
                </td>
                <td className="p-4 border-b border-border text-center relative">
                  <div className="absolute inset-0 border-x-2 border-[var(--color-accent)] z-0 bg-[var(--color-accent)]/5 pointer-events-none"></div>
                  <div className="relative z-10 flex justify-center">
                    <FeatureValue value={feature.pro} />
                  </div>
                </td>
                <td className="p-4 border-b border-border text-center">
                  <FeatureValue value={feature.guarantee} />
                </td>
              </tr>
            ))}
            {/* Bottom border for the highlighted column */}
            <tr>
              <td></td>
              <td></td>
              <td className="relative h-4">
                <div className="absolute inset-0 border-b-2 border-x-2 border-[var(--color-accent)] rounded-b-xl z-0 bg-[var(--color-accent)]/5 pointer-events-none"></div>
              </td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeatureValue({ value }: { value: boolean | string }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="w-5 h-5 text-[var(--color-success)] mx-auto" />
    ) : (
      <X className="w-5 h-5 text-[var(--color-text-muted)] opacity-30 mx-auto" />
    );
  }
  return (
    <span className="font-sans text-[var(--text-body-sm)] text-[var(--color-text)] font-medium">
      {value}
    </span>
  );
}
