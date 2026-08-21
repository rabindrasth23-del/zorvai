import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarCheck2, Activity, LayoutDashboard, BookOpen, History } from "lucide-react";
import { InviteCodeCard, LinkNotificationBanner } from "@/components/dashboard/parent-link-widgets";
import { CircularProgress } from "@/components/ui/circular-progress";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedSearchParams = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return null; // Handled by layout guard

  // Fetch the actual student profile including subjects and invite_code
  const { data: student, error } = await supabase
    .from('students')
    .select('name, study_hours_per_day, subjects, invite_code')
    .eq('id', user.id)
    .single();

  if (error || !student) {
    // If the layout guard failed to catch an onboarding bypass, or the DB fetch failed,
    // explicitly crash the page so the bug is highly visible and trackable.
    throw new Error(`Critical State Error: Failed to load student profile (Layout guard may have been bypassed). Details: ${error?.message || "Profile not found"}`);
  }

  // Fallback to "Student" ONLY if the row exists but the name is empty
  const studentName = student.name || "Student";
  const targetHours = student.study_hours_per_day ?? 0;
  const subjects = student.subjects || [];
  const inviteCode = student.invite_code || "";

  // Check for unnotified parent links (for the "a parent linked" banner)
  const admin = createAdminClient();
  const { data: unnotifiedLinks } = await admin
    .from('student_parent_links')
    .select('id, parent_id, created_at')
    .eq('student_id', user.id)
    .eq('student_notified', false);

  // Fetch parent names for any unnotified links
  const linkBanners: Array<{ linkId: string; parentName: string; linkedAt: string }> = [];
  if (unnotifiedLinks && unnotifiedLinks.length > 0) {
    for (const link of unnotifiedLinks) {
      const { data: parentRow } = await admin
        .from('parents')
        .select('name')
        .eq('id', link.parent_id)
        .single();
      linkBanners.push({
        linkId: link.id,
        parentName: parentRow?.name || 'A parent',
        linkedAt: link.created_at,
      });
    }
  }

  // Check if they have any sessions yet to drive the empty state
  const { count: sessionCount, error: countError } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', user.id);

  const hasSessions = (sessionCount && sessionCount > 0) ? true : false;
  
  // We have no actual session data array built out yet
  const sessionsList: any[] = [];

  return (
    <div className="flex flex-col gap-12 animate-element h-full max-w-5xl mx-auto pb-16 px-4">

      {/* Link notification banners */}
      {linkBanners.map((b) => (
        <LinkNotificationBanner
          key={b.linkId}
          linkId={b.linkId}
          parentName={b.parentName}
          linkedAt={b.linkedAt}
        />
      ))}

      <header className="w-full relative overflow-hidden rounded-[var(--radius-xl)] bg-[var(--color-primary)] text-white p-8 sm:p-10 shadow-md">
        <div className="absolute top-0 right-0 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
          <BookOpen className="w-64 h-64" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-display tracking-tight text-white mb-2">
              Welcome back, {studentName}
            </h1>
            <p className="text-white/80 font-sans text-lg">
              Ready to hit your {targetHours}-hour target today?
            </p>
          </div>
          <Button asChild className="rounded-full h-12 px-8 font-sans font-medium bg-white text-[var(--color-primary)] hover:bg-white/90 shadow-sm transition-all hover:scale-105 shrink-0">
            <Link href="/checkin">
              <CalendarCheck2 className="mr-2 w-5 h-5" />
              Start Daily Check-in
            </Link>
          </Button>
        </div>
      </header>

      {/* BENTO GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Metric 1: Progress */}
        <section className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-6 md:p-8 flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-display font-medium text-[var(--color-text)] mb-6 self-start">Today's Progress</h2>
          <CircularProgress 
            value={0} 
            size={160} 
            strokeWidth={12} 
            label="0 / 120 mins" 
            colorClass="text-[var(--color-accent)]"
          />
          <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-6">
            Start a session to fill your ring.
          </p>
        </section>

        {/* Metric 2: Streak & Sessions */}
        <section className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          {hasSessions ? (
            <>
              <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-success)]/10 flex items-center justify-center text-[var(--color-success)] mb-4">
                  <Activity className="w-6 h-6" />
                </div>
                <h3 className="text-[var(--color-text-muted)] font-sans text-sm font-medium uppercase tracking-wider mb-1">Current Streak</h3>
                <p className="text-4xl font-display font-semibold text-[var(--color-text)]">0 <span className="text-xl text-[var(--color-text-muted)] font-normal">days</span></p>
              </div>
              <div className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-6 flex flex-col justify-center">
                <div className="w-12 h-12 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center text-[var(--color-primary)] mb-4">
                  <History className="w-6 h-6" />
                </div>
                <h3 className="text-[var(--color-text-muted)] font-sans text-sm font-medium uppercase tracking-wider mb-1">Total Sessions</h3>
                <p className="text-4xl font-display font-semibold text-[var(--color-text)]">{sessionCount || 0}</p>
              </div>
            </>
          ) : (
            <div className="sm:col-span-2 rounded-[var(--radius-xl)] border border-[var(--color-border)] bg-surface p-8 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)] h-full">
              <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                <Activity className="w-8 h-8 text-[var(--color-primary)]" />
              </div>
              <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">
                No sessions yet.
              </h3>
              <p className="text-[var(--color-text-muted)] text-[var(--text-body)] max-w-sm font-sans leading-relaxed">
                Complete an onboarding check-in to start building your streak and mastery score.
              </p>
            </div>
          )}
        </section>

        {/* Parent Linking */}
        <section className="bg-surface border border-border rounded-[var(--radius-xl)] shadow-[var(--shadow-sm)] p-6 md:p-8 md:col-span-3">
          <h2 className="text-lg font-display font-medium text-[var(--color-text)] mb-6">Parent Connection</h2>
          <div className="max-w-md">
            <InviteCodeCard code={inviteCode} />
          </div>
        </section>

      </div>
    </div>
  );
}
