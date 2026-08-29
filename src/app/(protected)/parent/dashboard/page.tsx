import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  Activity,
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Clock,
  ShieldCheck,
} from "lucide-react";
import StaggerChildren from "@/components/motion/stagger-children";
import { StatChip } from "@/components/dashboard/stat-chip";
import { SessionCard } from "@/components/dashboard/session-card";
import {
  ActivitySidebar,
  type ActivityItem,
} from "@/components/dashboard/activity-sidebar";

export const metadata = {
  title: "Parent Dashboard | Zorvai",
  description: "Track your student's study progress and mastery status.",
};

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // ── Get the linked student ──
  const { data: link } = await admin
    .from("student_parent_links")
    .select("student_id")
    .eq("parent_id", user.id)
    .limit(1)
    .single();

  if (!link) {
    return (
      <div className="flex flex-col gap-12 h-full max-w-5xl mx-auto pb-16 pt-8 px-4">
        <div className="w-full rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-surface p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">
            No linked student
          </h3>
          <p className="text-[var(--color-text-muted)] text-[var(--text-body)] max-w-sm font-sans leading-relaxed">
            Something went wrong — your account isn&apos;t linked to a
            student yet.
          </p>
        </div>
      </div>
    );
  }

  const studentId = link.student_id;

  // ── Fetch student name ──
  const { data: student } = await admin
    .from("students")
    .select("name")
    .eq("id", studentId)
    .single();

  const studentName = student?.name || "Your student";

  // ── Get parent name for greeting ──
  const { data: parentRow } = await admin
    .from("parents")
    .select("name")
    .eq("id", user.id)
    .single();

  const parentName = parentRow?.name || "Parent";

  // ── Fetch session history (last 10 for activity sidebar) ──
  const { data: sessions } = await admin
    .from("sessions")
    .select(
      `
      id,
      phase,
      status,
      started_at,
      ended_at,
      plan_topics (title),
      session_results (passed)
    `
    )
    .eq("student_id", studentId)
    .order("started_at", { ascending: false })
    .limit(10);

  const sessionList = (sessions || []).map((s) => {
    const topicTitle = Array.isArray(s.plan_topics)
      ? (s.plan_topics[0] as any)?.title
      : (s.plan_topics as any)?.title || "Unknown Topic";
    const passed = Array.isArray(s.session_results)
      ? (s.session_results[0] as any)?.passed
      : (s.session_results as any)?.passed;
    return {
      id: s.id,
      topic: topicTitle,
      status: s.status,
      phase: s.phase,
      passed: typeof passed === "boolean" ? passed : null,
      startedAt: s.started_at,
      endedAt: s.ended_at,
    };
  });

  const completedSessions = sessionList.filter(
    (s) => s.status === "completed"
  );

  // ── Fetch topic mastery status (from active plan) ──
  const { data: activePlan } = await admin
    .from("plans")
    .select("id")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let topicStatuses: Array<{
    title: string;
    description: string | null;
    status: string;
    day: number;
  }> = [];

  if (activePlan) {
    const { data: topics } = await admin
      .from("plan_topics")
      .select("title, description, status, day")
      .eq("plan_id", activePlan.id)
      .order("sort_order", { ascending: true });

    topicStatuses = (topics || []).map((t) => ({
      title: t.title,
      description: t.description,
      status: t.status,
      day: t.day,
    }));
  }

  const masteredCount = topicStatuses.filter(
    (t) => t.status === "mastered"
  ).length;
  const pendingCount = topicStatuses.filter(
    (t) => t.status === "pending"
  ).length;
  const totalTopics = topicStatuses.length;

  // ── Fetch guarantee tracking ──
  const { data: guarantee } = await admin
    .from("guarantee_tracking")
    .select("status, agreed_sessions, baseline_score, follow_up_score")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let guaranteeLabel: string;
  let guaranteeColor: string;
  if (!guarantee) {
    guaranteeLabel = "Not yet tracked";
    guaranteeColor = "var(--color-text-muted)";
  } else if (guarantee.status === "in_progress") {
    guaranteeLabel = "On track";
    guaranteeColor = "var(--color-success)";
  } else if (guarantee.status === "needs_review") {
    guaranteeLabel = "Needs review";
    guaranteeColor = "var(--color-warning)";
  } else if (guarantee.status === "completed") {
    guaranteeLabel = "Guarantee met";
    guaranteeColor = "var(--color-success)";
  } else {
    guaranteeLabel = guarantee.status;
    guaranteeColor = "var(--color-text-muted)";
  }

  // ── Fetch recent check-ins (dates only — NEVER expose mood_text) ──
  const { data: recentCheckins } = await admin
    .from("checkins")
    .select("id, created_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false })
    .limit(5);

  // ── Build activity items for sidebar ──
  const activityItems: ActivityItem[] = [];

  // Add completed sessions as activity
  for (const s of completedSessions.slice(0, 5)) {
    activityItems.push({
      id: `session-${s.id}`,
      type: "session",
      title: s.topic,
      description:
        s.passed === true
          ? "Completed — Passed"
          : s.passed === false
            ? "Completed — Needs Review"
            : "Completed",
      date: new Date(s.startedAt).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      accentColor:
        s.passed === true
          ? "var(--color-success)"
          : s.passed === false
            ? "var(--color-warning)"
            : "var(--color-primary)",
    });
  }

  // Add check-ins as activity
  for (const c of recentCheckins || []) {
    activityItems.push({
      id: `checkin-${c.id}`,
      type: "checkin",
      title: "Daily Check-in",
      description: "Completed daily check-in",
      date: new Date(c.created_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      accentColor: "var(--color-primary)",
    });
  }

  // Sort by date descending, take most recent 8
  activityItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const displayActivities = activityItems.slice(0, 8);

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 pb-16">
      {/* ── Header ── */}
      <StaggerChildren delay={0}>
        <header className="mb-6">
          <h1 className="text-3xl md:text-4xl font-display text-[var(--color-text)] tracking-tight">
            Welcome, {parentName}
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-2 font-sans">
            Tracking progress for {studentName}
          </p>
        </header>
      </StaggerChildren>

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ══════════ Main Column (2/3) ══════════ */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Privacy Notice */}
          <StaggerChildren delay={0.04}>
            <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
              <ShieldCheck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
              <p className="text-sm text-[var(--color-text)] font-sans leading-relaxed">
                <strong className="font-semibold">
                  Your student&apos;s privacy is protected.
                </strong>{" "}
                This dashboard shows study progress and mastery status
                only. Check-in reflections and personal content are
                private to {studentName} and are never shared.
              </p>
            </div>
          </StaggerChildren>

          {/* Stats Row */}
          <StaggerChildren delay={0.08}>
            <div className="flex flex-wrap gap-3">
              <StatChip
                value={totalTopics}
                label="Total"
                colorClass="text-[var(--color-text)]"
                borderColorClass="border-[var(--color-primary)]/30"
              />
              <StatChip
                value={masteredCount}
                label="Mastered"
                colorClass="text-[var(--color-success)]"
                borderColorClass="border-[var(--color-success)]/30"
              />
              <StatChip
                value={pendingCount}
                label="Upcoming"
                colorClass="text-[var(--color-primary)]"
                borderColorClass="border-[var(--color-primary)]/20"
              />
              {/* Guarantee chip */}
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-surface shadow-[var(--shadow-xs)]">
                <ShieldCheck
                  className="w-4 h-4"
                  style={{ color: guaranteeColor }}
                />
                <span
                  className="text-sm font-sans font-medium"
                  style={{ color: guaranteeColor }}
                >
                  {guaranteeLabel}
                </span>
              </div>
            </div>
          </StaggerChildren>

          {/* Topic Mastery Card List — "Study Plan" */}
          <StaggerChildren delay={0.12}>
            <div>
              <h2 className="text-lg font-display font-medium text-[var(--color-text)] mb-4">
                {studentName}&apos;s Study Plan
              </h2>

              {topicStatuses.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {topicStatuses.map((topic, i) => (
                    <SessionCard
                      key={`${topic.title}-${i}`}
                      title={topic.title}
                      description={topic.description || undefined}
                      status={
                        topic.status as
                          | "mastered"
                          | "re-queued"
                          | "pending"
                      }
                      day={topic.day}
                      index={i}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-surface p-8 flex flex-col items-center text-center shadow-[var(--shadow-sm)]">
                  <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
                    <BookOpen className="w-7 h-7 text-[var(--color-primary)]" />
                  </div>
                  <h3 className="font-display font-medium text-[var(--color-text)] text-lg mb-1">
                    No study plan yet
                  </h3>
                  <p className="text-[var(--color-text-muted)] text-sm font-sans max-w-sm">
                    {studentName} hasn&apos;t completed onboarding yet.
                    Topics will appear here once their study plan is
                    generated.
                  </p>
                </div>
              )}
            </div>
          </StaggerChildren>
        </div>

        {/* ══════════ Sidebar (1/3) ══════════ */}
        <div className="lg:col-span-1">
          <ActivitySidebar
            items={displayActivities}
            studentName={studentName}
          />
        </div>
      </div>
    </div>
  );
}
