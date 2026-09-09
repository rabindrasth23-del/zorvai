"use client";

import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, AnimatedProgressBar, StatusChip, getSubjectColor, SubjectDot, Divider, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PROGRESS PAGE — Student Progress Tracker
   Route: /progress
   Subject progress bars, session history table, streak calendar,
   mastered/weak topics lists.
   ============================================================================= */

// Mock data
const subjectProgress = [
  { name: "Mathematics", percentage: 72, lastStudied: "2 days ago" },
  { name: "Biology", percentage: 85, lastStudied: "Yesterday" },
  { name: "English", percentage: 58, lastStudied: "4 days ago" },
  { name: "Science", percentage: 64, lastStudied: "Today" },
];

const sessionHistory = [
  { date: "Sep 3", topic: "Cell Division", subject: "Biology", duration: "42 min", result: "passed" as const },
  { date: "Sep 2", topic: "Quadratic Equations", subject: "Mathematics", duration: "38 min", result: "passed" as const },
  { date: "Sep 1", topic: "Essay Structure", subject: "English", duration: "45 min", result: "missed" as const },
  { date: "Aug 31", topic: "Chemical Bonds", subject: "Science", duration: "40 min", result: "passed" as const },
  { date: "Aug 30", topic: "Photosynthesis", subject: "Biology", duration: "44 min", result: "passed" as const },
  { date: "Aug 29", topic: "Algebra Review", subject: "Mathematics", duration: "35 min", result: "passed" as const },
  { date: "Aug 28", topic: "Shakespeare", subject: "English", duration: "42 min", result: "missed" as const },
];

const masteredTopics = [
  "Cell Structure", "Photosynthesis", "Linear Equations", "Atomic Structure", "Verb Tenses",
];

const weakTopics = [
  { topic: "Essay Structure", subject: "English" },
  { topic: "Trigonometry", subject: "Mathematics" },
];

// Generate streak calendar (30 days)
const generateCalendar = () => {
  const days = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const isStudyDay = Math.random() > 0.35; // Mock — ~65% study rate
    const isToday = i === 0;
    days.push({ date, isStudyDay, isToday });
  }
  return days;
};

export default function ProgressPage() {
  const shouldReduceMotion = useReducedMotion();
  const calendar = generateCalendar();

  return (
    <div className="dash-page-enter" style={{ maxWidth: "1040px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Progress
      </h1>

      {/* ═══ Subject Progress Bars ═══ */}
      <DashboardCard padding="20px" className="mb-5">
        <SectionHeader title="Subject progress" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {subjectProgress.map((subject, i) => (
            <div key={subject.name}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
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
            </div>
          ))}
        </div>
      </DashboardCard>

      {/* ═══ Two Column: Calendar + Mastered/Weak ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }} className="max-md:!grid-cols-1">
        {/* Streak Calendar */}
        <DashboardCard padding="20px">
          <SectionHeader title="Study streak" subtitle="Last 30 days" />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(7, 1fr)",
              gap: "4px",
              marginTop: "12px",
            }}
          >
            {calendar.map((day, i) => (
              <motion.div
                key={i}
                initial={shouldReduceMotion ? false : { scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.015, duration: 0.3 }}
                style={{
                  aspectRatio: "1",
                  borderRadius: "4px",
                  background: day.isStudyDay ? "var(--dash-teal)" : "var(--dash-raised)",
                  opacity: day.isStudyDay ? 0.8 : 0.3,
                  border: day.isToday ? "2px solid var(--dash-teal)" : "none",
                  transition: "opacity 200ms ease",
                }}
                title={day.date.toLocaleDateString()}
              />
            ))}
          </div>
        </DashboardCard>

        {/* Mastered + Weak Topics */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <DashboardCard padding="20px">
            <SectionHeader title="Mastered topics" />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {masteredTopics.map((topic) => (
                <div key={topic} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "4px 0" }}>
                  <span style={{ color: "var(--dash-success)", fontSize: "12px" }}>✓</span>
                  <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{topic}</span>
                </div>
              ))}
            </div>
          </DashboardCard>

          <DashboardCard padding="20px">
            <SectionHeader title="Weak topics" />
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {weakTopics.map((t) => (
                <div key={t.topic} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "4px 0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "var(--dash-danger)", fontSize: "12px" }}>⚑</span>
                    <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{t.topic}</span>
                  </div>
                  <a
                    href={`/chat?topic=${encodeURIComponent(t.topic)}`}
                    style={{ fontSize: "13px", color: "var(--dash-teal)", textDecoration: "none" }}
                  >
                    Review →
                  </a>
                </div>
              ))}
            </div>
          </DashboardCard>
        </div>
      </div>

      {/* ═══ Session History Table ═══ */}
      <DashboardCard padding="20px">
        <SectionHeader title="Session history" />
        {/* Desktop Table */}
        <div className="hidden md:block">
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Date", "Topic", "Subject", "Duration", "Result"].map((col) => (
                  <th
                    key={col}
                    style={{
                      textAlign: "left",
                      padding: "8px 12px",
                      fontSize: "11px",
                      color: "var(--dash-dim)",
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      fontWeight: 500,
                      borderBottom: "1px solid var(--dash-raised)",
                    }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sessionHistory.map((session, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: i < sessionHistory.length - 1 ? "1px solid var(--dash-raised)" : "none",
                  }}
                >
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{session.date}</td>
                  <td style={{ padding: "12px", fontSize: "14px", color: "var(--dash-text)" }}>{session.topic}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{session.subject}</td>
                  <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{session.duration}</td>
                  <td style={{ padding: "12px" }}><StatusChip status={session.result} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Mobile Card List */}
        <div className="md:hidden" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {sessionHistory.map((session, i) => (
            <div
              key={i}
              style={{
                padding: "12px",
                background: "var(--dash-raised)",
                borderRadius: "var(--dash-radius-inner)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontSize: "14px", color: "var(--dash-text)" }}>{session.topic}</div>
                <div style={{ fontSize: "12px", color: "var(--dash-muted)" }}>
                  {session.date} · {session.subject} · {session.duration}
                </div>
              </div>
              <StatusChip status={session.result} />
            </div>
          ))}
        </div>
      </DashboardCard>
    </div>
  );
}
