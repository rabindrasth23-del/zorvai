'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Stepper, Step } from '@/components/ui/stepper';
import { Button } from '@/components/ui/button';
import { BaselineQuizRadio, BaselineQuestion } from '@/components/ui/baseline-quiz-radio';
import { cn } from '@/lib/utils';

// Mock data for the isolated UI build
const ONBOARDING_STEPS: Step[] = [
  { id: 'identity', title: 'Identity' },
  { id: 'situation', title: 'Situation' },
  { id: 'commitment', title: 'Commitment' },
  { id: 'baseline', title: 'Baseline' }
];

const MOCK_BASELINE_QUESTIONS: BaselineQuestion[] = [
  { id: 'q1', question: "What is the primary function of mitochondria?", options: ["Energy production", "Protein synthesis", "Waste disposal"] },
  { id: 'q2', question: "Which of these is a noble gas?", options: ["Oxygen", "Neon", "Nitrogen"] }
];

export function OnboardingStepper() {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  // State for strict deterministic inputs
  const [grade, setGrade] = useState('');
  const [targetSubject, setTargetSubject] = useState('');
  const [confidence, setConfidence] = useState(3);
  
  // State for the AI transition line (mocked for now)
  const [transitionLine, setTransitionLine] = useState("Let's get started. Tell me a bit about where you're at.");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const isLastStep = currentStepIndex === ONBOARDING_STEPS.length - 1;

  const handleNextStep = () => {
    if (isLastStep) return;
    
    // Simulate API call for the transition line
    setIsTransitioning(true);
    setTimeout(() => {
      // Mocked AI transition based on step
      if (currentStepIndex === 0) {
        setTransitionLine(`Got it, Grade ${grade || '10'} is a big year. Let's talk about what you're studying.`);
      } else if (currentStepIndex === 1) {
        setTransitionLine(`${targetSubject || 'Math'} can definitely be tricky. Let's lock in your goals for it.`);
      }
      
      setCurrentStepIndex(prev => prev + 1);
      setIsTransitioning(false);
    }, 600);
  };

  const renderStepContent = () => {
    switch (currentStepIndex) {
      case 0: // Identity
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                Which grade or year are you in?
              </label>
              <select 
                value={grade}
                onChange={(e) => setGrade(e.target.value)}
                className="w-full p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all text-[var(--color-text)]"
              >
                <option value="" disabled>Select your grade...</option>
                <option value="9">9th Grade / Freshman</option>
                <option value="10">10th Grade / Sophomore</option>
                <option value="11">11th Grade / Junior</option>
                <option value="12">12th Grade / Senior</option>
                <option value="college">College / University</option>
              </select>
            </div>
            
            {/* The PRD Round 3 open-ended "vent" question */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                How do you feel about studying right now? (Optional)
              </label>
              <textarea 
                placeholder="Excited, stressed, exhausted..."
                className="w-full h-24 p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all"
              />
              <p className="text-xs text-[var(--color-text-muted)] mt-2">
                This helps me adjust my tone. It won't be saved to your profile.
              </p>
            </div>
          </div>
        );

      case 1: // Situation
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                Which subject do you want to start with?
              </label>
              <input 
                type="text"
                value={targetSubject}
                onChange={(e) => setTargetSubject(e.target.value)}
                placeholder="e.g. Biology, Calculus, History"
                className="w-full p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all text-[var(--color-text)]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                How confident do you feel in this subject? (1 = Lost, 5 = Master)
              </label>
              <div className="flex justify-between items-center bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] p-4">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button
                    key={num}
                    onClick={() => setConfidence(num)}
                    className={cn(
                      "w-12 h-12 rounded-full font-medium transition-all",
                      confidence === num 
                        ? "bg-[var(--color-primary)] text-white shadow-md scale-110" 
                        : "bg-[var(--color-surface)] text-[var(--color-text-muted)] border border-[var(--color-border)] hover:bg-[var(--color-border)]"
                    )}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Commitment
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-muted)] mb-2">
                What's one specific goal you want to hit this month?
              </label>
              <textarea 
                placeholder="e.g. Pass my AP Bio midterm, or build a study habit..."
                className="w-full h-32 p-4 bg-[var(--color-bg)]/50 border border-[var(--color-border)] rounded-[var(--radius-lg)] text-[var(--color-text)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/40 transition-all shadow-inner"
              />
            </div>
          </div>
        );

      case 3: // Baseline Assessment
        return (
          <div className="pt-2">
            <BaselineQuizRadio 
              questions={MOCK_BASELINE_QUESTIONS} 
              onSubmit={(answers) => console.log('Final Baseline Raw Answers:', answers)}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-4 py-8 md:py-12">
      <div className="mb-12">
        <Stepper steps={ONBOARDING_STEPS} currentStep={currentStepIndex} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: AI Transition & Tutor Persona */}
        <div className="md:col-span-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 md:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 text-[var(--color-primary)] flex items-center justify-center mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 8V4H8"/><rect width="16" height="12" x="4" y="8" rx="2"/><path d="M2 14h2"/><path d="M20 14h2"/><path d="M15 13v2"/><path d="M9 13v2"/></svg>
          </div>
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
            >
              <h2 className="font-display text-2xl font-medium text-[var(--color-text)] leading-snug">
                {transitionLine}
              </h2>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Right Column: Deterministic Inputs */}
        <div className="md:col-span-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepIndex}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className={cn(
                "w-full",
                currentStepIndex === 3 ? "" : "bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[var(--radius-xl)] p-6 md:p-8 shadow-md"
              )}
            >
              {renderStepContent()}

              {currentStepIndex < 3 && (
                <div className="flex justify-end pt-8 mt-8 border-t border-[var(--color-border)]">
                  <Button 
                    onClick={handleNextStep}
                    disabled={isTransitioning}
                    className="px-8 py-2.5 rounded-full bg-[var(--color-text)] text-[var(--color-surface)] font-medium hover:scale-105 transition-all"
                  >
                    {isTransitioning ? 'Thinking...' : 'Continue'}
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
