"use client";

import React, { useState, useEffect, useRef } from "react";
import { QuizChallenge, type ChallengeQuestion } from "@/components/ui/quiz-challenge";
import { useRouter } from "next/navigation";
import { AlertCircle, RefreshCcw, ArrowRight, Loader2 } from "lucide-react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";

interface ChallengePhaseClientProps {
  sessionId: string;
  topic: string;
}

export function ChallengePhaseClient({ sessionId, topic }: ChallengePhaseClientProps) {
  const router = useRouter();
  
  // State for fetching questions
  const [questions, setQuestions] = useState<ChallengeQuestion[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // State for evaluation
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluateError, setEvaluateError] = useState<string | null>(null);
  const [hasEvaluated, setHasEvaluated] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const hasFetched = useRef(false);

  const fetchQuestions = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const res = await fetch("/api/session/challenge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId })
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || "Failed to generate challenge questions.");
      }

      setQuestions(data.questions);
    } catch (err: any) {
      console.error("[ChallengePhase] Error generating questions:", err);
      setGenerateError(err.message || "An unknown error occurred.");
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const handleQuizSubmit = async (answers: string[]) => {
    setIsEvaluating(true);
    setEvaluateError(null);

    try {
      // Map the answers back alongside the questions
      // SECURITY: expected_answer is NOT sent to the server — it's fetched server-side
      const payload = questions.map((q, idx) => ({
        question: q.question,
        student_answer: answers[idx]
      }));

      const res = await fetch("/api/session/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, answers: payload })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to evaluate answers.");
      }

      // Success: we wait for manual transition
      setHasEvaluated(true);
    } catch (err: any) {
      console.error("[ChallengePhase] Error evaluating answers:", err);
      setEvaluateError(err.message || "An unknown error occurred.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleTransition = () => {
    setIsTransitioning(true);
    router.push(`/session/${sessionId}/feedback`);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] w-full max-w-5xl mx-auto px-4 py-6 md:py-8 relative">
      <div className="flex-1 overflow-hidden relative border border-[var(--color-border)] rounded-[var(--radius-xl)] bg-[var(--color-surface)] shadow-md flex flex-col p-4 md:p-8 transition-all">
        
        {isGenerating && !generateError && (
          <div className="flex flex-col h-full items-center justify-center text-[var(--color-text-muted)] font-sans gap-4">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-primary)]" />
            <p className="font-medium text-[var(--color-text)]">Generating personalized challenge questions...</p>
            <p className="text-sm">Based on your recall transcript.</p>
          </div>
        )}

        {generateError && (
          <div className="flex flex-col h-full items-center justify-center gap-6">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 flex flex-col items-center gap-4 max-w-lg text-center"
            >
              <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                <AlertCircle className="w-6 h-6 shrink-0" />
                <h3 className="font-display font-medium text-lg">AI Generation Failed</h3>
              </div>
              <p className="font-sans text-sm text-[var(--color-destructive)]/90">{generateError}</p>
              <Button 
                onClick={fetchQuestions} 
                className="mt-2 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-6 h-10 font-sans text-sm shadow-sm"
              >
                <RefreshCcw className="w-4 h-4 mr-2" />
                Retry Generation
              </Button>
            </motion.div>
          </div>
        )}

        {!isGenerating && !generateError && questions.length > 0 && (
          <div className="flex-1 overflow-y-auto">
            <QuizChallenge 
              questions={questions} 
              onSubmit={handleQuizSubmit} 
              isSubmitting={isEvaluating || hasEvaluated} 
            />

            {evaluateError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 p-4 rounded-lg bg-[var(--color-destructive)]/10 border border-[var(--color-destructive)]/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 max-w-2xl mx-auto"
              >
                <div className="flex items-center gap-3 text-[var(--color-destructive)]">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-sans text-sm font-medium">{evaluateError}</p>
                </div>
                <Button 
                  onClick={() => setEvaluateError(null)} 
                  className="shrink-0 bg-[var(--color-destructive)] text-white hover:opacity-90 rounded-full px-4 h-9 font-sans text-sm"
                >
                  Dismiss
                </Button>
              </motion.div>
            )}
          </div>
        )}

      </div>

      {/* Footer / Transition Button */}
      <div className="mt-6 flex justify-end min-h-12">
        {hasEvaluated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <Button 
              onClick={handleTransition}
              disabled={isTransitioning}
              className="bg-[var(--color-primary)] text-white rounded-full px-8 h-12 text-base shadow-sm hover:shadow-md transition-all font-sans font-medium"
            >
              {isTransitioning ? "Advancing..." : "See Feedback"}
              {!isTransitioning && <ArrowRight className="ml-2 w-5 h-5" />}
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
