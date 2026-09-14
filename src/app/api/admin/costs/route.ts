import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/costs — Usage & cost analytics
 * Aggregates AI provider logs by call type and date
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

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    // Get all logs this month
    const { data: logs } = await supabase
      .from('ai_provider_logs')
      .select('call_type, created_at, latency_ms, success')
      .gte('created_at', monthStart)
      .order('created_at', { ascending: false });

    const allLogs = logs || [];

    // Estimate cost per call type (based on typical token usage)
    const COST_PER_CALL: Record<string, number> = {
      teach: 0.008,
      teach_chat: 0.006,
      grounded_teach: 0.012,
      challenge: 0.005,
      feedback: 0.007,
      recall: 0.004,
      chatbot: 0.005,
      plan: 0.015,
      checkin: 0.003,
      mock_exam_generate: 0.020,
      mock_exam_grade: 0.010,
      snap_solve: 0.008,
      material_ingest: 0.025,
      safety_classifier: 0.002,
      onboarding_transition: 0.004,
      key_concepts_extract: 0.005,
    };

    // Calculate costs by call type
    const callTypeCounts: Record<string, { count: number; cost: number }> = {};
    let totalToday = 0;
    let totalThisWeek = 0;
    let totalThisMonth = 0;

    for (const log of allLogs) {
      if (!log.success) continue; // Only count successful calls
      const costPerCall = COST_PER_CALL[log.call_type] || 0.005;

      if (!callTypeCounts[log.call_type]) {
        callTypeCounts[log.call_type] = { count: 0, cost: 0 };
      }
      callTypeCounts[log.call_type].count++;
      callTypeCounts[log.call_type].cost += costPerCall;
      totalThisMonth += costPerCall;

      if (log.created_at >= weekStart) totalThisWeek += costPerCall;
      if (log.created_at >= todayStart) totalToday += costPerCall;
    }

    // Daily trend (last 7 days)
    const dailyTrend: Array<{ date: string; cost: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayStr = d.toISOString().split('T')[0];
      const dayStart = new Date(d.getFullYear(), d.getMonth(), d.getDate()).toISOString();
      const dayEnd = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1).toISOString();

      let dayCost = 0;
      for (const log of allLogs) {
        if (log.success && log.created_at >= dayStart && log.created_at < dayEnd) {
          dayCost += COST_PER_CALL[log.call_type] || 0.005;
        }
      }
      dailyTrend.push({ date: dayStr, cost: Math.round(dayCost * 100) / 100 });
    }

    return NextResponse.json({
      totalToday: Math.round(totalToday * 100) / 100,
      totalThisWeek: Math.round(totalThisWeek * 100) / 100,
      totalThisMonth: Math.round(totalThisMonth * 100) / 100,
      byCallType: Object.entries(callTypeCounts).map(([callType, data]) => ({
        callType,
        count: data.count,
        cost: Math.round(data.cost * 100) / 100,
      })),
      dailyTrend,
    });
  } catch (error) {
    console.error('[Admin/Costs] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
