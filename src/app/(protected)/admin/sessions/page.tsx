"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, StatCard, CountUp, StatusChip } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN SESSIONS PAGE
   Route: /admin/sessions
   All sessions with filters, table, status indicators
   ============================================================================= */

const mockSessions = [
  { id: "s1", student: "Aarav Sharma", subject: "Mathematics", topic: "Quadratic Equations", phase: "completed", duration: 42, score: 87, date: "2026-09-07", time: "14:30" },
  { id: "s2", student: "Sophie Chen", subject: "Science", topic: "Cell Biology", phase: "learn", duration: 18, score: null, date: "2026-09-07", time: "15:10" },
  { id: "s3", student: "Rabindra Shrestha", subject: "Physics", topic: "Newton's Laws", phase: "completed", duration: 38, score: 92, date: "2026-09-07", time: "13:45" },
  { id: "s4", student: "Aditya Kumar", subject: "Chemistry", topic: "Periodic Table", phase: "recall", duration: 25, score: null, date: "2026-09-07", time: "16:00" },
  { id: "s5", student: "Prince Thapa", subject: "English", topic: "Essay Writing", phase: "completed", duration: 35, score: 78, date: "2026-09-06", time: "10:15" },
  { id: "s6", student: "Emily Park", subject: "Mathematics", topic: "Trigonometry", phase: "completed", duration: 40, score: 95, date: "2026-09-06", time: "09:30" },
  { id: "s7", student: "James Wilson", subject: "Biology", topic: "Genetics", phase: "abandoned", duration: 8, score: null, date: "2026-09-06", time: "11:45" },
  { id: "s8", student: "Aarav Sharma", subject: "Science", topic: "Photosynthesis", phase: "completed", duration: 45, score: 81, date: "2026-09-05", time: "14:00" },
];

const stats = { today: 412, avgDuration: 38, completionRate: 87, activeNow: 23 };

export default function AdminSessionsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const filtered = mockSessions.filter(s => {
    if (phaseFilter !== "all" && s.phase !== phaseFilter) return false;
    if (subjectFilter !== "all" && s.subject !== subjectFilter) return false;
    return true;
  });

  const phaseColor = (phase: string) => {
    switch (phase) {
      case "completed": return { bg: "rgba(74,222,128,0.08)", color: "var(--dash-success)", border: "rgba(74,222,128,0.2)" };
      case "learn": case "recall": case "challenge": return { bg: "var(--dash-teal-bg)", color: "var(--dash-teal)", border: "var(--dash-teal-border)" };
      case "abandoned": return { bg: "rgba(248,113,113,0.08)", color: "var(--dash-danger)", border: "rgba(248,113,113,0.2)" };
      default: return { bg: "transparent", color: "var(--dash-dim)", border: "var(--dash-border)" };
    }
  };

  return (
    <motion.div
      className="dash-page-enter"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui", marginBottom: "24px" }}>Sessions</h1>

      {/* Stats row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Sessions today" value={stats.today} accentColor="var(--dash-teal)" />
        <StatCard label="Avg duration" value={stats.avgDuration} subtext="minutes" accentColor="var(--dash-purple)" />
        <StatCard label="Completion rate" value={stats.completionRate} subtext="%" accentColor="var(--dash-success)" />
        <StatCard label="Active now" value={stats.activeNow} accentColor="var(--dash-amber)" />
      </div>

      {/* Filters */}
      <DashboardCard padding="14px 16px" style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select value={phaseFilter} onChange={e => setPhaseFilter(e.target.value)} style={{ padding: "8px 12px", fontSize: "13px", color: "var(--dash-text)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", fontFamily: "system-ui" }}>
            <option value="all">All phases</option>
            <option value="completed">Completed</option>
            <option value="learn">Learning</option>
            <option value="recall">Recall</option>
            <option value="challenge">Challenge</option>
            <option value="abandoned">Abandoned</option>
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} style={{ padding: "8px 12px", fontSize: "13px", color: "var(--dash-text)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", fontFamily: "system-ui" }}>
            <option value="all">All subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Science">Science</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
            <option value="Biology">Biology</option>
          </select>
        </div>
      </DashboardCard>

      {/* Table */}
      <DashboardCard padding="0">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                {["Student", "Subject", "Topic", "Phase", "Duration", "Score", "Date"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--dash-dim)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(session => {
                const pc = phaseColor(session.phase);
                return (
                  <tr key={session.id} style={{ borderBottom: "1px solid var(--dash-border)" }}
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--dash-surface)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <td style={{ padding: "12px 16px", color: "var(--dash-text)", fontWeight: 500 }}>{session.student}</td>
                    <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{session.subject}</td>
                    <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{session.topic}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: pc.bg, color: pc.color, border: `1px solid ${pc.border}`, textTransform: "capitalize" }}>
                        {session.phase}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--dash-muted)", fontFamily: "'Geist Mono', monospace" }}>{session.duration}m</td>
                    <td style={{ padding: "12px 16px", color: session.score && session.score >= 80 ? "var(--dash-success)" : session.score ? "var(--dash-amber)" : "var(--dash-dim)", fontFamily: "'Geist Mono', monospace", fontWeight: 600 }}>
                      {session.score ? `${session.score}%` : "—"}
                    </td>
                    <td style={{ padding: "12px 16px", color: "var(--dash-dim)" }}>{session.date} · {session.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DashboardCard>
    </motion.div>
  );
}
