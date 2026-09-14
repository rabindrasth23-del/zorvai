import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/admin/materials/:id — Moderate a material (approve/flag/remove)
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body as { action: 'approve' | 'flag' | 'remove' };

    if (action === 'remove') {
      // Delete material and associated data
      await supabase.from('material_chunks').delete().eq('material_id', id);
      await supabase.from('extracted_topics').delete().eq('material_id', id);
      await supabase.from('materials').delete().eq('id', id);
    } else {
      // Update status
      await supabase
        .from('materials')
        .update({
          moderation_status: action === 'approve' ? 'approved' : 'flagged',
          moderated_by: user.id,
          moderated_at: new Date().toISOString(),
        })
        .eq('id', id);
    }

    return NextResponse.json({ success: true, action });
  } catch (error) {
    console.error('[Admin/Materials] Moderate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
