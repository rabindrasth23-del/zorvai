import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * DELETE /api/materials/:id — Remove uploaded file and its embeddings
 */
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Fetch material (verify ownership + get storage path)
    const { data: material } = await supabase
      .from('materials')
      .select('id, storage_url')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 });
    }

    // Delete from storage
    await supabase.storage
      .from('materials')
      .remove([material.storage_url]);

    // Delete material record (cascades to chunks + extracted_topics)
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Materials] DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
