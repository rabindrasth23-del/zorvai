/**
 * check-schema.ts — Query the REAL students table schema from Postgres
 * Run: npx tsx scripts/check-schema.ts
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
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log('\n=== STUDENTS TABLE SCHEMA ===\n');

  // Query information_schema for the students table columns
  const { data, error } = await admin
    .rpc('', {}) // This won't work, use raw SQL via REST
    .select();

  // Use the PostgREST approach - query a known row and check what columns come back
  // Better: use the Supabase Management API or direct SQL

  // Approach: Try to select * from students with limit 1
  const { data: sampleRow, error: sampleErr } = await admin
    .from('students')
    .select('*')
    .limit(1)
    .maybeSingle();

  if (sampleErr) {
    console.error('Error querying students:', sampleErr);
  }
  
  if (sampleRow) {
    console.log('Columns found in students table (from sample row):');
    const cols = Object.keys(sampleRow);
    for (const col of cols.sort()) {
      const val = sampleRow[col];
      const type = val === null ? 'null' : typeof val === 'object' ? (Array.isArray(val) ? 'array' : 'object') : typeof val;
      console.log(`  ${col}: ${type} = ${JSON.stringify(val)}`);
    }
    console.log(`\nTotal columns: ${cols.length}`);
  } else {
    console.log('No rows in students table to inspect schema from.');
    // Try inserting and reading columns from the error
    console.log('\nAttempting dummy select with known + potential columns...');
    
    const testCols = [
      'id', 'name', 'field', 'country', 'language', 'study_hours_per_day',
      'timezone', 'subjects', 'education_level', 'onboarded', 'grade',
      'target_subject', 'confidence_level', 'monthly_goal', 'baseline_score',
      'invite_code', 'created_at', 'updated_at', 'parent_id'
    ];
    
    for (const col of testCols) {
      const { error: colErr } = await admin
        .from('students')
        .select(col)
        .limit(0);
      const status = colErr ? `❌ ${colErr.message}` : '✅ exists';
      console.log(`  ${col}: ${status}`);
    }
  }

  // Also check plans and plan_topics schemas
  console.log('\n=== PLANS TABLE SCHEMA ===\n');
  const { data: planSample } = await admin.from('plans').select('*').limit(1).maybeSingle();
  if (planSample) {
    const cols = Object.keys(planSample).sort();
    for (const col of cols) {
      const val = planSample[col];
      const type = val === null ? 'null' : typeof val;
      console.log(`  ${col}: ${type}`);
    }
  }

  console.log('\n=== PLAN_TOPICS TABLE SCHEMA ===\n');
  const { data: topicSample } = await admin.from('plan_topics').select('*').limit(1).maybeSingle();
  if (topicSample) {
    const cols = Object.keys(topicSample).sort();
    for (const col of cols) {
      const val = topicSample[col];
      const type = val === null ? 'null' : typeof val;
      console.log(`  ${col}: ${type}`);
    }
  } else {
    console.log('No rows in plan_topics to inspect.');
    // Check known columns
    const testCols = ['id', 'plan_id', 'title', 'description', 'day', 'sort_order', 'status', 'created_at'];
    for (const col of testCols) {
      const { error: colErr } = await admin.from('plan_topics').select(col).limit(0);
      const status = colErr ? `❌ ${colErr.message}` : '✅ exists';
      console.log(`  ${col}: ${status}`);
    }
  }
}

main().catch(console.error);
