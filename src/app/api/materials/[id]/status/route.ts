import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/materials/:id/status — Poll ingestion status
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: material, error } = await supabase
      .from('materials')
      .select('id, status, error_message, page_count, updated_at')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Also fetch topic count if ready
    let topicCount = 0;
    if (material.status === 'ready') {
      const { count } = await supabase
        .from('extracted_topics')
        .select('id', { count: 'exact', head: true })
        .eq('material_id', id);
      topicCount = count ?? 0;
    }

    return NextResponse.json({
      id: material.id,
      status: material.status,
      error_message: material.error_message,
      page_count: material.page_count,
      topic_count: topicCount,
      updated_at: material.updated_at,
    });
  } catch (error) {
    console.error('[Materials] Status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
