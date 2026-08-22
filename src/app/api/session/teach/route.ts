/**
 * POST /api/session/teach
 *
 * Learn phase — delivers the Socratic lesson for a topic.
 * - Creates a new session (or resumes an existing active one)
 * - Calls runAICall('teach', payload)
 * - Returns lesson content + key concepts
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { TeachResponse } from '@/lib/ai/schema';

const TeachRequestSchema = z.object({
  topic_id: z.string().uuid(),
  session_minutes: z.number().int().min(5).max(120).optional().default(30),
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

    // Rate limit: 10 AI requests per 60s per user (Upstash Redis)
    const { aiRouteLimiter } = await import('@/lib/rate-limiter');
    const { success, reset } = await aiRouteLimiter.limit(user.id);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // 2. Verify student + parse request
    const admin = createAdminClient();
    const { data: student } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = TeachRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { topic_id, session_minutes } = parsed.data;

    // 3. Verify the topic exists and belongs to this student
    const { data: topic } = await admin
      .from('plan_topics')
      .select('*, plans!inner(student_id)')
      .eq('id', topic_id)
      .single();

    if (!topic || (topic.plans as { student_id: string }).student_id !== user.id) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 4. Check for an existing active session on this topic
    let sessionId: string;
    const { data: existingSession } = await admin
      .from('sessions')
      .select('id, phase, status')
      .eq('student_id', user.id)
      .eq('topic_id', topic_id)
      .eq('status', 'active')
      .single();

    if (existingSession) {
      // Resume existing session — verify it's still in learn phase
      if (existingSession.phase !== 'learn') {
        return NextResponse.json(
          {
            error: `Session is in "${existingSession.phase}" phase, not "learn". Use the appropriate endpoint.`,
            session_id: existingSession.id,
            current_phase: existingSession.phase,
          },
          { status: 409 }
        );
      }
      sessionId = existingSession.id;
    } else {
      // Create a new session
      const { data: newSession, error: sessionError } = await admin
        .from('sessions')
        .insert({
          student_id: user.id,
          topic_id,
          phase: 'learn',
          status: 'active',
        })
        .select('id')
        .single();

      if (sessionError || !newSession) {
        return NextResponse.json({ error: 'Failed to create session' }, { status: 500 });
      }
      sessionId = newSession.id;
    }

    // 5. Call AI
    const result = await runAICall<TeachResponse>('teach', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
      },
      topic: {
        title: topic.title,
        description: topic.description,
      },
      sessionMinutes: session_minutes,
    });

    // 6. Return lesson
    return NextResponse.json({
      session_id: sessionId,
      phase: 'learn',
      lesson: result.data,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/session/teach] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
