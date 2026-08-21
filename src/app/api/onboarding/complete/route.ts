import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAICall } from '@/lib/ai';
import { PlanResponse } from '@/lib/ai/schema';
import crypto from 'crypto';

// Use standard Node runtime to access crypto natively
export const runtime = 'nodejs';

// 1. Dedicated secret for quiz token (separate from SUPABASE_JWT_SECRET)
// Must be 32 bytes for aes-256-gcm. In production, this should be set in .env
const QUIZ_TOKEN_SECRET = process.env.QUIZ_TOKEN_SECRET || '0123456789abcdef0123456789abcdef';

// Decrypt using aes-256-gcm and check expiry
function decryptQuizToken(token: string): { expectedAnswers: number[], optionsLengths: number[], exp: number } | null {
  try {
    const [ivHex, authTagHex, encryptedHex] = token.split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(QUIZ_TOKEN_SECRET.padEnd(32, '0').slice(0, 32)), Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    const data = JSON.parse(decrypted);
    
    // Check expiry
    if (data.exp && Date.now() > data.exp) {
      console.warn('[Onboarding Complete] Quiz token expired.');
      return null;
    }
    
    return data;
  } catch (e) {
    console.warn('[Onboarding Complete] Quiz token decryption failed.', e);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient();
    const { data: { user }, error: authError } = await (await supabase).auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { profile, answers, quizToken } = body;

    // 1. Validations
    if (!profile || !answers || !quizToken) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const keyData = decryptQuizToken(quizToken);
    if (!keyData) {
      return NextResponse.json({ error: 'Invalid, expired, or tampered quiz token' }, { status: 400 });
    }

    if (answers.length !== keyData.expectedAnswers.length) {
      return NextResponse.json({ error: 'Answers length mismatch' }, { status: 400 });
    }

    // 2. Score Quiz Server-Side (Validating bounds)
    let score = 0;
    for (let i = 0; i < answers.length; i++) {
      const studentAnswer = answers[i];
      if (studentAnswer < 0 || studentAnswer >= keyData.optionsLengths[i]) {
        return NextResponse.json({ error: `Invalid option index at question ${i}` }, { status: 400 });
      }
      if (studentAnswer === keyData.expectedAnswers[i]) {
        score++;
      }
    }

    // Normalize to percentage (0-100)
    const baselineScore = Math.round((score / answers.length) * 100);

    // 3. Save Profile & Score (We do this before plan generation lock)
    const { error: updateError } = await (await supabase)
      .from('students')
      .update({
        grade: profile.grade,
        target_subject: profile.targetSubject,
        confidence_level: profile.confidence,
        monthly_goal: profile.monthlyGoal,
        baseline_score: baselineScore,
        onboarded: true
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('[Onboarding Complete] Failed to update profile:', updateError);
      return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 });
    }

    // 4. Concurrency & Idempotency: Lock the plan via DB Unique Constraint
    // The migration `unique_active_plan_per_student` guarantees only 1 active plan.
    const { data: newPlan, error: insertPlanError } = await (await supabase)
      .from('plans')
      .insert({ student_id: user.id, is_active: true })
      .select('id')
      .single();

    if (insertPlanError) {
      // 23505 is Postgres code for unique_violation
      if (insertPlanError.code === '23505') {
        console.warn('[Onboarding Complete] Active plan already generating/exists for user. Idempotent return.');
        return NextResponse.json({ success: true, plan_status: 'existing', score: baselineScore });
      }
      console.error('[Onboarding Complete] Failed to lock/insert plan:', insertPlanError);
      return NextResponse.json({ success: true, plan_status: 'failed', score: baselineScore }, { status: 202 });
    }

    const planId = newPlan.id;

    // 5. Trigger Plan Generation (AI Call)
    try {
      const planResult = await runAICall<PlanResponse>('plan', {
        student: { id: user.id, grade: profile.grade, targetSubject: profile.targetSubject },
        subjects: [profile.targetSubject],
        deadline: null
      });

      // 6. Save the AI response and normalized topics
      const rawPlan = planResult.data;
      
      // Update the plan with the raw response
      await (await supabase)
        .from('plans')
        .update({ raw_response: rawPlan })
        .eq('id', planId);

      // Insert normalized topics
      const topicsToInsert = rawPlan.topics.map((t: any, idx: number) => ({
          plan_id: planId,
          title: t.title,
          description: t.description,
          day: t.day,
          sort_order: idx,
          status: 'pending'
      }));

      await (await supabase).from('plan_topics').insert(topicsToInsert);

      return NextResponse.json({ success: true, plan_status: 'created', score: baselineScore });

    } catch (aiError) {
      console.error('[Onboarding Complete] AI Plan Generation failed:', aiError);
      // Clean up the incomplete plan so the user can retry later
      await (await supabase).from('plans').delete().eq('id', planId);
      
      return NextResponse.json({ success: true, plan_status: 'failed', score: baselineScore }, { status: 202 });
    }

  } catch (error) {
    console.error('[Onboarding Complete] Server Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
