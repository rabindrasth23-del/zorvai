"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* =============================================================================
   CONFETTI BURST COMPONENT
   < 1 second burst, dismissible, respects prefers-reduced-motion
   Used on first topic mastery in feedback phase
   ============================================================================= */

interface ConfettiBurstProps {
  trigger: boolean;
  onComplete?: () => void;
}

const CONFETTI_COLORS = [
  "#FF7A45", // accent coral
  "#4A9B7F", // success sage
  "#1B4F5C", // primary teal
  "#FFD93D", // gold
  "#FF6B9D", // pink
  "#6BCB77", // lime
];

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  shape: "circle" | "square" | "strip";
}

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 60, // % from center
    y: 40 + (Math.random() - 0.5) * 30,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    size: 4 + Math.random() * 6,
    shape: (["circle", "square", "strip"] as const)[Math.floor(Math.random() * 3)],
  }));
}

export default function ConfettiBurst({ trigger, onComplete }: ConfettiBurstProps) {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger && !shouldReduceMotion) {
      setParticles(generateParticles(24));
      setVisible(true);

      const timer = setTimeout(() => {
        setVisible(false);
        onComplete?.();
      }, 900);

      return () => clearTimeout(timer);
    }

    // If reduced motion, just call complete immediately
    if (trigger && shouldReduceMotion) {
      onComplete?.();
    }
  }, [trigger, shouldReduceMotion, onComplete]);

  if (!visible || shouldReduceMotion) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 200,
        overflow: "hidden",
      }}
      aria-hidden="true"
    >
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            opacity: 1,
            scale: 0,
            rotate: 0,
          }}
          animate={{
            top: `${p.y + 30 + Math.random() * 40}%`,
            left: `${p.x + (Math.random() - 0.5) * 30}%`,
            opacity: 0,
            scale: 1,
            rotate: p.rotation,
          }}
          transition={{
            duration: 0.7 + Math.random() * 0.3,
            ease: "easeOut",
          }}
          style={{
            position: "absolute",
            width: p.shape === "strip" ? p.size * 0.4 : p.size,
            height: p.shape === "strip" ? p.size * 2 : p.size,
            borderRadius: p.shape === "circle" ? "50%" : p.shape === "strip" ? 2 : 1,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
