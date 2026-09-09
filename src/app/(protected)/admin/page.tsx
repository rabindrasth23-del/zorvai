"use client";

import { motion, useReducedMotion } from "motion/react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { DashboardCard, StatCard, CountUp, SectionHeader, StatusChip } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN OVERVIEW PAGE
   Route: /admin
   KPI stat cards, real-time activity feed, user growth chart,
   session donut chart, active users table.
   ============================================================================= */

// Mock data
const kpiData = {
  totalStudents: 2847,
  activeThisWeek: 1923,
  sessionsToday: 412,
  avgSessionTime: 38,
  mrr: 139503,
  churn: 2.1,
};

const dailyUsersData = [
  { day: "Mon", users: 1420 },
  { day: "Tue", users: 1680 },
  { day: "Wed", users: 1520 },
  { day: "Thu", users: 1890 },
  { day: "Fri", users: 1740 },
  { day: "Sat", users: 980 },
  { day: "Sun", users: 1100 },
];

const sessionStatusData = [
  { name: "Passed", value: 324, color: "var(--dash-success)" },
  { name: "Failed", value: 56, color: "var(--dash-danger)" },
  { name: "In Progress", value: 32, color: "var(--dash-teal)" },
];

const recentActivity = [
  { time: "2 min ago", event: "New signup", detail: "sarah.m@gmail.com", type: "signup" },
  { time: "5 min ago", event: "Session completed", detail: "Alex J. — Cell Division (passed)", type: "session" },
  { time: "8 min ago", event: "Payment received", detail: "£49.00 — Premium plan", type: "payment" },
  { time: "12 min ago", event: "Refund requested", detail: "Parent ID #4281", type: "refund" },
  { time: "15 min ago", event: "Session completed", detail: "Emma K. — Quadratics (failed)", type: "session" },
  { time: "20 min ago", event: "New signup", detail: "david.k@outlook.com", type: "signup" },
];

const topStudents = [
  { name: "Alex Johnson", sessions: 28, streak: 14, mastery: 85 },
  { name: "Emma Williams", sessions: 24, streak: 10, mastery: 78 },
  { name: "Sam Parker", sessions: 22, streak: 8, mastery: 72 },
  { name: "Mia Chen", sessions: 20, streak: 12, mastery: 88 },
  { name: "Noah Davis", sessions: 18, streak: 6, mastery: 65 },
];

const COLORS_RESOLVED = ["#4ade80", "#f87171", "#4ecdc4"];

export default function AdminOverviewPage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="dash-page-enter" style={{ maxWidth: "1200px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        Admin Overview
      </h1>

      {/* ═══ KPI Stat Cards ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <StatCard label="Total Students" value={<CountUp end={kpiData.totalStudents} />} delay={0} />
        <StatCard label="Active This Week" value={<CountUp end={kpiData.activeThisWeek} />} subtext={`${Math.round((kpiData.activeThisWeek / kpiData.totalStudents) * 100)}% of total`} delay={0.08} />
        <StatCard label="Sessions Today" value={<CountUp end={kpiData.sessionsToday} />} delay={0.16} />
        <StatCard label="Avg Session Time" value={<CountUp end={kpiData.avgSessionTime} suffix=" min" />} delay={0.24} />
        <StatCard
          label="MRR"
          value={<CountUp end={kpiData.mrr} suffix="" />}
          subtext="£ monthly recurring"
          delay={0.32}
        />
        <StatCard
          label="Churn Rate"
          value={`${kpiData.churn}%`}
          subtext={kpiData.churn < 3 ? "Healthy" : "Needs attention"}
          accentColor={kpiData.churn < 3 ? "var(--dash-success)" : "var(--dash-danger)"}
          delay={0.4}
        />
      </div>

      {/* ═══ Two Column: Chart + Activity Feed ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "14px", marginBottom: "24px" }} className="max-md:!grid-cols-1">
        {/* User Growth Chart */}
        <DashboardCard padding="20px">
          <SectionHeader title="Daily active users" subtitle="This week" />
          <div style={{ height: "220px", marginTop: "12px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyUsersData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--dash-raised)" />
                <XAxis dataKey="day" stroke="var(--dash-dim)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--dash-dim)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                    color: "var(--dash-text)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#4ecdc4"
                  strokeWidth={2}
                  dot={{ fill: "#4ecdc4", r: 4 }}
                  activeDot={{ r: 6, fill: "#4ecdc4" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        {/* Real-time Activity Feed */}
        <DashboardCard padding="20px">
          <SectionHeader
            title="Live activity"
            action={
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--dash-success)", display: "inline-block", animation: "glowPulse 2s infinite" }} />
            }
          />
          <div style={{ display: "flex", flexDirection: "column", gap: "0", maxHeight: "240px", overflowY: "auto" }} className="dash-scrollbar">
            {recentActivity.map((a, i) => {
              const typeColors: Record<string, string> = {
                signup: "var(--dash-teal)",
                session: "var(--dash-purple)",
                payment: "var(--dash-success)",
                refund: "var(--dash-danger)",
              };
              return (
                <motion.div
                  key={i}
                  initial={shouldReduceMotion ? false : { opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.3 }}
                  style={{
                    display: "flex",
                    gap: "10px",
                    padding: "10px 0",
                    borderBottom: i < recentActivity.length - 1 ? "1px solid var(--dash-raised)" : "none",
                  }}
                >
                  <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: typeColors[a.type] || "var(--dash-muted)", marginTop: "6px", flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: "13px", color: "var(--dash-text)" }}>{a.event}</div>
                    <div style={{ fontSize: "12px", color: "var(--dash-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.detail}</div>
                    <div style={{ fontSize: "11px", color: "var(--dash-dim)", marginTop: "2px" }}>{a.time}</div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </DashboardCard>
      </div>

      {/* ═══ Two Column: Session Donut + Top Students ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "14px", marginBottom: "24px" }} className="max-md:!grid-cols-1">
        {/* Session Status Donut */}
        <DashboardCard padding="20px">
          <SectionHeader title="Sessions today" />
          <div style={{ height: "180px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sessionStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                  startAngle={90}
                  endAngle={-270}
                >
                  {sessionStatusData.map((entry, idx) => (
                    <Cell key={idx} fill={COLORS_RESOLVED[idx]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: "var(--dash-surface)",
                    border: "1px solid var(--dash-border)",
                    borderRadius: "8px",
                    fontSize: "13px",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "8px" }}>
            {sessionStatusData.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: COLORS_RESOLVED[i] }} />
                <span style={{ fontSize: "12px", color: "var(--dash-muted)" }}>{s.name} ({s.value})</span>
              </div>
            ))}
          </div>
        </DashboardCard>

        {/* Top Students Table */}
        <DashboardCard padding="20px">
          <SectionHeader title="Top students" subtitle="By session count" />
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Student", "Sessions", "Streak", "Mastery"].map((col) => (
                  <th key={col} style={{ textAlign: "left", padding: "8px 12px", fontSize: "11px", color: "var(--dash-dim)", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500, borderBottom: "1px solid var(--dash-raised)" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topStudents.map((s, i) => (
                <tr key={i} style={{ borderBottom: i < topStudents.length - 1 ? "1px solid var(--dash-raised)" : "none" }}>
                  <td style={{ padding: "10px 12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--dash-teal-bg)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 600, color: "var(--dash-teal)" }}>
                        {s.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <span style={{ fontSize: "14px", color: "var(--dash-text)" }}>{s.name}</span>
                    </div>
                  </td>
                  <td style={{ padding: "10px 12px", fontSize: "14px", color: "var(--dash-text)", fontFamily: "monospace" }}>{s.sessions}</td>
                  <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--dash-amber)" }}>{s.streak} 🔥</td>
                  <td style={{ padding: "10px 12px", fontSize: "13px", color: "var(--dash-text)", fontFamily: "monospace" }}>{s.mastery}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </div>
    </div>
  );
}
