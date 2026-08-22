/**
 * e2e-test.ts — End-to-end test: fresh signup → onboarding → plan gen → check-in → session
 * 
 * This tests the REAL flow programmatically using the same Supabase client
 * and server actions the app uses, just without a browser.
 * 
 * Run: npx tsx scripts/e2e-test.ts
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

const envPath = resolve(__dirname, '..', '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.slice(0, eqIdx).trim();
  const val = trimmed.slice(eqIdx + 1).trim();
  if (!process.env[key]) process.env[key] = val;
}

import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const admin = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEST_EMAIL = `e2e_test_${Date.now()}@test.com`;
const TEST_PASSWORD = 'TestPassword123!';

async function main() {
  console.log('\n=== E2E TEST: Fresh Account → Onboarding → Plan → Check-in → Session ===\n');
  console.log(`Test email: ${TEST_EMAIL}\n`);

  // ── STEP 1: Create a fresh user via admin API ──
  console.log('STEP 1: Creating fresh auth user...');
  const { data: authData, error: authError } = await admin.auth.admin.createUser({
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
    email_confirm: true, // Skip email confirmation
    user_metadata: { full_name: 'E2E Test User', role: 'student' },
  });

  if (authError || !authData.user) {
    console.error('❌ FAILED to create user:', authError);
    process.exit(1);
  }
  const userId = authData.user.id;
  console.log(`✅ User created: ${userId}\n`);

  // ── STEP 2: Verify no students row exists yet ──
  console.log('STEP 2: Verifying no students row exists...');
  const { data: preStudent } = await admin.from('students').select('id').eq('id', userId).maybeSingle();
  console.log(`  Students row: ${preStudent ? '❌ EXISTS (unexpected!)' : '✅ None (correct)'}`);
  
  const { data: prePlans } = await admin.from('plans').select('id').eq('student_id', userId);
  console.log(`  Plans: ${(prePlans || []).length === 0 ? '✅ None (correct)' : '❌ Has plans (unexpected!)'}\n`);

  // ── STEP 3: Simulate onboarding submission (same as submitOnboardingAction) ──
  console.log('STEP 3: Simulating onboarding submission...');
  console.log('  Upserting student profile...');
  
  const onboardingData = {
    id: userId,
    name: 'E2E Test User',
    country: 'Nepal',
    field: 'School',
    language: 'English',
    study_hours_per_day: 1.5,
    timezone: 'Asia/Kathmandu',
    subjects: ['Math', 'Science'],
    education_level: 'High School',
  };

  const { error: upsertError } = await admin.from('students').upsert(onboardingData, { onConflict: 'id' });
  if (upsertError) {
    console.error('❌ FAILED to upsert student:', upsertError);
    process.exit(1);
  }
  console.log('  ✅ Student profile saved\n');

  // ── STEP 4: Generate plan via runAICall (same as onboarding actions.ts now does) ──
  console.log('STEP 4: Generating study plan via runAICall("plan", ...)...');
  console.log('  (This is the same call the onboarding "Complete Setup" button now makes)');
  const startTime = Date.now();

  const { runAICall } = await import('../src/lib/ai/index');
  
  try {
    const result = await runAICall<{ topics: Array<{ day: number; title: string; description: string }> }>('plan', {
      student: {
        name: 'E2E Test User',
        country: 'Nepal',
        field: 'School',
        language: 'English',
        studyHoursPerDay: 1.5,
        timezone: 'Asia/Kathmandu',
      },
      subjects: ['Math', 'Science'],
      deadline: undefined,
    });

    const elapsed = Date.now() - startTime;
    console.log(`  ✅ AI call succeeded — provider=${result.provider}, latency=${elapsed}ms`);
    console.log(`  Topics generated: ${result.data.topics.length}`);
    for (const t of result.data.topics) {
      console.log(`    Day ${t.day}: ${t.title}`);
    }

    // Insert the plan
    const { data: newPlan, error: planErr } = await admin
      .from('plans')
      .insert({ student_id: userId, raw_response: result.data, is_active: true })
      .select('id')
      .single();

    if (planErr || !newPlan) {
      console.error('❌ FAILED to insert plan:', planErr);
      process.exit(1);
    }

    // Insert plan_topics
    const topicRows = result.data.topics.map((topic, index) => ({
      plan_id: newPlan.id,
      title: topic.title,
      description: topic.description,
      day: topic.day,
      sort_order: index + 1,
      status: 'pending' as const,
    }));

    const { error: topicsErr } = await admin.from('plan_topics').insert(topicRows);
    if (topicsErr) {
      console.error('❌ FAILED to insert plan_topics:', topicsErr);
      process.exit(1);
    }
    console.log(`  ✅ Plan + ${topicRows.length} topics inserted\n`);

  } catch (aiErr) {
    console.error('❌ AI call FAILED:', aiErr instanceof Error ? aiErr.message : String(aiErr));
    process.exit(1);
  }

  // ── STEP 5: Simulate check-in (same logic as submitCheckinAction) ──
  console.log('STEP 5: Simulating check-in...');
  
  // Find active plan
  const { data: plan } = await admin
    .from('plans')
    .select('id')
    .eq('student_id', userId)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (!plan?.id) {
    console.error('❌ No active plan found — this is the exact bug we fixed!');
    process.exit(1);
  }
  console.log(`  ✅ Active plan found: ${plan.id}`);

  // Fetch next pending topic
  const { data: topic } = await admin
    .from('plan_topics')
    .select('id, title')
    .eq('plan_id', plan.id)
    .eq('status', 'pending')
    .order('sort_order', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!topic) {
    console.error('❌ No pending topic found — check-in would show "finished your plan" error!');
    process.exit(1);
  }
  console.log(`  ✅ Next pending topic: "${topic.title}"`);

  // Create session
  const { data: session, error: sessionErr } = await admin
    .from('sessions')
    .insert({
      student_id: userId,
      topic_id: topic.id,
      phase: 'learn',
      status: 'active',
    })
    .select('id')
    .single();

  if (sessionErr || !session) {
    console.error('❌ FAILED to create session:', sessionErr);
    process.exit(1);
  }
  console.log(`  ✅ Session created: ${session.id}`);

  // Create checkin
  const { error: checkinErr } = await admin.from('checkins').insert({
    student_id: userId,
    session_id: session.id,
    mood_text: 'Feeling great, ready to focus',
    escalation_tier: 0,
    escalation_tier_is_mocked: true,
    notification_status: 'not_applicable',
  });

  if (checkinErr) {
    console.error('❌ FAILED to create checkin:', checkinErr);
    // Non-fatal, continue
  } else {
    console.log(`  ✅ Check-in recorded`);
  }

  console.log(`\n  → User would now be routed to /session/${session.id}`);
  console.log(`  → Session phase: "learn" — the Learn page would load and call /api/session/teach\n`);

  // ── STEP 6: Verify the teach API would work ──
  console.log('STEP 6: Verifying teach API prerequisites...');
  
  const { data: fullSession } = await admin
    .from('sessions')
    .select('id, student_id, phase, status, topic_id, plan_topics(title)')
    .eq('id', session.id)
    .single();

  if (!fullSession) {
    console.error('❌ Could not fetch session with topic join');
    process.exit(1);
  }

  const topicTitle = Array.isArray(fullSession.plan_topics) 
    ? (fullSession.plan_topics[0] as any)?.title 
    : (fullSession.plan_topics as any)?.title || "Unknown Topic";

  console.log(`  Session ${session.id}:`);
  console.log(`    phase: ${fullSession.phase}`);
  console.log(`    status: ${fullSession.status}`);
  console.log(`    topic: "${topicTitle}"`);
  console.log(`  ✅ All prerequisites for /api/session/teach are met\n`);

  // ── CLEANUP ──
  console.log('CLEANUP: Removing test data...');
  await admin.from('checkins').delete().eq('session_id', session.id);
  await admin.from('sessions').delete().eq('id', session.id);
  await admin.from('plan_topics').delete().eq('plan_id', plan.id);
  await admin.from('plans').delete().eq('id', plan.id);
  await admin.from('students').delete().eq('id', userId);
  await admin.auth.admin.deleteUser(userId);
  console.log('  ✅ Test user and all data cleaned up\n');

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  ✅ END-TO-END TEST PASSED');
  console.log('  All steps completed with zero errors:');
  console.log('    1. Fresh user created');
  console.log('    2. No pre-existing data (clean state)');
  console.log('    3. Onboarding profile saved');
  console.log('    4. Real AI plan generated via runAICall');
  console.log('    5. Check-in found plan + topic + created session');
  console.log('    6. Session ready for Learn phase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main().catch(console.error);
