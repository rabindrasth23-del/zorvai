/**
 * POST /api/session/recall
 *
 * Recall phase — stores the student's spoken transcript.
 * No AI call needed — this is a passthrough that captures
 * the transcript for use in the Challenge phase.
 * - Verifies session is in 'learn' phase, advances to 'recall' then 'challenge'
 * - Stores transcript in session_results
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RecallRequestSchema = z.object({
  session_id: z.string().uuid(),
  transcript: z.string().min(1, 'Transcript cannot be empty'),
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

    // 2. Parse request
    const body = await request.json();
    const parsed = RecallRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session_id, transcript } = parsed.data;

    // 3. Verify session belongs to this student and is in the right phase
    const admin = createAdminClient();
    const { data: session } = await admin
      .from('sessions')
      .select('id, student_id, phase, status')
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

    if (session.phase !== 'learn' && session.phase !== 'recall') {
      return NextResponse.json(
        {
          error: `Session is in "${session.phase}" phase. Recall is only available after Learn.`,
          current_phase: session.phase,
        },
        { status: 409 }
      );
    }

    // 4. Store the transcript in session_results
    // Check if session_results row already exists
    const { data: existingResult } = await admin
      .from('session_results')
      .select('id')
      .eq('session_id', session_id)
      .single();

    if (existingResult) {
      // Update existing
      await admin
        .from('session_results')
        .update({ recall_transcript: transcript })
        .eq('session_id', session_id);
    } else {
      // Insert new
      await admin.from('session_results').insert({
        session_id,
        recall_transcript: transcript,
      });
    }

    // 5. Advance session phase to 'challenge'
    await admin
      .from('sessions')
      .update({ phase: 'challenge' })
      .eq('id', session_id);

    // 6. Return
    return NextResponse.json({
      session_id,
      phase: 'challenge',
      message: 'Recall transcript saved. Ready for Challenge phase.',
      transcript_length: transcript.length,
    });
  } catch (err) {
    console.error('[/api/session/recall] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
