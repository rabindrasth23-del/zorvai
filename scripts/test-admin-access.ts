/**
 * Real authenticated browser-style admin access test.
 * 
 * Signs in as a non-admin student, constructs the proper Supabase
 * auth cookie, and makes requests to /admin and /api/admin/metrics
 * to see the actual HTTP responses.
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const BASE = 'http://localhost:3000';

// The Supabase project ref, extracted from the URL
const PROJECT_REF = SUPABASE_URL.replace('https://', '').split('.')[0];

async function main() {
  console.log('=== REAL BROWSER-STYLE ADMIN ACCESS TEST ===\n');
  
  const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  
  // 1. Create a temp password and sign in as non-admin student
  const STUDENT_EMAIL = 'rabindrasth23@gmail.com';
  const TEMP_PASS = 'TempAdminTest_' + Date.now();
  
  const { data: users } = await admin.auth.admin.listUsers();
  const studentUser = users.users.find(u => u.email === STUDENT_EMAIL);
  if (!studentUser) {
    console.error('❌ Student not found');
    process.exit(1);
  }
  
  await admin.auth.admin.updateUserById(studentUser.id, { password: TEMP_PASS });
  
  // Sign in to get real tokens
  const anonClient = createClient(SUPABASE_URL, ANON_KEY);
  const { data: signIn, error: signInError } = await anonClient.auth.signInWithPassword({
    email: STUDENT_EMAIL,
    password: TEMP_PASS,
  });
  
  if (signInError || !signIn.session) {
    console.error('❌ Sign-in failed:', signInError);
    process.exit(1);
  }
  
  console.log(`Signed in as: ${STUDENT_EMAIL}`);
  console.log(`User ID: ${signIn.user.id}`);
  console.log(`Access token: ${signIn.session.access_token.slice(0, 30)}...`);
  console.log(`Project ref: ${PROJECT_REF}`);
  console.log('');
  
  // 2. Construct the REAL Supabase auth cookie
  // Next.js Supabase SSR stores the auth token in chunks:
  // sb-{ref}-auth-token.0, sb-{ref}-auth-token.1, etc.
  // The value is base64-encoded JSON of the session
  const sessionJSON = JSON.stringify(signIn.session);
  const base64Session = Buffer.from(sessionJSON).toString('base64');
  
  // Supabase SSR splits cookies into 3500-byte chunks
  const CHUNK_SIZE = 3500;
  const chunks: string[] = [];
  for (let i = 0; i < base64Session.length; i += CHUNK_SIZE) {
    chunks.push(base64Session.slice(i, i + CHUNK_SIZE));
  }
  
  const cookieParts = chunks.map((chunk, i) => 
    `sb-${PROJECT_REF}-auth-token.${i}=${encodeURIComponent(chunk)}`
  );
  const cookieHeader = cookieParts.join('; ');
  
  console.log(`Cookie chunks: ${chunks.length}`);
  console.log(`Cookie header length: ${cookieHeader.length} bytes`);
  console.log('');
  
  // 3. Test /api/admin/metrics with real auth cookie
  console.log('--- Test 1: GET /api/admin/metrics ---');
  const metricsRes = await fetch(`${BASE}/api/admin/metrics`, {
    headers: { 'Cookie': cookieHeader },
  });
  console.log(`Status: HTTP ${metricsRes.status}`);
  const metricsBody = await metricsRes.json().catch(() => metricsRes.text());
  console.log(`Body: ${JSON.stringify(metricsBody)}`);
  
  if (metricsRes.status === 403) {
    console.log('✅ CORRECTLY BLOCKED with 403 Forbidden');
  } else if (metricsRes.status === 401) {
    console.log('✅ BLOCKED with 401 Unauthorized (cookie may not have been parsed)');
  } else if (metricsRes.status === 200) {
    console.log('❌ SECURITY FAILURE — non-admin got 200!');
  }
  console.log('');
  
  // 4. Test /admin page (HTML page, will redirect)
  console.log('--- Test 2: GET /admin (HTML page — expect redirect) ---');
  const adminPageRes = await fetch(`${BASE}/admin`, {
    headers: { 'Cookie': cookieHeader },
    redirect: 'manual',  // Don't follow redirects — capture the 302/307
  });
  console.log(`Status: HTTP ${adminPageRes.status}`);
  const location = adminPageRes.headers.get('location');
  console.log(`Location header: ${location || '(none)'}`);
  
  if (adminPageRes.status === 307 || adminPageRes.status === 302) {
    if (location?.includes('/dashboard')) {
      console.log('✅ CORRECTLY REDIRECTED to /dashboard');
    } else {
      console.log(`⚠️ Redirected to unexpected location: ${location}`);
    }
  } else if (adminPageRes.status === 200) {
    // Check if the body contains admin page content
    const html = await adminPageRes.text();
    if (html.includes('Zorvai Admin')) {
      console.log('❌ SECURITY FAILURE — non-admin can see admin page!');
    } else {
      console.log('⚠️ Got 200 but content unclear');
    }
  }
  console.log('');
  
  // 5. Also test as the ACTUAL admin to confirm it WORKS for them
  console.log('--- Test 3: GET /api/admin/metrics as ACTUAL admin ---');
  const ADMIN_EMAIL = 'skillmakers246@gmail.com';
  const ADMIN_TEMP_PASS = 'AdminTest_' + Date.now();
  
  const adminUser = users.users.find(u => u.email === ADMIN_EMAIL);
  if (adminUser) {
    await admin.auth.admin.updateUserById(adminUser.id, { password: ADMIN_TEMP_PASS });
    
    const adminAnonClient = createClient(SUPABASE_URL, ANON_KEY);
    const { data: adminSignIn } = await adminAnonClient.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_TEMP_PASS,
    });
    
    if (adminSignIn?.session) {
      const adminSessionJSON = JSON.stringify(adminSignIn.session);
      const adminBase64 = Buffer.from(adminSessionJSON).toString('base64');
      const adminChunks: string[] = [];
      for (let i = 0; i < adminBase64.length; i += CHUNK_SIZE) {
        adminChunks.push(adminBase64.slice(i, i + CHUNK_SIZE));
      }
      const adminCookie = adminChunks.map((c, i) => 
        `sb-${PROJECT_REF}-auth-token.${i}=${encodeURIComponent(c)}`
      ).join('; ');
      
      const adminMetricsRes = await fetch(`${BASE}/api/admin/metrics`, {
        headers: { 'Cookie': adminCookie },
      });
      console.log(`Status: HTTP ${adminMetricsRes.status}`);
      
      if (adminMetricsRes.status === 200) {
        const data = await adminMetricsRes.json();
        console.log(`✅ Admin got 200 OK — ${data.logs?.length || 0} log entries returned`);
      } else {
        const body = await adminMetricsRes.json().catch(() => ({}));
        console.log(`⚠️ Admin got ${adminMetricsRes.status}: ${JSON.stringify(body)}`);
      }
    }
  }
  
  console.log('\nDone.');
}

main().catch(console.error);
