import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET  /api/materials/:id/topics — Get extracted topics
 * PATCH /api/materials/:id/topics — Update/approve extracted topics
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

    // Verify ownership
    const { data: material } = await supabase
      .from('materials')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const { data: topics, error } = await supabase
      .from('extracted_topics')
      .select('*')
      .eq('material_id', id)
      .order('sort_order', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ topics });
  } catch (error) {
    console.error('[Materials] Topics GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Verify ownership
    const { data: material } = await supabase
      .from('materials')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    const body = await request.json();
    const { topics } = body as {
      topics: Array<{ id: string; approved: boolean; name?: string }>;
    };

    if (!topics || !Array.isArray(topics)) {
      return NextResponse.json({ error: 'topics array is required' }, { status: 400 });
    }

    // Update each topic
    for (const topic of topics) {
      const updateData: Record<string, unknown> = { approved: topic.approved };
      if (topic.name) updateData.name = topic.name;

      await supabase
        .from('extracted_topics')
        .update(updateData)
        .eq('id', topic.id)
        .eq('material_id', id);
    }

    // Fetch updated topics
    const { data: updatedTopics } = await supabase
      .from('extracted_topics')
      .select('*')
      .eq('material_id', id)
      .order('sort_order', { ascending: true });

    return NextResponse.json({ topics: updatedTopics });
  } catch (error) {
    console.error('[Materials] Topics PATCH error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
