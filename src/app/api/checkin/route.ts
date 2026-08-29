/**
 * POST /api/checkin
 *
 * Phase 3.5 — Check-in with escalation logic.
 * - Accepts mood_text from student
 * - Calls runAICall('checkin', payload) for tier classification
 * - Always logs mood_text + tier to checkins table
 * - Notification path gated behind ESCALATION_LOGIC_ENABLED feature flag:
 *   - Flag OFF (default): log tier, take no downstream action (dry run)
 *   - Flag ON: execute notification logic per tier
 *
 * See: Checkin Escalation doc, PROJECT_CONTEXT.md
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { CheckinResponse } from '@/lib/ai/schema';
import {
  REVIEW_QUEUE_REASONS,
  TIER_1_STUDENT_DISCLOSURE,
  TIER_2_STUDENT_SAFETY_MESSAGE,
  TIER_1_PARENT_NOTIFICATION,
  TIER_2_PARENT_NOTIFICATION_URGENT,
} from '@/lib/checkin/messages';
import { notifyParent } from '@/lib/notifications';

const CheckinRequestSchema = z.object({
  mood_text: z.string().min(1, 'Mood text cannot be empty'),
  session_id: z.string().uuid().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify student
    const admin = createAdminClient();
    const { data: student } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 3. Parse request
    const body = await request.json();
    const parsed = CheckinRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { mood_text, session_id } = parsed.data;

    // 4. Call AI for tier classification
    const result = await runAICall<CheckinResponse>('checkin', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
        grade: student.grade ?? undefined,
        educationLevel: student.education_level ?? undefined,
      },
      moodText: mood_text,
    });

    const classification = result.data;

    // 5. Determine notification_status
    const escalationEnabled = process.env.ESCALATION_LOGIC_ENABLED === 'true';
    let notificationStatus: string = 'not_applicable';

    if (escalationEnabled && classification.tier >= 1) {
      if (classification.stressor_may_involve_linked_adult) {
        notificationStatus = 'queued_for_review';
      } else {
        notificationStatus = 'sent'; // Will be set to 'send_failed' if notification fails
      }
    }

    // 6. Insert checkin record (ALWAYS — even with flag off)
    const { data: checkin, error: checkinError } = await admin
      .from('checkins')
      .insert({
        student_id: user.id,
        session_id: session_id ?? null,
        mood_text,
        escalation_tier: classification.tier,
        stressor_may_involve_linked_adult:
          classification.stressor_may_involve_linked_adult,
        notification_status: notificationStatus,
      })
      .select('id')
      .single();

    if (checkinError || !checkin) {
      console.error('[/api/checkin] Failed to insert checkin:', checkinError);
      return NextResponse.json(
        { error: 'Failed to save check-in' },
        { status: 500 }
      );
    }

    // 7. If escalation is enabled AND stressor involves linked adult,
    //    route to review queue instead of auto-notifying
    if (
      escalationEnabled &&
      classification.tier >= 1 &&
      classification.stressor_may_involve_linked_adult
    ) {
      const reason =
        classification.tier === 2
          ? REVIEW_QUEUE_REASONS.adult_stressor_tier_2
          : REVIEW_QUEUE_REASONS.adult_stressor_tier_1;

      await admin.from('checkin_review_queue').insert({
        checkin_id: checkin.id,
        reason,
        status: 'pending',
      });

      console.warn(
        `[/api/checkin] Tier ${classification.tier} routed to review queue ` +
          `(stressor_may_involve_linked_adult=true). Checkin ID: ${checkin.id}`
      );
    }

    // 8. If escalation is enabled AND tier >= 1 AND NOT routed to review queue,
    //    send notification to linked parent using fixed copy from messages.ts.
    if (
      escalationEnabled &&
      classification.tier >= 1 &&
      !classification.stressor_may_involve_linked_adult
    ) {
      // Look up the linked parent
      const { data: link } = await admin
        .from('student_parent_links')
        .select('parent_id')
        .eq('student_id', user.id)
        .limit(1)
        .single();

      if (link) {
        const notifCopy =
          classification.tier === 2
            ? TIER_2_PARENT_NOTIFICATION_URGENT
            : TIER_1_PARENT_NOTIFICATION;

        try {
          await notifyParent(link.parent_id, {
            title: notifCopy.title,
            body: notifCopy.body,
          });
        } catch (notifErr) {
          // Notification failed — update status but don't fail the checkin response
          console.error(
            `[/api/checkin] Failed to notify parent for checkin ${checkin.id}:`,
            notifErr
          );
          await admin
            .from('checkins')
            .update({ notification_status: 'send_failed' })
            .eq('id', checkin.id);
        }
      } else {
        console.warn(
          `[/api/checkin] Tier ${classification.tier} but no linked parent found ` +
            `for student ${user.id}. Checkin ID: ${checkin.id}`
        );
      }
    }

    // 9. Build response
    // Don't expose rationale to the student — that's internal
    const response: Record<string, unknown> = {
      checkin_id: checkin.id,
      tier: classification.tier,
      suggested_session_adjustment: classification.suggested_session_adjustment,
      escalation_enabled: escalationEnabled,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    };

    // 10. Include fixed student-facing message for tier >= 1.
    // This is decoupled from ESCALATION_LOGIC_ENABLED — the student
    // sees the disclosure/safety copy based on tier alone. The flag
    // only controls whether the backend notification actually fires.
    if (classification.tier === 1) {
      response.student_message = TIER_1_STUDENT_DISCLOSURE;
    } else if (classification.tier === 2) {
      response.student_message = TIER_2_STUDENT_SAFETY_MESSAGE;
    }

    // 11. If flag is off, note the dry-run status
    if (!escalationEnabled && classification.tier >= 1) {
      response.dry_run_note =
        'ESCALATION_LOGIC_ENABLED=false — tier was logged but no notification was sent. ' +
        'This is a dry-run period for observing tier distribution.';
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('[/api/checkin] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
