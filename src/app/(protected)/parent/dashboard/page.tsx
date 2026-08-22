import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Activity, BookOpen, CheckCircle2, RotateCcw, Clock, ShieldCheck } from "lucide-react";
import StaggerChildren from "@/components/motion/stagger-children";

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
        <div className="w-full rounded-2xl border border-[var(--color-border)] bg-surface p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">
            No linked student
          </h3>
          <p className="text-[var(--color-text-muted)] text-[var(--text-body)] max-w-sm font-sans leading-relaxed">
            Something went wrong — your account isn&apos;t linked to a student yet.
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

  // ── Fetch session history (last 20 sessions, with topic titles and results) ──
  const { data: sessions } = await admin
    .from("sessions")
    .select(`
      id,
      phase,
      status,
      started_at,
      ended_at,
      plan_topics (title),
      session_results (passed)
    `)
    .eq("student_id", studentId)
    .order("started_at", { ascending: false })
    .limit(20);

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

  const hasSessions = sessionList.length > 0;
  const completedSessions = sessionList.filter(s => s.status === "completed");

  // ── Fetch topic mastery status (from active plan) ──
  const { data: activePlan } = await admin
    .from("plans")
    .select("id")
    .eq("student_id", studentId)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle();

  let topicStatuses: Array<{ title: string; status: string; day: number }> = [];

  if (activePlan) {
    const { data: topics } = await admin
      .from("plan_topics")
      .select("title, status, day")
      .eq("plan_id", activePlan.id)
      .order("sort_order", { ascending: true });

    topicStatuses = (topics || []).map((t) => ({
      title: t.title,
      status: t.status,
      day: t.day,
    }));
  }

  const masteredCount = topicStatuses.filter(t => t.status === "mastered").length;
  const requeuedCount = topicStatuses.filter(t => t.status === "re-queued").length;
  const pendingCount = topicStatuses.filter(t => t.status === "pending").length;
  const totalTopics = topicStatuses.length;

  // ── Fetch guarantee tracking (manual/qualitative v1) ──
  const { data: guarantee } = await admin
    .from("guarantee_tracking")
    .select("status, agreed_sessions, baseline_score, follow_up_score")
    .eq("student_id", studentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // Determine guarantee status as plain language
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

  return (
    <div className="flex flex-col gap-8 h-full max-w-5xl mx-auto pb-16 pt-8 px-4">
      {/* Header */}
      <StaggerChildren delay={0}>
        <header>
          <h1 className="text-3xl md:text-4xl font-display text-[var(--color-text)] tracking-tight">
            Welcome, {parentName}
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-2 font-sans">
            Tracking progress for {studentName}
          </p>
        </header>
      </StaggerChildren>

      {/* Privacy Notice — PROMINENT, before any data */}
      <StaggerChildren delay={0.04}>
        <div className="flex items-start gap-3 rounded-[var(--radius-lg)] border border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5 p-4">
          <ShieldCheck className="w-5 h-5 text-[var(--color-primary)] shrink-0 mt-0.5" />
          <p className="text-sm text-[var(--color-text)] font-sans leading-relaxed">
            <strong className="font-semibold">Your student&apos;s privacy is protected.</strong> This dashboard shows study progress and mastery status only. Check-in reflections and personal content are private to {studentName} and are never shared.
          </p>
        </div>
      </StaggerChildren>

      {/* Stats Row — 2x2 on mobile, 4-col on desktop */}
      <StaggerChildren delay={0.08}>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Sessions Completed */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)]">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
              <Activity className="w-4 h-4" />
              <span className="font-sans text-xs font-medium uppercase tracking-wider">Sessions</span>
            </div>
            <p className="text-3xl font-display font-semibold text-[var(--color-text)]">
              {completedSessions.length}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-sans mt-1">completed</p>
          </div>

          {/* Topics Mastered */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)]">
            <div className="flex items-center gap-2 text-[var(--color-success)] mb-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="font-sans text-xs font-medium uppercase tracking-wider">Mastered</span>
            </div>
            <p className="text-3xl font-display font-semibold text-[var(--color-text)]">
              {masteredCount}<span className="text-lg text-[var(--color-text-muted)] font-normal"> / {totalTopics}</span>
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-sans mt-1">topics understood</p>
          </div>

          {/* Topics Re-queued */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)]">
            <div className="flex items-center gap-2 text-[var(--color-warning)] mb-2">
              <RotateCcw className="w-4 h-4" />
              <span className="font-sans text-xs font-medium uppercase tracking-wider">Re-queued</span>
            </div>
            <p className="text-3xl font-display font-semibold text-[var(--color-text)]">
              {requeuedCount}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] font-sans mt-1">topics need more practice</p>
          </div>

          {/* Guarantee Status */}
          <div className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-5 flex flex-col transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:border-[var(--color-border-focus)]">
            <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
              <BookOpen className="w-4 h-4" />
              <span className="font-sans text-xs font-medium uppercase tracking-wider">Guarantee</span>
            </div>
            <p className="text-lg font-display font-semibold" style={{ color: guaranteeColor }}>
              {guaranteeLabel}
            </p>
            {guarantee?.agreed_sessions && (
              <p className="text-xs text-[var(--color-text-muted)] font-sans mt-1">
                {guarantee.agreed_sessions} sessions agreed
              </p>
            )}
          </div>
        </div>
      </StaggerChildren>

      {/* Topic Mastery Status */}
      <StaggerChildren delay={0.12}>
        {topicStatuses.length > 0 ? (
          <section className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-6 pb-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-display font-medium text-[var(--color-text)]">
                Topic Mastery
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] font-sans mt-1">
                {studentName}&apos;s current study plan — {pendingCount} remaining, {masteredCount} mastered, {requeuedCount} reviewing
              </p>
            </div>
            <div className="divide-y divide-[var(--color-border)]">
              {topicStatuses.map((topic, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[var(--color-bg)]/50 transition-colors">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    topic.status === "mastered"
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : topic.status === "re-queued"
                      ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  }`}>
                    {topic.status === "mastered" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : topic.status === "re-queued" ? (
                      <RotateCcw className="w-4 h-4" />
                    ) : (
                      <Clock className="w-4 h-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm text-[var(--color-text)] truncate font-medium">
                      {topic.title}
                    </p>
                    <p className="font-sans text-xs text-[var(--color-text-muted)]">
                      Day {topic.day}
                    </p>
                  </div>
                  <span className={`text-xs font-medium font-sans px-2.5 py-1 rounded-full shrink-0 ${
                    topic.status === "mastered"
                      ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                      : topic.status === "re-queued"
                      ? "bg-[var(--color-warning)]/10 text-[var(--color-warning)]"
                      : "bg-[var(--color-primary)]/10 text-[var(--color-primary)]"
                  }`}>
                    {topic.status === "mastered" ? "Understood" : topic.status === "re-queued" ? "Reviewing" : "Upcoming"}
                  </span>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
              <BookOpen className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-display font-medium text-[var(--color-text)] text-lg mb-1">No study plan yet</h3>
            <p className="text-[var(--color-text-muted)] text-sm font-sans max-w-sm">
              {studentName} hasn&apos;t completed onboarding yet. Topics will appear here once their study plan is generated.
            </p>
          </section>
        )}
      </StaggerChildren>

      {/* Session History */}
      <StaggerChildren delay={0.16}>
        {hasSessions ? (
          <section className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] overflow-hidden">
            <div className="p-6 pb-4 border-b border-[var(--color-border)]">
              <h2 className="text-lg font-display font-medium text-[var(--color-text)]">
                Session History
              </h2>
              <p className="text-sm text-[var(--color-text-muted)] font-sans mt-1">
                Recent study sessions
              </p>
            </div>

            {/* Desktop table — hidden on mobile */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left font-sans text-sm">
                <thead className="bg-[var(--color-bg)] text-[var(--color-text-muted)] border-b border-[var(--color-border)] text-[11px] uppercase tracking-widest">
                  <tr>
                    <th className="px-6 py-3.5 font-medium">Topic</th>
                    <th className="px-6 py-3.5 font-medium">Status</th>
                    <th className="px-6 py-3.5 font-medium">Result</th>
                    <th className="px-6 py-3.5 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border)]">
                  {sessionList.map((s) => (
                    <tr key={s.id} className="hover:bg-[var(--color-bg)]/50 transition-colors">
                      <td className="px-6 py-3.5 text-[var(--color-text)] font-medium max-w-[200px] truncate">
                        {s.topic}
                      </td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === "completed"
                            ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                            : s.status === "active"
                            ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                            : "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]"
                        }`}>
                          {s.status === "completed" ? "Completed" : s.status === "active" ? "In Progress" : "Abandoned"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-[var(--color-text-muted)]">
                        {s.passed === true ? (
                          <span className="text-[var(--color-success)] font-medium">Passed</span>
                        ) : s.passed === false ? (
                          <span className="text-[var(--color-warning)] font-medium">Needs Review</span>
                        ) : (
                          <span>&mdash;</span>
                        )}
                      </td>
                      <td className="px-6 py-3.5 text-[var(--color-text-muted)] whitespace-nowrap">
                        {new Date(s.startedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards — hidden on desktop */}
            <div className="md:hidden divide-y divide-[var(--color-border)]">
              {sessionList.map((s) => (
                <div key={s.id} className="p-4 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <p className="font-sans text-sm text-[var(--color-text)] font-medium truncate max-w-[200px]">
                      {s.topic}
                    </p>
                    <span className="font-sans text-xs text-[var(--color-text-muted)] whitespace-nowrap ml-2">
                      {new Date(s.startedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      s.status === "completed"
                        ? "bg-[var(--color-success)]/10 text-[var(--color-success)]"
                        : s.status === "active"
                        ? "bg-[var(--color-accent)]/10 text-[var(--color-accent)]"
                        : "bg-[var(--color-text-muted)]/10 text-[var(--color-text-muted)]"
                    }`}>
                      {s.status === "completed" ? "Completed" : s.status === "active" ? "In Progress" : "Abandoned"}
                    </span>
                    {s.passed === true ? (
                      <span className="text-xs text-[var(--color-success)] font-medium">Passed</span>
                    ) : s.passed === false ? (
                      <span className="text-xs text-[var(--color-warning)] font-medium">Needs Review</span>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="bg-surface border border-[var(--color-border)] rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-8 flex flex-col items-center text-center">
            <div className="w-14 h-14 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-4">
              <Activity className="w-7 h-7 text-[var(--color-primary)]" />
            </div>
            <h3 className="font-display font-medium text-[var(--color-text)] text-lg mb-1">No sessions yet</h3>
            <p className="text-[var(--color-text-muted)] text-sm font-sans max-w-sm">
              {studentName} hasn&apos;t started studying yet. Sessions will appear here once they begin.
            </p>
          </section>
        )}
      </StaggerChildren>
    </div>
  );
}
