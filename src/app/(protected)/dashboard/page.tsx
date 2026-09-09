import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  StudentDashboardClient,
  type StudentDashboardData,
} from "@/components/dashboard/student-dashboard-client";

/* =============================================================================
   STUDENT DASHBOARD PAGE — Server Component
   Route: /dashboard
   Fetches all student data and passes to client component for rendering.
   ============================================================================= */

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // ── Student profile ──
  const { data: student } = await supabase
    .from("students")
    .select("name, study_hours_per_day, subjects, invite_code")
    .eq("id", user.id)
    .single();

  const studentName = student?.name || user.user_metadata?.name || "Student";

  // ── Active plan + topics ──
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
    subject?: string;
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

  // ── Recent sessions ──
  const admin = createAdminClient();
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
    .limit(4);

  // ── Build mock-safe dashboard data ──
  // Uses real data where available, falls back to sensible defaults

  const now = new Date();
  const dayOfWeek = now.getDay();
  const daysOfWeek = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Build week plan from topics
  const weekPlan: StudentDashboardData["weekPlan"] = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(now);
    date.setDate(date.getDate() - dayOfWeek + i);
    const dayTopic = topicStatuses.find((t) => t.day === i + 1);

    return {
      dayAbbr: daysOfWeek[i],
      dateNumber: date.getDate(),
      isToday: i === dayOfWeek,
      session: dayTopic
        ? {
            topic: dayTopic.title,
            status:
              dayTopic.status === "mastered"
                ? ("completed" as const)
                : i === dayOfWeek
                  ? ("today" as const)
                  : i < dayOfWeek
                    ? ("completed" as const)
                    : ("upcoming" as const),
          }
        : null,
    };
  });

  // Today's session
  const todayTopic = topicStatuses.find((t) => t.day === dayOfWeek + 1);
  const todayCompleted = todayTopic?.status === "mastered";

  // Calculate streak from sessions
  const completedSessionCount = recentSessions?.length || 0;
  const streak = Math.min(completedSessionCount, 7); // Simple approximation

  // Build recent sessions list
  const formattedSessions: StudentDashboardData["recentSessions"] =
    (recentSessions || []).map((s) => {
      const topicTitle = Array.isArray(s.plan_topics)
        ? (s.plan_topics[0] as Record<string, string>)?.title
        : (s.plan_topics as Record<string, string> | null)?.title || "Study Session";
      const passed = Array.isArray(s.session_results)
        ? (s.session_results[0] as Record<string, boolean>)?.passed
        : (s.session_results as Record<string, boolean> | null)?.passed;

      const startedAt = new Date(s.started_at);
      const diffMs = now.getTime() - startedAt.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const timeAgo =
        diffDays === 0
          ? "Today"
          : diffDays === 1
            ? "Yesterday"
            : `${diffDays} days ago`;

      return {
        topic: topicTitle || "Study Session",
        subject: "General",
        result: (passed ? "passed" : "missed") as "passed" | "missed",
        timeAgo,
      };
    });

  // Build weak topics from missed sessions
  const weakTopics: StudentDashboardData["weakTopics"] = formattedSessions
    .filter((s) => s.result === "missed")
    .slice(0, 3)
    .map((s) => ({
      topic: s.topic,
      subject: s.subject,
      reason: "Missed last session",
    }));

  const dashboardData: StudentDashboardData = {
    studentName,
    streak,
    bestStreak: Math.max(streak, 3),
    todaySession: todayTopic
      ? {
          topic: todayTopic.title,
          subject: todayTopic.description || "General",
          dayOfPlan: todayTopic.day,
          totalDays: topicStatuses.length,
          estimatedMinutes: 45,
          completed: todayCompleted,
        }
      : null,
    sessionsThisMonth: {
      completed: completedSessionCount,
      planned: Math.max(topicStatuses.length, 12),
    },
    guaranteeStatus:
      completedSessionCount >= 12
        ? "qualified"
        : completedSessionCount >= 8
          ? "on-track"
          : "behind",
    guaranteeSessions: completedSessionCount,
    guaranteeDaysLeft: 30 - now.getDate(),
    weekPlan,
    weakTopics,
    recentSessions: formattedSessions,
    goal: {
      text: "Improve my biology grade by one level this term",
      daysAgo: 14,
      progress: Math.round((completedSessionCount / 12) * 100),
    },
  };

  return <StudentDashboardClient data={dashboardData} />;
}
