/**
 * Notifications — Unified Entry Point
 *
 * notifyParent() checks the parent's notification_preferences and sends
 * via the appropriate channel(s): push, email, both, or neither.
 *
 * Re-exports individual senders for direct use by cron jobs or routes
 * that need more control.
 */

import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToParent } from './firebase';
import { sendEmail } from './email';

// Re-export for direct use
export { sendPushNotification, sendPushToParent } from './firebase';
export { sendEmail, sendDigestEmail } from './email';

// ---------------------------------------------------------------------------
// Unified parent notification
// ---------------------------------------------------------------------------

export interface NotifyParentOptions {
  title: string;
  body: string;
  /** HTML version of body for email — falls back to body wrapped in <p> */
  emailHtml?: string;
}

export interface NotifyParentResult {
  parentId: string;
  push: { attempted: boolean; sent: number; failed: number };
  email: { attempted: boolean; success: boolean; error?: string };
}

/**
 * Send a notification to a parent through their preferred channel(s).
 *
 * Looks up the parent's notification_preferences (push/email/both)
 * and sends accordingly. If no preferences row exists, defaults to
 * both channels (per PRD: "v1 default: both push + email").
 *
 * @param parentId - The parent's auth user ID
 * @param options - Notification content
 */
export async function notifyParent(
  parentId: string,
  options: NotifyParentOptions
): Promise<NotifyParentResult> {
  const supabase = createAdminClient();

  // Fetch parent's notification preferences
  const { data: prefs } = await supabase
    .from('notification_preferences')
    .select('push_enabled, email_enabled')
    .eq('parent_id', parentId)
    .single();

  // Default: both enabled (PRD Section 2: "v1 default: both push + email")
  const pushEnabled = prefs?.push_enabled ?? true;
  const emailEnabled = prefs?.email_enabled ?? true;

  const result: NotifyParentResult = {
    parentId,
    push: { attempted: false, sent: 0, failed: 0 },
    email: { attempted: false, success: false },
  };

  // Send push notification
  if (pushEnabled) {
    result.push.attempted = true;
    const pushResult = await sendPushToParent(parentId, options.title, options.body);
    result.push.sent = pushResult.sent;
    result.push.failed = pushResult.failed;
  }

  // Send email notification
  if (emailEnabled) {
    result.email.attempted = true;

    // Look up parent's email from auth.users (via parents table FK)
    // Since parents.id references auth.users(id), we query Supabase Auth
    const { data: authUser } = await supabase.auth.admin.getUserById(parentId);

    if (authUser?.user?.email) {
      const html = options.emailHtml ?? `<p>${options.body}</p>`;
      const emailResult = await sendEmail(
        authUser.user.email,
        options.title,
        html
      );
      result.email.success = emailResult.success;
      if (!emailResult.success) {
        result.email.error = emailResult.error;
      }
    } else {
      result.email.success = false;
      result.email.error = 'Parent email not found in auth.users.';
    }
  }

  return result;
}
