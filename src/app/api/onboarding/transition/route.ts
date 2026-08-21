import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runAICall } from '@/lib/ai';
import { SafetyClassifierResponse, OnboardingTransitionResponse } from '@/lib/ai/schema';

// Fallback response if the AI transition generation times out or fails
const FALLBACK_TRANSITION = "Got it. Let's move on to the next question.";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { previousAnswer, nextIntent } = body;

    if (!previousAnswer || !nextIntent) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // -----------------------------------------------------------------------
    // STEP 1: SAFETY CLASSIFIER (Flag & Discard Policy)
    // -----------------------------------------------------------------------
    const safetyController = new AbortController();
    const safetyTimeoutId = setTimeout(() => safetyController.abort(), 2000);

    try {
      const safetyResult = await runAICall<SafetyClassifierResponse>(
        'safety_classifier',
        { input: previousAnswer }
      );
      clearTimeout(safetyTimeoutId);

      if (!safetyResult.data.safe) {
        // Log to safety_escalations table
        const { error: dbError } = await supabase
          .from('safety_escalations')
          .insert({
            student_id: user.id, // Confirmed: students.id is a FK to auth.users.id
            flagged_text: previousAnswer,
            flag_reason: safetyResult.data.flag_reason,
            route_source: 'onboarding',
            status: 'pending_review'
          });

        if (dbError) {
          console.error('[Onboarding Transition] Failed to insert safety escalation:', dbError);
        }

        // Decoupled from DB success: always fire the webhook if flagged
        const webhookUrl = process.env.SAFETY_WEBHOOK_URL;
        if (webhookUrl) {
          try {
            // Awaiting directly to guarantee delivery before the lambda sleeps
            await fetch(webhookUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                text: `⚠️ SAFETY ESCALATION (Onboarding): User ${user.id} flagged for: ${safetyResult.data.flag_reason}. DB Insert Error: ${dbError?.message || 'None'}`
              })
            });
          } catch (e) {
            console.error('[Onboarding Transition] Webhook failed', e);
          }
        } else {
          console.warn('[Onboarding Transition] SAFETY_WEBHOOK_URL not configured.');
        }
      }
    } catch (error) {
      clearTimeout(safetyTimeoutId);
      console.error('[Onboarding Transition] Safety classifier failed or timed out:', error);
    }

    // -----------------------------------------------------------------------
    // STEP 2: TRANSITION GENERATION (2s Timeout)
    // -----------------------------------------------------------------------
    // Now we generate the warm conversational transition. If this takes longer
    // than 2 seconds or fails, we gracefully degrade to the static fallback.
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    try {
      const transitionResult = await runAICall<OnboardingTransitionResponse>(
        'onboarding_transition',
        { previousAnswer, nextIntent }
      );
      
      clearTimeout(timeoutId);
      return NextResponse.json({ transitionText: transitionResult.data.transition_text });
    } catch (error: any) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError' || error.message?.includes('aborted')) {
        console.warn('[Onboarding Transition] AI generation timed out, using fallback.');
      } else {
        console.error('[Onboarding Transition] AI generation failed:', error);
      }
      
      // Graceful degradation: never hang the stepper
      return NextResponse.json({ transitionText: FALLBACK_TRANSITION });
    }

  } catch (error) {
    console.error('[Onboarding Transition] Route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
