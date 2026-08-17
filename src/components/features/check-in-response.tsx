"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { FeedbackCallout } from "@/components/ui/feedback-callout";

export interface CheckInResponseProps {
  transcript: string;
  evaluation: {
    status: "understood" | "missed" | "passed";
    feedback: string;
    identifiedGaps: string[];
  };
  className?: string;
}

export function CheckInResponse({ transcript, evaluation, className }: CheckInResponseProps) {
  return (
    <div className={cn("flex flex-col gap-8 w-full max-w-3xl mx-auto", className)}>
      {/* Transcript Block */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[var(--text-body-sm)] font-sans font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Your Response
        </h3>
        <div className="p-5 rounded-[var(--radius-lg)] bg-[var(--color-muted)]/50 border border-border text-[var(--text-body)] font-sans text-[var(--color-text)] leading-relaxed italic">
          &quot;{transcript}&quot;
        </div>
      </div>

      {/* Evaluation Block */}
      <div className="flex flex-col gap-3">
        <h3 className="text-[var(--text-body-sm)] font-sans font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
          Analysis
        </h3>
        
        <FeedbackCallout 
          state={evaluation.status} 
          message={evaluation.feedback}
          title={
            evaluation.status === "understood" ? "Concept Mastered" :
            evaluation.status === "missed" ? "Knowledge Gap Identified" : "Moving On"
          }
        />

        {evaluation.identifiedGaps.length > 0 && (
          <div className="mt-4 p-5 border border-border rounded-[var(--radius-lg)] bg-surface">
            <h4 className="text-[var(--text-body-sm)] font-sans font-semibold text-[var(--color-text)] mb-3">
              Areas to Review:
            </h4>
            <ul className="list-disc pl-5 flex flex-col gap-2">
              {evaluation.identifiedGaps.map((gap, i) => (
                <li key={i} className="text-[var(--text-body)] font-sans text-[var(--color-text-muted)]">
                  {gap}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
