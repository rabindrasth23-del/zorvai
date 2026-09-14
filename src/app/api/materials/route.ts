import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { runIngestionPipeline } from '@/lib/ingestion/pipeline';

/**
 * POST /api/materials — Upload a file, create material record, kick off ingestion
 * GET  /api/materials — List all materials for the current user
 */

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const subject = formData.get('subject') as string | null;

    if (!file || !subject) {
      return NextResponse.json(
        { error: 'File and subject are required' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Allowed: PDF, PNG, JPG, WebP, TXT' },
        { status: 400 }
      );
    }

    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 20MB.' },
        { status: 400 }
      );
    }

    // Determine type
    const materialType = file.type === 'application/pdf'
      ? 'pdf'
      : file.type.startsWith('image/')
        ? 'image'
        : 'text';

    // Upload to Supabase Storage
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const storagePath = `${user.id}/${Date.now()}_${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('materials')
      .upload(storagePath, fileBuffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Create material record
    const { data: material, error: insertError } = await supabase
      .from('materials')
      .insert({
        user_id: user.id,
        subject,
        filename: file.name,
        type: materialType,
        storage_url: storagePath,
        status: 'queued',
        file_size_bytes: file.size,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create material record: ${insertError.message}` },
        { status: 500 }
      );
    }

    // Kick off ingestion asynchronously (fire-and-forget)
    runIngestionPipeline(material.id).catch(err =>
      console.error('[Materials] Ingestion pipeline failed:', err)
    );

    return NextResponse.json({ material }, { status: 201 });
  } catch (error) {
    console.error('[Materials] POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: materials, error } = await supabase
      .from('materials')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ materials });
  } catch (error) {
    console.error('[Materials] GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
