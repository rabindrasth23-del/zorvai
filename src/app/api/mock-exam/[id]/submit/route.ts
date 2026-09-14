import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/mock-exam/:id/submit — Grade and return feedback
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { answers, timeSpentSeconds } = body as {
      answers: Array<{ questionId: number; answer: string }>;
      timeSpentSeconds: number;
    };

    // Fetch the exam
    const { data: exam } = await supabase
      .from('mock_exams')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!exam) {
      return NextResponse.json({ error: 'Exam not found' }, { status: 404 });
    }

    if (exam.status === 'completed') {
      return NextResponse.json({ error: 'Exam already submitted' }, { status: 400 });
    }

    const questions = exam.questions_json as Array<{
      id: number;
      topic: string;
      type: string;
      question: string;
      correct_answer: string;
      explanation: string;
      options?: string[];
    }>;

    // Auto-grade multiple choice and true/false
    let correctCount = 0;
    const gradedResults: Array<{
      questionId: number;
      correct: boolean;
      score: number;
      studentAnswer: string;
      correctAnswer: string;
      explanation: string;
      topic: string;
    }> = [];

    const freeResponseItems: Array<{
      question: string;
      studentAnswer: string;
      correctAnswer: string;
      topic: string;
    }> = [];

    for (const q of questions) {
      const studentAnswer = answers.find(a => a.questionId === q.id)?.answer || '';

      if (q.type === 'multiple_choice' || q.type === 'true_false') {
        // Auto-grade: normalize and compare
        const isCorrect = normalizeAnswer(studentAnswer) === normalizeAnswer(q.correct_answer);
        if (isCorrect) correctCount++;

        gradedResults.push({
          questionId: q.id,
          correct: isCorrect,
          score: isCorrect ? 1 : 0,
          studentAnswer,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          topic: q.topic,
        });
      } else {
        // Free-response — needs AI grading
        freeResponseItems.push({
          question: q.question,
          studentAnswer,
          correctAnswer: q.correct_answer,
          topic: q.topic,
        });
      }
    }

    // AI-grade free response items if any
    if (freeResponseItems.length > 0) {
      try {
        const { data: student } = await supabase
          .from('students')
          .select('*')
          .eq('id', user.id)
          .single();

        if (student) {
          const { runAICall } = await import('@/lib/ai');
          const { data: gradeData } = await runAICall('mock_exam_grade', {
            student: {
              name: student.name,
              country: student.country,
              field: student.field,
              language: student.language,
              studyHoursPerDay: student.study_hours_per_day,
              timezone: student.timezone,
            },
            questionsAndAnswers: freeResponseItems,
          });

          const graded = gradeData as { results: Array<{ question_index: number; correct: boolean; score: number; feedback: string; topic: string }> };
          for (const result of graded.results || []) {
            if (result.correct) correctCount++;
            gradedResults.push({
              questionId: freeResponseItems[result.question_index]
                ? questions.findIndex(q => q.question === freeResponseItems[result.question_index].question) + 1
                : 0,
              correct: result.correct,
              score: result.score,
              studentAnswer: freeResponseItems[result.question_index]?.studentAnswer || '',
              correctAnswer: freeResponseItems[result.question_index]?.correctAnswer || '',
              explanation: result.feedback,
              topic: result.topic,
            });
          }
        }
      } catch (err) {
        console.error('[MockExam] AI grading failed, using basic grading:', err);
      }
    }

    const overallScore = questions.length > 0
      ? Math.round((correctCount / questions.length) * 100)
      : 0;

    // Update exam record
    await supabase
      .from('mock_exams')
      .update({
        answers_json: answers,
        score: overallScore,
        correct_count: correctCount,
        time_spent_seconds: timeSpentSeconds,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', id);

    // Identify weak topics
    const topicScores: Record<string, { correct: number; total: number }> = {};
    for (const r of gradedResults) {
      if (!topicScores[r.topic]) topicScores[r.topic] = { correct: 0, total: 0 };
      topicScores[r.topic].total++;
      if (r.correct) topicScores[r.topic].correct++;
    }

    const weakTopics = Object.entries(topicScores)
      .filter(([, s]) => s.correct / s.total < 0.6)
      .map(([topic]) => topic);

    const strongTopics = Object.entries(topicScores)
      .filter(([, s]) => s.correct / s.total >= 0.8)
      .map(([topic]) => topic);

    return NextResponse.json({
      score: overallScore,
      correctCount,
      totalQuestions: questions.length,
      results: gradedResults,
      weakTopics,
      strongTopics,
      timeSpentSeconds,
    });
  } catch (error) {
    console.error('[MockExam] Submit error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function normalizeAnswer(answer: string): string {
  return answer
    .toLowerCase()
    .replace(/^[a-d]\)\s*/i, '')
    .replace(/^(true|false)\b/i, m => m.toLowerCase())
    .trim();
}
