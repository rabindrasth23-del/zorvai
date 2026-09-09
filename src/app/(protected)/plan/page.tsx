"use client";

import { DashboardCard, SectionHeader } from "@/components/dashboard/dashboard-primitives";

/* =============================================================================
   PLAN PAGE — 7-Day Study Plan
   Route: /plan
   Visual calendar-style view of the week's study plan with topic details.
   ============================================================================= */

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const planData = [
  { day: "Monday", topic: "Cell Division — Mitosis", subject: "Biology", duration: "45 min", status: "completed" },
  { day: "Tuesday", topic: "Quadratic Equations", subject: "Mathematics", duration: "40 min", status: "completed" },
  { day: "Wednesday", topic: "Essay Techniques", subject: "English", duration: "45 min", status: "today" },
  { day: "Thursday", topic: "Chemical Reactions", subject: "Science", duration: "42 min", status: "upcoming" },
  { day: "Friday", topic: "Algebra Review", subject: "Mathematics", duration: "38 min", status: "upcoming" },
  { day: "Saturday", topic: null, subject: null, duration: null, status: "rest" },
  { day: "Sunday", topic: "Cell Division — Meiosis", subject: "Biology", duration: "45 min", status: "upcoming" },
];

const statusConfig: Record<string, { borderColor: string; bgColor: string; textColor: string; label: string }> = {
  completed: {
    borderColor: "var(--dash-success)",
    bgColor: "rgba(74, 222, 128, 0.06)",
    textColor: "var(--dash-success)",
    label: "✓ Completed",
  },
  today: {
    borderColor: "var(--dash-teal)",
    bgColor: "var(--dash-teal-bg)",
    textColor: "var(--dash-teal)",
    label: "Today",
  },
  upcoming: {
    borderColor: "var(--dash-border)",
    bgColor: "transparent",
    textColor: "var(--dash-dim)",
    label: "Upcoming",
  },
  rest: {
    borderColor: "var(--dash-border)",
    bgColor: "transparent",
    textColor: "var(--dash-dim)",
    label: "Rest day",
  },
};

export default function PlanPage() {
  return (
    <div className="dash-page-enter" style={{ maxWidth: "1040px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <h1 style={{ fontSize: "22px", fontWeight: 500, color: "var(--dash-text)", marginBottom: "24px" }}>
        My Study Plan
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        {planData.map((day, i) => {
          const config = statusConfig[day.status];
          return (
            <DashboardCard
              key={i}
              padding="18px 22px"
              accentColor={config.borderColor}
              hoverable={day.status === "today" || day.status === "upcoming"}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px",
                }}
              >
                <div style={{ flex: 1, minWidth: "200px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "var(--dash-muted)",
                        minWidth: "80px",
                      }}
                    >
                      {day.day}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: config.textColor,
                        background: config.bgColor,
                        padding: "2px 8px",
                        borderRadius: "var(--dash-radius-pill)",
                        fontWeight: 500,
                      }}
                    >
                      {config.label}
                    </span>
                  </div>
                  {day.topic ? (
                    <>
                      <div style={{ fontSize: "16px", fontWeight: 500, color: "var(--dash-text)", marginTop: "6px" }}>
                        {day.topic}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--dash-muted)", marginTop: "2px" }}>
                        {day.subject} · {day.duration}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: "14px", color: "var(--dash-dim)", marginTop: "6px", fontStyle: "italic" }}>
                      No session scheduled — take a break!
                    </div>
                  )}
                </div>
                {day.status === "today" && (
                  <a
                    href="/session"
                    style={{
                      background: "var(--dash-teal)",
                      color: "var(--dash-bg)",
                      padding: "9px 20px",
                      borderRadius: "9px",
                      fontWeight: 600,
                      fontSize: "13px",
                      textDecoration: "none",
                      transition: "opacity 150ms ease",
                      flexShrink: 0,
                    }}
                  >
                    Start Session
                  </a>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </div>
  );
}
