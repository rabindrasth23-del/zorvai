"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  DashboardCard,
  SectionHeader,
  StatBlock,
} from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   ADMIN — USAGE & COST DASHBOARD
   Route: /admin/costs
   Per-call-type cost tracking, daily/weekly spend trends, spike detection
   ============================================================================= */

interface CostData {
  totalToday: number;
  totalThisWeek: number;
  totalThisMonth: number;
  byCallType: Array<{
    callType: string;
    count: number;
    cost: number;
  }>;
  dailyTrend: Array<{
    date: string;
    cost: number;
  }>;
}

const CALL_TYPE_LABELS: Record<string, string> = {
  teach: "Teach",
  teach_chat: "Teach Chat",
  grounded_teach: "Grounded Teach",
  challenge: "Challenge",
  feedback: "Feedback",
  recall: "Recall",
  chatbot: "Chatbot",
  plan: "Plan Maker",
  checkin: "Check-in",
  mock_exam_generate: "Mock Exam Gen",
  mock_exam_grade: "Mock Exam Grade",
  snap_solve: "Snap & Solve",
  material_ingest: "Material Ingest",
  safety_classifier: "Safety Filter",
};

export default function AdminCostsPage() {
  const [data, setData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(true);
  const shouldReduceMotion = useReducedMotion();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/costs");
      if (res.ok) {
        const result = await res.json();
        setData(result);
      }
    } catch (err) {
      console.error("Failed to fetch cost data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Simple bar chart using CSS
  function renderBar(value: number, max: number, color: string) {
    const pct = max > 0 ? (value / max) * 100 : 0;
    return (
      <div style={{ flex: 1, height: 8, background: "var(--dash-raised)", borderRadius: 4, overflow: "hidden" }}>
        <motion.div
          initial={shouldReduceMotion ? { width: `${pct}%` } : { width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 4 }}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
        <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>Usage & Costs</h1>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {[1, 2, 3].map((i) => (
            <div key={i} style={{ height: 100, background: "var(--dash-surface)", border: "1px solid var(--dash-border)", borderRadius: "var(--dash-radius-card)", animation: "commitPulse 1.5s ease-in-out infinite" }} />
          ))}
        </div>
      </div>
    );
  }

  const costData = data || { totalToday: 0, totalThisWeek: 0, totalThisMonth: 0, byCallType: [], dailyTrend: [] };
  const maxCost = Math.max(...(costData.byCallType.map(c => c.cost) || [1]));
  const spikeDetected = costData.totalToday > (costData.totalThisWeek / 7) * 2;

  return (
    <div className="dash-page-enter" style={{ fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: 22, fontWeight: 500, color: "var(--dash-text)", marginBottom: 24 }}>
        Usage & Costs
      </h1>

      {/* ═══ Spend Summary ═══ */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
        <DashboardCard padding="20px">
          <StatBlock label="Today" value={`$${costData.totalToday.toFixed(2)}`} color={spikeDetected ? "var(--dash-danger)" : undefined} />
          {spikeDetected && (
            <div style={{ fontSize: 11, color: "var(--dash-danger)", marginTop: 6 }}>
              ⚠ Spending 2x above daily average
            </div>
          )}
        </DashboardCard>
        <DashboardCard padding="20px">
          <StatBlock label="This week" value={`$${costData.totalThisWeek.toFixed(2)}`} />
        </DashboardCard>
        <DashboardCard padding="20px">
          <StatBlock label="This month" value={`$${costData.totalThisMonth.toFixed(2)}`} />
        </DashboardCard>
      </div>

      {/* ═══ Cost by Call Type ═══ */}
      <DashboardCard padding="20px">
        <SectionHeader title="Cost by AI call type" />
        <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          {costData.byCallType
            .sort((a, b) => b.cost - a.cost)
            .map((item) => (
              <div key={item.callType} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 130, fontSize: 13, color: "var(--dash-text)", flexShrink: 0 }}>
                  {CALL_TYPE_LABELS[item.callType] || item.callType}
                </div>
                {renderBar(item.cost, maxCost, "var(--dash-teal)")}
                <div style={{ width: 80, textAlign: "right", flexShrink: 0 }}>
                  <span className="text-number" style={{ fontSize: 13, color: "var(--dash-text)" }}>
                    ${item.cost.toFixed(2)}
                  </span>
                </div>
                <div style={{ width: 50, textAlign: "right", flexShrink: 0 }}>
                  <span className="text-number" style={{ fontSize: 12, color: "var(--dash-dim)" }}>
                    {item.count}×
                  </span>
                </div>
              </div>
            ))}
        </div>
      </DashboardCard>

      {/* ═══ Daily Trend (simple text list) ═══ */}
      {costData.dailyTrend.length > 0 && (
        <DashboardCard padding="20px" style={{ marginTop: 14 }}>
          <SectionHeader title="Daily trend (last 7 days)" />
          <div style={{ marginTop: 16, display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
            {costData.dailyTrend.slice(-7).map((day) => {
              const maxDay = Math.max(...costData.dailyTrend.map(d => d.cost), 1);
              const heightPct = (day.cost / maxDay) * 100;
              return (
                <div key={day.date} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                  <span className="text-number" style={{ fontSize: 10, color: "var(--dash-dim)" }}>
                    ${day.cost.toFixed(0)}
                  </span>
                  <motion.div
                    initial={shouldReduceMotion ? { height: `${heightPct}%` } : { height: 0 }}
                    animate={{ height: `${heightPct}%` }}
                    transition={{ duration: 0.5 }}
                    style={{
                      width: "100%",
                      background: "var(--dash-teal)",
                      borderRadius: 4,
                      minHeight: 4,
                    }}
                  />
                  <span style={{ fontSize: 10, color: "var(--dash-dim)" }}>
                    {new Date(day.date).toLocaleDateString(undefined, { weekday: "short" })}
                  </span>
                </div>
              );
            })}
          </div>
        </DashboardCard>
      )}
    </div>
  );
}
