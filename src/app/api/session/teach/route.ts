/**
 * POST /api/session/teach
 *
 * Learn phase — delivers the Socratic lesson for a topic.
 * - Creates a new session (or resumes an existing active one)
 * - Auto-abandons stale sessions (>2 hours old) instead of blocking the student
 * - Calls runAICall('teach', payload)
 * - Returns lesson content + key concepts
 */

/**
 * Sessions older than this threshold (in milliseconds) are considered stale
 * and will be auto-abandoned when the student tries to start a new session
 * on the same topic. 2 hours is generous — sessions are designed for ~30 min.
 */
const STALE_SESSION_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours

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

    // 4. Resolve session — auto-abandon stale ones, resume fresh ones, or create new
    const { data: existingSession } = await admin
      .from('sessions')
      .select('id, phase, status, started_at')
      .eq('student_id', user.id)
      .eq('topic_id', topic_id)
      .eq('status', 'active')
      .single();

    let sessionId = '';

    if (existingSession) {
      const sessionAge = Date.now() - new Date(existingSession.started_at).getTime();
      const isStale = sessionAge > STALE_SESSION_THRESHOLD_MS;

      if (isStale) {
        // Auto-abandon the stale session — student shouldn't be blocked
        // by a session they walked away from hours ago
        await admin
          .from('sessions')
          .update({ status: 'abandoned', ended_at: new Date().toISOString() })
          .eq('id', existingSession.id);

        console.log(
          `[/api/session/teach] Auto-abandoned stale session ${existingSession.id} ` +
          `(age: ${Math.round(sessionAge / 60000)}min, phase: ${existingSession.phase})`
        );
        // sessionId stays empty → falls through to create a new session
      } else if (existingSession.phase !== 'learn') {
        // Non-stale session in a later phase — this is a real conflict,
        // not a stale artifact. Direct the student to the correct phase.
        return NextResponse.json(
          {
            error: `Session is in "${existingSession.phase}" phase, not "learn". Use the appropriate endpoint.`,
            session_id: existingSession.id,
            current_phase: existingSession.phase,
          },
          { status: 409 }
        );
      } else {
        // Non-stale, learn-phase session — resume it
        sessionId = existingSession.id;
      }
    }

    // Create a new session if we don't have one yet (no existing, or stale was abandoned)
    if (!sessionId) {
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
        grade: student.grade ?? undefined,
        educationLevel: student.education_level ?? undefined,
      },
      topic: {
        title: topic.title,
        description: topic.description,
      },
      sessionMinutes: session_minutes,
    });

    // 6. Persist the initial lesson as first message in session_messages
    // This enables conversation restore on page refresh
    await admin.from('session_messages').insert({
      session_id: sessionId,
      role: 'ai',
      content: result.data.content,
    });

    // 7. Return lesson
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
