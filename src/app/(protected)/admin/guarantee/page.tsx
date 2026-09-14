"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
  Badge,
  StatBlock,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN — GUARANTEE QUEUE
   Route: /admin/guarantee
   Most business-critical admin screen
   Lists students approaching/past their guarantee checkpoint
   ============================================================================= */

interface GuaranteeItem {
  id: string;
  student_id: string;
  student_name: string;
  subject: string;
  baseline_score: number;
  target_score: number;
  followup_score: number | null;
  session_count: number;
  status: "on_track" | "at_risk" | "eligible_refund" | "met" | "refunded";
  started_at: string;
  followup_due_at: string | null;
}

const STATUS_MAP: Record<string, { label: string; color: string }> = {
  on_track: { label: "On Track", color: "var(--dash-success)" },
  at_risk: { label: "At Risk", color: "var(--dash-amber)" },
  eligible_refund: { label: "Eligible for Refund", color: "var(--dash-danger)" },
  met: { label: "Guarantee Met", color: "var(--dash-success)" },
  refunded: { label: "Refunded", color: "var(--dash-dim)" },
};

export default function AdminGuaranteePage() {
  const [items, setItems] = useState<GuaranteeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalActive: 0, atRisk: 0, refundsThisMonth: 0, revenueThisMonth: 0 });
  const [filter, setFilter] = useState<string>("all");
  const shouldReduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/guarantee");
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setStats(data.stats || stats);
      }
    } catch (err) {
      console.error("Failed to fetch guarantee data:", err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredItems = filter === "all"
    ? items
    : items.filter((i) => i.status === filter);

  return (
    <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>
        Guarantee Queue
      </h1>

      {/* ═══ Stats Row ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
        <DashboardCard padding="16px">
          <StatBlock label="Active guarantees" value={stats.totalActive} />
        </DashboardCard>
        <DashboardCard padding="16px">
          <StatBlock label="At risk" value={stats.atRisk} color="var(--dash-amber)" />
        </DashboardCard>
        <DashboardCard padding="16px">
          <StatBlock label="Refunds this month" value={stats.refundsThisMonth} color="var(--dash-danger)" />
        </DashboardCard>
        <DashboardCard padding="16px">
          <StatBlock label="Revenue this month" value={`$${stats.revenueThisMonth}`} color="var(--dash-success)" />
        </DashboardCard>
      </div>

      {/* ═══ Filters ═══ */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
        {["all", "at_risk", "eligible_refund", "on_track", "met", "refunded"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "6px 14px",
              background: filter === f ? "var(--dash-teal-bg)" : "transparent",
              border: `1px solid ${filter === f ? "var(--dash-teal-border)" : "var(--dash-border)"}`,
              borderRadius: "var(--dash-radius-pill)",
              fontSize: 12,
              color: filter === f ? "var(--dash-teal)" : "var(--dash-muted)",
              cursor: "pointer",
              textTransform: "capitalize",
            }}
          >
            {f.replace(/_/g, " ")}
          </button>
        ))}
      </div>

      {/* ═══ Table ═══ */}
      <DashboardCard padding="0">
        {loading ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--dash-muted)" }}>Loading…</div>
        ) : filteredItems.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--dash-muted)" }}>No items in this view</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--dash-border)" }}>
                  {["Student", "Subject", "Baseline", "Target", "Follow-up", "Sessions", "Status", "Action"].map((h) => (
                    <th key={h} style={{ padding: "12px 14px", fontSize: 11, fontWeight: 500, color: "var(--dash-dim)", textTransform: "uppercase", letterSpacing: "0.04em", textAlign: "left" }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredItems.map((item, i) => {
                  const statusConfig = STATUS_MAP[item.status] || STATUS_MAP.on_track;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={shouldReduceMotion ? false : { opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      style={{ borderBottom: "1px solid var(--dash-border)" }}
                    >
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--dash-text)" }}>{item.student_name}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13, color: "var(--dash-muted)" }}>{item.subject}</td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="text-number" style={{ fontSize: 13, color: "var(--dash-text)" }}>{item.baseline_score}%</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="text-number" style={{ fontSize: 13, color: "var(--dash-text)" }}>{item.target_score}%</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="text-number" style={{ fontSize: 13, color: item.followup_score !== null ? "var(--dash-text)" : "var(--dash-dim)" }}>
                          {item.followup_score !== null ? `${item.followup_score}%` : "—"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <span className="text-number" style={{ fontSize: 13, color: "var(--dash-text)" }}>{item.session_count}</span>
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        <Badge label={statusConfig.label} color={statusConfig.color} />
                      </td>
                      <td style={{ padding: "12px 14px" }}>
                        {item.status === "eligible_refund" && (
                          <button
                            style={{
                              padding: "6px 14px",
                              background: "rgba(248, 113, 113, 0.1)",
                              border: "1px solid rgba(248, 113, 113, 0.3)",
                              borderRadius: 6,
                              fontSize: 12,
                              color: "var(--dash-danger)",
                              cursor: "pointer",
                            }}
                          >
                            Approve refund
                          </button>
                        )}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </DashboardCard>

      <p style={{ fontSize: 11, color: "var(--dash-dim)", marginTop: 12, fontStyle: "italic" }}>
        ⚠ Refund approval logs the admin decision and hands off to the payment gateway. It never auto-fires.
      </p>
    </div>
  );
}
