/**
 * POST /api/cron/weekly-digest
 *
 * Vercel Cron job — runs weekly, builds a study progress digest
 * for each parent and sends it via their preferred channel(s).
 *
 * Digest content: sessions completed, topics mastered vs. re-queued,
 * pass rate, guarantee status — all from the last 7 days.
 *
 * Authenticated via CRON_SECRET header.
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
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

// ---------------------------------------------------------------------------
// Digest data types
// ---------------------------------------------------------------------------

interface DigestData {
  studentName: string;
  sessionsCompleted: number;
  sessionsAbandoned: number;
  topicsMastered: number;
  topicsReQueued: number;
  topicsPending: number;
  passRate: number;
  guaranteeStatus: string | null;
}

// ---------------------------------------------------------------------------
// Build HTML email from digest data
// ---------------------------------------------------------------------------

function buildDigestHtml(digest: DigestData): string {
  return `
    <div style="font-family: sans-serif; max-width: 520px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Weekly Study Digest — ${digest.studentName}</h2>
      
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #666;">Sessions completed</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${digest.sessionsCompleted}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #666;">Sessions abandoned</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${digest.sessionsAbandoned}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #666;">Topics mastered</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #16a34a;">${digest.topicsMastered}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #666;">Topics re-queued</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600; color: #dc2626;">${digest.topicsReQueued}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 8px 0; color: #666;">Pass rate</td>
          <td style="padding: 8px 0; text-align: right; font-weight: 600;">${digest.passRate}%</td>
        </tr>
      </table>

      ${
        digest.guaranteeStatus
          ? `<p style="padding: 12px; background: #f0fdf4; border-radius: 8px; font-size: 14px;">
              <strong>Guarantee status:</strong> ${digest.guaranteeStatus}
            </p>`
          : ''
      }

      <p style="color: #888; font-size: 13px; margin-top: 24px;">
        This is your weekly digest from Zorvai. You can change how you receive updates
        in your notification settings.
      </p>
    </div>
  `;
}

// ---------------------------------------------------------------------------
// Build push notification summary
// ---------------------------------------------------------------------------

function buildDigestPushBody(digest: DigestData): string {
  return (
    `${digest.studentName}'s week: ${digest.sessionsCompleted} sessions, ` +
    `${digest.topicsMastered} topics mastered, ${digest.passRate}% pass rate.`
  );
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

    // 2. Get all parent-student links
    const { data: links, error: linksError } = await admin
      .from('student_parent_links')
      .select('parent_id, student_id');

    if (linksError || !links) {
      console.error('[cron/weekly-digest] Failed to fetch links:', linksError);
      return NextResponse.json({ error: 'Failed to fetch parent-student links.' }, { status: 500 });
    }

    if (links.length === 0) {
      return NextResponse.json({ digests_sent: 0, message: 'No parent-student links found.' });
    }

    // 3. Date range: last 7 days
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);

    let digestsSent = 0;
    const errors: Array<{ parent_id: string; error: string }> = [];

    for (const link of links) {
      try {
        // 4. Get student name
        const { data: student } = await admin
          .from('students')
          .select('name')
          .eq('id', link.student_id)
          .single();

        const studentName = student?.name ?? 'Your student';

        // 5. Get sessions from last 7 days
        const { data: sessions } = await admin
          .from('sessions')
          .select(`
            status,
            session_results (passed)
          `)
          .eq('student_id', link.student_id)
          .gte('started_at', weekAgo.toISOString())
          .lte('started_at', now.toISOString());

        const sessionsCompleted = sessions?.filter((s) => s.status === 'completed').length ?? 0;
        const sessionsAbandoned = sessions?.filter((s) => s.status === 'abandoned').length ?? 0;

        // Count passed sessions
        const passedSessions = sessions?.filter((s) => {
          const results = s.session_results as Array<{ passed: boolean }> | null;
          return results?.[0]?.passed === true;
        }).length ?? 0;

        const passRate = sessionsCompleted > 0
          ? Math.round((passedSessions / sessionsCompleted) * 100)
          : 0;

        // 6. Get current plan topics status
        const { data: activePlan } = await admin
          .from('plans')
          .select('id')
          .eq('student_id', link.student_id)
          .eq('is_active', true)
          .single();

        let topicsMastered = 0;
        let topicsReQueued = 0;
        let topicsPending = 0;

        if (activePlan) {
          const { data: topics } = await admin
            .from('plan_topics')
            .select('status')
            .eq('plan_id', activePlan.id);

          topicsMastered = topics?.filter((t) => t.status === 'mastered').length ?? 0;
          topicsReQueued = topics?.filter((t) => t.status === 're-queued').length ?? 0;
          topicsPending = topics?.filter((t) => t.status === 'pending').length ?? 0;
        }

        // 7. Get guarantee status
        const { data: guarantee } = await admin
          .from('guarantee_tracking')
          .select('status')
          .eq('student_id', link.student_id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        const guaranteeStatus = guarantee?.status ?? null;

        // 8. Build and send digest
        const digest: DigestData = {
          studentName,
          sessionsCompleted,
          sessionsAbandoned,
          topicsMastered,
          topicsReQueued,
          topicsPending,
          passRate,
          guaranteeStatus,
        };

        await notifyParent(link.parent_id, {
          title: `Zorvai Weekly Digest — ${studentName}`,
          body: buildDigestPushBody(digest),
          emailHtml: buildDigestHtml(digest),
        });

        digestsSent++;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        errors.push({ parent_id: link.parent_id, error: errorMsg });
        console.error(`[cron/weekly-digest] Failed for parent ${link.parent_id}:`, errorMsg);
      }
    }

    // 9. Return summary
    return NextResponse.json({
      digests_sent: digestsSent,
      total_links: links.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    console.error('[cron/weekly-digest] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
