import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { solveMathExpression } from '@/lib/solver/mathjs-solver';

/**
 * POST /api/solve — Snap & Solve: OCR text → symbolic solver → LLM explanation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { ocrText, mode = 'hint' } = body as {
      ocrText: string;
      mode?: 'hint' | 'full';
    };

    if (!ocrText || ocrText.trim().length === 0) {
      return NextResponse.json({ error: 'OCR text is required' }, { status: 400 });
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

    // Step 1: Try symbolic solver first
    const solverResult = solveMathExpression(ocrText.trim());

    // Step 2: Pass solver result to LLM for explanation
    const { runAICall } = await import('@/lib/ai');

    const { data: solveData } = await runAICall('snap_solve', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        timezone: student.timezone,
      },
      ocrText: ocrText.trim(),
      solverResult: {
        success: solverResult.success,
        result: solverResult.result,
        steps: solverResult.steps,
      },
      mode,
    });

    const parsed = solveData as { answer: string; steps: string[]; explanation: string; confidence: string };

    return NextResponse.json({
      solverVerified: solverResult.success,
      solverResult: solverResult.success ? solverResult.result : null,
      answer: parsed.answer,
      steps: parsed.steps,
      explanation: parsed.explanation,
      confidence: parsed.confidence,
      mode,
    });
  } catch (error) {
    console.error('[Solve] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
