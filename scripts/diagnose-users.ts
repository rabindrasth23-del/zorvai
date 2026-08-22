/**
 * diagnose-users.ts — Query all users' plan state
 * 
 * Run: npx tsx scripts/diagnose-users.ts
 * 
 * Reports for every auth user:
 * - Has students row?
 * - Number of plans (active/inactive)
 * - Number of plan_topics (by status)
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

async function main() {
  console.log('\n=== ZORVAI USER DIAGNOSTIC ===\n');

  // 1. List all auth users
  const { data: authData, error: authError } = await admin.auth.admin.listUsers();
  if (authError) {
    console.error('Failed to list auth users:', authError);
    process.exit(1);
  }

  const users = authData.users;
  console.log(`Total auth users: ${users.length}\n`);

  for (const user of users) {
    const email = user.email || '(no email)';
    const provider = user.app_metadata?.provider || 'unknown';
    console.log(`--- ${email} (${provider}) ---`);
    console.log(`  Auth ID: ${user.id}`);

    // 2. Check students row
    const { data: student, error: studentErr } = await admin
      .from('students')
      .select('id, name, field, country, language, subjects, education_level')
      .eq('id', user.id)
      .maybeSingle();

    if (studentErr) {
      console.log(`  Students row: ERROR — ${studentErr.message}`);
    } else if (!student) {
      console.log(`  Students row: ❌ MISSING — no student record exists`);
    } else {
      console.log(`  Students row: ✅ EXISTS — name="${student.name}", field="${student.field}"`);
      console.log(`    subjects=${JSON.stringify(student.subjects)}, education_level="${student.education_level}"`);
    }

    // 3. Check plans
    const { data: plans, error: plansErr } = await admin
      .from('plans')
      .select('id, is_active, created_at, raw_response')
      .eq('student_id', user.id)
      .order('created_at', { ascending: false });

    if (plansErr) {
      console.log(`  Plans: ERROR — ${plansErr.message}`);
    } else if (!plans || plans.length === 0) {
      console.log(`  Plans: ❌ ZERO plans`);
    } else {
      console.log(`  Plans: ${plans.length} total`);
      for (const p of plans) {
        const isDummy = p.raw_response?.note?.includes('DUMMY') || false;
        console.log(`    Plan ${p.id.slice(0, 8)}... active=${p.is_active} created=${p.created_at} ${isDummy ? '⚠️ DUMMY STUB' : ''}`);

        // 4. Check plan_topics for this plan
        const { data: topics, error: topicsErr } = await admin
          .from('plan_topics')
          .select('id, title, status, sort_order')
          .eq('plan_id', p.id)
          .order('sort_order', { ascending: true });

        if (topicsErr) {
          console.log(`      Topics: ERROR — ${topicsErr.message}`);
        } else if (!topics || topics.length === 0) {
          console.log(`      Topics: ❌ ZERO plan_topics rows`);
        } else {
          const statusCounts: Record<string, number> = {};
          for (const t of topics) {
            statusCounts[t.status] = (statusCounts[t.status] || 0) + 1;
          }
          console.log(`      Topics: ${topics.length} rows — ${JSON.stringify(statusCounts)}`);
          for (const t of topics) {
            console.log(`        [${t.status}] ${t.title}`);
          }
        }
      }
    }

    console.log('');
  }
}

main().catch(console.error);
