'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './button';
import { CheckCircle2, Circle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BaselineQuestion {
  id: string; // Add an ID to track questions reliably
  question: string;
  options: string[];
}

interface BaselineQuizRadioProps {
  questions: BaselineQuestion[];
  onSubmit: (answers: number[]) => void; // Submitting raw answers, NOT score
  isSubmitting?: boolean;
}

export function BaselineQuizRadio({ questions, onSubmit, isSubmitting = false }: BaselineQuizRadioProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // Reconcile state if questions change (e.g. refetch)
  useEffect(() => {
    setSelectedIndices(new Array(questions?.length || 0).fill(-1));
    setCurrentIndex(0);
  }, [questions]);

  if (!questions || questions.length === 0 || selectedIndices.length !== questions.length) return null;

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;
  const hasSelected = selectedIndices[currentIndex] !== -1;

  const handleNext = () => {
    if (isLastQuestion) {
      // Pass the raw answers back to the consumer. Scoring happens server-side.
      onSubmit(selectedIndices);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleSelect = (optionIndex: number) => {
    const newSelected = [...selectedIndices];
    newSelected[currentIndex] = optionIndex;
    setSelectedIndices(newSelected);
  };

  if (!questions || questions.length === 0) return null;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="font-display font-semibold text-2xl tracking-tight text-[var(--color-text)]">
          Baseline Assessment
        </h3>
        <div className="font-mono text-sm font-medium text-[var(--color-text-muted)] bg-[var(--color-bg)] border border-[var(--color-border)] px-4 py-1.5 rounded-full shadow-sm">
          {currentIndex + 1} / {questions.length}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
          className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-md overflow-hidden relative"
        >
          <div className="p-6 md:p-8 pt-8">
            <div className="mb-8">
              <p className="font-sans text-[var(--color-text)] leading-relaxed text-xl font-medium">
                {currentQuestion.question}
              </p>
            </div>

            <div 
              className="flex flex-col gap-3 mb-8"
              role="radiogroup"
              aria-labelledby="question-label"
            >
              <span id="question-label" className="sr-only">Options for: {currentQuestion.question}</span>
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedIndices[currentIndex] === idx;
                
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelect(idx)}
                    role="radio"
                    aria-checked={isSelected}
                    className={cn(
                      "flex items-center text-left w-full p-4 rounded-[var(--radius-lg)] border transition-all duration-200",
                      isSelected 
                        ? "bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-text)] shadow-sm"
                        : "bg-[var(--color-bg)]/50 border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]/40 hover:bg-[var(--color-bg)]"
                    )}
                  >
                    <div className={cn(
                      "flex-shrink-0 mr-4 flex items-center justify-center transition-colors",
                      isSelected ? "text-[var(--color-primary)]" : "text-[var(--color-border)]"
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <span className={cn("font-sans text-base", isSelected && "font-medium")}>
                      {option}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
              <Button
                onClick={handleNext}
                disabled={!hasSelected || isSubmitting}
                className={cn(
                  "px-8 py-2.5 rounded-full font-medium transition-all",
                  hasSelected
                    ? "bg-[var(--color-text)] text-[var(--color-surface)] hover:scale-105"
                    : "bg-[var(--color-border)] text-[var(--color-text-muted)] opacity-50 cursor-not-allowed"
                )}
              >
                {isSubmitting ? 'Scoring...' : isLastQuestion ? 'Complete Assessment' : 'Next Question'}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
