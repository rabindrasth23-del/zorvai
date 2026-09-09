"use client";

import { DashboardCard, AnimatedProgressBar, StatusChip, getSubjectColor, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT PROGRESS PAGE
   Route: /parent/progress — Detailed child progress view
   ============================================================================= */

export default function ParentProgressPage() {
  return (
    <div className="dash-page-enter" style={{ maxWidth: "1040px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Alex&apos;s Progress
      </h1>
      {/* Reuses same structure as student progress */}
      <DashboardCard padding="20px" className="mb-5">
        <SectionHeader title="Subject mastery" />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {[
            { name: "Mathematics", pct: 72 },
            { name: "Biology", pct: 85 },
            { name: "English", pct: 58 },
            { name: "Science", pct: 64 },
          ].map((s, i) => (
            <div key={s.name}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{s.name}</span>
                <span style={{ fontSize: "13px", color: "var(--dash-muted)", fontFamily: "monospace" }}>{s.pct}%</span>
              </div>
              <AnimatedProgressBar value={s.pct} max={100} color={getSubjectColor(s.name)} height={6} delay={i * 0.1} />
            </div>
          ))}
        </div>
      </DashboardCard>
      <DashboardCard padding="20px">
        <SectionHeader title="All sessions" />
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {["Date", "Topic", "Subject", "Duration", "Result"].map((c) => (
                <th key={c} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", color: "var(--dash-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, borderBottom: "1px solid var(--dash-raised)" }}>
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: "Sep 3", topic: "Cell Division", subject: "Biology", dur: "42m", r: "passed" as const },
              { date: "Sep 2", topic: "Quadratics", subject: "Mathematics", dur: "38m", r: "passed" as const },
              { date: "Sep 1", topic: "Essay Techniques", subject: "English", dur: "45m", r: "missed" as const },
              { date: "Aug 31", topic: "Chemical Bonds", subject: "Science", dur: "40m", r: "passed" as const },
              { date: "Aug 30", topic: "Photosynthesis", subject: "Biology", dur: "44m", r: "passed" as const },
              { date: "Aug 29", topic: "Algebra Review", subject: "Mathematics", dur: "35m", r: "passed" as const },
            ].map((s, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--dash-raised)" }}>
                <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.date}</td>
                <td style={{ padding: "12px", fontSize: "14px", color: "var(--dash-text)" }}>{s.topic}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.subject}</td>
                <td style={{ padding: "12px", fontSize: "13px", color: "var(--dash-muted)" }}>{s.dur}</td>
                <td style={{ padding: "12px" }}><StatusChip status={s.r} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>
    </div>
  );
}
