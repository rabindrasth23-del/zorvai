"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  DashboardCard,
  StatCard,
  CountUp,
  ProgressRing,
  AnimatedProgressBar,
  StatusChip,
  StreakBadge,
  SectionHeader,
  Divider,
  getSubjectColor,
  DashButton,
  useScrollAnimation,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT DASHBOARD PAGE
   Route: /parent/dashboard
   Overview of child's progress, activity, and guarantee status.
   ============================================================================= */

// Mock data — replace with API fetches
const mockData = {
  childName: "Alex",
  lastActive: "2 hours ago",
  streak: 5,
  studiedToday: true,
  todayTopic: "Cell Division",
  todayDuration: "42 min",
  sessionsThisWeek: { completed: 3, total: 5 },
  streakStartDate: "Aug 30",
  guaranteeStatus: "on-track" as const,
  guaranteeSessions: 8,
  guaranteeDaysLeft: 18,
  goal: {
    text: "Improve biology grade by one level this term",
    progress: 67,
    aiSummary: "Alex has completed 8 of 12 required sessions. Biology mastery is up 15% since the baseline quiz.",
  },
  weekActivity: [
    { day: "Mon", date: "Sep 1", topic: "Photosynthesis", status: "completed" },
    { day: "Tue", date: "Sep 2", topic: "Quadratic Equations", status: "completed" },
    { day: "Wed", date: "Sep 3", topic: "Cell Division", status: "completed" },
    { day: "Thu", date: "Sep 4", topic: "Essay Structure", status: "today" },
    { day: "Fri", date: "Sep 5", topic: "Chemical Bonds", status: "upcoming" },
    { day: "Sat", date: "Sep 6", topic: null, status: "rest" },
    { day: "Sun", date: "Sep 7", topic: "Algebra Review", status: "upcoming" },
  ],
  subjectProgress: [
    { name: "Mathematics", percentage: 72, lastStudied: "2 days ago" },
    { name: "Biology", percentage: 85, lastStudied: "Yesterday" },
    { name: "English", percentage: 58, lastStudied: "4 days ago" },
    { name: "Science", percentage: 64, lastStudied: "Today" },
  ],
  recentSessions: [
    { date: "Sep 3", topic: "Cell Division", subject: "Biology", duration: "42 min", result: "passed" as const },
    { date: "Sep 2", topic: "Quadratic Equations", subject: "Mathematics", duration: "38 min", result: "passed" as const },
    { date: "Sep 1", topic: "Photosynthesis", subject: "Biology", duration: "44 min", result: "passed" as const },
    { date: "Aug 31", topic: "Essay Structure", subject: "English", duration: "45 min", result: "missed" as const },
    { date: "Aug 30", topic: "Chemical Bonds", subject: "Science", duration: "40 min", result: "passed" as const },
  ],
  baselineScore: 42,
  currentTrajectory: 15,
};

export default function ParentDashboardPage() {
  const shouldReduceMotion = useReducedMotion();
  const [nudgeSent, setNudgeSent] = useState(false);
  const [nudgeCooldown, setNudgeCooldown] = useState(false);
  useScrollAnimation();

  const handleNudge = async () => {
    setNudgeSent(true);
    setTimeout(() => {
      setNudgeSent(false);
      setNudgeCooldown(true);
    }, 2000);
  };

  const d = mockData;

  return (
    <div className="dash-page-enter" style={{ maxWidth: "1040px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Section 1 — Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", margin: 0 }}>
          Watching {d.childName}
        </h1>
        <p style={{ fontSize: "14px", color: "var(--dash-muted)", margin: "4px 0 0" }}>
          Last active {d.lastActive} · {d.streak}-day streak 🔥
        </p>
      </div>

      {/* Section 2 — Four Status Cards */}
      <div
        className="dash-animate-on-scroll"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Studied today */}
        <StatCard
          label="Studied today"
          value={
            d.studiedToday ? (
              <span style={{ color: "var(--dash-success)" }}>Yes ✓</span>
            ) : (
              <span style={{ color: "var(--dash-amber)" }}>Not yet</span>
            )
          }
          subtext={d.studiedToday ? `${d.todayTopic} · ${d.todayDuration}` : "Session planned"}
          delay={0}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: d.studiedToday ? "var(--dash-success)" : "var(--dash-amber)",
              position: "absolute",
              top: "18px",
              right: "18px",
            }}
          />
        </StatCard>

        {/* This week */}
        <StatCard
          label="Sessions this week"
          value={`${d.sessionsThisWeek.completed} of ${d.sessionsThisWeek.total}`}
          delay={0.08}
        >
          <div style={{ display: "flex", gap: "4px", marginTop: "8px" }}>
            {Array.from({ length: d.sessionsThisWeek.total }, (_, i) => (
              <div
                key={i}
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: i < d.sessionsThisWeek.completed ? "var(--dash-teal)" : "var(--dash-raised)",
                }}
              />
            ))}
          </div>
        </StatCard>

        {/* Streak */}
        <StatCard
          label="Current streak"
          value={<CountUp end={d.streak} suffix=" days" />}
          subtext={`🔥 Started ${d.streakStartDate}`}
          delay={0.16}
        />

        {/* Guarantee */}
        <StatCard
          label="Improvement guarantee"
          value={<StatusChip status={d.guaranteeStatus} />}
          subtext={`${d.guaranteeSessions} of 12 sessions · ${d.guaranteeDaysLeft} days left`}
          delay={0.24}
        />
      </div>

      {/* Section 3 — Goal Card */}
      <motion.div
        className="dash-animate-on-scroll"
        style={{
          background: "rgba(78, 205, 196, 0.05)",
          border: "1px solid rgba(78, 205, 196, 0.15)",
          borderRadius: "var(--dash-radius-card)",
          padding: "20px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "24px",
        }}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
      >
        <div style={{ flex: 1, minWidth: "240px" }}>
          <span style={{ fontSize: "11px", color: "var(--dash-teal)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            YOUR GOAL FOR {d.childName.toUpperCase()}
          </span>
          <p style={{ fontSize: "16px", fontWeight: 500, fontStyle: "italic", color: "var(--dash-text)", margin: "6px 0 0" }}>
            {d.goal.text}
          </p>
          <p style={{ fontSize: "14px", color: "var(--dash-muted)", margin: "6px 0 0", lineHeight: 1.5 }}>
            {d.goal.aiSummary}
          </p>
        </div>
        <ProgressRing percentage={d.goal.progress} size={60} strokeWidth={5} sublabel="of sessions done" />
      </motion.div>

      {/* Section 4 — Two Column Layout */}
      <div
        className="dash-animate-on-scroll"
        style={{
          display: "grid",
          gridTemplateColumns: "58fr 42fr",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        {/* Left: This Week's Activity */}
        <DashboardCard padding="20px">
          <SectionHeader title="This week's activity" />
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            {d.weekActivity.map((day, i) => {
              const statusStyles: Record<string, { border: string; color: string; bg: string }> = {
                completed: { border: "var(--dash-success)", color: "var(--dash-muted)", bg: "var(--dash-raised)" },
                today: { border: "var(--dash-teal)", color: "var(--dash-teal)", bg: "var(--dash-teal-bg)" },
                upcoming: { border: "var(--dash-border)", color: "var(--dash-dim)", bg: "transparent" },
                missed: { border: "var(--dash-danger)", color: "var(--dash-danger)", bg: "rgba(248,113,113,0.06)" },
                rest: { border: "var(--dash-border)", color: "var(--dash-dim)", bg: "transparent" },
              };
              const s = statusStyles[day.status] || statusStyles.upcoming;

              return (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "8px 0",
                    borderBottom: i < d.weekActivity.length - 1 ? "1px solid var(--dash-raised)" : "none",
                  }}
                >
                  <span style={{ fontSize: "13px", color: "var(--dash-muted)", minWidth: "70px" }}>
                    {day.day} {day.date.split(" ")[1]}
                  </span>
                  {day.topic ? (
                    <span
                      style={{
                        fontSize: "12px",
                        color: s.color,
                        background: s.bg,
                        borderLeft: `3px solid ${s.border}`,
                        padding: "4px 10px",
                        borderRadius: "4px",
                        flex: 1,
                      }}
                    >
                      {day.topic}
                    </span>
                  ) : (
                    <span style={{ fontSize: "12px", color: "var(--dash-dim)", fontStyle: "italic" }}>Rest day</span>
                  )}
                </div>
              );
            })}
          </div>
          {/* Nudge button */}
          <div style={{ marginTop: "16px" }}>
            {nudgeCooldown ? (
              <span style={{ fontSize: "13px", color: "var(--dash-dim)" }}>Nudge sent (once per day)</span>
            ) : nudgeSent ? (
              <span style={{ fontSize: "13px", color: "var(--dash-success)" }}>Nudge sent ✓</span>
            ) : (
              <button
                onClick={handleNudge}
                style={{
                  fontSize: "13px",
                  color: "var(--dash-teal)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                Send a nudge →
              </button>
            )}
          </div>
        </DashboardCard>

        {/* Right: Subject Progress */}
        <DashboardCard padding="20px">
          <SectionHeader title="Subject progress" />
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {d.subjectProgress.map((subject, i) => (
              <div key={subject.name}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{subject.name}</span>
                  <span style={{ fontSize: "13px", color: "var(--dash-muted)", fontFamily: "monospace" }}>
                    {subject.percentage}%
                  </span>
                </div>
                <AnimatedProgressBar
                  value={subject.percentage}
                  max={100}
                  color={getSubjectColor(subject.name)}
                  height={6}
                  delay={i * 0.1}
                />
                <span style={{ fontSize: "11px", color: "var(--dash-dim)", marginTop: "3px", display: "block" }}>
                  Last studied: {subject.lastStudied}
                </span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Section 5 — Recent Sessions Table */}
      <DashboardCard padding="20px" className="dash-animate-on-scroll mb-5">
        <SectionHeader
          title="Recent sessions"
          action={
            <Link href="/parent/progress" style={{ fontSize: "13px", color: "var(--dash-teal)", textDecoration: "none" }}>
              View all →
            </Link>
          }
        />
        <div className="hidden md:block">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Topic", "Subject", "Duration", "Result"].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", color: "var(--dash-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, borderBottom: "1px solid var(--dash-raised)" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {d.recentSessions.map((s, i) => (
                <tr key={i} style={{ borderBottom: i < d.recentSessions.length - 1 ? "1px solid var(--dash-raised)" : "none" }}>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.date}</td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--dash-text)" }}>{s.topic}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.subject}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.duration}</td>
                  <td style={{ padding: "12px" }}><StatusChip status={s.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {d.recentSessions.map((s, i) => (
            <div key={i} style={{ padding: "12px", background: "var(--dash-raised)", borderRadius: "var(--dash-radius-inner)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>{s.topic}</div>
                <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>{s.date} · {s.subject}</div>
              </div>
              <StatusChip status={s.result} />
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* Section 6 — Guarantee Panel */}
      <DashboardCard padding="24px" className="dash-animate-on-scroll">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "24px", alignItems: "start" }} className="max-md:!grid-cols-1">
          {/* Left */}
          <div>
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--dash-text)", margin: "0 0 12px" }}>
              Improvement guarantee
            </h3>
            <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "0 0 8px" }}>Sessions completed this window</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: "2px" }}>
              <span style={{ fontSize: "32px", fontWeight: 700, color: "var(--dash-teal)", fontFamily: "monospace" }}>
                {d.guaranteeSessions}
              </span>
              <span style={{ fontSize: "18px", color: "var(--dash-dim)" }}> / 12</span>
            </div>
            <AnimatedProgressBar value={d.guaranteeSessions} max={12} height={6} delay={0.2} />
          </div>

          {/* Middle */}
          <div>
            <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "0 0 8px" }}>Baseline score</p>
            <p style={{ fontSize: "16px", color: "var(--dash-text)", margin: "0 0 12px" }}>{d.baselineScore}%</p>
            <p style={{ fontSize: "12px", color: "var(--dash-muted)", margin: "0 0 8px" }}>Current trajectory</p>
            <p style={{ fontSize: "16px", color: d.currentTrajectory > 0 ? "var(--dash-success)" : "var(--dash-danger)", margin: "0 0 12px" }}>
              {d.currentTrajectory > 0 ? "+" : ""}{d.currentTrajectory}%
            </p>
            <p style={{ fontSize: "13px", color: "var(--dash-muted)" }}>Follow-up quiz: {d.guaranteeDaysLeft} days away</p>
          </div>

          {/* Right */}
          <div style={{ textAlign: "right" }}>
            {d.guaranteeSessions >= 12 ? (
              <>
                <DashButton variant="secondary">Claim refund</DashButton>
                <p style={{ fontSize: "12px", color: "var(--dash-dim)", marginTop: "8px" }}>Refunds in 5 business days</p>
              </>
            ) : (
              <>
                <p style={{ fontSize: "13px", color: "var(--dash-dim)", margin: 0 }}>Available after 12 sessions</p>
                <p style={{ fontSize: "12px", color: "var(--dash-dim)", marginTop: "4px" }}>Refunds in 5 business days</p>
              </>
            )}
          </div>
        </div>
      </DashboardCard>
    </div>
  );
}
