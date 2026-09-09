"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DashboardCard, StatCard, CountUp } from "@/components/dashboard/dashboard-primitives";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

/* =============================================================================
   ADMIN WAITLIST PAGE
   Route: /admin/waitlist
   Waitlist management: summary, table, leaderboard, commitment viewer
   ============================================================================= */

const mockWaitlist = [
  { pos: 1, name: "Rabindra Shrestha", email: "rabindra@example.com", country: "Nepal", commitment: true, plan: "Annual", referrals: 12, joined: "2026-06-01" },
  { pos: 2, name: "Aarav Sharma", email: "aarav@example.com", country: "India", commitment: true, plan: "Monthly", referrals: 8, joined: "2026-07-15" },
  { pos: 3, name: "Prince Thapa", email: "prince@example.com", country: "Nepal", commitment: true, plan: "Annual", referrals: 7, joined: "2026-07-20" },
  { pos: 4, name: "Sophie Chen", email: "sophie@example.com", country: "Canada", commitment: true, plan: "Monthly", referrals: 5, joined: "2026-08-01" },
  { pos: 5, name: "Aditya Kumar", email: "aditya@example.com", country: "India", commitment: true, plan: "Annual", referrals: 4, joined: "2026-08-05" },
  { pos: 6, name: "Emily Park", email: "emily@example.com", country: "South Korea", commitment: false, plan: "Not chosen", referrals: 3, joined: "2026-08-10" },
  { pos: 7, name: "James Wilson", email: "james@example.com", country: "USA", commitment: false, plan: "Not chosen", referrals: 1, joined: "2026-08-15" },
  { pos: 8, name: "Fatima Al-Hassan", email: "fatima@example.com", country: "UAE", commitment: true, plan: "Monthly", referrals: 2, joined: "2026-08-18" },
  { pos: 9, name: "Maria Garcia", email: "maria@example.com", country: "Spain", commitment: false, plan: "Not chosen", referrals: 0, joined: "2026-08-22" },
  { pos: 10, name: "Priya Patel", email: "priya@example.com", country: "India", commitment: true, plan: "Annual", referrals: 6, joined: "2026-08-25" },
];

const planPie = [
  { name: "Annual", value: 45, color: "var(--dash-teal)" },
  { name: "Monthly", value: 35, color: "var(--dash-purple)" },
  { name: "Not chosen", value: 20, color: "var(--dash-dim)" },
];

export default function AdminWaitlistPage() {
  const shouldReduceMotion = useReducedMotion();
  const [selectedEntry, setSelectedEntry] = useState<typeof mockWaitlist[0] | null>(null);

  const totalSignups = mockWaitlist.length;
  const commitmentRate = Math.round((mockWaitlist.filter(w => w.commitment).length / totalSignups) * 100);
  const paidCount = mockWaitlist.filter(w => w.plan !== "Not chosen").length;

  const leaderboard = [...mockWaitlist].sort((a, b) => b.referrals - a.referrals).slice(0, 10);

  return (
    <motion.div
      className="dash-page-enter"
      initial={shouldReduceMotion ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui", marginBottom: "24px" }}>Waitlist</h1>

      {/* Summary row */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <StatCard label="Total signups" value={totalSignups} accentColor="var(--dash-teal)" />
        <StatCard label="Commitment rate" value={commitmentRate} subtext="%" accentColor="var(--dash-success)" />
        <StatCard label="Paid count" value={paidCount} accentColor="var(--dash-purple)" />
        <DashboardCard padding="14px 16px">
          <p style={{ fontSize: "11px", color: "var(--dash-dim)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Plan distribution</p>
          <div style={{ height: "80px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={planPie} dataKey="value" cx="50%" cy="50%" innerRadius={20} outerRadius={35} strokeWidth={0}>
                  {planPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "4px" }}>
            {planPie.map(p => (
              <span key={p.name} style={{ fontSize: "10px", color: "var(--dash-muted)", display: "flex", alignItems: "center", gap: "4px" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: p.color, display: "inline-block" }} />
                {p.name}
              </span>
            ))}
          </div>
        </DashboardCard>
      </div>

      {/* Table */}
      <DashboardCard padding="0" style={{ marginBottom: "24px" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", fontFamily: "system-ui" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                {["#", "Name", "Email", "Country", "Commitment", "Plan", "Referrals", "Joined"].map(h => (
                  <th key={h} style={{ padding: "12px 16px", textAlign: "left", color: "var(--dash-dim)", fontWeight: 500, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mockWaitlist.map(entry => (
                <tr key={entry.pos} style={{ borderBottom: "1px solid var(--dash-border)", cursor: "pointer" }}
                  onClick={() => setSelectedEntry(entry)}
                  onMouseEnter={e => (e.currentTarget.style.background = "var(--dash-surface)")}
                  onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "12px 16px", color: "var(--dash-dim)", fontFamily: "'Geist Mono', monospace" }}>{entry.pos}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-text)", fontWeight: 500 }}>{entry.name}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{entry.email}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-muted)" }}>{entry.country}</td>
                  <td style={{ padding: "12px 16px" }}>
                    {entry.commitment
                      ? <span style={{ color: "var(--dash-success)" }}>✓</span>
                      : <span style={{ color: "var(--dash-dim)" }}>—</span>}
                  </td>
                  <td style={{ padding: "12px 16px", color: entry.plan !== "Not chosen" ? "var(--dash-teal)" : "var(--dash-dim)" }}>{entry.plan}</td>
                  <td style={{ padding: "12px 16px", color: entry.referrals >= 5 ? "var(--dash-teal)" : "var(--dash-muted)", fontFamily: "'Geist Mono', monospace", fontWeight: entry.referrals >= 5 ? 600 : 400 }}>{entry.referrals}</td>
                  <td style={{ padding: "12px 16px", color: "var(--dash-dim)" }}>{entry.joined}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashboardCard>

      {/* Leaderboard */}
      <h2 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "12px" }}>Top Referrers</h2>
      <DashboardCard padding="0">
        {leaderboard.map((entry, i) => (
          <div key={entry.pos} style={{ display: "flex", alignItems: "center", gap: "14px", padding: "12px 16px", borderBottom: i < leaderboard.length - 1 ? "1px solid var(--dash-border)" : "none" }}>
            <span style={{
              width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "12px", fontWeight: 700, fontFamily: "'Geist Mono', monospace",
              background: i === 0 ? "rgba(251,191,36,0.12)" : i === 1 ? "rgba(192,192,192,0.12)" : i === 2 ? "rgba(205,127,50,0.12)" : "var(--dash-bg)",
              color: i === 0 ? "#fbbf24" : i === 1 ? "#c0c0c0" : i === 2 ? "#cd7f32" : "var(--dash-dim)",
              border: `1px solid ${i === 0 ? "rgba(251,191,36,0.3)" : i === 1 ? "rgba(192,192,192,0.3)" : i === 2 ? "rgba(205,127,50,0.3)" : "var(--dash-border)"}`,
            }}>
              {i + 1}
            </span>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{entry.name}</p>
              <p style={{ fontSize: "12px", color: "var(--dash-dim)" }}>{entry.country}</p>
            </div>
            <span style={{ fontSize: "14px", fontWeight: 600, color: "var(--dash-teal)", fontFamily: "'Geist Mono', monospace" }}>{entry.referrals} referrals</span>
          </div>
        ))}
      </DashboardCard>

      {/* Commitment viewer modal */}
      {selectedEntry && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setSelectedEntry(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ position: "relative", zIndex: 51, width: "440px", maxWidth: "90vw", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-card)", padding: "28px" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 600, color: "var(--dash-text)" }}>Commitment Letter</h3>
              <button onClick={() => setSelectedEntry(null)} style={{ color: "var(--dash-dim)", background: "none", border: "none", cursor: "pointer", fontSize: "18px" }}>✕</button>
            </div>
            <div style={{ padding: "16px", background: "var(--dash-bg)", borderRadius: "var(--dash-radius-inner)", border: "1px solid var(--dash-border)", marginBottom: "16px" }}>
              <p style={{ fontSize: "14px", color: "var(--dash-text)", lineHeight: 1.6, fontStyle: "italic" }}>
                {selectedEntry.commitment
                  ? `"I, ${selectedEntry.name}, commit to helping my child master their studies. I believe in the power of consistent learning and will support their educational journey."`
                  : "No commitment letter submitted yet."}
              </p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
              <div style={{ padding: "10px", background: "var(--dash-bg)", borderRadius: "var(--dash-radius-inner)", border: "1px solid var(--dash-border)" }}>
                <p style={{ fontSize: "10px", color: "var(--dash-dim)", textTransform: "uppercase" }}>Plan</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{selectedEntry.plan}</p>
              </div>
              <div style={{ padding: "10px", background: "var(--dash-bg)", borderRadius: "var(--dash-radius-inner)", border: "1px solid var(--dash-border)" }}>
                <p style={{ fontSize: "10px", color: "var(--dash-dim)", textTransform: "uppercase" }}>Referrals</p>
                <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-teal)" }}>{selectedEntry.referrals}</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
