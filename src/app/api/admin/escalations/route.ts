import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/escalations — Fetch escalation queue
 */
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch check-in responses with escalation flags
    const { data: checkins } = await supabase
      .from('checkins')
      .select(`
        id,
        student_id,
        tier,
        ai_response,
        parent_notified,
        created_at,
        resolution,
        resolved_by,
        status,
        students!inner ( name )
      `)
      .gte('tier', 2) // Only tier 2+ are escalation-worthy
      .order('created_at', { ascending: false })
      .limit(50);

    const escalations = (checkins || []).map((c: Record<string, unknown>) => {
      const student = c.students as { name: string } | null;
      const aiResponse = c.ai_response as { trigger_text?: string } | null;
      return {
        id: c.id,
        student_id: c.student_id,
        student_name: student?.name || 'Unknown',
        tier: c.tier,
        trigger_text: aiResponse?.trigger_text || '(Check-in response)',
        parent_notified: c.parent_notified || false,
        parent_notification_sent_at: null,
        resolution: c.resolution,
        resolved_by: c.resolved_by,
        created_at: c.created_at,
        status: c.status || (c.resolution ? 'resolved' : 'pending'),
      };
    });

    return NextResponse.json({ escalations });
  } catch (error) {
    console.error('[Admin/Escalations] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
