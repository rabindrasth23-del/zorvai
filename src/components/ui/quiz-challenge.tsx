'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './button';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

export interface ChallengeQuestion {
  type: 'fact' | 'understanding' | 'application' | 'mixed';
  question: string;
  expected_answer: string;
}

interface QuizChallengeProps {
  questions: ChallengeQuestion[];
  onSubmit: (answers: string[]) => void;
  isSubmitting?: boolean;
}

export function QuizChallenge({ questions, onSubmit, isSubmitting = false }: QuizChallengeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(questions.length).fill(''));

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleNext = () => {
    if (isLastQuestion) {
      onSubmit(answers);
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleAnswerChange = (text: string) => {
    const newAnswers = [...answers];
    newAnswers[currentIndex] = text;
    setAnswers(newAnswers);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress Indicator */}
      <div className="flex items-center justify-between mb-8 px-2">
        <h3 className="font-display font-semibold text-2xl tracking-tight text-[var(--color-text)]">
          Challenge
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
          {/* Subtle gradient strip based on question type */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-accent)] opacity-80" />
          
          <div className="p-6 md:p-8 pt-8">
            <div className="mb-6">
              <span className="inline-block px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-widest bg-[var(--color-primary)]/10 text-[var(--color-primary)] mb-4 shadow-sm">
                {currentQuestion.type} Question
              </span>
              <p className="font-sans text-[var(--text-body)] text-[var(--color-text)] leading-relaxed text-lg font-medium">
                {currentQuestion.question}
              </p>
            </div>

            <textarea
              value={answers[currentIndex]}
              onChange={(e) => handleAnswerChange(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full h-40 p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text)] font-sans resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all mb-8 shadow-inner"
              autoFocus
            />

            <div className="flex justify-end">
              <Button
                onClick={handleNext}
                disabled={!answers[currentIndex].trim() || isSubmitting}
                className="rounded-full px-8 h-12 bg-[var(--color-primary)] text-white hover:opacity-90 transition-all hover:shadow-md hover:-translate-y-0.5 font-medium"
              >
                {isSubmitting ? 'Submitting...' : isLastQuestion ? 'Complete Challenge' : 'Next Question'}
                {!isSubmitting && (
                  isLastQuestion ? <CheckCircle2 size={18} className="ml-2" /> : <ChevronRight size={18} className="ml-2" />
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
