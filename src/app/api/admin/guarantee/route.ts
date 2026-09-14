import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/guarantee — Fetch guarantee queue with stats
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch all students with guarantee data
    const { data: students } = await supabase
      .from('students')
      .select(`
        id,
        name,
        field,
        baseline_score,
        country
      `)
      .not('baseline_score', 'is', null);

    // Build guarantee items from student + session data
    const items = [];
    let atRisk = 0;
    let refundsThisMonth = 0;

    for (const student of students || []) {
      // Count sessions
      const { count: sessionCount } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', student.id);

      // Get latest mock exam score as follow-up indicator
      const { data: latestExam } = await supabase
        .from('mock_exams')
        .select('score, completed_at')
        .eq('user_id', student.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .single();

      const baseline = student.baseline_score || 0;
      const target = Math.min(baseline + 15, 100); // 15% improvement target
      const followupScore = latestExam?.score ?? null;

      // Determine status
      let status = 'on_track';
      if (followupScore !== null) {
        if (followupScore >= target) {
          status = 'met';
        } else if ((sessionCount || 0) >= 20 && followupScore < target) {
          status = 'eligible_refund';
        } else if (followupScore < baseline) {
          status = 'at_risk';
          atRisk++;
        }
      } else if ((sessionCount || 0) >= 15 && !latestExam) {
        status = 'at_risk';
        atRisk++;
      }

      items.push({
        id: student.id,
        student_id: student.id,
        student_name: student.name,
        subject: student.field || 'General',
        baseline_score: baseline,
        target_score: target,
        followup_score: followupScore,
        session_count: sessionCount || 0,
        status,
        started_at: new Date().toISOString(),
        followup_due_at: null,
      });
    }

    return NextResponse.json({
      items,
      stats: {
        totalActive: items.filter(i => i.status !== 'met' && i.status !== 'refunded').length,
        atRisk,
        refundsThisMonth,
        revenueThisMonth: 0, // Would come from payment gateway
      },
    });
  } catch (error) {
    console.error('[Admin/Guarantee] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
