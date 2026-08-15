"use client";

import { motion, useReducedMotion } from "motion/react";
import { BookOpen, Mic, BrainCircuit, RefreshCw } from "lucide-react";

export default function HowItWorksVisual() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="relative w-full aspect-square max-w-[400px] mx-auto md:mx-0 flex items-center justify-center" aria-hidden="true">
      {/* Background connecting ring */}
      <div className="absolute inset-[20%] rounded-full border-2 border-dashed border-[var(--color-border)]" />

      {/* Orbiting particle (if motion allowed) */}
      {!shouldReduceMotion && (
        <motion.div
          className="absolute inset-[20%] rounded-full z-0"
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
        >
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[var(--color-accent)] shadow-[0_0_15px_var(--color-accent)]" />
        </motion.div>
      )}

      {/* 4 Nodes */}
      <div className="absolute top-[5%] left-1/2 -translate-x-1/2 bg-[var(--color-surface)] p-[var(--space-4)] rounded-full shadow-[var(--shadow-md)] border border-white/20 z-10 flex flex-col items-center gap-1">
        <BookOpen size={24} className="text-[var(--color-primary)]" />
        <span className="font-sans text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Learn</span>
      </div>

      <div className="absolute right-[5%] top-1/2 -translate-y-1/2 bg-[var(--color-surface)] p-[var(--space-4)] rounded-full shadow-[var(--shadow-md)] border border-white/20 z-10 flex flex-col items-center gap-1">
        <Mic size={24} className="text-[var(--color-primary)]" />
        <span className="font-sans text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Recall</span>
      </div>

      <div className="absolute bottom-[5%] left-1/2 -translate-x-1/2 bg-[var(--color-surface)] p-[var(--space-4)] rounded-full shadow-[var(--shadow-md)] border border-white/20 z-10 flex flex-col items-center gap-1">
        <BrainCircuit size={24} className="text-[var(--color-primary)]" />
        <span className="font-sans text-[10px] font-bold text-[var(--color-primary)] uppercase tracking-wider">Challenge</span>
      </div>

      <div className="absolute left-[5%] top-1/2 -translate-y-1/2 bg-[var(--color-surface)] p-[var(--space-4)] rounded-full shadow-[var(--shadow-md)] border border-[var(--color-success)] z-10 flex flex-col items-center gap-1">
        <RefreshCw size={24} className="text-[var(--color-success)]" />
        <span className="font-sans text-[10px] font-bold text-[var(--color-success)] uppercase tracking-wider">Feedback</span>
      </div>
      
      {/* Center AI Brain core */}
      <div className="w-[100px] h-[100px] rounded-full bg-gradient-to-tr from-[var(--color-primary)] to-teal-700 flex items-center justify-center shadow-[var(--shadow-lg)] z-10">
        <BrainCircuit size={40} className="text-white opacity-90" />
      </div>
    </div>
  );
}
