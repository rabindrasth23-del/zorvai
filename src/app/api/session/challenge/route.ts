/**
 * POST /api/session/challenge
 *
 * Challenge phase — generates exactly 4 graduated-difficulty questions.
 * - Verifies session is in 'challenge' phase
 * - Uses the recall transcript as context
 * - Calls runAICall('challenge', payload)
 * - Returns 4 questions (fact → understanding → application → mixed)
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { ChallengeResponse } from '@/lib/ai/schema';

const ChallengeRequestSchema = z.object({
  session_id: z.string().uuid(),
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

    // 2. Parse request
    const body = await request.json();
    const parsed = ChallengeRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session_id } = parsed.data;

    // 3. Verify session
    const admin = createAdminClient();
    const { data: session } = await admin
      .from('sessions')
      .select('id, student_id, topic_id, phase, status')
      .eq('id', session_id)
      .single();

    if (!session || session.student_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (session.status !== 'active') {
      return NextResponse.json(
        { error: `Session is "${session.status}", not active` },
        { status: 409 }
      );
    }

    if (session.phase !== 'challenge') {
      return NextResponse.json(
        {
          error: `Session is in "${session.phase}" phase. Complete Recall first.`,
          current_phase: session.phase,
        },
        { status: 409 }
      );
    }

    // 4. Get the student profile
    const { data: student } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 5. Get the topic
    const { data: topic } = await admin
      .from('plan_topics')
      .select('title, description')
      .eq('id', session.topic_id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // 6. Get the recall transcript and existing challenge questions
    const { data: sessionResult } = await admin
      .from('session_results')
      .select('recall_transcript, challenge_qas')
      .eq('session_id', session_id)
      .single();

    // IDEMPOTENCY CHECK: If questions already exist, return them immediately
    // SECURITY: Strip expected_answer before sending to client
    if (sessionResult?.challenge_qas && Array.isArray(sessionResult.challenge_qas) && sessionResult.challenge_qas.length === 4) {
      const safeQuestions = sessionResult.challenge_qas.map((q: any) => ({
        type: q.type,
        question: q.question,
        // expected_answer intentionally omitted — server-side only
      }));
      return NextResponse.json({
        session_id,
        phase: 'challenge',
        questions: safeQuestions,
        ai_provider: 'cached',
        ai_latency_ms: 0,
      });
    }

    const recallTranscript = sessionResult?.recall_transcript ?? '(No recall transcript available)';

    // 7. Call AI
    const result = await runAICall<ChallengeResponse>('challenge', {
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
      recallTranscript,
    });

    // 8. Store the FULL questions (with expected_answer) in session_results — server-side only
    await admin
      .from('session_results')
      .update({ challenge_qas: result.data.questions })
      .eq('session_id', session_id);

    // 9. Phase stays at 'challenge' — the evaluate endpoint advances to 'done'

    // SECURITY: Strip expected_answer before sending to client
    const safeQuestions = result.data.questions.map((q) => ({
      type: q.type,
      question: q.question,
      // expected_answer intentionally omitted — never sent to browser
    }));

    return NextResponse.json({
      session_id,
      phase: 'challenge',
      questions: safeQuestions,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/session/challenge] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
