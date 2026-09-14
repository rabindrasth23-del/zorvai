import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/parent/sessions — Session history for parent view
 * Shows completed sessions with feedback summaries
 * PRIVACY: Check-in data is NEVER exposed — only wellness indicator
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Find the child linked to this parent
    const { data: link } = await supabase
      .from('parent_student_links')
      .select('student_id')
      .eq('parent_id', user.id)
      .limit(1)
      .single();

    if (!link) {
      return NextResponse.json({ sessions: [] });
    }

    // Fetch completed sessions with topic info
    const { data: sessions } = await supabase
      .from('sessions')
      .select(`
        id,
        status,
        started_at,
        completed_at,
        plan_topics!inner (
          title,
          plans!inner (
            subject
          )
        )
      `)
      .eq('student_id', link.student_id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(30);

    const sessionRecords = (sessions || []).map((s: Record<string, unknown>) => {
      const topic = s.plan_topics as { title: string; plans: { subject: string } } | null;
      const startedAt = s.started_at as string;
      const completedAt = s.completed_at as string;

      // Calculate duration
      const duration = startedAt && completedAt
        ? Math.round((new Date(completedAt).getTime() - new Date(startedAt).getTime()) / 60000)
        : 0;

      return {
        id: s.id,
        subject: topic?.plans?.subject || 'General',
        topic_title: topic?.title || 'Study session',
        phase: 'completed',
        mastery_result: 'reviewed', // Simplified for parent view
        feedback_summary: null, // Would be populated from feedback phase
        duration_minutes: duration,
        completed_at: completedAt,
      };
    });

    return NextResponse.json({ sessions: sessionRecords });
  } catch (error) {
    console.error('[Parent/Sessions] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
