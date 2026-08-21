"use client";

import React, { useState } from "react";
import { AudioRecorder } from "@/components/ui/audio-recorder";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface RecallPhaseClientProps {
  sessionId: string;
  topic: string;
}

export function RecallPhaseClient({ sessionId, topic }: RecallPhaseClientProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (transcript: string, method: 'voice' | 'typed') => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/session/recall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: sessionId, transcript, method })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit recall transcript.");
      }

      // Success: Route to challenge phase
      router.push(`/session/${sessionId}/challenge`);
      router.refresh();
      
    } catch (err: any) {
      console.error("[RecallPhase] Error submitting transcript:", err);
      setError(err.message || "An unknown error occurred.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto px-4 py-8 relative">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-sm flex flex-col p-8">
        
        <div className="mb-8">
          <h2 className="font-display font-medium text-3xl text-[var(--color-text)] tracking-tight">Recall Phase</h2>
          <p className="font-sans text-[var(--text-body)] text-[var(--color-text-muted)] mt-2">
            Try to recall everything you can remember about <strong className="text-[var(--color-text)] font-semibold">{topic}</strong>.
          </p>
        </div>

        <div className="flex-1 overflow-y-auto">
          <AudioRecorder 
            onSubmit={handleSubmit} 
            isSubmitting={isSubmitting} 
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-sans text-sm font-medium">{error}</p>
              </div>
              <Button 
                onClick={() => setError(null)} 
                className="shrink-0 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-4 h-9 font-sans text-sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Dismiss
              </Button>
            </motion.div>
          )}
        </div>

      </div>
    </div>
  );
}
