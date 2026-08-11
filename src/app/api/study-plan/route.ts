/**
 * POST /api/study-plan
 *
 * Generates (or regenerates) a 7-day study plan for a student.
 * - Calls runAICall('plan', payload)
 * - Stores raw_response in plans table
 * - Creates normalized plan_topics rows
 * - Deactivates any previous active plan
 * - Returns the structured plan
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { PlanResponse } from '@/lib/ai/schema';

// ---------------------------------------------------------------------------
// Request validation
// ---------------------------------------------------------------------------

const StudyPlanRequestSchema = z.object({
  subjects: z.array(z.string().min(1)).min(1),
  deadline: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate the student
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — you must be logged in.' },
        { status: 401 }
      );
    }

    // 2. Verify user is a student
    const admin = createAdminClient();
    const { data: student, error: studentError } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json(
        { error: 'Student profile not found. Complete onboarding first.' },
        { status: 404 }
      );
    }

    // 3. Parse and validate the request body
    const body = await request.json();
    const parsed = StudyPlanRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { subjects, deadline } = parsed.data;

    // 4. Call the AI engine
    const result = await runAICall<PlanResponse>('plan', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
      },
      subjects,
      deadline,
    });

    // 5. Deactivate any previous active plan
    await admin
      .from('plans')
      .update({ is_active: false })
      .eq('student_id', user.id)
      .eq('is_active', true);

    // 6. Insert the new plan with raw AI response
    const { data: plan, error: planError } = await admin
      .from('plans')
      .insert({
        student_id: user.id,
        raw_response: result.data,
        is_active: true,
      })
      .select('id')
      .single();

    if (planError || !plan) {
      console.error('[/api/study-plan] Failed to insert plan:', planError);
      return NextResponse.json(
        { error: 'Failed to save study plan.' },
        { status: 500 }
      );
    }

    // 7. Create normalized plan_topics rows
    const topicRows = result.data.topics.map((topic, index) => ({
      plan_id: plan.id,
      title: topic.title,
      description: topic.description,
      day: topic.day,
      sort_order: index + 1,
      status: 'pending' as const,
    }));

    const { error: topicsError } = await admin
      .from('plan_topics')
      .insert(topicRows);

    if (topicsError) {
      console.error('[/api/study-plan] Failed to insert plan_topics:', topicsError);
      // Plan was created but topics failed — clean up
      await admin.from('plans').delete().eq('id', plan.id);
      return NextResponse.json(
        { error: 'Failed to save study plan topics.' },
        { status: 500 }
      );
    }

    // 8. Fetch the complete plan with topics for the response
    const { data: completePlan } = await admin
      .from('plans')
      .select(`
        id,
        is_active,
        created_at,
        plan_topics (
          id,
          title,
          description,
          day,
          sort_order,
          status
        )
      `)
      .eq('id', plan.id)
      .single();

    // 9. Return the plan
    return NextResponse.json({
      plan: completePlan,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/study-plan] Unhandled error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
