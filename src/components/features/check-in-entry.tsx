"use client";

import * as React from "react";
import { Mic, Square } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export interface CheckInEntryProps {
  onStop: () => void;
  className?: string;
}

// Rules override for Check-in: MINIMAL, CALM motion only — no spring, no celebration
export function CheckInEntry({ onStop, className }: CheckInEntryProps) {
  const [isRecording, setIsRecording] = React.useState(false);
  const [levels, setLevels] = React.useState<number[]>(Array(8).fill(10));
  const timerRef = React.useRef<NodeJS.Timeout | null>(null);

  const start = () => {
    setIsRecording(true);
    timerRef.current = setInterval(() => {
      setLevels(prev => prev.map(() => 10 + Math.random() * 60));
    }, 200);
  };

  const stop = () => {
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
    setLevels(Array(8).fill(10));
    onStop();
  };

  React.useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <div className={cn("flex flex-col items-center gap-6", className)}>
      <AnimatePresence mode="wait">
        {!isRecording ? (
          <motion.div
            key="start"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} // Calm fade
          >
            <Button
              onClick={start}
              className="h-16 w-16 rounded-full bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/90 shadow-lg text-white"
            >
              <Mic className="h-6 w-6" />
            </Button>
            <p className="text-center text-[var(--color-text-muted)] font-sans text-sm mt-4">
              Tap to begin check-in
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="stop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }} // Calm fade
            className="flex flex-col items-center gap-6"
          >
            <div className="flex items-center justify-center gap-1.5 h-12">
              {levels.map((level, i) => (
                <div
                  key={i}
                  className="w-1.5 bg-[var(--color-primary)] rounded-full transition-all duration-200 ease-in-out"
                  style={{ height: `${level}%` }}
                />
              ))}
            </div>
            
            <Button
              onClick={stop}
              variant="outline"
              className="h-16 w-16 rounded-full border-[1.5px] border-border bg-surface shadow-sm hover:bg-[var(--color-muted)] text-[var(--color-text)]"
            >
              <Square className="h-5 w-5 fill-current text-red-500" />
            </Button>
            <p className="text-center text-[var(--color-text-muted)] font-sans text-sm">
              Tap to stop
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
