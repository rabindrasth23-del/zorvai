"use client";

import { useState, useEffect, useCallback } from "react";

/* ─────────────────────────────────────────────────────────────────
   Admin — Waitlist Monitor
   Protected by a simple password check (not production-grade auth)
   ───────────────────────────────────────────────────────────────── */

interface WaitlistEntry {
  id: string;
  name: string;
  email: string;
  country_code: string;
  city: string | null;
  role: string;
  child_name: string | null;
  referral_code: string;
  referral_count: number;
  position: number;
  tier: number;
  discount_percent: number;
  paid: boolean;
  created_at: string;
}

export default function WaitlistAdmin() {
  const [authed, setAuthed] = useState(false);
  const [password, setPassword] = useState("");
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [stats, setStats] = useState<{
    total: number; today: number; thisWeek: number;
    byCountry: Record<string, number>;
    byRole: Record<string, number>;
    paid: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/waitlist/admin", {
        headers: { "x-admin-key": password },
      });
      if (!res.ok) { setAuthed(false); return; }
      const data = await res.json();
      setEntries(data.entries || []);
      setStats(data.stats || null);
    } catch {} finally { setLoading(false); }
  }, [password]);

  useEffect(() => {
    if (!authed) return;
    fetchData();
    const id = setInterval(fetchData, 15000);
    return () => clearInterval(id);
  }, [authed, fetchData]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthed(true);
  };

  if (!authed) {
    return (
      <div style={{
        minHeight: "100vh", background: "#0a0a09", display: "flex",
        alignItems: "center", justifyContent: "center",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}>
        <form onSubmit={handleLogin} style={{
          background: "#111110", border: "1px solid #1a1918", borderRadius: 20,
          padding: 32, width: 320,
        }}>
          <h2 style={{ color: "#f0ede8", fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
            Waitlist Admin
          </h2>
          <input
            type="password" placeholder="Admin password"
            value={password} onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%", background: "#141312", border: "1px solid #1f1e1c",
              borderRadius: 10, padding: "12px 14px", color: "#f0ede8",
              fontSize: 14, fontFamily: "inherit", outline: "none", marginBottom: 12,
            }}
          />
          <button type="submit" style={{
            width: "100%", padding: 12, borderRadius: 10, border: "none",
            background: "#4ecdc4", color: "#0a0a09", fontWeight: 600, fontSize: 14,
            cursor: "pointer", fontFamily: "inherit",
          }}>Enter</button>
        </form>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a09", padding: "32px clamp(16px,4vw,40px)",
      fontFamily: "'Inter', system-ui, sans-serif", color: "#f0ede8",
    }}>
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>
            Waitlist Monitor
            {loading && <span style={{ fontSize: 12, color: "#4a4844", marginLeft: 8, fontWeight: 400 }}>refreshing...</span>}
          </h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80" }} />
            <span style={{ fontSize: 12, color: "#4a4844" }}>Live · auto-refresh 15s</span>
          </div>
        </div>

        {/* Stats cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12, marginBottom: 32 }}>
            {[
              { label: "Total signups", value: stats.total, color: "#f0ede8" },
              { label: "Today", value: stats.today, color: "#4ecdc4" },
              { label: "This week", value: stats.thisWeek, color: "#fbbf24" },
              { label: "Paid", value: stats.paid, color: "#4ade80" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{
                background: "#111110", border: "1px solid #1a1918", borderRadius: 16,
                padding: "20px 20px 16px",
              }}>
                <p style={{ fontSize: 11, color: "#4a4844", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</p>
                <p style={{ fontSize: 36, fontWeight: 800, color, marginTop: 4, fontVariantNumeric: "tabular-nums" }}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Country & Role breakdown */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
            <div style={{ background: "#111110", border: "1px solid #1a1918", borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, color: "#4a4844", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>By Country</p>
              {Object.entries(stats.byCountry).sort(([,a],[,b]) => b - a).map(([code, count]) => (
                <div key={code} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #141312" }}>
                  <span style={{ fontSize: 13, color: "#7a7672" }}>{code}</span>
                  <span style={{ fontSize: 13, color: "#f0ede8", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.byCountry).length === 0 && <p style={{ color: "#3a3835", fontSize: 13 }}>No data yet</p>}
            </div>
            <div style={{ background: "#111110", border: "1px solid #1a1918", borderRadius: 16, padding: 20 }}>
              <p style={{ fontSize: 12, color: "#4a4844", fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 12 }}>By Role</p>
              {Object.entries(stats.byRole).sort(([,a],[,b]) => b - a).map(([role, count]) => (
                <div key={role} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #141312" }}>
                  <span style={{ fontSize: 13, color: "#7a7672" }}>{role}</span>
                  <span style={{ fontSize: 13, color: "#f0ede8", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{count}</span>
                </div>
              ))}
              {Object.keys(stats.byRole).length === 0 && <p style={{ color: "#3a3835", fontSize: 13 }}>No data yet</p>}
            </div>
          </div>
        )}

        {/* Table */}
        <div style={{
          background: "#111110", border: "1px solid #1a1918", borderRadius: 16,
          overflow: "hidden",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #1a1918" }}>
            <h2 style={{ fontSize: 14, fontWeight: 600 }}>All Signups ({entries.length})</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #1a1918" }}>
                  {["#", "Name", "Email", "Country", "Role", "Tier", "Discount", "Referrals", "Paid", "Joined"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "#4a4844", fontWeight: 600, fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} style={{ borderBottom: "1px solid #141312" }}>
                    <td style={{ padding: "10px 12px", color: "#4a4844", fontVariantNumeric: "tabular-nums" }}>{e.position}</td>
                    <td style={{ padding: "10px 12px", fontWeight: 500 }}>{e.name}</td>
                    <td style={{ padding: "10px 12px", color: "#7a7672" }}>{e.email}</td>
                    <td style={{ padding: "10px 12px" }}>{e.country_code}</td>
                    <td style={{ padding: "10px 12px" }}>
                      <span style={{
                        padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600,
                        background: e.role === "parent" ? "rgba(78,205,196,0.1)" : "rgba(251,191,36,0.1)",
                        color: e.role === "parent" ? "#4ecdc4" : "#fbbf24",
                      }}>{e.role}</span>
                    </td>
                    <td style={{ padding: "10px 12px", color: "#4ecdc4", fontWeight: 600 }}>T{e.tier}</td>
                    <td style={{ padding: "10px 12px", color: e.discount_percent > 0 ? "#4ade80" : "#4a4844" }}>{e.discount_percent}%</td>
                    <td style={{ padding: "10px 12px", fontVariantNumeric: "tabular-nums" }}>{e.referral_count}</td>
                    <td style={{ padding: "10px 12px" }}>
                      {e.paid ? <span style={{ color: "#4ade80" }}>✓</span> : <span style={{ color: "#3a3835" }}>—</span>}
                    </td>
                    <td style={{ padding: "10px 12px", color: "#4a4844", whiteSpace: "nowrap", fontSize: 12 }}>
                      {new Date(e.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </td>
                  </tr>
                ))}
                {entries.length === 0 && (
                  <tr><td colSpan={10} style={{ padding: 32, textAlign: "center", color: "#3a3835" }}>No signups yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
