import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAICall } from '@/lib/ai';
import { ChallengeResponse } from '@/lib/ai/schema';
import crypto from 'crypto';

export const runtime = 'nodejs';

const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || '0123456789abcdef0123456789abcdef';

// Helper to encrypt the answer key into a stateless token
function createQuizToken(expectedAnswers: number[], optionsLengths: number[]): string {
  const payload = JSON.stringify({
    expectedAnswers,
    optionsLengths,
    exp: Date.now() + 1000 * 60 * 60 // 1 hour expiry
  });

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(QUIZ_TOKEN_SECRET.padEnd(32, '0').slice(0, 32)), iv);
  
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}.${authTag.toString('hex')}.${encrypted}`;
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await (await supabase).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 3 requests per 5 minutes per user (Upstash Redis)
    const { planLimiter } = await import('@/lib/rate-limiter');
    const { success, reset } = await planLimiter.limit(user.id);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    const body = await request.json();
    const { targetSubject, confidence, grade } = body;

    if (!targetSubject || !confidence || !grade) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Generate 5 questions (using the challenge call type, but tailored for a baseline)
    // We reuse the 'challenge' call type here since it generates multiple-choice questions.
    // If the schema for Baseline requires a specific new call type, we would create one.
    // For now, we adapt the payload to fit the challenge prompt expectations.
    const result = await runAICall<ChallengeResponse>('challenge', {
      student: { id: user.id, grade },
      topic: { title: `${targetSubject} (Baseline Assessment)` },
      recallTranscript: `Student has rated their confidence as ${confidence}/5. Generate 5 multiple-choice questions of varying difficulty to establish a baseline.`
    });

    const expectedAnswers: number[] = [];
    const optionsLengths: number[] = [];
    
    // Map the response to the BaselineQuestion format (strip correct indices)
    const questionsForClient = result.data.questions.slice(0, 5).map((q: any, idx: number) => {
      // Find the index of the expected answer in the options array
      // AI returns options: string[] and expected_answer: string
      let correctIndex = q.options.findIndex((opt: string) => opt === q.expected_answer);
      
      // Fallback if AI didn't exactly match the string
      if (correctIndex === -1) {
        correctIndex = 0;
        q.options[0] = q.expected_answer; // Force it to be the first option just to be safe
      }

      expectedAnswers.push(correctIndex);
      optionsLengths.push(q.options.length);

      return {
        id: `base_${Date.now()}_${idx}`,
        question: q.question,
        options: q.options
      };
    });

    const quizToken = createQuizToken(expectedAnswers, optionsLengths);

    return NextResponse.json({
      questions: questionsForClient,
      quizToken
    });

  } catch (error) {
    console.error('[Baseline Generate] Failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
