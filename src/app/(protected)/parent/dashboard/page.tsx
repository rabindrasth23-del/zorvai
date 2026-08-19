import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Activity } from "lucide-react";

export const metadata = {
  title: "Parent Dashboard | Zorvai",
  description: "Track your student's progress.",
};

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const admin = createAdminClient();

  // Get the linked student
  const { data: link } = await admin
    .from("student_parent_links")
    .select("student_id")
    .eq("parent_id", user.id)
    .limit(1)
    .single();

  if (!link) {
    return (
      <div className="flex flex-col gap-12 animate-element h-full max-w-5xl mx-auto pb-16 pt-8 px-4">
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

  // Fetch student name
  const { data: student } = await admin
    .from("students")
    .select("name")
    .eq("id", link.student_id)
    .single();

  const studentName = student?.name || "Your student";

  // Fetch session count
  const { count: sessionCount } = await admin
    .from("sessions")
    .select("*", { count: "exact", head: true })
    .eq("student_id", link.student_id);

  const hasSessions = (sessionCount && sessionCount > 0) ? true : false;

  // Get parent name for greeting
  const { data: parentRow } = await admin
    .from("parents")
    .select("name")
    .eq("id", user.id)
    .single();

  const parentName = parentRow?.name || "Parent";

  return (
    <div className="flex flex-col gap-12 animate-element h-full max-w-5xl mx-auto pb-16 pt-8 px-4">
      <header>
        <h1 className="text-3xl md:text-4xl font-display text-[var(--color-text)] tracking-tight">
          Welcome, {parentName}
        </h1>
        <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-2 font-sans">
          Tracking progress for {studentName}
        </p>
      </header>

      {hasSessions ? (
        <div className="w-full rounded-2xl border border-[var(--color-border)] bg-surface p-8 sm:p-12 shadow-[var(--shadow-sm)]">
          <p className="text-[var(--text-body)] text-[var(--color-text)] font-sans">
            {studentName} has completed {sessionCount} {sessionCount === 1 ? "session" : "sessions"}.
          </p>
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-2">
            Detailed progress view coming soon.
          </p>
        </div>
      ) : (
        <div className="w-full rounded-2xl border border-[var(--color-border)] bg-surface p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)]">
          <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
            <Activity className="w-8 h-8 text-[var(--color-primary)]" />
          </div>
          <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">
            No sessions yet
          </h3>
          <p className="text-[var(--color-text-muted)] text-[var(--text-body)] max-w-sm font-sans leading-relaxed">
            {studentName} hasn&apos;t started studying yet. Sessions will appear here once they begin.
          </p>
        </div>
      )}
    </div>
  );
}
