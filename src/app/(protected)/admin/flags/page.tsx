"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { DashboardCard } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN SAFETY FLAGS PAGE
   Route: /admin/flags
   Safety flags review with privacy notice, unreviewed/reviewed sections
   ============================================================================= */

interface Flag {
  id: string;
  studentId: string;
  type: "Escalation" | "Inappropriate content" | "Curriculum concern";
  triggeredAt: string;
  context: string;
  reviewed: boolean;
  reviewedBy?: string;
  reviewedAt?: string;
  action?: string;
}

const mockFlags: Flag[] = [
  { id: "f1", studentId: "Student #1847", type: "Escalation", triggeredAt: "2026-09-07 14:23", context: "Check-in response indicated emotional distress. Escalation threshold met.", reviewed: false },
  { id: "f2", studentId: "Student #2193", type: "Inappropriate content", triggeredAt: "2026-09-07 11:05", context: "Session input contained language flagged by content safety filter.", reviewed: false },
  { id: "f3", studentId: "Student #0892", type: "Curriculum concern", triggeredAt: "2026-09-06 16:42", context: "Student reported content inaccuracy in Chemistry — Periodic Table topic.", reviewed: false },
  { id: "f4", studentId: "Student #1204", type: "Escalation", triggeredAt: "2026-09-05 09:15", context: "Multiple consecutive low check-in scores triggered parent notification threshold.", reviewed: true, reviewedBy: "Admin", reviewedAt: "2026-09-05 10:30", action: "Parent contacted" },
  { id: "f5", studentId: "Student #0567", type: "Inappropriate content", triggeredAt: "2026-09-04 13:20", context: "Image upload in chat flagged by content moderation.", reviewed: true, reviewedBy: "Admin", reviewedAt: "2026-09-04 14:00", action: "No action — false positive" },
  { id: "f6", studentId: "Student #1678", type: "Curriculum concern", triggeredAt: "2026-09-03 15:45", context: "AI response contained potentially misleading information about historical event.", reviewed: true, reviewedBy: "Admin", reviewedAt: "2026-09-03 17:00", action: "Content updated" },
];

export default function AdminFlagsPage() {
  const shouldReduceMotion = useReducedMotion();
  const [flags, setFlags] = useState(mockFlags);
  const [showReviewed, setShowReviewed] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ flagId: string; action: string } | null>(null);

  const unreviewed = flags.filter(f => !f.reviewed);
  const reviewed = flags.filter(f => f.reviewed);

  const handleReview = (flagId: string, action: string) => {
    setFlags(prev => prev.map(f =>
      f.id === flagId ? { ...f, reviewed: true, reviewedBy: "Admin", reviewedAt: new Date().toISOString().slice(0, 16).replace("T", " "), action } : f
    ));
    setConfirmAction(null);
  };

  const typeColor = (type: string) => {
    switch (type) {
      case "Escalation": return { bg: "rgba(248,113,113,0.08)", color: "var(--dash-danger)", border: "rgba(248,113,113,0.2)" };
      case "Inappropriate content": return { bg: "rgba(251,191,36,0.08)", color: "var(--dash-amber)", border: "rgba(251,191,36,0.2)" };
      case "Curriculum concern": return { bg: "var(--dash-teal-bg)", color: "var(--dash-teal)", border: "var(--dash-teal-border)" };
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
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "var(--dash-text)", fontFamily: "system-ui", marginBottom: "16px" }}>Safety Flags</h1>

      {/* Privacy notice */}
      <DashboardCard padding="14px 18px" style={{ marginBottom: "24px", borderLeft: "3px solid var(--dash-teal)" }}>
        <p style={{ fontSize: "13px", color: "var(--dash-muted)", lineHeight: 1.6 }}>
          🔒 Student check-in content is never shown here — only the escalation flag. Exact words are not stored per the privacy policy.
        </p>
      </DashboardCard>

      {/* Unreviewed flags */}
      {unreviewed.length > 0 && (
        <div style={{ marginBottom: "32px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
            <h2 style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)" }}>Unreviewed</h2>
            <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 700, background: "rgba(248,113,113,0.12)", color: "var(--dash-danger)", border: "1px solid rgba(248,113,113,0.25)" }}>
              {unreviewed.length}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {unreviewed.map(flag => {
              const tc = typeColor(flag.type);
              return (
                <DashboardCard key={flag.id} padding="18px" style={{ borderTop: "3px solid var(--dash-danger)", background: "rgba(248,113,113,0.04)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                    <div>
                      <p style={{ fontSize: "15px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "4px" }}>{flag.studentId}</p>
                      <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "11px", fontWeight: 600, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {flag.type}
                      </span>
                    </div>
                    <span style={{ fontSize: "12px", color: "var(--dash-dim)" }}>{flag.triggeredAt}</span>
                  </div>

                  <p style={{ fontSize: "13px", color: "var(--dash-muted)", lineHeight: 1.5, marginBottom: "16px", padding: "10px 14px", background: "var(--dash-bg)", borderRadius: "var(--dash-radius-inner)", border: "1px solid var(--dash-border)" }}>
                    {flag.context}
                  </p>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    <button onClick={() => handleReview(flag.id, "No action — reviewed")} style={{ padding: "7px 14px", fontSize: "12px", fontWeight: 500, color: "var(--dash-success)", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>
                      Mark reviewed — no action
                    </button>
                    <button onClick={() => handleReview(flag.id, "Parent contacted")} style={{ padding: "7px 14px", fontSize: "12px", fontWeight: 500, color: "var(--dash-teal)", background: "var(--dash-teal-bg)", border: "1px solid var(--dash-teal-border)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>
                      Contact parent
                    </button>
                    <button onClick={() => setConfirmAction({ flagId: flag.id, action: "suspend" })} style={{ padding: "7px 14px", fontSize: "12px", fontWeight: 500, color: "var(--dash-amber)", background: "rgba(251,191,36,0.06)", border: "1px solid rgba(251,191,36,0.15)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>
                      Suspend account
                    </button>
                    <button onClick={() => handleReview(flag.id, "Escalated to team")} style={{ padding: "7px 14px", fontSize: "12px", fontWeight: 500, color: "var(--dash-danger)", background: "rgba(248,113,113,0.06)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer", fontFamily: "system-ui" }}>
                      Escalate to team
                    </button>
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        </div>
      )}

      {unreviewed.length === 0 && (
        <DashboardCard padding="40px" style={{ marginBottom: "32px", textAlign: "center" }}>
          <p style={{ fontSize: "32px", marginBottom: "8px" }}>✅</p>
          <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "4px" }}>All clear</p>
          <p style={{ fontSize: "13px", color: "var(--dash-dim)" }}>No unreviewed safety flags.</p>
        </DashboardCard>
      )}

      {/* Reviewed flags (collapsed) */}
      <div>
        <button
          onClick={() => setShowReviewed(!showReviewed)}
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", fontWeight: 600, color: "var(--dash-muted)", background: "none", border: "none", cursor: "pointer", marginBottom: "12px", fontFamily: "system-ui" }}
        >
          <span style={{ transform: showReviewed ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 200ms", display: "inline-block" }}>▸</span>
          Reviewed ({reviewed.length})
        </button>

        {showReviewed && (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {reviewed.map(flag => {
              const tc = typeColor(flag.type);
              return (
                <DashboardCard key={flag.id} padding="14px 18px">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <p style={{ fontSize: "14px", fontWeight: 500, color: "var(--dash-text)" }}>{flag.studentId}</p>
                      <span style={{ padding: "2px 8px", borderRadius: "99px", fontSize: "10px", fontWeight: 600, background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` }}>
                        {flag.type}
                      </span>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p style={{ fontSize: "12px", color: "var(--dash-success)" }}>{flag.action}</p>
                      <p style={{ fontSize: "11px", color: "var(--dash-dim)" }}>by {flag.reviewedBy} · {flag.reviewedAt}</p>
                    </div>
                  </div>
                </DashboardCard>
              );
            })}
          </div>
        )}
      </div>

      {/* Suspend confirmation modal */}
      {confirmAction && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)" }} onClick={() => setConfirmAction(null)} />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ position: "relative", zIndex: 51, width: "380px", background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-card)", padding: "28px", textAlign: "center" }}
          >
            <p style={{ fontSize: "16px", fontWeight: 600, color: "var(--dash-text)", marginBottom: "8px" }}>Confirm Suspension</p>
            <p style={{ fontSize: "13px", color: "var(--dash-muted)", marginBottom: "20px" }}>Are you sure you want to suspend this account? The student will be unable to access their sessions.</p>
            <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
              <button onClick={() => setConfirmAction(null)} style={{ padding: "8px 20px", fontSize: "13px", color: "var(--dash-muted)", background: "var(--dash-bg)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-inner)", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => handleReview(confirmAction.flagId, "Account suspended")} style={{ padding: "8px 20px", fontSize: "13px", fontWeight: 600, color: "#fff", background: "var(--dash-danger)", border: "none", borderRadius: "var(--dash-radius-inner)", cursor: "pointer" }}>Suspend</button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
