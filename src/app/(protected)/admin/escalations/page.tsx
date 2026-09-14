"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
  Badge,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN — ESCALATION REVIEW QUEUE
   Route: /admin/escalations
   Check-in escalations: triggering text, student name, parent notification status
   ============================================================================= */

interface Escalation {
  id: string;
  student_id: string;
  student_name: string;
  tier: number;
  trigger_text: string;
  parent_notified: boolean;
  parent_notification_sent_at: string | null;
  resolution: string | null;
  resolved_by: string | null;
  created_at: string;
  status: "pending" | "reviewing" | "resolved";
}

export default function AdminEscalationsPage() {
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);
  const [resolutionText, setResolutionText] = useState("");
  const shouldReduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/escalations");
      if (res.ok) {
        const data = await res.json();
        setEscalations(data.escalations || []);
      }
    } catch (err) {
      console.error("Failed to fetch escalations:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  async function handleResolve(id: string) {
    if (!resolutionText.trim()) return;
    try {
      await fetch(`/api/admin/escalations/${id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resolution: resolutionText.trim() }),
      });
      setResolvingId(null);
      setResolutionText("");
      fetchData();
    } catch (err) {
      console.error("Resolve failed:", err);
    }
  }

  const pending = escalations.filter((e) => e.status !== "resolved");
  const resolved = escalations.filter((e) => e.status === "resolved");

  return (
    <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
        Escalation Review
      </h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 24 }}>
        Check-in responses that triggered escalation protocols. All interactions are logged for audit.
      </p>

      {loading ? (
        <div style={{ padding: 40, textAlign: "center", color: "var(--dash-muted)" }}>Loading…</div>
      ) : (
        <>
          {/* ═══ Pending Escalations ═══ */}
          <SectionHeader title={`Pending (${pending.length})`} />
          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 12, marginBottom: 32 }}>
            {pending.length === 0 && (
              <DashboardCard padding="32px">
                <div style={{ textAlign: "center", color: "var(--dash-muted)", fontSize: 14 }}>
                  No pending escalations — all clear ✓
                </div>
              </DashboardCard>
            )}
            {pending.map((esc, i) => (
              <motion.div
                key={esc.id}
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <DashboardCard padding="20px">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: "var(--dash-text)" }}>
                        {esc.student_name}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--dash-dim)", marginTop: 2 }}>
                        {new Date(esc.created_at).toLocaleDateString()} · Tier {esc.tier}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Badge
                        label={esc.tier >= 3 ? "Critical" : esc.tier >= 2 ? "Elevated" : "Low"}
                        color={esc.tier >= 3 ? "var(--dash-danger)" : esc.tier >= 2 ? "var(--dash-amber)" : "var(--dash-blue)"}
                      />
                      <Badge
                        label={esc.parent_notified ? "Parent notified" : "Pending notify"}
                        color={esc.parent_notified ? "var(--dash-success)" : "var(--dash-amber)"}
                      />
                    </div>
                  </div>

                  {/* Triggering text */}
                  <div style={{
                    padding: "12px 14px",
                    background: "var(--dash-raised)",
                    borderRadius: 8,
                    fontSize: 13,
                    color: "var(--dash-text)",
                    lineHeight: 1.5,
                    fontStyle: "italic",
                    marginBottom: 12,
                    borderLeft: `3px solid ${esc.tier >= 3 ? "var(--dash-danger)" : "var(--dash-amber)"}`,
                  }}>
                    &ldquo;{esc.trigger_text}&rdquo;
                  </div>

                  {/* Resolution form */}
                  {resolvingId === esc.id ? (
                    <div style={{ display: "flex", gap: 8 }}>
                      <input
                        type="text"
                        value={resolutionText}
                        onChange={(e) => setResolutionText(e.target.value)}
                        placeholder="Resolution notes…"
                        style={{
                          flex: 1,
                          padding: "8px 12px",
                          background: "var(--dash-bg)",
                          border: "1px solid var(--dash-border)",
                          borderRadius: 8,
                          fontSize: 13,
                          color: "var(--dash-text)",
                          outline: "none",
                        }}
                      />
                      <button
                        onClick={() => handleResolve(esc.id)}
                        style={{
                          padding: "8px 16px",
                          background: "var(--dash-success)",
                          color: "#0f1b1e",
                          border: "none",
                          borderRadius: 8,
                          fontSize: 13,
                          fontWeight: 600,
                          cursor: "pointer",
                        }}
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => { setResolvingId(null); setResolutionText(""); }}
                        style={{
                          padding: "8px 12px",
                          background: "transparent",
                          border: "1px solid var(--dash-border)",
                          borderRadius: 8,
                          fontSize: 13,
                          color: "var(--dash-muted)",
                          cursor: "pointer",
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setResolvingId(esc.id)}
                      style={{
                        padding: "8px 16px",
                        background: "transparent",
                        border: "1px solid var(--dash-border)",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "var(--dash-muted)",
                        cursor: "pointer",
                      }}
                    >
                      Add resolution
                    </button>
                  )}
                </DashboardCard>
              </motion.div>
            ))}
          </div>

          {/* ═══ Resolved (collapsed) ═══ */}
          {resolved.length > 0 && (
            <>
              <SectionHeader title={`Resolved (${resolved.length})`} />
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12, opacity: 0.7 }}>
                {resolved.slice(0, 10).map((esc) => (
                  <DashboardCard key={esc.id} padding="14px 16px">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontSize: 13, color: "var(--dash-muted)" }}>
                        {esc.student_name} · Tier {esc.tier} · {new Date(esc.created_at).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: 12, color: "var(--dash-success)" }}>
                        Resolved: {esc.resolution}
                      </div>
                    </div>
                  </DashboardCard>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
