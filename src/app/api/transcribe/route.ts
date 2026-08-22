import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
  try {
    // Initialize the OpenAI client dynamically to avoid build-time errors
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // 1. Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Rate limit: 5 transcription requests per 60s per user (Upstash Redis)
    const { transcribeLimiter } = await import('@/lib/rate-limiter');
    const { success, reset } = await transcribeLimiter.limit(user.id);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return NextResponse.json(
        { error: 'Too many transcription requests. Please wait before trying again.' },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // 2. Fetch student language
    const admin = createAdminClient();
    const { data: student } = await admin
      .from('students')
      .select('language')
      .eq('id', user.id)
      .single();

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found' }, { status: 404 });
    }

    // 3. Extract and validate file
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Whisper hard cap is 25MB
    const MAX_SIZE = 25 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Audio file too large (max 25MB)' }, { status: 413 });
    }
    
    // We expect at least some audio payload, reject fully empty blobs
    if (file.size === 0) {
      return NextResponse.json({ error: 'Audio file is empty' }, { status: 400 });
    }

    // 4. Call the Whisper-1 model via OpenAI SDK
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      response_format: 'text',
      language: student.language, // Pulled securely from student profile
    });

    // OpenAI SDK returns a string when response_format is 'text'
    return NextResponse.json({ transcript: transcription });
  } catch (error) {
    console.error('Transcription error:', error);
    const message = error instanceof Error ? error.message : 'Transcription failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
