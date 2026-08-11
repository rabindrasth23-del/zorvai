/**
 * POST /api/cron/missed-session-check
 *
 * Vercel Cron job — runs daily, finds students who haven't started
 * ANY session today, and sends a notification to their linked parent.
 *
 * Per PROJECT_CONTEXT: an abandoned session (started but dropped) counts
 * as "tried" — only students with NO session for the day get alerted.
 *
 * Authenticated via CRON_SECRET header to prevent unauthorized triggers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { notifyParent } from '@/lib/notifications';

// ---------------------------------------------------------------------------
// Cron authentication
// ---------------------------------------------------------------------------

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    // No secret configured — allow in dev, block in production
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Verify cron authentication
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized — invalid or missing CRON_SECRET.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // 2. Get the start and end of "today" in UTC
    //    Students have a timezone field — ideally we'd check per-student-timezone,
    //    but for v1 we use UTC. A timezone-aware version can be added later.
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // 3. Find all students who have an active plan
    const { data: studentsWithPlans, error: studentsError } = await admin
      .from('plans')
      .select('student_id')
      .eq('is_active', true);

    if (studentsError || !studentsWithPlans) {
      console.error('[cron/missed-session-check] Failed to fetch active plans:', studentsError);
      return NextResponse.json(
        { error: 'Failed to fetch active plans.' },
        { status: 500 }
      );
    }

    const studentIds = [...new Set(studentsWithPlans.map((p) => p.student_id))];

    if (studentIds.length === 0) {
      return NextResponse.json({ checked: 0, alerted: 0, message: 'No students with active plans.' });
    }

    // 4. Find which of these students have ANY session today
    //    (any status — active, completed, or abandoned all count as "tried")
    const { data: todaySessions } = await admin
      .from('sessions')
      .select('student_id')
      .in('student_id', studentIds)
      .gte('started_at', todayStart.toISOString())
      .lte('started_at', todayEnd.toISOString());

    const studentsWhoStudied = new Set(
      todaySessions?.map((s) => s.student_id) ?? []
    );

    // 5. Students who DIDN'T study today
    const missedStudentIds = studentIds.filter((id) => !studentsWhoStudied.has(id));

    if (missedStudentIds.length === 0) {
      return NextResponse.json({
        checked: studentIds.length,
        alerted: 0,
        message: 'All students with active plans studied today.',
      });
    }

    // 6. For each missed student, find their linked parent and notify
    let alertedCount = 0;
    const errors: Array<{ student_id: string; error: string }> = [];

    for (const studentId of missedStudentIds) {
      // Get student name for the notification
      const { data: student } = await admin
        .from('students')
        .select('name')
        .eq('id', studentId)
        .single();

      // Get linked parent
      const { data: link } = await admin
        .from('student_parent_links')
        .select('parent_id')
        .eq('student_id', studentId)
        .limit(1)
        .single();

      if (!link) {
        // No linked parent — skip (student might not have a parent account yet)
        continue;
      }

      const studentName = student?.name ?? 'Your student';

      try {
        await notifyParent(link.parent_id, {
          title: 'Missed session today',
          body: `Heads up — ${studentName} hasn't started their study session today. No pressure, just a friendly nudge.`,
          emailHtml: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #333;">Missed session today</h2>
              <p>Heads up — <strong>${studentName}</strong> hasn't started their study session today.</p>
              <p>No pressure, just a friendly nudge so you're in the loop.</p>
              <p style="color: #888; font-size: 13px;">— Zorvai</p>
            </div>
          `,
        });
        alertedCount++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ student_id: studentId, error: errorMsg });
        console.error(`[cron/missed-session-check] Failed to notify parent for student ${studentId}:`, errorMsg);
      }
    }

    // 7. Return summary
    return NextResponse.json({
      checked: studentIds.length,
      missed: missedStudentIds.length,
      alerted: alertedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('[cron/missed-session-check] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
