import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/cron/review-scheduler — Daily job to compute which topics are due
 *
 * Creates review_states entries for newly mastered topics.
 * A topic enters the Review Deck only AFTER it has passed the mastery gate at least once.
 *
 * Spaced intervals: 1 day → 3 days → 7 days → 21 days after last pass
 */
export async function GET(request: Request) {
  try {
    // Verify cron secret (Vercel Cron protection)
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find all mastered topics that don't have a review_state yet
    const { data: masteredTopics, error: topicsError } = await supabase
      .from('plan_topics')
      .select(`
        id,
        title,
        plan_id,
        plans!inner (
          student_id
        )
      `)
      .eq('status', 'mastered');

    if (topicsError) {
      console.error('[ReviewScheduler] Error fetching mastered topics:', topicsError);
      return NextResponse.json({ error: topicsError.message }, { status: 500 });
    }

    let created = 0;

    for (const topic of masteredTopics || []) {
      const plan = topic.plans as unknown as { student_id: string };
      const studentId = plan?.student_id;
      if (!studentId) continue;

      // Check if review_state already exists
      const { data: existing } = await supabase
        .from('review_states')
        .select('id')
        .eq('user_id', studentId)
        .eq('topic_id', topic.id)
        .single();

      if (!existing) {
        // Create initial review state — due tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        const { error: insertError } = await supabase
          .from('review_states')
          .insert({
            user_id: studentId,
            topic_id: topic.id,
            next_due_at: tomorrow.toISOString(),
            interval_days: 1,
            streak_count: 0,
          });

        if (!insertError) created++;
      }
    }

    return NextResponse.json({
      success: true,
      newReviewStatesCreated: created,
      totalMasteredTopics: masteredTopics?.length || 0,
    });
  } catch (error) {
    console.error('[ReviewScheduler] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
