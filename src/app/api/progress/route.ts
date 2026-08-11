/**
 * GET /api/progress
 *
 * Returns a student's progress data — session history, plan topics,
 * and recent check-ins. Used by both Student and Parent dashboards.
 * - If called by a parent, looks up the linked student
 * - If called by a student, returns their own data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
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

    const admin = createAdminClient();

    // 2. Determine if this is a student or parent
    let studentId: string;

    // Check if student
    const { data: student } = await admin
      .from('students')
      .select('id')
      .eq('id', user.id)
      .single();

    if (student) {
      studentId = student.id;
    } else {
      // Check if parent — look up linked student
      const { data: parent } = await admin
        .from('parents')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!parent) {
        return NextResponse.json(
          { error: 'User is neither a student nor a parent' },
          { status: 403 }
        );
      }

      // Allow override via query param for parents with multiple students (future)
      const url = new URL(request.url);
      const queryStudentId = url.searchParams.get('student_id');

      if (queryStudentId) {
        // Verify this parent is linked to this student
        const { data: link } = await admin
          .from('student_parent_links')
          .select('id')
          .eq('parent_id', user.id)
          .eq('student_id', queryStudentId)
          .single();

        if (!link) {
          return NextResponse.json(
            { error: 'You are not linked to this student' },
            { status: 403 }
          );
        }
        studentId = queryStudentId;
      } else {
        // Default to the first linked student
        const { data: link } = await admin
          .from('student_parent_links')
          .select('student_id')
          .eq('parent_id', user.id)
          .limit(1)
          .single();

        if (!link) {
          return NextResponse.json(
            { error: 'No linked student found' },
            { status: 404 }
          );
        }
        studentId = link.student_id;
      }
    }

    // 3. Fetch the active plan with topics
    const { data: activePlan } = await admin
      .from('plans')
      .select(`
        id,
        is_active,
        created_at,
        plan_topics (
          id,
          title,
          description,
          day,
          sort_order,
          status
        )
      `)
      .eq('student_id', studentId)
      .eq('is_active', true)
      .single();

    // 4. Fetch recent sessions with results
    const { data: recentSessions } = await admin
      .from('sessions')
      .select(`
        id,
        topic_id,
        phase,
        status,
        started_at,
        ended_at,
        plan_topics (title),
        session_results (
          understood,
          missed,
          review_next,
          passed
        )
      `)
      .eq('student_id', studentId)
      .order('started_at', { ascending: false })
      .limit(20);

    // 5. Compute summary stats
    const totalSessions = recentSessions?.length ?? 0;
    const completedSessions =
      recentSessions?.filter((s) => s.status === 'completed').length ?? 0;
    const passedSessions =
      recentSessions?.filter((s) => {
        const results = s.session_results as Array<{ passed: boolean }> | null;
        return results?.[0]?.passed === true;
      }).length ?? 0;

    const totalTopics = activePlan?.plan_topics?.length ?? 0;
    const masteredTopics =
      (activePlan?.plan_topics as Array<{ status: string }> | undefined)?.filter(
        (t) => t.status === 'mastered'
      ).length ?? 0;

    // 6. Fetch recent check-ins (for parent dashboard)
    const { data: recentCheckins } = await admin
      .from('checkins')
      .select('id, mood_text, escalation_tier, created_at')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 7. Return
    return NextResponse.json({
      student_id: studentId,
      plan: activePlan,
      recent_sessions: recentSessions,
      recent_checkins: recentCheckins,
      summary: {
        total_sessions: totalSessions,
        completed_sessions: completedSessions,
        passed_sessions: passedSessions,
        pass_rate:
          completedSessions > 0
            ? Math.round((passedSessions / completedSessions) * 100)
            : 0,
        total_topics: totalTopics,
        mastered_topics: masteredTopics,
        mastery_rate:
          totalTopics > 0
            ? Math.round((masteredTopics / totalTopics) * 100)
            : 0,
      },
    });
  } catch (err) {
    console.error('[/api/progress] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
