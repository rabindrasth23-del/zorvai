"use client";

import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, StatCard, CountUp } from "@/components/dashboard/dashboard-primitives";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

/* =============================================================================
   ADMIN REVENUE PAGE
   Route: /admin/revenue
   MRR/ARR metrics, charts, plan breakdown, churn, country breakdown
   ============================================================================= */

const mrrData = [
  { month: "Apr", mrr: 42000 }, { month: "May", mrr: 58000 }, { month: "Jun", mrr: 75000 },
  { month: "Jul", mrr: 98000 }, { month: "Aug", mrr: 119000 }, { month: "Sep", mrr: 139500 },
];

const planBreakdown = [
  { name: "Annual", value: 58, color: "#4ecdc4", subscribers: 1250, revenue: 74250 },
  { name: "Monthly", value: 35, color: "#a78bfa", subscribers: 890, revenue: 52430 },
  { name: "Weekly", value: 7, color: "#60a5fa", subscribers: 180, revenue: 12820 },
];

const cohortRetention = [
  { cohort: "Mar 2026", m1: 95, m2: 88, m3: 82, m4: 78, m5: 74, m6: 71 },
  { cohort: "Apr 2026", m1: 93, m2: 86, m3: 80, m4: 76, m5: 72 },
  { cohort: "May 2026", m1: 96, m2: 89, m3: 84, m4: 79 },
  { cohort: "Jun 2026", m1: 94, m2: 87, m3: 82 },
  { cohort: "Jul 2026", m1: 97, m2: 91 },
  { cohort: "Aug 2026", m1: 95 },
];

const countryRevenue = [
  { country: "India", subscribers: 890, mrr: 42500, avgLtv: 285 },
  { country: "Nepal", subscribers: 420, mrr: 28900, avgLtv: 312 },
  { country: "USA", subscribers: 310, mrr: 24800, avgLtv: 345 },
  { country: "Canada", subscribers: 180, mrr: 14200, avgLtv: 298 },
  { country: "UAE", subscribers: 150, mrr: 12800, avgLtv: 340 },
  { country: "South Korea", subscribers: 120, mrr: 9800, avgLtv: 310 },
  { country: "UK", subscribers: 95, mrr: 6500, avgLtv: 275 },
];

const recentRefunds = [
  { name: "Sarah M.", amount: 19, reason: "Guarantee claim — no improvement", date: "2026-09-05" },
  { name: "John D.", amount: 119, reason: "Annual — changed mind", date: "2026-09-02" },
  { name: "Meera K.", amount: 19, reason: "Guarantee claim — child disengaged", date: "2026-08-28" },
];

const retentionColor = (v: number) => {
  if (v >= 90) return "rgba(74,222,128,0.15)";
  if (v >= 80) return "rgba(74,222,128,0.08)";
  if (v >= 70) return "rgba(251,191,36,0.08)";
  return "rgba(248,113,113,0.08)";
};

const retentionTextColor = (v: number) => {
  if (v >= 90) return "var(--dash-success)";
  if (v >= 80) return "#86efac";
  if (v >= 70) return "var(--dash-amber)";
  return "var(--dash-danger)";
};

export default function AdminRevenuePage() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="dash-page-enter"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui", marginBottom: "24px" }}>Revenue</h1>

      {/* Key metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "24px" }}>
        <StatCard label="MRR" value={139503} subtext="↑ 17% from last month" accentColor="var(--dash-teal)" />
        <StatCard label="ARR" value={1674036} subtext="projected" accentColor="var(--dash-success)" />
        <StatCard label="Total revenue" value={487200} accentColor="var(--dash-purple)" />
        <StatCard label="ARPU" value={60} subtext="/month" accentColor="var(--dash-blue)" />
        <StatCard label="Churn rate" value={2.1} subtext="% monthly" accentColor="var(--dash-amber)" />
      </div>

      {/* MRR Chart + Plan Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }} className="max-md:!grid-cols-1">
        <DashboardCard padding="20px">
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "16px" }}>MRR Growth</p>
          <div style={{ height: "200px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrData}>
                <XAxis dataKey="month" tick={{ fill: "var(--dash-dim)", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "var(--dash-dim)", fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={{ background: "var(--dash-raised)", border: "1px solid var(--dash-border)", borderRadius: "10px", fontSize: "12px", color: "var(--dash-text)" }} formatter={(v) => [`$${Number(v).toLocaleString()}`, "MRR"]} />
                <Line type="monotone" dataKey="mrr" stroke="#4ecdc4" strokeWidth={2.5} dot={{ fill: "#4ecdc4", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </DashboardCard>

        <DashboardCard padding="20px">
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "16px" }}>Plan Breakdown</p>
          <div style={{ height: "160px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planBreakdown} dataKey="value" cx="50%" cy="50%" innerRadius={40} outerRadius={65} strokeWidth={0}>
                  {planBreakdown.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ marginTop: "12px" }}>
            {planBreakdown.map(p => (
              <div key={p.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--dash-border)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--dash-text)" }}>
                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: p.color }} />
                  {p.name}
                </span>
                <span style={{ fontSize: "13px", color: "var(--dash-muted)" }}>{p.subscribers} subs · ${p.revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Cohort Retention Heatmap */}
      <DashboardCard padding="20px" style={{ marginBottom: "24px" }}>
        <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "16px" }}>Cohort Retention</p>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", fontFamily: "system-ui" }}>
            <thead>
              <tr>
                <th style={{ padding: "8px 12px", textAlign: "left", color: "var(--dash-dim)", fontSize: "11px", fontWeight: 500 }}>Cohort</th>
                {["M1", "M2", "M3", "M4", "M5", "M6"].map(m => (
                  <th key={m} style={{ padding: "8px 12px", textAlign: "center", color: "var(--dash-dim)", fontSize: "11px", fontWeight: 500 }}>{m}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {cohortRetention.map(row => (
                <tr key={row.cohort}>
                  <td style={{ padding: "8px 12px", color: "var(--dash-muted)", fontWeight: 500 }}>{row.cohort}</td>
                  {[row.m1, row.m2, row.m3, row.m4, row.m5, row.m6].map((v, i) => (
                    <td key={i} style={{ padding: "8px 12px", textAlign: "center" }}>
                      {v != null ? (
                        <span style={{
                          display: "inline-block", padding: "4px 10px", borderRadius: "6px",
                          background: retentionColor(v), color: retentionTextColor(v),
                          fontWeight: 600, fontFamily: "'Geist Mono', monospace", fontSize: "12px",
                        }}>{v}%</span>
                      ) : <span style={{ color: "var(--dash-dim)" }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Guarantee Refunds + Country Breakdown */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="max-md:!grid-cols-1">
        <DashboardCard padding="20px">
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "4px" }}>Guarantee Refunds</p>
          <p style={{ fontSize: "12px", color: "var(--dash-dim)", marginBottom: "16px" }}>$157 total · 0.8% refund rate · 2.3 day avg</p>
          {recentRefunds.map((r, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: i < recentRefunds.length - 1 ? "1px solid var(--dash-border)" : "none" }}>
              <div>
                <p style={{ fontSize: "13px", color: "var(--dash-text)", fontWeight: 500 }}>{r.name}</p>
                <p style={{ fontSize: "11px", color: "var(--dash-dim)" }}>{r.reason}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ fontSize: "13px", color: "var(--dash-danger)", fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>-${r.amount}</p>
                <p style={{ fontSize: "11px", color: "var(--dash-dim)" }}>{r.date}</p>
              </div>
            </div>
          ))}
        </DashboardCard>

        <DashboardCard padding="0">
          <p style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-text)", padding: "20px 20px 12px" }}>Revenue by Country</p>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                {["Country", "Subs", "MRR", "Avg LTV"].map(h => (
                  <th key={h} style={{ padding: "8px 16px", textAlign: "left", color: "var(--dash-dim)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {countryRevenue.map(c => (
                <tr key={c.country} style={{ borderBottom: "1px solid var(--dash-border)" }}>
                  <td style={{ padding: "10px 16px", color: "var(--dash-text)", fontWeight: 500 }}>{c.country}</td>
                  <td style={{ padding: "10px 16px", color: "var(--dash-muted)", fontFamily: "'Geist Mono', monospace" }}>{c.subscribers}</td>
                  <td style={{ padding: "10px 16px", color: "var(--dash-teal)", fontWeight: 600, fontFamily: "'Geist Mono', monospace" }}>${c.mrr.toLocaleString()}</td>
                  <td style={{ padding: "10px 16px", color: "var(--dash-muted)", fontFamily: "'Geist Mono', monospace" }}>${c.avgLtv}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </DashboardCard>
      </div>
    </motion.div>
  );
}
