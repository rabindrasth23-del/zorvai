"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";
import {
  DashboardCard,
  StatCard,
  CountUp,
  ProgressRing,
  AnimatedProgressBar,
  StatusChip,
  StreakBadge,
  SectionHeader,
  Divider,
  SubjectDot,
  getSubjectColor,
  DashButton,
  useScrollAnimation,
} from "./dashboard-primitives";
import { FloatingChatButton } from "./floating-chat-button";

/* =============================================================================
   STUDENT DASHBOARD CLIENT
   All interactive/animated sections of the student dashboard.
   Server Component (page.tsx) fetches data and passes it here.
   ============================================================================= */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StudentDashboardData {
  studentName: string;
  streak: number;
  bestStreak: number;
  todaySession: {
    topic: string;
    subject: string;
    dayOfPlan: number;
    totalDays: number;
    estimatedMinutes: number;
    completed: boolean;
  } | null;
  sessionsThisMonth: {
    completed: number;
    planned: number;
  };
  guaranteeStatus: "on-track" | "behind" | "qualified";
  guaranteeSessions: number;
  guaranteeDaysLeft: number;
  weekPlan: Array<{
    dayAbbr: string;
    dateNumber: number;
    isToday: boolean;
    session: {
      topic: string;
      status: "completed" | "today" | "upcoming" | "rest";
    } | null;
  }>;
  weakTopics: Array<{
    topic: string;
    subject: string;
    reason: string;
  }>;
  recentSessions: Array<{
    topic: string;
    subject: string;
    result: "passed" | "missed";
    timeAgo: string;
  }>;
  goal: {
    text: string;
    daysAgo: number;
    progress: number;
  } | null;
}

// ─── Greeting Row ────────────────────────────────────────────────────────────

function GreetingRow({
  name,
  streak,
  todayTopic,
  nextSessionDay,
}: {
  name: string;
  streak: number;
  todayTopic?: string;
  nextSessionDay?: string;
}) {
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  let contextLine = "";
  if (streak > 0) {
    contextLine = `Day ${streak} streak — keep it going 🔥`;
  } else if (todayTopic) {
    contextLine = `Today's topic: ${todayTopic}`;
  } else if (nextSessionDay) {
    contextLine = `Rest day — next session is ${nextSessionDay}`;
  }

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        flexWrap: "wrap",
        gap: "12px",
      }}
    >
      <div>
        <h1
          style={{
            fontSize: "22px",
            fontWeight: 500,
            color: "var(--dash-text)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: 0,
          }}
        >
          {greeting}, {name.split(" ")[0]}
        </h1>
        {contextLine && (
          <p
            style={{
              fontSize: "14px",
              color: "var(--dash-muted)",
              margin: "4px 0 0",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {contextLine}
          </p>
        )}
      </div>
      {streak > 0 && <StreakBadge days={streak} />}
    </div>
  );
}

// ─── Today's Session Card ────────────────────────────────────────────────────

function TodaySessionCard({
  session,
  nextSessionDay,
}: {
  session: StudentDashboardData["todaySession"];
  nextSessionDay?: string;
}) {
  const shouldReduceMotion = useReducedMotion();

  if (!session) {
    return (
      <DashboardCard accentColor="var(--dash-border-hi)" padding="22px 26px">
        <div style={{ textAlign: "center", padding: "12px 0" }}>
          <p style={{ fontSize: "15px", color: "var(--dash-muted)", fontFamily: "system-ui, -apple-system, sans-serif" }}>
            Rest day — your next session is {nextSessionDay || "tomorrow"}
          </p>
        </div>
      </DashboardCard>
    );
  }

  if (session.completed) {
    return (
      <DashboardCard accentColor="var(--dash-success)" padding="22px 26px">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ fontSize: "20px", color: "var(--dash-success)" }}>✓</span>
          <div>
            <p style={{ fontSize: "16px", fontWeight: 500, color: "var(--dash-text)", fontFamily: "system-ui, -apple-system, sans-serif", margin: 0 }}>
              Session complete
            </p>
            <p style={{ fontSize: "14px", color: "var(--dash-muted)", fontFamily: "system-ui, -apple-system, sans-serif", margin: "2px 0 0" }}>
              {session.topic}
            </p>
          </div>
        </div>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard accentColor="var(--dash-teal)" padding="22px 26px">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span
            style={{
              fontSize: "11px",
              color: "var(--dash-muted)",
              letterSpacing: "0.06em",
              fontFamily: "system-ui, -apple-system, sans-serif",
              textTransform: "uppercase",
            }}
          >
            TODAY
          </span>
          <h2
            style={{
              fontSize: "22px",
              fontWeight: 600,
              color: "var(--dash-text)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              margin: "4px 0 0",
            }}
          >
            {session.topic}
          </h2>
          <p
            style={{
              fontSize: "14px",
              color: "var(--dash-muted)",
              margin: "2px 0",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            {session.subject} · Day {session.dayOfPlan} of {session.totalDays}
          </p>
          <p
            style={{
              fontSize: "13px",
              color: "var(--dash-dim)",
              margin: "0",
              fontFamily: "system-ui, -apple-system, sans-serif",
            }}
          >
            ~{session.estimatedMinutes} min
          </p>
          {/* Phase chips */}
          <div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
            {["Learn", "Recall", "Challenge"].map((phase) => (
              <span
                key={phase}
                style={{
                  background: "var(--dash-raised)",
                  color: "var(--dash-dim)",
                  padding: "3px 10px",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                }}
              >
                {phase}
              </span>
            ))}
          </div>
        </div>
        <Link href="/session" style={{ textDecoration: "none" }}>
          <DashButton variant="primary">Start Session</DashButton>
        </Link>
      </div>
    </DashboardCard>
  );
}

// ─── Stat Cards Row ──────────────────────────────────────────────────────────

function StatCardsRow({
  streak,
  bestStreak,
  sessions,
  guaranteeStatus,
  guaranteeSessions,
  guaranteeDaysLeft,
}: {
  streak: number;
  bestStreak: number;
  sessions: { completed: number; planned: number };
  guaranteeStatus: "on-track" | "behind" | "qualified";
  guaranteeSessions: number;
  guaranteeDaysLeft: number;
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "14px",
      }}
    >
      {/* Card 1 — Streak */}
      <StatCard
        label="Current streak"
        value={<CountUp end={streak} suffix=" days" />}
        subtext={`🔥 Best: ${bestStreak} days`}
        delay={0}
      />

      {/* Card 2 — Sessions this month */}
      <StatCard
        label="Sessions this month"
        value={<CountUp end={sessions.completed} />}
        subtext={`${sessions.completed} of ${sessions.planned} planned`}
        delay={0.08}
      >
        <AnimatedProgressBar
          value={sessions.completed}
          max={sessions.planned}
          delay={0.3}
          className="mt-2"
        />
      </StatCard>

      {/* Card 3 — Guarantee */}
      <StatCard
        label="Improvement guarantee"
        value={<StatusChip status={guaranteeStatus} />}
        subtext={`${guaranteeSessions} of 12 sessions · ${guaranteeDaysLeft} days left`}
        delay={0.16}
      />
    </div>
  );
}

// ─── Weekly Plan Strip ───────────────────────────────────────────────────────

function WeeklyPlanStrip({ days }: { days: StudentDashboardData["weekPlan"] }) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div>
      <h3
        style={{
          fontSize: "14px",
          fontWeight: 500,
          color: "var(--dash-text)",
          fontFamily: "system-ui, -apple-system, sans-serif",
          marginBottom: "12px",
        }}
      >
        This week
      </h3>
      <div
        style={{
          display: "flex",
          gap: "0",
          overflowX: "auto",
        }}
        className="dash-scrollbar"
      >
        {days.map((day, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              minWidth: "80px",
              textAlign: "center",
              padding: "8px 4px 12px",
              position: "relative",
            }}
          >
            {/* Today indicator line */}
            {day.isToday && (
              <motion.div
                style={{
                  position: "absolute",
                  top: 0,
                  left: "10%",
                  right: "10%",
                  height: "2px",
                  background: "var(--dash-teal)",
                  transformOrigin: "left",
                }}
                initial={shouldReduceMotion ? false : { scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              />
            )}

            {/* Day abbreviation */}
            <div
              style={{
                fontSize: "11px",
                color: "var(--dash-muted)",
                letterSpacing: "0.06em",
                fontFamily: "system-ui, -apple-system, sans-serif",
                textTransform: "uppercase",
              }}
            >
              {day.dayAbbr}
            </div>

            {/* Date number */}
            <div
              style={{
                fontSize: "14px",
                color: "var(--dash-text)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                marginTop: "2px",
              }}
            >
              {day.dateNumber}
            </div>

            {/* Session pill */}
            <div style={{ marginTop: "8px" }}>
              {day.session ? (
                <SessionPill status={day.session.status} topic={day.session.topic} />
              ) : (
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--dash-border-hi)",
                  }}
                >
                  —
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SessionPill({ status, topic }: { status: string; topic: string }) {
  const styles: Record<string, React.CSSProperties> = {
    completed: {
      background: "var(--dash-raised)",
      borderLeft: "3px solid var(--dash-success)",
      color: "var(--dash-muted)",
    },
    today: {
      background: "var(--dash-teal-bg)",
      borderLeft: "3px solid var(--dash-teal)",
      color: "var(--dash-teal)",
    },
    upcoming: {
      background: "var(--dash-surface)",
      border: "1px dashed var(--dash-border)",
      color: "var(--dash-dim)",
    },
    rest: {
      background: "transparent",
      color: "var(--dash-border-hi)",
    },
  };

  return (
    <div
      style={{
        fontSize: "12px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        padding: "4px 8px",
        borderRadius: "4px",
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
        maxWidth: "100%",
        ...styles[status],
      }}
    >
      {status === "rest" ? "—" : topic}
    </div>
  );
}

// ─── Focus Areas ─────────────────────────────────────────────────────────────

function FocusAreas({ topics }: { topics: StudentDashboardData["weakTopics"] }) {
  if (topics.length === 0) {
    return (
      <DashboardCard padding="20px">
        <SectionHeader title="Focus areas" subtitle="Based on your last 3 sessions" />
        <p
          style={{
            fontSize: "13px",
            color: "var(--dash-muted)",
            textAlign: "center",
            padding: "20px 0",
            fontFamily: "system-ui, -apple-system, sans-serif",
          }}
        >
          No weak topics yet — great work so far
        </p>
      </DashboardCard>
    );
  }

  return (
    <DashboardCard padding="20px">
      <SectionHeader title="Focus areas" subtitle="Based on your last 3 sessions" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {topics.map((t, i) => (
          <div key={i}>
            {i > 0 && <Divider />}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                gap: "8px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                <SubjectDot subject={t.subject} />
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: "14px",
                      color: "var(--dash-text)",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {t.topic}
                  </div>
                  <div
                    style={{
                      fontSize: "12px",
                      color: "var(--dash-muted)",
                      fontFamily: "system-ui, -apple-system, sans-serif",
                    }}
                  >
                    {t.reason}
                  </div>
                </div>
              </div>
              <Link
                href={`/chat?topic=${encodeURIComponent(t.topic)}`}
                style={{
                  fontSize: "13px",
                  color: "var(--dash-teal)",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                Review →
              </Link>
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

// ─── Recent Sessions List ────────────────────────────────────────────────────

function RecentSessionsList({ sessions }: { sessions: StudentDashboardData["recentSessions"] }) {
  return (
    <DashboardCard padding="20px">
      <SectionHeader title="Recent sessions" />
      <div style={{ display: "flex", flexDirection: "column" }}>
        {sessions.map((s, i) => (
          <div key={i}>
            {i > 0 && <Divider />}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 0",
                gap: "8px",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: "14px",
                    color: "var(--dash-text)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {s.topic}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--dash-muted)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                  }}
                >
                  {s.subject}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    color: "var(--dash-dim)",
                    fontFamily: "system-ui, -apple-system, sans-serif",
                    marginTop: "2px",
                  }}
                >
                  {s.timeAgo}
                </div>
              </div>
              <StatusChip status={s.result} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

// ─── Goal Card ───────────────────────────────────────────────────────────────

function GoalCard({ goal }: { goal: StudentDashboardData["goal"] }) {
  if (!goal) return null;

  return (
    <motion.div
      style={{
        background: "rgba(78, 205, 196, 0.05)",
        border: "1px solid rgba(78, 205, 196, 0.15)",
        borderRadius: "var(--dash-radius-card)",
        padding: "20px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: "20px",
        flexWrap: "wrap",
      }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      <div>
        <span
          style={{
            fontSize: "11px",
            color: "var(--dash-teal)",
            letterSpacing: "0.06em",
            fontFamily: "system-ui, -apple-system, sans-serif",
            textTransform: "uppercase",
          }}
        >
          YOUR GOAL THIS MONTH
        </span>
        <p
          style={{
            fontSize: "16px",
            fontWeight: 500,
            fontStyle: "italic",
            color: "var(--dash-text)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: "6px 0 0",
          }}
        >
          {goal.text}
        </p>
        <p
          style={{
            fontSize: "12px",
            color: "var(--dash-muted)",
            fontFamily: "system-ui, -apple-system, sans-serif",
            margin: "4px 0 0",
          }}
        >
          Set {goal.daysAgo} days ago
        </p>
      </div>
      <ProgressRing
        percentage={goal.progress}
        size={60}
        strokeWidth={5}
        sublabel="of sessions done"
      />
    </motion.div>
  );
}

// ─── Main Dashboard Export ───────────────────────────────────────────────────

export function StudentDashboardClient({ data }: { data: StudentDashboardData }) {
  useScrollAnimation();

  return (
    <div className="dash-page-enter" style={{ maxWidth: "1040px" }}>
      {/* Section 1 — Greeting */}
      <div className="dash-animate-on-scroll" style={{ marginBottom: "24px" }}>
        <GreetingRow
          name={data.studentName}
          streak={data.streak}
          todayTopic={data.todaySession?.topic}
        />
      </div>

      {/* Section 2 — Today's Session */}
      <div className="dash-animate-on-scroll" style={{ marginBottom: "20px" }}>
        <TodaySessionCard session={data.todaySession} />
      </div>

      {/* Section 3 — Stat Cards */}
      <div className="dash-animate-on-scroll" style={{ marginBottom: "24px" }}>
        <StatCardsRow
          streak={data.streak}
          bestStreak={data.bestStreak}
          sessions={data.sessionsThisMonth}
          guaranteeStatus={data.guaranteeStatus}
          guaranteeSessions={data.guaranteeSessions}
          guaranteeDaysLeft={data.guaranteeDaysLeft}
        />
      </div>

      {/* Section 4 — Weekly Plan */}
      <div className="dash-animate-on-scroll" style={{ marginBottom: "28px" }}>
        <DashboardCard padding="18px 20px">
          <WeeklyPlanStrip days={data.weekPlan} />
        </DashboardCard>
      </div>

      {/* Section 5 — Two Column Layout */}
      <div
        className="dash-animate-on-scroll"
        style={{
          display: "grid",
          gridTemplateColumns: "3fr 2fr",
          gap: "14px",
          marginBottom: "24px",
        }}
      >
        <FocusAreas topics={data.weakTopics} />
        <RecentSessionsList sessions={data.recentSessions} />
      </div>

      {/* Section 6 — Goal Card */}
      <div className="dash-animate-on-scroll" style={{ marginBottom: "32px" }}>
        <GoalCard goal={data.goal} />
      </div>

      {/* Floating Chat Button */}
      <FloatingChatButton />
    </div>
  );
}
