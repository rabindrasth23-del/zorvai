import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/review-deck/:topicId/complete — Log review outcome, update interval
 *
 * Spaced repetition intervals: 1 → 3 → 7 → 21 days
 * Reset to 1 day on failed review
 */

const INTERVALS = [1, 3, 7, 21, 42, 90]; // days

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ topicId: string }> }
) {
  try {
    const { topicId } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { passed } = body as { passed: boolean };

    // Fetch current review state
    const { data: reviewState } = await supabase
      .from('review_states')
      .select('*')
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .single();

    if (!reviewState) {
      return NextResponse.json({ error: 'Review state not found' }, { status: 404 });
    }

    const now = new Date();
    let newStreak: number;
    let newIntervalDays: number;

    if (passed) {
      // Advance to next interval
      newStreak = reviewState.streak_count + 1;
      const intervalIndex = Math.min(newStreak, INTERVALS.length - 1);
      newIntervalDays = INTERVALS[intervalIndex];
    } else {
      // Reset to beginning
      newStreak = 0;
      newIntervalDays = INTERVALS[0]; // 1 day
    }

    const nextDueAt = new Date(now.getTime() + newIntervalDays * 24 * 60 * 60 * 1000);

    // Update review state
    const { error } = await supabase
      .from('review_states')
      .update({
        last_reviewed_at: now.toISOString(),
        next_due_at: nextDueAt.toISOString(),
        streak_count: newStreak,
        interval_days: newIntervalDays,
      })
      .eq('id', reviewState.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      passed,
      newStreak,
      nextDueAt: nextDueAt.toISOString(),
      intervalDays: newIntervalDays,
    });
  } catch (error) {
    console.error('[ReviewDeck] Complete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
