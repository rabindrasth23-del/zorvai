/**
 * POST /api/session/evaluate
 *
 * Feedback phase — grades the student's challenge answers.
 * - Verifies session is in 'challenge' phase
 * - Calls runAICall('feedback', payload) with Q&A pairs
 * - Writes understood/missed/review_next/passed to session_results
 * - If passed === false, re-queues topic (status → 're-queued')
 * - Advances session: phase → 'done', status → 'completed'
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { FeedbackResponse } from '@/lib/ai/schema';

const AnswerSchema = z.object({
  question: z.string().min(1),
  student_answer: z.string().min(1),
  // expected_answer is NO LONGER accepted from the client.
  // It is fetched server-side from session_results.challenge_qas.
});

const EvaluateRequestSchema = z.object({
  session_id: z.string().uuid(),
  answers: z.array(AnswerSchema).length(4),
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
    const parsed = EvaluateRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session_id, answers } = parsed.data;

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
          error: `Session is in "${session.phase}" phase. Must be in Challenge to evaluate.`,
          current_phase: session.phase,
        },
        { status: 409 }
      );
    }

    // 4. Get student + topic + stored challenge questions (with expected_answer)
    const { data: student } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    const { data: topic } = await admin
      .from('plan_topics')
      .select('id, title, description')
      .eq('id', session.topic_id)
      .single();

    if (!topic) {
      return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
    }

    // SECURITY: Fetch expected_answer from server-side storage, not from client
    const { data: sessionResult } = await admin
      .from('session_results')
      .select('challenge_qas')
      .eq('session_id', session_id)
      .single();

    const storedQuestions: Array<{ question: string; expected_answer: string }> =
      sessionResult?.challenge_qas || [];

    // 5. Call AI for feedback — pair student answers with server-stored expected answers
    const result = await runAICall<FeedbackResponse>('feedback', {
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
      questionsAndAnswers: answers.map((a) => {
        // Find the matching server-stored question to get the real expected_answer
        const stored = storedQuestions.find(
          (sq) => sq.question === a.question
        );
        return {
          question: a.question,
          studentAnswer: a.student_answer,
          expectedAnswer: stored?.expected_answer || '(answer not found)',
        };
      }),
    });

    const feedback = result.data;

    // 6. Update session_results with feedback
    await admin
      .from('session_results')
      .update({
        understood: feedback.understood,
        missed: feedback.missed,
        review_next: feedback.review_next,
        passed: feedback.passed,
      })
      .eq('session_id', session_id);

    // 7. If not passed, re-queue the topic
    if (!feedback.passed) {
      await admin
        .from('plan_topics')
        .update({ status: 're-queued' })
        .eq('id', topic.id);
    } else {
      await admin
        .from('plan_topics')
        .update({ status: 'mastered' })
        .eq('id', topic.id);
    }

    // 8. Complete the session: phase → 'done', status → 'completed'
    await admin
      .from('sessions')
      .update({
        phase: 'done',
        status: 'completed',
        ended_at: new Date().toISOString(),
      })
      .eq('id', session_id);

    // 9. Return feedback
    return NextResponse.json({
      session_id,
      phase: 'done',
      status: 'completed',
      feedback: {
        understood: feedback.understood,
        missed: feedback.missed,
        review_next: feedback.review_next,
        passed: feedback.passed,
      },
      topic_status: feedback.passed ? 'mastered' : 're-queued',
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/session/evaluate] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
