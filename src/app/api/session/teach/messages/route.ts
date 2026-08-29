/**
 * GET /api/session/teach/messages?session_id=xxx
 *
 * Returns all conversation messages for a learn-phase session.
 * Used on page load to restore conversation state after refresh.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get session_id from query params
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    const admin = createAdminClient();

    // 3. Verify session ownership
    const { data: session } = await admin
      .from('sessions')
      .select('id, student_id')
      .eq('id', sessionId)
      .single();

    if (!session || session.student_id !== user.id) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    // 4. Fetch all messages ordered by time
    const { data: messages, error } = await admin
      .from('session_messages')
      .select('id, role, content, attachment_url, attachment_type, attachment_name, created_at')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[teach/messages] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({
      session_id: sessionId,
      messages: messages || [],
    });
  } catch (err) {
    console.error('[/api/session/teach/messages] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
