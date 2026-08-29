"use client";

import Link from "next/link";
import { BookOpen, ArrowRight, ShieldCheck, CalendarCheck2 } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";

interface HeroBannerProps {
  guaranteeStatus?: string | null;
  guaranteeLabel?: string;
  hasSessions: boolean;
  targetHours: number;
}

export function HeroBanner({
  guaranteeStatus,
  guaranteeLabel,
  hasSessions,
  targetHours,
}: HeroBannerProps) {
  const shouldReduceMotion = useReducedMotion();

  // Determine banner content based on real state
  let title: string;
  let subtitle: string;
  let ctaText: string;
  let ctaHref: string;
  let Icon = CalendarCheck2;

  if (guaranteeStatus && guaranteeStatus !== "not_tracked") {
    title = "Your Improvement Guarantee";
    subtitle =
      guaranteeLabel || "Track your progress toward guaranteed improvement";
    ctaText = "View Details";
    ctaHref = "/guarantee";
    Icon = ShieldCheck;
  } else if (hasSessions) {
    title = "Continue Your Study Journey";
    subtitle = `Hit your ${targetHours}-hour daily target with a focused session`;
    ctaText = "Start Check-in";
    ctaHref = "/checkin";
  } else {
    title = "Ready to Begin?";
    subtitle =
      "Start your daily check-in to kick off your first study session";
    ctaText = "Start Check-in";
    ctaHref = "/checkin";
  }

  return (
    <motion.div
      className="relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-primary)] p-6 md:p-8 shadow-[var(--shadow-md)]"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
        mass: 1,
        delay: 0.06,
      }}
    >
      {/* Decorative background icon */}
      <div className="absolute top-0 right-0 opacity-[0.08] pointer-events-none transform translate-x-1/4 -translate-y-1/4">
        <BookOpen className="w-64 h-64 text-white" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-5 h-5 text-white/80" />
            <span className="text-xs font-sans font-medium text-white/60 uppercase tracking-wider">
              {guaranteeStatus ? "Guarantee Status" : "Daily Session"}
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-display font-semibold text-white tracking-tight mb-1">
            {title}
          </h2>
          <p className="text-white/75 font-sans text-sm md:text-base max-w-md">
            {subtitle}
          </p>
        </div>

        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-[var(--color-primary)] font-sans font-semibold text-sm hover:bg-white/90 transition-colors shadow-[var(--shadow-sm)] shrink-0 cursor-pointer"
        >
          {ctaText}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
