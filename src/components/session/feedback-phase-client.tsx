"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, ArrowLeft, Lightbulb, Target, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface FeedbackData {
  understood: string[];
  missed: string[];
  review_next: string[];
  passed: boolean;
}

interface FeedbackPhaseClientProps {
  topic: string;
  feedback: FeedbackData;
}

export function FeedbackPhaseClient({ topic, feedback }: FeedbackPhaseClientProps) {
  const router = useRouter();

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-8 relative">
      <div className="flex-1 overflow-y-auto relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-sm flex flex-col p-8">
        
        {/* Header Section */}
        <div className="flex flex-col items-center justify-center text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="mb-4"
          >
            {feedback.passed ? (
              <div className="w-16 h-16 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[var(--color-success)]" />
              </div>
            ) : (
              <div className="w-16 h-16 rounded-full bg-[var(--color-warning)]/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-[var(--color-warning)]" />
              </div>
            )}
          </motion.div>
          
          <motion.h2 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="font-display font-medium text-3xl text-[var(--color-text)] tracking-tight"
          >
            {feedback.passed ? "Topic Mastered!" : "Topic Needs Review"}
          </motion.h2>
          
          <motion.p 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)] mt-2 max-w-md"
          >
            {feedback.passed 
              ? `Great job! You've shown a solid understanding of ${topic}.` 
              : `You're making progress, but there are a few gaps in ${topic} to close before moving on.`}
          </motion.p>
        </div>

        {/* Feedback Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          
          {/* Understood Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <Lightbulb className="w-5 h-5 text-[var(--color-success)]" />
              <h3 className="font-sans font-medium text-[var(--color-text)] text-lg">What you nailed</h3>
            </div>
            {feedback.understood.length > 0 ? (
              <ul className="space-y-3">
                {feedback.understood.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-success)] mt-2 shrink-0" />
                    <span className="font-sans text-[var(--color-text-muted)] text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[var(--color-text-muted)] text-sm italic">Nothing specifically noted here.</p>
            )}
          </motion.div>

          {/* Missed Section */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)]"
          >
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="w-5 h-5 text-[var(--color-warning)]" />
              <h3 className="font-sans font-medium text-[var(--color-text)] text-lg">Where you slipped</h3>
            </div>
            {feedback.missed.length > 0 ? (
              <ul className="space-y-3">
                {feedback.missed.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-warning)] mt-2 shrink-0" />
                    <span className="font-sans text-[var(--color-text-muted)] text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[var(--color-text-muted)] text-sm italic">Great job, no major gaps identified!</p>
            )}
          </motion.div>

          {/* Review Next Section (Spans full width) */}
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-6 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] md:col-span-2"
          >
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-5 h-5 text-[var(--color-accent)]" />
              <h3 className="font-sans font-medium text-[var(--color-text)] text-lg">Next steps</h3>
            </div>
            {feedback.review_next.length > 0 ? (
              <ul className="space-y-3">
                {feedback.review_next.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-accent)] mt-2 shrink-0" />
                    <span className="font-sans text-[var(--color-text-muted)] text-sm leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="font-sans text-[var(--color-text-muted)] text-sm italic">Ready to move on to the next topic in your plan.</p>
            )}
          </motion.div>

        </div>

      </div>

      {/* Footer / Exit Button */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-6 flex justify-end min-h-12"
      >
        <Button 
          onClick={() => router.push("/dashboard")}
          className="bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface)] rounded-full px-8 h-12 text-base font-sans font-medium transition-colors"
        >
          <ArrowLeft className="mr-2 w-4 h-4" />
          Back to Dashboard
        </Button>
      </motion.div>
    </div>
  );
}
