"use client";

import { motion, useReducedMotion } from "motion/react";
import { AudioLines } from "lucide-react";

export default function RecallRibbon() {
  const shouldReduceMotion = useReducedMotion();

  const textContent = "So the mitochondria is the powerhouse of the cell because it generates most of the chemical energy needed to power the cell's biochemical reactions, and honestly the whole thing's been kind of chaotic, like nobody really knows what's going on so you can check in with them and see if the notes from yesterday's meeting were sent out... ";
  const contentBlock = `${textContent} ${textContent}`;

  const marqueeTransition = {
    duration: 60,
    repeat: Infinity,
    ease: "linear",
  };

  return (
    <div className="w-[120vw] h-[100px] flex items-center justify-center relative -translate-x-[10vw]">
      
      {/* 1. Base Layer: Transparent bg, faded gray text (Left side) */}
      <div className="absolute inset-0 flex items-center overflow-hidden z-0">
        <motion.div
          animate={shouldReduceMotion ? {} : { x: "-50%" }}
          transition={marqueeTransition}
          className="whitespace-nowrap flex w-max"
        >
          <span className="font-sans text-[16px] md:text-[20px] font-light text-[var(--color-text-muted)] opacity-50 tracking-wide pr-8">
            {contentBlock}
          </span>
          <span className="font-sans text-[16px] md:text-[20px] font-light text-[var(--color-text-muted)] opacity-50 tracking-wide pr-8">
            {contentBlock}
          </span>
        </motion.div>
      </div>

      {/* 2. Top Layer: Black background, white text (Right side) */}
      {/* We clip this layer so it only appears to the right of the center pill */}
      <div 
        className="absolute inset-0 z-10 overflow-hidden flex items-center"
        style={{ clipPath: "polygon(50% 0, 100% 0, 100% 100%, 50% 100%)" }}
      >
        {/* The actual black ribbon bar, slightly thinner than the container */}
        <div className="absolute w-full h-[48px] md:h-[56px] bg-[var(--color-text)] top-1/2 -translate-y-1/2 z-0"></div>
        
        {/* The synced white text */}
        <motion.div
          animate={shouldReduceMotion ? {} : { x: "-50%" }}
          transition={marqueeTransition}
          className="whitespace-nowrap flex w-max z-10"
        >
          <span className="font-sans text-[16px] md:text-[20px] font-light text-white tracking-wide pr-8">
            {contentBlock}
          </span>
          <span className="font-sans text-[16px] md:text-[20px] font-light text-white tracking-wide pr-8">
            {contentBlock}
          </span>
        </motion.div>
      </div>

      {/* 3. The Pill: Anchored in the center, overlapping the seam */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 
                      bg-[var(--color-bg)] border-[2.5px] border-[var(--color-text)] rounded-full 
                      h-[56px] md:h-[64px] px-6 md:px-8 flex items-center justify-center shadow-md">
        <motion.div
          animate={shouldReduceMotion ? {} : { scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <AudioLines size={24} className="text-[var(--color-text)] md:w-[28px] md:h-[28px]" strokeWidth={2.5} />
        </motion.div>
      </div>

    </div>
  );
}
