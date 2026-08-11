/**
 * Firebase Cloud Messaging — Push Notification Sender
 *
 * Singleton Firebase Admin SDK initialization + push notification helpers.
 * Handles missing credentials gracefully — logs a warning instead of crashing,
 * so the rest of the app works even if Firebase isn't configured yet.
 *
 * Uses firebase-admin v14 modular imports.
 */

import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import { createAdminClient } from '@/lib/supabase/admin';

// ---------------------------------------------------------------------------
// Singleton initialization
// ---------------------------------------------------------------------------

let firebaseApp: App | null = null;
let firebaseInitFailed = false;

function getFirebaseApp(): App | null {
  if (firebaseApp) return firebaseApp;
  if (firebaseInitFailed) return null;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      '[Firebase] Missing credentials (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY). ' +
        'Push notifications will not be sent. Set these in .env.local to enable FCM.'
    );
    firebaseInitFailed = true;
    return null;
  }

  try {
    // Check if already initialized (e.g. hot reload in dev)
    const existingApps = getApps();
    if (existingApps.length > 0) {
      firebaseApp = existingApps[0]!;
      return firebaseApp;
    }

    firebaseApp = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        // Firebase private key comes as a string with literal \n — replace with real newlines
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });

    console.log('[Firebase] Admin SDK initialized successfully.');
    return firebaseApp;
  } catch (err) {
    console.error('[Firebase] Failed to initialize Admin SDK:', err);
    firebaseInitFailed = true;
    return null;
  }
}

// ---------------------------------------------------------------------------
// Send a single push notification to one FCM token
// ---------------------------------------------------------------------------

export interface PushResult {
  success: boolean;
  token: string;
  error?: string;
}

export async function sendPushNotification(
  token: string,
  title: string,
  body: string
): Promise<PushResult> {
  const app = getFirebaseApp();
  if (!app) {
    return {
      success: false,
      token,
      error: 'Firebase not configured — push notification skipped.',
    };
  }

  try {
    const messaging = getMessaging(app);
    await messaging.send({
      token,
      notification: { title, body },
      // High priority for time-sensitive notifications (e.g. Tier 2 escalation)
      android: { priority: 'high' },
      apns: { payload: { aps: { sound: 'default' } } },
    });

    return { success: true, token };
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error(`[Firebase] Failed to send push to token ${token.slice(0, 12)}...:`, errorMsg);
    return { success: false, token, error: errorMsg };
  }
}

// ---------------------------------------------------------------------------
// Send push to all of a parent's registered devices
// ---------------------------------------------------------------------------

export async function sendPushToParent(
  parentId: string,
  title: string,
  body: string
): Promise<{ sent: number; failed: number; results: PushResult[] }> {
  const supabase = createAdminClient();

  const { data: tokens, error } = await supabase
    .from('fcm_tokens')
    .select('token')
    .eq('parent_id', parentId);

  if (error || !tokens || tokens.length === 0) {
    return {
      sent: 0,
      failed: 0,
      results: [
        {
          success: false,
          token: '(none)',
          error: tokens?.length === 0
            ? 'No FCM tokens registered for this parent.'
            : `Failed to fetch FCM tokens: ${error?.message}`,
        },
      ],
    };
  }

  const results = await Promise.all(
    tokens.map((t) => sendPushNotification(t.token, title, body))
  );

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    results,
  };
}
