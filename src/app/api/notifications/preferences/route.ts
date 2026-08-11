/**
 * PATCH /api/notifications/preferences
 *
 * Updates a parent's notification channel preferences (push/email/both/neither).
 * - Auth: parent only
 * - Upserts into notification_preferences (creates row if none exists)
 * - Returns the updated preferences
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const PreferencesSchema = z.object({
  push_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
}).refine(
  (data) => data.push_enabled !== undefined || data.email_enabled !== undefined,
  { message: 'At least one preference (push_enabled or email_enabled) must be provided.' }
);

export async function PATCH(request: NextRequest) {
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
        { error: 'Only parents can manage notification preferences.' },
        { status: 403 }
      );
    }

    // 3. Parse request
    const body = await request.json();
    const parsed = PreferencesSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const updates = parsed.data;

    // 4. Check if preferences row exists
    const { data: existing } = await admin
      .from('notification_preferences')
      .select('id, push_enabled, email_enabled')
      .eq('parent_id', user.id)
      .single();

    let finalPrefs: { push_enabled: boolean; email_enabled: boolean };

    if (existing) {
      // Update existing row — merge with current values
      finalPrefs = {
        push_enabled: updates.push_enabled ?? existing.push_enabled,
        email_enabled: updates.email_enabled ?? existing.email_enabled,
      };

      const { error: updateError } = await admin
        .from('notification_preferences')
        .update(finalPrefs)
        .eq('id', existing.id);

      if (updateError) {
        console.error('[/api/notifications/preferences] Update failed:', updateError);
        return NextResponse.json(
          { error: 'Failed to update preferences.' },
          { status: 500 }
        );
      }
    } else {
      // Create new row — defaults: both enabled (PRD: "v1 default: both push + email")
      finalPrefs = {
        push_enabled: updates.push_enabled ?? true,
        email_enabled: updates.email_enabled ?? true,
      };

      const { error: insertError } = await admin
        .from('notification_preferences')
        .insert({
          parent_id: user.id,
          ...finalPrefs,
        });

      if (insertError) {
        console.error('[/api/notifications/preferences] Insert failed:', insertError);
        return NextResponse.json(
          { error: 'Failed to save preferences.' },
          { status: 500 }
        );
      }
    }

    // 5. Return updated preferences
    return NextResponse.json({
      push_enabled: finalPrefs.push_enabled,
      email_enabled: finalPrefs.email_enabled,
    });
  } catch (err) {
    console.error('[/api/notifications/preferences] Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
