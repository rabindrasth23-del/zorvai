/**
 * Stale-Session Fix — Live Verification
 * 
 * Runs against the real Supabase database using the admin client.
 * 1. Finds a student + topic
 * 2. Inserts a fake stale session (3 hours old)
 * 3. Reports what's in the sessions table for that topic (BEFORE state)
 * 4. Then we'll test the cron sweep + teach route against it
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey);

async function run() {
  const step = process.argv[2] || 'setup';

  if (step === 'setup') {
    // Find a student with an active plan and topic
    const { data: plans, error: planErr } = await admin
      .from('plans')
      .select('student_id, id')
      .eq('is_active', true)
      .limit(1);

    if (planErr || !plans?.length) {
      console.log('No active plans found. Cannot test.');
      console.log('Error:', planErr);
      return;
    }

    const plan = plans[0];
    const { data: student } = await admin
      .from('students')
      .select('id, name, country, field')
      .eq('id', plan.student_id)
      .single();

    const { data: topics } = await admin
      .from('plan_topics')
      .select('id, title, status')
      .eq('plan_id', plan.id)
      .limit(3);

    if (!topics?.length) {
      console.log('No topics found for this plan.');
      return;
    }

    const topic = topics[0];

    console.log('\n=== STEP 1: Found test data ===');
    console.log('Student:', JSON.stringify(student, null, 2));
    console.log('Topic:', JSON.stringify(topic, null, 2));

    // Check existing sessions for this topic
    const { data: existingSessions } = await admin
      .from('sessions')
      .select('id, phase, status, started_at, ended_at')
      .eq('student_id', student.id)
      .eq('topic_id', topic.id)
      .order('started_at', { ascending: false });

    console.log('\n=== Existing sessions for this topic ===');
    console.log(JSON.stringify(existingSessions || [], null, 2));

    // Insert a fake stale session (3 hours old)
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
    const { data: staleSession, error: insertErr } = await admin
      .from('sessions')
      .insert({
        student_id: student.id,
        topic_id: topic.id,
        phase: 'learn',
        status: 'active',
        started_at: threeHoursAgo,
      })
      .select('id, phase, status, started_at')
      .single();

    if (insertErr) {
      console.log('\nFailed to insert stale session:', insertErr);
      return;
    }

    console.log('\n=== STEP 2: Inserted fake stale session ===');
    console.log(JSON.stringify(staleSession, null, 2));
    console.log('\nStale session ID:', staleSession.id);
    console.log('Topic ID:', topic.id);
    console.log('Student ID:', student.id);

    // Show all active sessions now
    const { data: allActive } = await admin
      .from('sessions')
      .select('id, phase, status, started_at, ended_at')
      .eq('student_id', student.id)
      .eq('topic_id', topic.id)
      .order('started_at', { ascending: false });

    console.log('\n=== BEFORE state — all sessions for this topic ===');
    console.log(JSON.stringify(allActive, null, 2));

  } else if (step === 'verify') {
    // After running cron or teach route, check the state
    const topicId = process.argv[3];
    const studentId = process.argv[4];

    if (!topicId || !studentId) {
      console.log('Usage: node scripts/test-stale-live.js verify <topic_id> <student_id>');
      return;
    }

    const { data: sessions } = await admin
      .from('sessions')
      .select('id, phase, status, started_at, ended_at')
      .eq('student_id', studentId)
      .eq('topic_id', topicId)
      .order('started_at', { ascending: false });

    console.log('\n=== AFTER state — all sessions for this topic ===');
    console.log(JSON.stringify(sessions, null, 2));

    // Highlight the result
    const abandoned = sessions?.filter(s => s.status === 'abandoned') || [];
    const active = sessions?.filter(s => s.status === 'active') || [];
    
    console.log('\n=== RESULT ===');
    console.log(`Abandoned sessions: ${abandoned.length}`);
    console.log(`Active sessions: ${active.length}`);
    
    if (abandoned.length > 0 && abandoned.some(s => s.ended_at)) {
      console.log('✓ Stale session was abandoned with ended_at set');
    }
    if (active.length === 0) {
      console.log('✓ No active sessions remain (cron cleaned up, new one not yet created)');
    }

  } else if (step === 'count-all-stale') {
    // Count how many stale active sessions exist system-wide right now
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const { data: stale, error } = await admin
      .from('sessions')
      .select('id, student_id, phase, started_at')
      .eq('status', 'active')
      .lt('started_at', twoHoursAgo);

    console.log('\n=== System-wide stale active sessions (>2 hours old) ===');
    console.log(`Count: ${stale?.length || 0}`);
    if (stale?.length) {
      console.log(JSON.stringify(stale, null, 2));
    }
  }
}

run().catch(console.error);
