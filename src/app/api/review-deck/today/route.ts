import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/review-deck/today — Return topics due for spaced review today
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();

    // Fetch review states where next_due_at <= now
    const { data: dueReviews, error } = await supabase
      .from('review_states')
      .select(`
        id,
        topic_id,
        last_reviewed_at,
        next_due_at,
        streak_count,
        interval_days,
        plan_topics!inner (
          title,
          description,
          plan_id,
          status
        )
      `)
      .eq('user_id', user.id)
      .lte('next_due_at', now)
      .order('next_due_at', { ascending: true })
      .limit(10);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const reviews = (dueReviews || []).map((r: Record<string, unknown>) => {
      const topic = r.plan_topics as Record<string, unknown>;
      return {
        id: r.id,
        topicId: r.topic_id,
        topicTitle: topic?.title || 'Unknown topic',
        topicDescription: topic?.description || '',
        streakCount: r.streak_count,
        intervalDays: r.interval_days,
        lastReviewedAt: r.last_reviewed_at,
        nextDueAt: r.next_due_at,
      };
    });

    return NextResponse.json({
      reviews,
      count: reviews.length,
    });
  } catch (error) {
    console.error('[ReviewDeck] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
