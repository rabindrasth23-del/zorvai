/**
 * Email Notifications — Resend Integration
 *
 * Sends transactional emails (weekly digest, escalation alerts) via Resend.
 * Handles missing RESEND_API_KEY gracefully — logs a warning, doesn't crash.
 */

import { Resend } from 'resend';

// ---------------------------------------------------------------------------
// Lazy client initialization
// ---------------------------------------------------------------------------

let resendClient: Resend | null = null;
let resendInitFailed = false;

function getResendClient(): Resend | null {
  if (resendClient) return resendClient;
  if (resendInitFailed) return null;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      '[Email] RESEND_API_KEY not set. Email notifications will not be sent. ' +
        'Set this in .env.local to enable email delivery.'
    );
    resendInitFailed = true;
    return null;
  }

  resendClient = new Resend(apiKey);
  return resendClient;
}

// ---------------------------------------------------------------------------
// Send a single email
// ---------------------------------------------------------------------------

export interface EmailResult {
  success: boolean;
  to: string;
  error?: string;
}

/**
 * Send a single email via Resend.
 *
 * @param to - Recipient email address
 * @param subject - Email subject line
 * @param html - Email body (HTML)
 * @returns Result object with success/failure info
 */
export async function sendEmail(
  to: string,
  subject: string,
  html: string
): Promise<EmailResult> {
  const client = getResendClient();
  if (!client) {
    return {
      success: false,
      to,
      error: 'Resend not configured — email skipped.',
    };
  }

  try {
    const { error } = await client.emails.send({
      // TODO: Replace with verified sender domain once configured in Resend
      from: 'Zorvai <notifications@zorvai.com>',
      to,
      subject,
      html,
    });

    if (error) {
      console.error(`[Email] Resend API error sending to ${to}:`, error);
      return { success: false, to, error: error.message };
    }

    return { success: true, to };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Email] Failed to send email to ${to}:`, errorMsg);
    return { success: false, to, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Send a digest email (convenience wrapper)
// ---------------------------------------------------------------------------

/**
 * Send a formatted weekly digest email to a parent.
 */
export async function sendDigestEmail(
  parentEmail: string,
  digestHtml: string
): Promise<EmailResult> {
  return sendEmail(
    parentEmail,
    'Zorvai — Weekly Study Digest',
    digestHtml
  );
}
