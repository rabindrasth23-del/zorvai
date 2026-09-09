"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, StatCard } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN CONTENT PAGE — Curriculum Management
   Route: /admin/content
   Topics, subjects, curriculum structure management
   ============================================================================= */

const subjects = [
  { name: "Mathematics", topics: 48, active: 42, avgScore: 76, color: "var(--dash-teal)" },
  { name: "Science", topics: 36, active: 32, avgScore: 72, color: "var(--dash-success)" },
  { name: "Physics", topics: 28, active: 25, avgScore: 68, color: "var(--dash-purple)" },
  { name: "Chemistry", topics: 32, active: 28, avgScore: 71, color: "var(--dash-blue)" },
  { name: "Biology", topics: 30, active: 26, avgScore: 74, color: "var(--dash-amber)" },
  { name: "English", topics: 24, active: 22, avgScore: 82, color: "var(--dash-danger)" },
  { name: "History", topics: 20, active: 16, avgScore: 78, color: "#f472b6" },
  { name: "Geography", topics: 18, active: 14, avgScore: 75, color: "#34d399" },
];

const recentTopics = [
  { id: "t1", name: "Quadratic Equations", subject: "Mathematics", sessions: 234, avgScore: 72, status: "active" },
  { id: "t2", name: "Cell Biology", subject: "Science", sessions: 189, avgScore: 76, status: "active" },
  { id: "t3", name: "Newton's Laws", subject: "Physics", sessions: 167, avgScore: 68, status: "active" },
  { id: "t4", name: "Periodic Table", subject: "Chemistry", sessions: 156, avgScore: 71, status: "active" },
  { id: "t5", name: "Essay Writing", subject: "English", sessions: 143, avgScore: 82, status: "active" },
  { id: "t6", name: "Trigonometry", subject: "Mathematics", sessions: 198, avgScore: 65, status: "review" },
  { id: "t7", name: "Photosynthesis", subject: "Biology", sessions: 134, avgScore: 78, status: "active" },
  { id: "t8", name: "World War II", subject: "History", sessions: 98, avgScore: 80, status: "draft" },
];

export default function AdminContentPage() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedSubject, setSelectedSubject] = useState("all");

  const filtered = selectedSubject === "all" ? recentTopics : recentTopics.filter(t => t.subject === selectedSubject);
  const totalTopics = subjects.reduce((sum, s) => sum + s.topics, 0);
  const totalActive = subjects.reduce((sum, s) => sum + s.active, 0);

  return (
    <motion.div
      className="dash-page-enter"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui", marginBottom: "24px" }}>Curriculum</h1>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <StatCard label="Total topics" value={totalTopics} accentColor="var(--dash-teal)" />
        <StatCard label="Active topics" value={totalActive} accentColor="var(--dash-success)" />
        <StatCard label="Subjects" value={subjects.length} accentColor="var(--dash-purple)" />
        <StatCard label="Avg mastery" value={74} subtext="%" accentColor="var(--dash-amber)" />
      </div>

      {/* Subject cards */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "12px" }}>Subjects</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        {subjects.map(sub => (
          <DashboardCard key={sub.name} hoverable padding="16px" accentColor={sub.color} onClick={() => setSelectedSubject(sub.name === selectedSubject ? "all" : sub.name)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)" }}>{sub.name}</p>
              <span style={{ fontSize: "11px", color: sub.color, fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>{sub.avgScore}%</span>
            </div>
            <p style={{ fontSize: "12px", color: "var(--dash-muted)" }}>{sub.active}/{sub.topics} topics active</p>
            <div style={{ marginTop: "8px", height: "4px", background: "var(--dash-bg)", borderRadius: "99px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${(sub.active / sub.topics) * 100}%`, background: sub.color, borderRadius: "99px", transition: "width 600ms ease" }} />
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Topics table */}
      <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "12px" }}>
        {selectedSubject === "all" ? "All Topics" : `${selectedSubject} Topics`}
        {selectedSubject !== "all" && (
          <button onClick={() => setSelectedSubject("all")} style={{ marginLeft: "10px", fontSize: "12px", color: "var(--dash-teal)", background: "none", border: "none", cursor: "pointer" }}>Show all</button>
        )}
      </h2>
      <DashboardCard padding="0">
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
              {["Topic", "Subject", "Sessions", "Avg Score", "Status"].map(h => (
                <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--dash-dim)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(topic => (
              <tr key={topic.id} style={{ borderBottom: "1px solid var(--dash-border)" }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--dash-surface)")}
                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
              >
                <td style={{ padding: "12px 16px", color: "var(--dash-text)", fontWeight: 500 }}>{topic.name}</td>
                <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{topic.subject}</td>
                <td style={{ padding: "12px 16px", color: "var(--dash-muted)", fontFamily: "'Geist Mono', monospace" }}>{topic.sessions}</td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{ color: topic.avgScore >= 80 ? "var(--dash-success)" : topic.avgScore >= 70 ? "var(--dash-amber)" : "var(--dash-danger)", fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>
                    {topic.avgScore}%
                  </span>
                </td>
                <td style={{ padding: "12px 16px" }}>
                  <span style={{
                    padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, textTransform: "capitalize",
                    background: topic.status === "active" ? "rgba(74,222,128,0.08)" : topic.status === "review" ? "rgba(251,191,36,0.08)" : "rgba(90,87,83,0.08)",
                    color: topic.status === "active" ? "var(--dash-success)" : topic.status === "review" ? "var(--dash-amber)" : "var(--dash-dim)",
                    border: `1px solid ${topic.status === "active" ? "rgba(74,222,128,0.2)" : topic.status === "review" ? "rgba(251,191,36,0.2)" : "var(--dash-border)"}`,
                  }}>
                    {topic.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </DashboardCard>
    </motion.div>
  );
}
