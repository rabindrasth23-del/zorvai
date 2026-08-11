/**
 * POST /api/chat
 *
 * Ad-hoc chatbot Q&A — student can ask anything outside of sessions.
 * - Calls runAICall('chatbot', payload) with student profile + recent history
 * - Returns Socratic AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { ChatbotResponse } from '@/lib/ai/schema';

const ChatRequestSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty'),
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
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { message } = parsed.data;

    // 4. Fetch recent study context for the AI
    const { data: recentSessions } = await admin
      .from('sessions')
      .select(`
        topic_id,
        phase,
        status,
        started_at,
        plan_topics (title)
      `)
      .eq('student_id', user.id)
      .order('started_at', { ascending: false })
      .limit(5);

    const recentHistory = recentSessions
      ?.map((s) => {
        const topics = s.plan_topics as Array<{ title: string }> | null;
        const topicTitle = topics?.[0]?.title ?? 'Unknown';
        return `- ${topicTitle} (${s.status}, ${s.phase})`;
      })
      .join('\n');

    // 5. Call AI
    const result = await runAICall<ChatbotResponse>('chatbot', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
      },
      message,
      recentHistory: recentHistory
        ? `Recent sessions:\n${recentHistory}`
        : undefined,
    });

    // 6. Return
    return NextResponse.json({
      answer: result.data.answer,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/chat] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
