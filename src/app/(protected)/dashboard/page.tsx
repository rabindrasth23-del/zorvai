import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { CalendarDays } from "lucide-react";
import {
  LinkNotificationBanner,
} from "@/components/dashboard/parent-link-widgets";
import { StudyPlanClient } from "@/components/dashboard/study-plan-client";
import {
  ActivitySidebar,
  type ActivityItem,
} from "@/components/dashboard/activity-sidebar";
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
      `Critical State Error: Failed to load student profile. Details: ${error?.message || "Profile not found"}`
    );
  }

  const studentName = student.name || "Student";
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

  // ── Active plan topics ──
  const { data: activePlan } = await supabase
    .from("plans")
    .select("id")
    .eq("student_id", user.id)
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
    const { data: topics } = await supabase
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

  const totalTopics = topicStatuses.length;
  const masteredCount = topicStatuses.filter(
    (t) => t.status === "mastered"
  ).length;
  // re-queued collapses into Upcoming (not a 4th category)
  const upcomingCount = topicStatuses.filter(
    (t) => t.status === "pending" || t.status === "re-queued"
  ).length;

  // ── Recent sessions (for activity sidebar) ──
  const { data: recentSessions } = await admin
    .from("sessions")
    .select(
      `id, status, started_at, ended_at,
       plan_topics (title),
       session_results (passed)`
    )
    .eq("student_id", user.id)
    .eq("status", "completed")
    .order("started_at", { ascending: false })
    .limit(5);

  // ── Recent check-ins (dates only — NEVER expose mood_text) ──
  const { data: recentCheckins } = await admin
    .from("checkins")
    .select("id, created_at")
    .eq("student_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  // ── Build activity items ──
  const activityItems: ActivityItem[] = [];

  for (const s of recentSessions || []) {
    const topicTitle = Array.isArray(s.plan_topics)
      ? (s.plan_topics[0] as any)?.title
      : (s.plan_topics as any)?.title || "Study Session";
    const passed = Array.isArray(s.session_results)
      ? (s.session_results[0] as any)?.passed
      : (s.session_results as any)?.passed;

    activityItems.push({
      id: `session-${s.id}`,
      type: "session",
      title: topicTitle,
      description:
        passed === true
          ? "Completed — Passed"
          : passed === false
            ? "Completed — Needs Review"
            : "Completed",
      date: new Date(s.started_at).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      }),
      accentColor:
        passed === true
          ? "var(--color-success)"
          : passed === false
            ? "var(--color-warning)"
            : "var(--color-primary)",
    });
  }

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

  activityItems.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  const displayActivities = activityItems.slice(0, 8);

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-16">
      {/* Link notification banners */}
      {linkBanners.map((b) => (
        <LinkNotificationBanner
          key={b.linkId}
          linkId={b.linkId}
          parentName={b.parentName}
          linkedAt={b.linkedAt}
        />
      ))}

      {/* ── Two-Column Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ═══ Main Column (2/3) ═══ */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Section header */}
          <StaggerChildren delay={0}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center">
                <CalendarDays className="w-5 h-5 text-[var(--color-primary)]" />
              </div>
              <h1 className="text-2xl md:text-3xl font-display font-semibold text-[var(--color-text)] tracking-tight">
                My Study Plan
              </h1>
            </div>
          </StaggerChildren>

          {/* Stats row — 3 chips */}
          <StaggerChildren delay={0.06}>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-lg)] bg-[var(--color-primary)]/8 border border-[var(--color-primary)]/15">
                <span className="font-mono text-2xl font-bold text-[var(--color-primary)]">
                  {totalTopics}
                </span>
                <span className="text-sm font-sans text-[var(--color-text-muted)]">
                  Total
                </span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-lg)] bg-[var(--color-success)]/8 border border-[var(--color-success)]/15">
                <span className="font-mono text-2xl font-bold text-[var(--color-success)]">
                  {masteredCount}
                </span>
                <span className="text-sm font-sans text-[var(--color-text-muted)]">
                  Mastered
                </span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 rounded-[var(--radius-lg)] bg-[var(--color-warning)]/8 border border-[var(--color-warning)]/15">
                <span className="font-mono text-2xl font-bold text-[var(--color-warning)]">
                  {upcomingCount}
                </span>
                <span className="text-sm font-sans text-[var(--color-text-muted)]">
                  Upcoming
                </span>
              </div>
            </div>
          </StaggerChildren>

          {/* Topic flow — search + icon rail + connected cards */}
          <StudyPlanClient topics={topicStatuses} />
        </div>

        {/* ═══ Sidebar (1/3) ═══ */}
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
