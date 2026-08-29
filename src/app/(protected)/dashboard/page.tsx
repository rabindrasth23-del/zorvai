import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import Link from "next/link";
import {
  Activity,
  Clock,
  Target,
  BookOpen,
  Sparkles,
  CalendarCheck2,
} from "lucide-react";
import {
  InviteCodeCard,
  LinkNotificationBanner,
} from "@/components/dashboard/parent-link-widgets";
import { LinearProgress } from "@/components/ui/linear-progress";
import { StudentDashboardHeader } from "@/components/dashboard/student-dashboard-header";
import { HeroBanner } from "@/components/dashboard/hero-banner";
import { WeeklyChart } from "@/components/dashboard/weekly-chart";
import { DashboardBottomNav } from "@/components/dashboard/dashboard-bottom-nav";
import StaggerChildren from "@/components/motion/stagger-children";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // ── Student profile ──
  const { data: student, error } = await supabase
    .from("students")
    .select("name, study_hours_per_day, subjects, invite_code")
    .eq("id", user.id)
    .single();

  if (error || !student) {
    throw new Error(
      `Critical State Error: Failed to load student profile (Layout guard may have been bypassed). Details: ${error?.message || "Profile not found"}`
    );
  }

  const studentName = student.name || "Student";
  const targetHours = student.study_hours_per_day ?? 0;
  const inviteCode = student.invite_code || "";

  // ── Admin client for guarantee + parent links ──
  const admin = createAdminClient();

  // ── Unnotified parent links ──
  const { data: unnotifiedLinks } = await admin
    .from("student_parent_links")
    .select("id, parent_id, created_at")
    .eq("student_id", user.id)
    .eq("student_notified", false);

  const linkBanners: Array<{
    linkId: string;
    parentName: string;
    linkedAt: string;
  }> = [];
  if (unnotifiedLinks && unnotifiedLinks.length > 0) {
    for (const link of unnotifiedLinks) {
      const { data: parentRow } = await admin
        .from("parents")
        .select("name")
        .eq("id", link.parent_id)
        .single();
      linkBanners.push({
        linkId: link.id,
        parentName: parentRow?.name || "A parent",
        linkedAt: link.created_at,
      });
    }
  }

  // ── Completed sessions count ──
  const { count: completedCount } = await supabase
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", user.id)
    .eq("status", "completed");

  const sessionCount = completedCount || 0;
  const hasSessions = sessionCount > 0;

  // ── Total study hours (completed sessions with valid ended_at only) ──
  const { data: completedSessions } = await supabase
    .from("sessions")
    .select("started_at, ended_at")
    .eq("student_id", user.id)
    .eq("status", "completed")
    .not("ended_at", "is", null);

  let totalStudyMinutes = 0;
  for (const s of completedSessions || []) {
    if (!s.ended_at) continue;
    const start = new Date(s.started_at).getTime();
    const end = new Date(s.ended_at).getTime();
    totalStudyMinutes += (end - start) / (1000 * 60);
  }
  const totalStudyHours =
    Math.round((totalStudyMinutes / 60) * 10) / 10;

  // ── Active plan topics for mastery count ──
  const { data: activePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("student_id", user.id)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let masteredCount = 0;
  let totalTopics = 0;
  if (activePlan) {
    const { data: topics } = await supabase
      .from("plan_topics")
      .select("status")
      .eq("plan_id", activePlan.id);
    totalTopics = (topics || []).length;
    masteredCount = (topics || []).filter(
      (t) => t.status === "mastered"
    ).length;
  }
  const masteryPercent =
    totalTopics > 0
      ? Math.round((masteredCount / totalTopics) * 100)
      : 0;

  // ── Guarantee tracking ──
  const { data: guarantee } = await admin
    .from("guarantee_tracking")
    .select("status, agreed_sessions, baseline_score, follow_up_score")
    .eq("student_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let guaranteeLabel = "";
  let guaranteeStatus: string | null = null;
  if (guarantee) {
    guaranteeStatus = guarantee.status;
    if (guarantee.status === "in_progress")
      guaranteeLabel = "On track — keep it up!";
    else if (guarantee.status === "needs_review")
      guaranteeLabel = "Your progress is being reviewed";
    else if (guarantee.status === "completed")
      guaranteeLabel = "Congratulations! Guarantee met";
    else guaranteeLabel = guarantee.status;
  }

  // ── Weekly session data (current week, Mon–Sun) ──
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() + mondayOffset);
  weekStart.setHours(0, 0, 0, 0);

  const { data: weekSessions } = await supabase
    .from("sessions")
    .select("started_at, ended_at")
    .eq("student_id", user.id)
    .eq("status", "completed")
    .not("ended_at", "is", null)
    .gte("started_at", weekStart.toISOString());

  const weeklyData = [0, 0, 0, 0, 0, 0, 0]; // Mon–Sun
  let weekTotalMinutes = 0;
  for (const s of weekSessions || []) {
    if (!s.ended_at) continue;
    const start = new Date(s.started_at);
    const end = new Date(s.ended_at);
    const durationMinutes =
      (end.getTime() - start.getTime()) / (1000 * 60);
    const dayIndex = (start.getDay() + 6) % 7; // 0=Mon, 6=Sun
    weeklyData[dayIndex] += durationMinutes;
    weekTotalMinutes += durationMinutes;
  }
  const hasWeeklyData = weeklyData.some((d) => d > 0);

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-24 md:pb-16">
      {/* Link notification banners */}
      {linkBanners.map((b) => (
        <LinkNotificationBanner
          key={b.linkId}
          linkId={b.linkId}
          parentName={b.parentName}
          linkedAt={b.linkedAt}
        />
      ))}

      {/* ── Greeting Header ── */}
      <StudentDashboardHeader studentName={studentName} />

      {/* ── Hero Banner ── */}
      <HeroBanner
        guaranteeStatus={guaranteeStatus}
        guaranteeLabel={guaranteeLabel}
        hasSessions={hasSessions}
        targetHours={targetHours}
      />

      {/* ── Stat Cards Row ── */}
      <StaggerChildren delay={0.12}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Total Sessions */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200">
            <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <p className="font-mono text-3xl font-semibold text-[var(--color-text)] tracking-tight">
              {sessionCount}
            </p>
            <p className="text-xs font-sans text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-medium">
              Total Sessions
            </p>
          </div>

          {/* Study Hours */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200">
            <div className="w-10 h-10 rounded-full bg-[var(--color-accent)]/10 flex items-center justify-center mb-3">
              <Clock className="w-5 h-5 text-[var(--color-accent)]" />
            </div>
            <p className="font-mono text-3xl font-semibold text-[var(--color-text)] tracking-tight">
              {totalStudyHours}
            </p>
            <p className="text-xs font-sans text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-medium">
              Study Hours
            </p>
          </div>

          {/* Mastery Score */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 shadow-[var(--shadow-xs)] hover:shadow-[var(--shadow-md)] transition-shadow duration-200">
            <div className="w-10 h-10 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-[var(--color-success)]" />
            </div>
            <p className="font-mono text-3xl font-semibold text-[var(--color-text)] tracking-tight">
              {masteredCount}
              <span className="text-lg text-[var(--color-text-muted)] font-normal">
                /{totalTopics}
              </span>
            </p>
            <p className="text-xs font-sans text-[var(--color-text-muted)] mt-1 uppercase tracking-wider font-medium">
              Topics Mastered
            </p>
          </div>
        </div>
      </StaggerChildren>

      {/* ── Average Progress + Weekly Chart ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Average Progress */}
        <StaggerChildren delay={0.18}>
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-[var(--shadow-xs)]">
            <h3 className="text-base font-display font-medium text-[var(--color-text)] mb-5">
              Average Progress
            </h3>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <LinearProgress
                  value={masteryPercent}
                  showValue={false}
                  colorClass="bg-[var(--color-accent)]"
                  label="Progress"
                />
              </div>
              <span className="font-mono text-4xl font-bold text-[var(--color-text)] tracking-tight shrink-0">
                {masteryPercent}
                <span className="text-xl font-semibold text-[var(--color-text-muted)]">
                  %
                </span>
              </span>
            </div>
          </div>
        </StaggerChildren>

        {/* Weekly Study Chart */}
        <StaggerChildren delay={0.24}>
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-[var(--shadow-xs)]">
            {hasWeeklyData ? (
              <WeeklyChart
                data={weeklyData}
                totalMinutes={weekTotalMinutes}
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[var(--color-muted)] flex items-center justify-center mb-3">
                  <BookOpen className="w-6 h-6 text-[var(--color-text-muted)]" />
                </div>
                <h3 className="text-base font-display font-medium text-[var(--color-text)] mb-1">
                  Weekly Study Time
                </h3>
                <p className="text-sm text-[var(--color-text-muted)] font-sans max-w-[220px]">
                  Complete sessions this week to see your daily study
                  pattern here.
                </p>
              </div>
            )}
          </div>
        </StaggerChildren>
      </div>

      {/* ── Parent Connection ── */}
      <StaggerChildren delay={0.3}>
        <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-lg)] p-5 md:p-6 shadow-[var(--shadow-xs)]">
          <h3 className="text-base font-display font-medium text-[var(--color-text)] mb-4">
            Parent Connection
          </h3>
          <div className="max-w-md">
            <InviteCodeCard code={inviteCode} />
          </div>
        </div>
      </StaggerChildren>

      {/* ── Bottom Nav (mobile only) ── */}
      <DashboardBottomNav />
    </div>
  );
}
