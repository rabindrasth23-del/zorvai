"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PARENT — SESSION HISTORY
   Route: /parent/history
   List of past sessions with date, subject, topic, Feedback summary
   Permanent privacy note about check-in data
   ============================================================================= */

interface SessionRecord {
  id: string;
  subject: string;
  topic_title: string;
  phase: string;
  mastery_result: string | null;
  feedback_summary: string | null;
  duration_minutes: number;
  completed_at: string;
}

export default function ParentHistoryPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/parent/sessions");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to fetch sessions:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return (
    <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 8 }}>
        Session History
      </h1>
      <p style={{ fontSize: 13, color: "var(--dash-muted)", marginBottom: 20 }}>
        A record of your child&apos;s completed study sessions with feedback summaries.
      </p>

      {/* ═══ Privacy Note — always visible ═══ */}
      <div style={{
        padding: "12px 16px",
        background: "rgba(91, 168, 184, 0.08)",
        border: "1px solid rgba(91, 168, 184, 0.2)",
        borderRadius: 10,
        marginBottom: 24,
        fontSize: 13,
        color: "var(--dash-muted)",
        lineHeight: 1.5,
      }}>
        🔒 <strong>Privacy note:</strong> Check-in responses are private between your child and Zorvai.
        You&apos;ll only see a wellness indicator here, never the specific words your child shared.
        If our system detects a concern, you&apos;ll receive a notification separately.
      </div>

      {loading ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ height: 80, background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-card)", animation: "commitPulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <DashboardCard padding="40px">
          <div style={{ textAlign: "center", color: "var(--dash-muted)" }}>
            No sessions completed yet. Sessions will appear here after your child finishes their first study session.
          </div>
        </DashboardCard>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sessions.map((session, i) => (
            <motion.div
              key={session.id}
              initial={shouldReduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <DashboardCard padding="16px 18px">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: "var(--dash-text)" }}>
                        {session.topic_title}
                      </span>
                      <span style={{
                        fontSize: 11,
                        padding: "2px 8px",
                        borderRadius: "var(--dash-radius-pill)",
                        background: session.mastery_result === "mastered"
                          ? "rgba(74, 222, 128, 0.1)"
                          : "rgba(251, 191, 36, 0.1)",
                        color: session.mastery_result === "mastered"
                          ? "var(--dash-success)"
                          : "var(--dash-amber)",
                      }}>
                        {session.mastery_result === "mastered" ? "Mastered" : "Reviewing"}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--dash-dim)" }}>
                      {session.subject} · {session.duration_minutes} min · {new Date(session.completed_at).toLocaleDateString()}
                    </div>
                    {session.feedback_summary && (
                      <div style={{ fontSize: 13, color: "var(--dash-muted)", marginTop: 6, lineHeight: 1.4 }}>
                        {session.feedback_summary}
                      </div>
                    )}
                  </div>
                </div>
              </DashboardCard>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
