/**
 * seed-plans-for-existing-users.ts
 * 
 * One-off admin script to generate real AI-powered study plans
 * for all existing users who have no plan_topics.
 * 
 * Uses the SAME AI engine (runAICall) and the SAME plan_topics
 * insert logic as the real /api/study-plan route.
 * 
 * Usage:
 *   npx tsx scripts/seed-plans-for-existing-users.ts          # dry-run (read-only)
 *   npx tsx scripts/seed-plans-for-existing-users.ts --execute # actually write data
 * 
 * What it does:
 * 1. Lists all auth users
 * 2. For users missing a students row, creates one with reasonable defaults
 * 3. Deactivates all existing plans (including dummy stubs)
 * 4. Calls runAICall('plan', ...) for each user — real AI, real validation, real logging
 * 5. Inserts plan + plan_topics rows
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually (no dotenv dependency)
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ---- Import the real AI engine ----
// We need to set up the module resolution for the project's @ alias
// Since we're running from scripts/, we resolve manually.

const EXECUTE = process.argv.includes('--execute');

// Default student profile for users without a students row
const DEFAULT_STUDENT = {
  name: 'Student',
  field: 'General Studies',
  country: 'Nepal',
  language: 'English',
  study_hours_per_day: 1.5,
  timezone: 'Asia/Kathmandu',
  subjects: ['Mathematics', 'Science', 'English'],
  education_level: 'High School',
};

async function main() {
  console.log('\n=== ZORVAI PLAN SEED SCRIPT ===');
  console.log(`Mode: ${EXECUTE ? '🔴 EXECUTE (will write to database)' : '🟡 DRY RUN (read-only)'}\n`);

  // 1. List all auth users
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list auth users:', authError);
    process.exit(1);
  }

  const users = authData.users;
  console.log(`Total auth users: ${users.length}\n`);

  let seededCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const user of users) {
    const email = user.email || '(no email)';
    console.log(`\n━━━ Processing: ${email} ━━━`);
    console.log(`  Auth ID: ${user.id}`);

    // 2. Check/create students row
    let { data: student } = await admin
      .from('students')
      .select('id, name, field, country, language, study_hours_per_day, timezone, subjects, education_level')
      .eq('id', user.id)
      .maybeSingle();

    if (!student) {
      const displayName = user.user_metadata?.full_name 
        || user.user_metadata?.name 
        || email.split('@')[0];
      
      console.log(`  Students row: MISSING — will create with defaults (name="${displayName}")`);

      if (EXECUTE) {
        const { error: insertErr } = await admin
          .from('students')
          .insert({
            id: user.id,
            name: displayName,
            field: DEFAULT_STUDENT.field,
            country: DEFAULT_STUDENT.country,
            language: DEFAULT_STUDENT.language,
            study_hours_per_day: DEFAULT_STUDENT.study_hours_per_day,
            timezone: DEFAULT_STUDENT.timezone,
            subjects: DEFAULT_STUDENT.subjects,
            education_level: DEFAULT_STUDENT.education_level,
          });

        if (insertErr) {
          console.error(`  ❌ Failed to create students row:`, insertErr.message);
          errorCount++;
          continue;
        }
        console.log(`  ✅ Students row created`);

        // Re-fetch
        const { data: refetched } = await admin
          .from('students')
          .select('id, name, field, country, language, study_hours_per_day, timezone, subjects, education_level')
          .eq('id', user.id)
          .single();
        student = refetched;
      } else {
        // In dry-run, simulate the student for logging
        student = {
          id: user.id,
          ...DEFAULT_STUDENT,
          name: displayName,
        } as any;
      }
    } else {
      console.log(`  Students row: EXISTS — name="${student.name}", subjects=${JSON.stringify(student.subjects)}`);
    }

    // 3. Check if user already has a real plan with pending topics
    const { data: existingPlans } = await admin
      .from('plans')
      .select('id, is_active, raw_response')
      .eq('student_id', user.id);

    const existingPlanIds = (existingPlans || []).map(p => p.id);
    
    // Check for real (non-dummy) pending topics across all plans
    let hasRealPendingTopics = false;
    if (existingPlanIds.length > 0) {
      const { data: existingTopics } = await admin
        .from('plan_topics')
        .select('id, plan_id, status, title')
        .in('plan_id', existingPlanIds)
        .eq('status', 'pending');

      // Filter out single-topic "Photosynthesis" test artifacts
      const realTopics = (existingTopics || []).filter(t => {
        // Count how many topics this plan has
        const planTopicCount = (existingTopics || []).filter(et => et.plan_id === t.plan_id).length;
        // A real AI plan has at least 3 topics
        return planTopicCount >= 3;
      });

      hasRealPendingTopics = realTopics.length > 0;
    }

    if (hasRealPendingTopics) {
      console.log(`  ⏭️  SKIPPING — already has a real plan with pending topics`);
      skippedCount++;
      continue;
    }

    // 4. Determine subjects to use
    const subjects = (student?.subjects && Array.isArray(student.subjects) && student.subjects.length > 0)
      ? student.subjects as string[]
      : DEFAULT_STUDENT.subjects;

    console.log(`  Subjects for plan: ${JSON.stringify(subjects)}`);

    // 5. Deactivate all existing plans
    if (existingPlanIds.length > 0) {
      console.log(`  Deactivating ${existingPlanIds.length} existing plan(s)...`);
      if (EXECUTE) {
        await admin
          .from('plans')
          .update({ is_active: false })
          .eq('student_id', user.id);
      }
    }

    // 6. Call the REAL AI engine to generate a plan
    console.log(`  Calling runAICall('plan', ...) with real AI engine...`);

    const aiPayload = {
      student: {
        name: student!.name,
        country: student!.country,
        field: student!.field,
        language: student!.language,
        studyHoursPerDay: student!.study_hours_per_day,
        timezone: student!.timezone,
      },
      subjects,
      deadline: undefined,
    };

    if (!EXECUTE) {
      console.log(`  [DRY RUN] Would call runAICall('plan', ${JSON.stringify(aiPayload, null, 2).split('\n').join('\n  ')})`);
      console.log(`  [DRY RUN] Would insert plan + plan_topics rows`);
      seededCount++;
      continue;
    }

    // Dynamic import of the AI engine (needs tsconfig paths)
    // We use the admin client directly since we can't use Next.js server context
    try {
      // Import the real AI engine
      const { runAICall } = await import('../src/lib/ai/index');
      
      const startTime = Date.now();
      const result = await runAICall<{ topics: Array<{ day: number; title: string; description: string }> }>('plan', aiPayload);
      const elapsed = Date.now() - startTime;

      console.log(`  ✅ AI call succeeded — provider=${result.provider}, latency=${elapsed}ms, topics=${result.data.topics.length}`);

      // 7. Insert the new plan
      const { data: newPlan, error: planErr } = await admin
        .from('plans')
        .insert({
          student_id: user.id,
          raw_response: result.data,
          is_active: true,
        })
        .select('id')
        .single();

      if (planErr || !newPlan) {
        console.error(`  ❌ Failed to insert plan:`, planErr?.message);
        errorCount++;
        continue;
      }

      // 8. Insert plan_topics (same logic as /api/study-plan)
      const topicRows = result.data.topics.map((topic, index) => ({
        plan_id: newPlan.id,
        title: topic.title,
        description: topic.description,
        day: topic.day,
        sort_order: index + 1,
        status: 'pending' as const,
      }));

      const { error: topicsErr } = await admin
        .from('plan_topics')
        .insert(topicRows);

      if (topicsErr) {
        console.error(`  ❌ Failed to insert plan_topics:`, topicsErr.message);
        // Clean up orphan plan
        await admin.from('plans').delete().eq('id', newPlan.id);
        errorCount++;
        continue;
      }

      console.log(`  ✅ Plan seeded: ${topicRows.length} topics across ${Math.max(...topicRows.map(t => t.day))} days`);
      for (const t of topicRows) {
        console.log(`    Day ${t.day}: ${t.title}`);
      }
      seededCount++;

    } catch (aiErr) {
      console.error(`  ❌ AI call failed:`, aiErr instanceof Error ? aiErr.message : String(aiErr));
      errorCount++;
    }
  }

  console.log(`\n━━━ SUMMARY ━━━`);
  console.log(`  Seeded: ${seededCount}`);
  console.log(`  Skipped (already had real plans): ${skippedCount}`);
  console.log(`  Errors: ${errorCount}`);
  console.log(`  Mode: ${EXECUTE ? 'EXECUTED' : 'DRY RUN (run with --execute to write)'}\n`);
}

main().catch(console.error);
