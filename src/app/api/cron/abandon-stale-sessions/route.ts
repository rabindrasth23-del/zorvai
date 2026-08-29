/**
 * POST /api/cron/abandon-stale-sessions
 *
 * Vercel Cron job — runs every 6 hours.
 * Marks any session with status='active' and started_at > 4 hours ago
 * as 'abandoned'. This is a safety-net sweep — the teach route also
 * auto-abandons stale sessions inline when the student returns to the
 * same topic, so this cron catches sessions on topics the student
 * never revisits.
 *
 * The cron threshold (4 hours) is more generous than the teach-route
 * threshold (2 hours) to avoid racing with a legitimately long session.
 *
 * Authenticated via CRON_SECRET header to prevent unauthorized triggers.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STALE_THRESHOLD_HOURS = 4;

function verifyCronSecret(request: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      return false;
    }
    return true; // Allow in dev without secret
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${cronSecret}`;
}

export async function POST(request: NextRequest) {
  try {
    if (!verifyCronSecret(request)) {
      return NextResponse.json(
        { error: 'Unauthorized — invalid or missing CRON_SECRET.' },
        { status: 401 }
      );
    }

    const admin = createAdminClient();

    // Calculate the cutoff timestamp
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_HOURS * 60 * 60 * 1000);

    // Find and update all stale active sessions in one query
    const { data: abandoned, error } = await admin
      .from('sessions')
      .update({
        status: 'abandoned',
        ended_at: new Date().toISOString(),
      })
      .eq('status', 'active')
      .lt('started_at', cutoff.toISOString())
      .select('id, student_id, topic_id, phase, started_at');

    if (error) {
      console.error('[cron/abandon-stale-sessions] Update failed:', error);
      return NextResponse.json({ error: 'Failed to abandon stale sessions.' }, { status: 500 });
    }

    const count = abandoned?.length ?? 0;

    if (count > 0) {
      console.log(
        `[cron/abandon-stale-sessions] Abandoned ${count} stale session(s):`,
        abandoned?.map((s) => `${s.id} (phase: ${s.phase}, started: ${s.started_at})`).join(', ')
      );

      // Clean up orphaned files in session-uploads for abandoned sessions
      for (const session of abandoned!) {
        try {
          // Find messages with attachments
          const { data: attachments } = await admin
            .from('session_messages')
            .select('attachment_url')
            .eq('session_id', session.id)
            .not('attachment_url', 'is', null);

          if (attachments && attachments.length > 0) {
            const filePaths = attachments.map(a => {
              const url = a.attachment_url as string;
              const marker = 'session-uploads/';
              const idx = url.indexOf(marker);
              return idx !== -1 ? url.slice(idx + marker.length) : url;
            }).filter(Boolean);

            if (filePaths.length > 0) {
              await admin.storage.from('session-uploads').remove(filePaths);
              console.log(
                `[cron/abandon-stale-sessions] Deleted ${filePaths.length} orphaned file(s) for session ${session.id}`
              );
            }

            // Null out attachment_urls so no broken references remain
            await admin
              .from('session_messages')
              .update({ attachment_url: null })
              .eq('session_id', session.id)
              .not('attachment_url', 'is', null);
          }
        } catch (cleanupErr) {
          // File cleanup failure should not break the cron response
          console.error(`[cron/abandon-stale-sessions] File cleanup failed for ${session.id}:`, cleanupErr);
        }
      }
    }

    return NextResponse.json({
      abandoned_count: count,
      threshold_hours: STALE_THRESHOLD_HOURS,
      cutoff: cutoff.toISOString(),
      sessions: abandoned?.map((s) => ({
        id: s.id,
        student_id: s.student_id,
        phase: s.phase,
        started_at: s.started_at,
      })),
    });
  } catch (err) {
    console.error('[cron/abandon-stale-sessions] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
