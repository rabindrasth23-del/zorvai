/**
 * POST /api/session/teach/chat
 *
 * Conversational Learn phase — student follow-up messages.
 * - Validates session ownership + phase
 * - Optionally uploads a file to Supabase Storage
 * - Loads conversation history from session_messages
 * - Calls runAICall('teach_chat', payload) with full context
 * - Persists both student message and AI response
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { runAICall } from '@/lib/ai';
import type { TeachChatResponse, SafetyClassifierResponse } from '@/lib/ai/schema';

const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_PDF_SIZE = 20 * 1024 * 1024;   // 20MB
const ALLOWED_MIME_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
];

const ChatRequestSchema = z.object({
  session_id: z.string().uuid(),
  message: z.string().min(1).max(2000),
  attachment: z.object({
    base64: z.string(),
    type: z.string(),
    name: z.string(),
  }).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit
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
    const parsed = ChatRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { session_id, message, attachment } = parsed.data;
    const admin = createAdminClient();

    // 2b. SAFETY CLASSIFIER — same protection as onboarding
    try {
      const safetyResult = await runAICall<SafetyClassifierResponse>(
        'safety_classifier',
        { input: message }
      );

      if (!safetyResult.data.safe) {
        // Log to safety_escalations
        try {
          await admin.from('safety_escalations').insert({
            student_id: user.id,
            flagged_text: message,
            flag_reason: safetyResult.data.flag_reason,
            route_source: 'teach_chat',
            status: 'pending_review',
          });
        } catch (dbErr) {
          console.error('[teach/chat] Failed to insert safety escalation:', dbErr);
        }

        // Return safe deflection — don't process the message
        return NextResponse.json({
          session_id,
          message: {
            id: 'safety-deflection',
            role: 'ai',
            content: "Hey — it sounds like there might be something on your mind beyond the lesson. That's okay. If you ever need to talk to someone, a parent, teacher, or school counselor would be a great person to reach out to. 💙\n\nI'm always here for the study stuff though! What part of the topic should we look at next?",
          },
          ai_provider: 'safety_classifier',
          ai_latency_ms: safetyResult.latencyMs,
        });
      }
    } catch (safetyErr) {
      // Safety classifier failure — fail-open (don't block student),
      // but log to safety_escalations so admin dashboard surfaces sustained failures
      console.error('[teach/chat] Safety classifier error (continuing):', safetyErr);
      try {
        await admin.from('safety_escalations').insert({
          student_id: user.id,
          flagged_text: `[CLASSIFIER_ERROR] ${message.substring(0, 200)}`,
          flag_reason: `Safety classifier failed: ${safetyErr instanceof Error ? safetyErr.message : String(safetyErr)}`,
          route_source: 'teach_chat',
          status: 'classifier_error',
        });
      } catch {
        // Last-resort: if even the error logging fails, just console.error
        console.error('[teach/chat] Failed to log safety classifier error to DB');
      }
    }

    // 3. Verify session ownership + phase
    const { data: session } = await admin
      .from('sessions')
      .select('id, student_id, phase, status, topic_id, plan_topics(title, description)')
      .eq('id', session_id)
      .single();

    if (!session || session.student_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }
    if (session.status !== 'active') {
      return NextResponse.json({ error: 'Session is not active' }, { status: 400 });
    }
    if (session.phase !== 'learn') {
      return NextResponse.json({ error: 'Session is not in learn phase' }, { status: 400 });
    }

    // 4. Handle file attachment
    let attachmentUrl: string | null = null;
    let attachmentPayload: { base64: string; mimeType: string; filename: string } | undefined;

    if (attachment) {
      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(attachment.type)) {
        return NextResponse.json(
          { error: `File type not allowed. Supported: ${ALLOWED_MIME_TYPES.join(', ')}` },
          { status: 400 }
        );
      }

      // Validate size
      const sizeBytes = Math.ceil(attachment.base64.length * 0.75); // base64 to bytes estimate
      const maxSize = attachment.type.startsWith('image/') ? MAX_IMAGE_SIZE : MAX_PDF_SIZE;
      if (sizeBytes > maxSize) {
        const maxMB = Math.round(maxSize / (1024 * 1024));
        return NextResponse.json(
          { error: `File too large. Maximum: ${maxMB}MB` },
          { status: 400 }
        );
      }

      // Upload to Supabase Storage
      const fileBuffer = Buffer.from(attachment.base64, 'base64');
      const filePath = `${session_id}/${Date.now()}_${attachment.name}`;
      
      const { error: uploadError } = await admin.storage
        .from('session-uploads')
        .upload(filePath, fileBuffer, {
          contentType: attachment.type,
          upsert: false,
        });

      if (uploadError) {
        console.error('[teach/chat] Storage upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload file' }, { status: 500 });
      }

      // Get the storage URL for persistence
      const { data: urlData } = admin.storage
        .from('session-uploads')
        .getPublicUrl(filePath);
      attachmentUrl = urlData?.publicUrl || filePath;

      // Prepare attachment for AI call
      attachmentPayload = {
        base64: attachment.base64,
        mimeType: attachment.type,
        filename: attachment.name,
      };
    }

    // 5. Save student message to session_messages
    await admin.from('session_messages').insert({
      session_id,
      role: 'user',
      content: message,
      attachment_url: attachmentUrl,
      attachment_type: attachment?.type || null,
      attachment_name: attachment?.name || null,
    });

    // 6. Load conversation history (capped at 30 turns)
    const { data: history } = await admin
      .from('session_messages')
      .select('role, content')
      .eq('session_id', session_id)
      .order('created_at', { ascending: true })
      .limit(60); // 30 turns = 60 messages max

    const conversationHistory = (history || []).map(m => ({
      role: m.role as 'user' | 'ai',
      content: m.content,
    }));

    // 7. Get student context
    const { data: student } = await admin
      .from('students')
      .select('*')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // 8. Resolve topic
    const topicData = Array.isArray(session.plan_topics)
      ? session.plan_topics[0]
      : session.plan_topics;

    const topic = {
      title: (topicData as { title: string })?.title || 'Unknown Topic',
      description: (topicData as { description?: string })?.description || '',
    };

    // 9. Call AI
    const result = await runAICall<TeachChatResponse>('teach_chat', {
      student: {
        name: student.name,
        country: student.country,
        field: student.field,
        language: student.language,
        studyHoursPerDay: student.study_hours_per_day,
        grade: student.grade ?? undefined,
        educationLevel: student.education_level ?? undefined,
      },
      topic,
      conversationHistory,
      message,
      hasAttachment: !!attachment,
      attachment: attachmentPayload,
    });

    // 10. Save AI response to session_messages
    const { data: aiMessage } = await admin
      .from('session_messages')
      .insert({
        session_id,
        role: 'ai',
        content: result.data.response,
      })
      .select('id, role, content, created_at')
      .single();

    // 11. Return
    return NextResponse.json({
      session_id,
      message: aiMessage,
      ai_provider: result.provider,
      ai_latency_ms: result.latencyMs,
    });
  } catch (err) {
    console.error('[/api/session/teach/chat] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
