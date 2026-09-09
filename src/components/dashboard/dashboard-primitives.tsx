"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

/* =============================================================================
   DASHBOARD PRIMITIVES
   Shared UI components for Student, Parent, and Admin dashboards.
   All colors from CSS variables (--dash-*). Zero hardcoded hex values.
   ============================================================================= */

// ─── Dashboard Card ─────────────────────────────────────────────────────────

interface DashboardCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  accentColor?: string; // CSS variable value, e.g. var(--dash-teal)
  accentPosition?: "left" | "top";
  padding?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}

export function DashboardCard({
  children,
  className = "",
  hoverable = false,
  accentColor,
  accentPosition = "left",
  padding = "18px 20px",
  onClick,
  style: externalStyle,
}: DashboardCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className={`dash-card ${hoverable ? "dash-card-hoverable" : ""} ${className}`}
      style={{
        padding,
        cursor: onClick ? "pointer" : undefined,
        ...(accentColor && accentPosition === "left"
          ? { borderLeftWidth: "3px", borderLeftColor: accentColor }
          : {}),
        ...(accentColor && accentPosition === "top"
          ? { borderTopWidth: "3px", borderTopColor: accentColor }
          : {}),
        ...externalStyle,
      }}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ─── Stat Card (Dark) ────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: React.ReactNode;
  subtext?: string;
  icon?: React.ReactNode;
  accentColor?: string;
  delay?: number;
  children?: React.ReactNode;
}

export function StatCard({
  label,
  value,
  subtext,
  icon,
  accentColor,
  delay = 0,
  children,
}: StatCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="dash-card dash-card-hoverable"
      style={{ padding: "18px 20px" }}
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.4,
        ease: [0.16, 1, 0.3, 1],
        delay,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
        {icon && (
          <span style={{ color: accentColor || "var(--dash-muted)" }}>{icon}</span>
        )}
        <span
          style={{
            fontSize: "12px",
            color: "var(--dash-muted)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {label}
        </span>
      </div>
      <div
        style={{
          fontSize: "26px",
          fontWeight: 600,
          color: "var(--dash-text)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          lineHeight: 1.2,
        }}
      >
        {value}
      </div>
      {children}
      {subtext && (
        <div
          style={{
            fontSize: "13px",
            color: "var(--dash-muted)",
            marginTop: "6px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {subtext}
        </div>
      )}
    </motion.div>
  );
}

// ─── Count-Up Number ─────────────────────────────────────────────────────────

interface CountUpProps {
  end: number;
  duration?: number;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CountUp({ end, duration = 600, suffix = "", className, style }: CountUpProps) {
  const [count, setCount] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setCount(end);
      return;
    }

    let startTime: number;
    let rafId: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setCount(Math.round(eased * end));

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [end, duration, shouldReduceMotion]);

  return (
    <span className={className} style={style}>
      {count}
      {suffix}
    </span>
  );
}

// ─── Progress Ring (SVG Circular) ────────────────────────────────────────────

interface ProgressRingProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  label?: string;
  sublabel?: string;
}

export function ProgressRing({
  percentage,
  size = 60,
  strokeWidth = 5,
  color = "var(--dash-teal)",
  bgColor = "var(--dash-raised)",
  label,
  sublabel,
}: ProgressRingProps) {
  const shouldReduceMotion = useReducedMotion();
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={bgColor}
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={
            shouldReduceMotion
              ? { strokeDashoffset: offset }
              : { strokeDashoffset: circumference }
          }
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      {/* Center text (overlaid) */}
      <div
        style={{
          position: "relative",
          marginTop: -size - 4,
          height: size,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--dash-text)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {label ?? `${Math.round(percentage)}%`}
        </span>
      </div>
      {sublabel && (
        <span
          style={{
            fontSize: "11px",
            color: "var(--dash-muted)",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {sublabel}
        </span>
      )}
    </div>
  );
}

// ─── Animated Progress Bar ───────────────────────────────────────────────────

interface AnimatedProgressBarProps {
  value: number;
  max: number;
  color?: string;
  height?: number;
  delay?: number;
  className?: string;
}

export function AnimatedProgressBar({
  value,
  max,
  color = "var(--dash-teal)",
  height = 4,
  delay = 0,
  className = "",
}: AnimatedProgressBarProps) {
  const shouldReduceMotion = useReducedMotion();
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div
      className={className}
      style={{
        height: `${height}px`,
        background: "var(--dash-raised)",
        borderRadius: "var(--dash-radius-pill)",
        overflow: "hidden",
      }}
    >
      <motion.div
        style={{
          height: "100%",
          background: color,
          borderRadius: "var(--dash-radius-pill)",
        }}
        initial={shouldReduceMotion ? { width: `${percentage}%` } : { width: "0%" }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      />
    </div>
  );
}

// ─── Status Chip ─────────────────────────────────────────────────────────────

interface StatusChipProps {
  status: "passed" | "missed" | "completed" | "pending" | "on-track" | "behind" | "qualified";
  label?: string;
}

const statusStyles: Record<
  StatusChipProps["status"],
  { color: string; bg: string; text: string }
> = {
  passed: {
    color: "var(--dash-success)",
    bg: "rgba(74, 222, 128, 0.08)",
    text: "Passed",
  },
  missed: {
    color: "var(--dash-danger)",
    bg: "rgba(248, 113, 113, 0.08)",
    text: "Missed",
  },
  completed: {
    color: "var(--dash-success)",
    bg: "rgba(74, 222, 128, 0.08)",
    text: "Completed",
  },
  pending: {
    color: "var(--dash-dim)",
    bg: "var(--dash-raised)",
    text: "Pending",
  },
  "on-track": {
    color: "var(--dash-success)",
    bg: "rgba(74, 222, 128, 0.08)",
    text: "On track ✓",
  },
  behind: {
    color: "var(--dash-amber)",
    bg: "rgba(251, 191, 36, 0.08)",
    text: "Behind schedule",
  },
  qualified: {
    color: "var(--dash-teal)",
    bg: "var(--dash-teal-bg)",
    text: "Qualified ✓",
  },
};

export function StatusChip({ status, label }: StatusChipProps) {
  const s = statusStyles[status];
  return (
    <span
      style={{
        color: s.color,
        background: s.bg,
        padding: "2px 8px",
        borderRadius: "6px",
        fontSize: "12px",
        fontWeight: 500,
        fontFamily: "system-ui, -apple-system, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {label ?? s.text}
    </span>
  );
}

// ─── Streak Badge ────────────────────────────────────────────────────────────

interface StreakBadgeProps {
  days: number;
}

export function StreakBadge({ days }: StreakBadgeProps) {
  return (
    <span
      style={{
        background: "rgba(251, 191, 36, 0.1)",
        color: "var(--dash-amber)",
        padding: "6px 14px",
        borderRadius: "var(--dash-radius-pill)",
        fontSize: "13px",
        fontWeight: 600,
        fontFamily: "system-ui, -apple-system, sans-serif",
        whiteSpace: "nowrap",
      }}
    >
      {days} day streak 🔥
    </span>
  );
}

// ─── Section Header ──────────────────────────────────────────────────────────

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "12px",
      }}
    >
      <div>
        <h3
          style={{
            fontSize: "15px",
            fontWeight: 600,
            color: "var(--dash-text)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
          }}
        >
          {title}
        </h3>
        {subtitle && (
          <p
            style={{
              fontSize: "12px",
              color: "var(--dash-muted)",
              marginTop: "2px",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {subtitle}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}

// ─── Divider ─────────────────────────────────────────────────────────────────

export function Divider() {
  return (
    <div
      style={{
        height: "1px",
        background: "var(--dash-raised)",
        margin: "0",
      }}
    />
  );
}

// ─── Subject Color Dot ───────────────────────────────────────────────────────

const subjectColors: Record<string, string> = {
  math: "var(--dash-amber)",
  mathematics: "var(--dash-amber)",
  biology: "var(--dash-teal)",
  english: "var(--dash-purple)",
  science: "var(--dash-blue)",
  physics: "var(--dash-blue)",
  chemistry: "var(--dash-teal)",
  history: "var(--dash-amber)",
};

export function SubjectDot({ subject }: { subject: string }) {
  const color = subjectColors[subject.toLowerCase()] || "var(--dash-muted)";
  return (
    <span
      style={{
        width: "4px",
        height: "4px",
        borderRadius: "50%",
        background: color,
        display: "inline-block",
        flexShrink: 0,
      }}
    />
  );
}

export function getSubjectColor(subject: string): string {
  return subjectColors[subject.toLowerCase()] || "var(--dash-muted)";
}

// ─── Empty State ─────────────────────────────────────────────────────────────

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      {icon && (
        <div style={{ color: "var(--dash-border)", marginBottom: "16px", fontSize: "32px" }}>
          {icon}
        </div>
      )}
      <h4
        style={{
          fontSize: "16px",
          fontWeight: 500,
          color: "var(--dash-text)",
          margin: "0 0 4px 0",
          fontFamily: "system-ui, -apple-system, sans-serif",
        }}
      >
        {title}
      </h4>
      {description && (
        <p
          style={{
            fontSize: "13px",
            color: "var(--dash-muted)",
            margin: 0,
            maxWidth: "320px",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: "16px" }}>{action}</div>}
    </div>
  );
}

// ─── Dashboard Button ────────────────────────────────────────────────────────

interface DashButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  href?: string;
  className?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export function DashButton({
  children,
  variant = "primary",
  onClick,
  className = "",
  disabled = false,
  style,
}: DashButtonProps) {
  const baseStyle: React.CSSProperties = {
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: 600,
    fontSize: "14px",
    borderRadius: "9px",
    border: "none",
    cursor: disabled ? "not-allowed" : "pointer",
    transition: "all 150ms ease",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    opacity: disabled ? 0.5 : 1,
    ...style,
  };

  const variants: Record<string, React.CSSProperties> = {
    primary: {
      background: "var(--dash-teal)",
      color: "var(--dash-bg)",
      padding: "11px 24px",
    },
    secondary: {
      background: "transparent",
      color: "var(--dash-text)",
      padding: "10px 20px",
      border: "1px solid var(--dash-border)",
    },
    ghost: {
      background: "transparent",
      color: "var(--dash-teal)",
      padding: "6px 12px",
    },
  };

  return (
    <button
      className={className}
      style={{ ...baseStyle, ...variants[variant] }}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

// ─── Scroll Animation Observer ───────────────────────────────────────────────

export function useScrollAnimation() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
            observer.unobserve(e.target);
          }
        }),
      { threshold: 0.1 }
    );
    document
      .querySelectorAll(".dash-animate-on-scroll")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);
}
