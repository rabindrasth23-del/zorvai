"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { submitCheckinAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function CheckinPage() {
  const router = useRouter();
  const [moodText, setMoodText] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!moodText.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await submitCheckinAction({ moodText: moodText.trim() });

    if (result.status === "success" && result.session_id) {
      // Stub: the real session page doesn't exist yet, but we route there
      router.push(`/session/${result.session_id}`);
    } else if (result.status === "empty_queue") {
      setError(result.error || "Queue is empty.");
      setIsSubmitting(false);
    } else {
      setError(result.error || "An unexpected error occurred.");
      setIsSubmitting(false);
    }
  };

  const quickSelects = [
    "Feeling great, ready to focus",
    "A bit tired today",
    "Stressed about an upcoming exam",
    "I'm feeling overwhelmed"
  ];

  return (
    <div className="min-h-screen w-full bg-[var(--color-bg)] flex flex-col items-center justify-center p-6">
      {/* 
        Motion Rule Override: MINIMAL, CALM motion only. 
        Using duration: 0.6, ease: "easeInOut", no springs.
      */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
        className="w-full max-w-xl mx-auto"
      >
        <div className="space-y-4 mb-10 text-center">
          <h1 className="text-[var(--text-h2)] font-display text-[var(--color-text)]">
            Before we start
          </h1>
          <p className="text-[var(--text-body-lg)] text-[var(--color-text-muted)] font-sans">
            How are you feeling about your studying today?
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col gap-3">
            <textarea
              value={moodText}
              onChange={(e) => setMoodText(e.target.value)}
              placeholder="I'm feeling..."
              className="w-full min-h-[140px] rounded-2xl border-[1.5px] border-border bg-surface p-5 text-[var(--text-body)] font-sans text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] transition-colors focus-visible:outline-none focus-visible:border-[var(--color-border-focus)] focus-visible:ring-[3px] focus-visible:ring-ring resize-none"
              disabled={isSubmitting}
            />

            <div className="flex flex-wrap gap-2 mt-2">
              {quickSelects.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setMoodText(option)}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-full border border-border bg-white text-[var(--text-body-sm)] text-[var(--color-text)] font-sans font-medium hover:bg-[var(--color-muted)] hover:text-[var(--color-text)] transition-colors text-left"
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="w-full p-4 bg-[var(--color-destructive)]/10 text-[var(--color-destructive)] rounded-xl border border-[var(--color-destructive)]/20 text-sm font-medium font-sans flex items-start"
                role="alert"
                aria-live="assertive"
              >
                <div className="mr-3 mt-0.5" aria-hidden="true">⚠️</div>
                <div>{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="pt-4 flex justify-end">
            <Button
              type="submit"
              disabled={isSubmitting || !moodText.trim()}
              className="h-12 px-8 rounded-xl font-sans font-medium w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Starting session...
                </>
              ) : (
                "Continue to Session"
              )}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
