import { StatCard } from "@/components/ui/stat-card";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CalendarCheck2, Activity, LayoutDashboard, BookOpen, History } from "lucide-react";
import { InviteCodeCard, LinkNotificationBanner } from "@/components/dashboard/parent-link-widgets";
import { LinearProgress } from "@/components/ui/linear-progress";

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

      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pt-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-display text-[var(--color-text)] tracking-tight">
            Welcome back, {studentName}
          </h1>
          <p className="text-[var(--text-body)] text-[var(--color-text-muted)] mt-2 font-sans">
            Your daily target is {targetHours} {targetHours === 1 ? 'hour' : 'hours'}.
          </p>
        </div>
        
        {/* PRIMARY CTA: Visual focal point */}
        <Button asChild className="rounded-xl h-12 px-8 font-sans font-medium shadow-sm shrink-0 bg-[var(--color-primary)] text-white hover:opacity-90 transition-opacity w-full sm:w-auto">
          <Link href="/checkin">
            <CalendarCheck2 className="mr-2 w-5 h-5" />
            Start Daily Check-in
          </Link>
        </Button>
      </header>




        <div className="flex flex-col gap-12">
          {/* STAT CARDS / EMPTY STATE */}
          <section>
            {hasSessions ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <StatCard title="Sessions" value={`${sessionCount || 0}`} iconType="sessions" />
              </div>
            ) : (
              <div className="w-full rounded-2xl border border-[var(--color-border)] bg-surface p-8 sm:p-12 flex flex-col items-center justify-center text-center shadow-[var(--shadow-sm)]">
                <div className="w-16 h-16 rounded-full bg-[var(--color-primary)]/10 flex items-center justify-center mb-5">
                  <Activity className="w-8 h-8 text-[var(--color-primary)]" />
                </div>
                <h3 className="font-display font-medium text-[var(--color-text)] text-xl mb-2">
                  No sessions found.
                </h3>
                <p className="text-[var(--color-text-muted)] text-[var(--text-body)] max-w-sm font-sans leading-relaxed">
                  Complete an onboarding check-in to start building your streak and mastery score.
                </p>
              </div>
            )}
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            <section className="lg:col-span-2 flex flex-col gap-6">
              <h2 className="text-xl font-display font-medium text-[var(--color-text)]">
                Today's Progress
              </h2>
              <div className="p-6 bg-surface border border-border rounded-2xl shadow-[var(--shadow-sm)]">
                <LinearProgress 
                  value={0} 
                  label={`Daily Goal: ${targetHours} ${targetHours === 1 ? 'hour' : 'hours'}`} 
                  colorClass="bg-[var(--color-accent)]"
                />
                <p className="text-[var(--text-body-sm)] text-[var(--color-text-muted)] font-sans mt-4">
                  0 minutes studied today. Start a session to build your streak!
                </p>
              </div>
            </section>

            {/* INVITE CODE for parent linking */}
            <section>
              <h2 className="text-xl font-display font-medium text-[var(--color-text)] mb-4">
                Parent Linking
              </h2>
              <InviteCodeCard code={inviteCode} />
            </section>
          </div>
        </div>
    </div>
  );
}
