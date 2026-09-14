import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/materials — Material moderation queue
 */
export async function GET() {
  try {
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

    const { data: materials } = await supabase
      .from('materials')
      .select(`
        id,
        user_id,
        filename,
        subject,
        type,
        file_size_bytes,
        page_count,
        status,
        created_at,
        students!inner ( name )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    const enriched = (materials || []).map((m: Record<string, unknown>) => {
      const student = m.students as { name: string } | null;
      const flags: string[] = [];

      // Auto-flag rules
      const pageCount = m.page_count as number | null;
      const sizeBytes = m.file_size_bytes as number | null;
      if (pageCount && pageCount > 50) flags.push('large-document');
      if (sizeBytes && sizeBytes > 15 * 1024 * 1024) flags.push('oversized');

      return {
        id: m.id,
        student_name: student?.name || 'Unknown',
        filename: m.filename,
        subject: m.subject,
        type: m.type,
        file_size_bytes: m.file_size_bytes,
        page_count: m.page_count,
        status: m.status,
        flags,
        created_at: m.created_at,
      };
    });

    return NextResponse.json({ materials: enriched });
  } catch (error) {
    console.error('[Admin/Materials] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
