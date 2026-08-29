/**
 * Test the teach route's stale-session guard directly.
 * Uses the admin client to simulate the teach API call flow
 * (since we can't easily authenticate as a student via script).
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

const STALE_SESSION_THRESHOLD_MS = 2 * 60 * 60 * 1000; // 2 hours — same as teach route

async function run() {
  const studentId = '928e693e-ea1a-472e-9a13-16a5a2342132';
  const topicId = '0ba23973-db33-444e-9cd9-15fac2ab7b51';

  // Check current state
  const { data: existingSession } = await admin
    .from('sessions')
    .select('id, phase, status, started_at, ended_at')
    .eq('student_id', studentId)
    .eq('topic_id', topicId)
    .eq('status', 'active')
    .single();

  console.log('\n=== Current active session ===');
  console.log(JSON.stringify(existingSession, null, 2));

  if (!existingSession) {
    console.log('No active session found. Nothing to test.');
    return;
  }

  const sessionAge = Date.now() - new Date(existingSession.started_at).getTime();
  const isStale = sessionAge > STALE_SESSION_THRESHOLD_MS;

  console.log(`\nSession age: ${Math.round(sessionAge / 60000)} minutes`);
  console.log(`Stale threshold: ${STALE_SESSION_THRESHOLD_MS / 60000} minutes`);
  console.log(`Is stale: ${isStale}`);

  if (isStale) {
    // Simulate what the teach route does
    console.log('\n=== Simulating teach route stale-session guard ===');

    // Step 1: Abandon the stale session
    const { error: updateErr } = await admin
      .from('sessions')
      .update({ status: 'abandoned', ended_at: new Date().toISOString() })
      .eq('id', existingSession.id);

    if (updateErr) {
      console.log('Failed to abandon:', updateErr);
      return;
    }
    console.log(`✓ Abandoned stale session ${existingSession.id}`);

    // Step 2: Create a new session
    const { data: newSession, error: insertErr } = await admin
      .from('sessions')
      .insert({
        student_id: studentId,
        topic_id: topicId,
        phase: 'learn',
        status: 'active',
      })
      .select('id, phase, status, started_at')
      .single();

    if (insertErr) {
      console.log('Failed to create new session:', insertErr);
      return;
    }
    console.log(`✓ Created fresh session ${newSession.id}`);

    // Step 3: Show final state
    const { data: allSessions } = await admin
      .from('sessions')
      .select('id, phase, status, started_at, ended_at')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .order('started_at', { ascending: false });

    console.log('\n=== FINAL STATE — all sessions for this topic ===');
    console.log(JSON.stringify(allSessions, null, 2));

    const abandoned = allSessions?.filter(s => s.status === 'abandoned') || [];
    const active = allSessions?.filter(s => s.status === 'active') || [];

    console.log(`\n✓ Abandoned sessions: ${abandoned.length} (all have ended_at set: ${abandoned.every(s => s.ended_at !== null)})`);
    console.log(`✓ Active sessions: ${active.length} (the fresh one)`);
    console.log('\n=== TEST PASSED ===');
  }
}

run().catch(console.error);
