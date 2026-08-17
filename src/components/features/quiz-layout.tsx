"use client";

import * as React from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export type QuestionType = "fact" | "understanding" | "application" | "mixed";

export interface QuizLayoutProps {
  currentStep: number; // 1 to 4
  questionType: QuestionType;
  questionText: string;
  options: string[];
  selectedOption?: number | null;
  onSelectOption: (index: number) => void;
  onNext: () => void;
  isCorrect?: boolean | null;
  feedbackText?: string | null;
}

export function QuizLayout({
  currentStep,
  questionType,
  questionText,
  options,
  selectedOption = null,
  onSelectOption,
  onNext,
  isCorrect = null,
  feedbackText = null
}: QuizLayoutProps) {
  
  const TypeLabels: Record<QuestionType, string> = {
    fact: "1. Factual Recall",
    understanding: "2. Conceptual Understanding",
    application: "3. Application",
    mixed: "4. Mixed / Synthesis"
  };

  const hasAnswered = selectedOption !== null;

  return (
    <div className="flex flex-col max-w-3xl w-full mx-auto gap-8 p-6 bg-surface border border-border rounded-[var(--radius-xl)] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border pb-4">
        <span className="text-[var(--text-body-sm)] font-sans font-semibold text-[var(--color-primary)] uppercase tracking-wider">
          {TypeLabels[questionType]}
        </span>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={cn(
                "h-2 w-8 rounded-full transition-colors",
                step <= currentStep ? "bg-[var(--color-accent)]" : "bg-border"
              )}
            />
          ))}
        </div>
      </div>

      {/* Question */}
      <h2 className="text-[var(--text-display-sm)] font-display text-[var(--color-text)]">
        {questionText}
      </h2>

      {/* Options */}
      <div className="flex flex-col gap-3">
        {options.map((option, idx) => {
          const isSelected = selectedOption === idx;
          const showCorrectness = hasAnswered && isSelected;
          
          return (
            <button
              key={idx}
              onClick={() => !hasAnswered && onSelectOption(idx)}
              disabled={hasAnswered}
              className={cn(
                "flex items-center p-4 rounded-[var(--radius-lg)] border-[1.5px] transition-all font-sans text-left text-[var(--text-body)]",
                !hasAnswered && "hover:border-[var(--color-primary)] hover:bg-[var(--color-muted)] border-border bg-surface text-[var(--color-text)]",
                isSelected && isCorrect === null && "border-[var(--color-primary)] bg-[var(--color-primary)]/5 text-[var(--color-primary)]",
                showCorrectness && isCorrect && "border-[var(--color-success)] bg-[var(--color-success)]/10 text-green-900",
                showCorrectness && isCorrect === false && "border-red-400 bg-red-50 text-red-900",
                hasAnswered && !isSelected && "border-border bg-surface opacity-50 text-[var(--color-text-muted)]"
              )}
            >
              <div className={cn(
                "flex items-center justify-center h-6 w-6 rounded-full border mr-4 text-sm font-medium",
                isSelected && isCorrect === true ? "bg-[var(--color-success)] border-[var(--color-success)] text-white" :
                isSelected && isCorrect === false ? "bg-red-500 border-red-500 text-white" :
                isSelected ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-white" :
                "border-border bg-surface text-[var(--color-text-muted)]"
              )}>
                {String.fromCharCode(65 + idx)}
              </div>
              <span className="flex-1">{option}</span>
            </button>
          );
        })}
      </div>

      {/* Feedback & Actions */}
      {hasAnswered && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-4 mt-4"
        >
          {feedbackText && (
            <div className={cn(
              "p-4 rounded-lg font-sans text-[var(--text-body-sm)]",
              isCorrect ? "bg-[var(--color-success)]/10 text-green-900 border border-[var(--color-success)]/20" : "bg-red-50 text-red-900 border border-red-200"
            )}>
              <span className="font-semibold block mb-1">
                {isCorrect ? "Correct!" : "Not quite."}
              </span>
              {feedbackText}
            </div>
          )}
          <Button onClick={onNext} className="w-full sm:w-auto self-end font-sans">
            {currentStep < 4 ? "Next Question" : "Complete Quiz"}
          </Button>
        </motion.div>
      )}
    </div>
  );
}
