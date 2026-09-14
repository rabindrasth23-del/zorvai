import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/mock-exam/generate — Assemble a mock exam for a subject
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { subject, questionCount = 10, durationMinutes = 30 } = body;

    if (!subject) {
      return NextResponse.json({ error: 'Subject is required' }, { status: 400 });
    }

    // Get student profile
    const { data: student } = await supabase
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Get active plan topics with mastery status
    const { data: plans } = await supabase
      .from('plans')
      .select('id')
      .eq('student_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single();

    let topics: Array<{ title: string; mastered: boolean }> = [];

    if (plans) {
      const { data: planTopics } = await supabase
        .from('plan_topics')
        .select('title, status')
        .eq('plan_id', plans.id);

      topics = (planTopics || []).map(t => ({
        title: t.title,
        mastered: t.status === 'mastered',
      }));
    }

    if (topics.length === 0) {
      return NextResponse.json(
        { error: 'No topics found for this subject. Complete some study sessions first.' },
        { status: 400 }
      );
    }

    // Call AI to generate the exam — runAICall returns { data, provider, latencyMs }
    const { runAICall } = await import('@/lib/ai');

    const { data: generated } = await runAICall('mock_exam_generate', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
      },
      subject,
      topics,
      questionCount,
    });

    const questions = (generated as { questions: Array<Record<string, unknown>> }).questions;

    // Create mock exam record
    const { data: exam, error: insertError } = await supabase
      .from('mock_exams')
      .insert({
        user_id: user.id,
        subject,
        questions_json: questions,
        total_questions: questions.length,
        duration_seconds: durationMinutes * 60,
        status: 'in_progress',
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({
      exam: {
        id: exam.id,
        subject: exam.subject,
        questions: questions.map((q: Record<string, unknown>) => ({
          ...q,
          correct_answer: undefined, // Don't reveal answers yet
          explanation: undefined,
        })),
        total_questions: exam.total_questions,
        duration_seconds: exam.duration_seconds,
      },
    });
  } catch (error) {
    console.error('[MockExam] Generate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
