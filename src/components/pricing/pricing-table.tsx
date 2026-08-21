import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  { name: "Full AI session access", starter: "7 days", solo: "Unlimited", family: "Unlimited" },
  { name: "Subjects included", starter: "1 Subject", solo: "All Subjects", family: "All Subjects" },
  { name: "Spaced repetition & tracking", starter: true, solo: true, family: true },
  { name: "Zorvai Guarantee Eligibility", starter: false, solo: true, family: true },
  { name: "Parent Dashboard", starter: false, solo: false, family: true },
  { name: "Missed-session alerts", starter: false, solo: false, family: true },
  { name: "Weekly email digest", starter: false, solo: false, family: true },
  { name: "Sibling add-on (50% extra)", starter: false, solo: false, family: "Annual only" },
  { name: "Quarterly progress reports", starter: false, solo: false, family: "Annual only" },
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
        <table className="w-full text-left border-collapse min-w-[700px]">
          <thead>
            <tr>
              <th className="w-[40%] p-4 border-b border-border bg-surface font-sans text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-medium">Features</th>
              <th className="w-1/5 p-4 border-b border-border bg-surface font-display text-lg text-[var(--color-text)] font-semibold text-center">Family Starter</th>
              <th className="w-1/5 p-4 border-b border-border bg-surface font-display text-lg text-[var(--color-text)] font-semibold text-center">Student Solo</th>
              <th className="w-1/5 p-4 border-b border-border bg-surface font-display text-lg text-[var(--color-text)] font-semibold text-center">Family Plan</th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, i) => (
              <tr key={i} className="hover:bg-surface/50 transition-colors">
                <td className="p-4 border-b border-border font-sans text-[var(--text-body)] text-[var(--color-text)]">
                  {feature.name}
                </td>
                <td className="p-4 border-b border-border text-center">
                  <FeatureValue value={feature.starter} />
                </td>
                <td className="p-4 border-b border-border text-center bg-[var(--color-primary)]/5">
                  <FeatureValue value={feature.solo} />
                </td>
                <td className="p-4 border-b border-border text-center">
                  <FeatureValue value={feature.family} />
                </td>
              </tr>
            ))}
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
