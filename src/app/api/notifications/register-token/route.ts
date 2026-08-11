/**
 * POST /api/notifications/register-token
 *
 * Registers (or refreshes) an FCM push notification token for a parent's device.
 * - Auth: parent only (verifies user is in parents table)
 * - Upserts on the token value to avoid duplicates from the same device
 * - Returns the token record ID
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const RegisterTokenSchema = z.object({
  token: z.string().min(1, 'FCM token cannot be empty'),
  device_info: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Verify user is a parent
    const admin = createAdminClient();
    const { data: parent } = await admin
      .from('parents')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!parent) {
      return NextResponse.json(
        { error: 'Only parents can register push notification tokens.' },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body = await request.json();
    const parsed = RegisterTokenSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { token, device_info } = parsed.data;

    // 4. Upsert — if this exact token already exists for this parent, update device_info.
    //    A parent may have multiple devices, but the same token shouldn't be duplicated.
    const { data: existing } = await admin
      .from('fcm_tokens')
      .select('id')
      .eq('parent_id', user.id)
      .eq('token', token)
      .single();

    let tokenId: string;

    if (existing) {
      // Token already registered — update device_info and timestamp
      await admin
        .from('fcm_tokens')
        .update({
          device_info: device_info ?? null,
          created_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
      tokenId = existing.id;
    } else {
      // New token — insert
      const { data: newToken, error: insertError } = await admin
        .from('fcm_tokens')
        .insert({
          parent_id: user.id,
          token,
          device_info: device_info ?? null,
        })
        .select('id')
        .single();

      if (insertError || !newToken) {
        console.error('[/api/notifications/register-token] Insert failed:', insertError);
        return NextResponse.json(
          { error: 'Failed to register token.' },
          { status: 500 }
        );
      }
      tokenId = newToken.id;
    }

    // 5. Return
    return NextResponse.json({
      success: true,
      token_id: tokenId,
      is_update: !!existing,
    });
  } catch (err) {
    console.error('[/api/notifications/register-token] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
