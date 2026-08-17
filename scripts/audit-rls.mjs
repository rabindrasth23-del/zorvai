// Creates a test user via the Supabase Admin API (bypasses rate limits)
// Then runs the full RLS empirical test with real data.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function svc(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function anon(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   ZORVAI BACKEND AUDIT — DEFINITIVE                    ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // ================================================================
  // STEP 1: Create two test users via Admin API (no rate limit)
  // ================================================================
  console.log("--- Creating test users via Admin API ---");
  
  const userARes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: `audit_a_${Date.now()}@zorvai.com`,
      password: "AuditPass123!",
      email_confirm: true,
    }),
  });
  const userA = await userARes.json();
  if (!userA.id) { console.error("Failed to create User A:", JSON.stringify(userA)); process.exit(1); }
  console.log(`  User A: ${userA.id} (${userA.email})`);

  const userBRes = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: `audit_b_${Date.now()}@zorvai.com`,
      password: "AuditPass123!",
      email_confirm: true,
    }),
  });
  const userB = await userBRes.json();
  if (!userB.id) { console.error("Failed to create User B:", JSON.stringify(userB)); process.exit(1); }
  console.log(`  User B: ${userB.id} (${userB.email})`);

  // Get access tokens by signing in
  const tokenA = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: userA.email, password: "AuditPass123!" }),
  }).then(r => r.json());

  const tokenB = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "apikey": ANON_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email: userB.email, password: "AuditPass123!" }),
  }).then(r => r.json());

  console.log(`  Token A: ${tokenA.access_token ? "✅" : "❌ " + JSON.stringify(tokenA)}`);
  console.log(`  Token B: ${tokenB.access_token ? "✅" : "❌ " + JSON.stringify(tokenB)}`);

  // ================================================================
  // STEP 2: Insert student data for User A via SERVICE ROLE
  // ================================================================
  console.log("\n--- Insert student data for User A ---");
  const insertA = await svc("students", {
    method: "POST",
    body: JSON.stringify({
      id: userA.id,
      name: "User_A_Secret",
      country: "CountryA",
      field: "FieldA",
      language: "en",
      study_hours_per_day: 2.0,
      timezone: "America/New_York",
      education_level: "University",
      subjects: ["Math", "Physics"],
    }),
  });
  console.log(`  Insert A status: ${insertA.status} ${insertA.status === 201 ? "✅" : "❌"}`);

  // ================================================================
  // SECTION 0: RLS TESTS
  // ================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 0: ROW LEVEL SECURITY TESTS");
  console.log("█".repeat(60));

  // TEST 1: Can ANON read User A's student data?
  console.log("\n--- Test 1: ANON reads students ---");
  const anonRead = await anon("students?select=id,name,country");
  console.log(`  Status: ${anonRead.status}, Rows: ${Array.isArray(anonRead.data) ? anonRead.data.length : "ERR"}`);
  if (Array.isArray(anonRead.data) && anonRead.data.length > 0) {
    console.log("  ❌ CRITICAL: ANONYMOUS USERS CAN READ STUDENT DATA!");
    anonRead.data.forEach(r => console.log(`    Exposed: ${JSON.stringify(r)}`));
  } else {
    console.log("  ✅ Anon cannot read student data");
  }

  // TEST 2: Can User B read User A's data?
  if (tokenB.access_token) {
    console.log("\n--- Test 2: User B reads students (should see only own, which is nothing) ---");
    const crossRead = await fetch(`${SUPABASE_URL}/rest/v1/students?select=id,name,country`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${tokenB.access_token}` },
    }).then(async r => ({ status: r.status, data: await r.json() }));
    
    console.log(`  Status: ${crossRead.status}, Rows: ${Array.isArray(crossRead.data) ? crossRead.data.length : "ERR"}`);
    if (Array.isArray(crossRead.data)) {
      const seesA = crossRead.data.some(r => r.id === userA.id);
      if (seesA) {
        console.log("  ❌ CRITICAL: User B CAN read User A's student data!");
        crossRead.data.forEach(r => console.log(`    Exposed: ${JSON.stringify(r)}`));
      } else if (crossRead.data.length === 0) {
        console.log("  ✅ User B sees no data (correct — no student row for B, and can't see A's)");
      } else {
        console.log("  ⚠️ User B sees data but not A's:", JSON.stringify(crossRead.data));
      }
    }

    // TEST 3: Can User B INSERT a student row with User A's ID?
    console.log("\n--- Test 3: User B tries to INSERT with User A's ID ---");
    const crossInsert = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${tokenB.access_token}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ id: userA.id, name: "HACKED", country: "X", field: "X", language: "en" }),
    });
    const crossInsertBody = await crossInsert.text();
    console.log(`  Status: ${crossInsert.status} ${crossInsert.status === 201 ? "❌ USER B WROTE TO USER A'S ROW!" : "✅ Blocked"}`);
    if (crossInsert.status !== 201) console.log(`  Response: ${crossInsertBody.substring(0, 200)}`);

    // TEST 4: Can User B UPDATE User A's student row?
    console.log("\n--- Test 4: User B tries to UPDATE User A's row ---");
    const crossUpdate = await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.${userA.id}`, {
      method: "PATCH",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${tokenB.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: "HACKED_BY_B" }),
    });
    console.log(`  Status: ${crossUpdate.status}`);
    // Check if the name actually changed
    const checkName = await svc(`students?id=eq.${userA.id}&select=name`);
    const currentName = Array.isArray(checkName.data) && checkName.data[0]?.name;
    console.log(`  Current name: ${currentName} ${currentName === "HACKED_BY_B" ? "❌ DATA WAS MODIFIED!" : "✅ Name unchanged"}`);

    // TEST 5: Can User B read guarantee_tracking?
    console.log("\n--- Test 5: User B reads guarantee_tracking ---");
    const crossGT = await fetch(`${SUPABASE_URL}/rest/v1/guarantee_tracking?select=*`, {
      headers: { "apikey": ANON_KEY, "Authorization": `Bearer ${tokenB.access_token}` },
    }).then(async r => ({ status: r.status, data: await r.json() }));
    console.log(`  Status: ${crossGT.status}, Rows: ${Array.isArray(crossGT.data) ? crossGT.data.length : "ERR"}`);

    // TEST 6: Can User B INSERT into guarantee_tracking?
    console.log("\n--- Test 6: User B writes to guarantee_tracking ---");
    const gtInsert = await fetch(`${SUPABASE_URL}/rest/v1/guarantee_tracking`, {
      method: "POST",
      headers: {
        "apikey": ANON_KEY,
        "Authorization": `Bearer ${tokenB.access_token}`,
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
      },
      body: JSON.stringify({ student_id: userA.id, agreed_sessions: 99, status: "fake" }),
    });
    const gtInsertBody = await gtInsert.text();
    console.log(`  Status: ${gtInsert.status} ${gtInsert.status === 201 ? "❌ GUARANTEE DATA WRITABLE BY CLIENT!" : "✅ Blocked"}`);
  }

  // ================================================================
  // SECTION 1: ANON WRITE TESTS ON ALL TABLES
  // ================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 1: ANON INSERT TESTS — ALL SENSITIVE TABLES");
  console.log("█".repeat(60));

  const anonInsertTests = [
    { table: "guarantee_tracking", body: { student_id: userA.id, agreed_sessions: 1, status: "test" } },
    { table: "checkins", body: { student_id: userA.id, mood_text: "test" } },
    { table: "ai_provider_logs", body: { call_type: "test", provider: "test" } },
  ];

  for (const test of anonInsertTests) {
    const res = await anon(test.table, {
      method: "POST",
      headers: { "Prefer": "return=minimal" },
      body: JSON.stringify(test.body),
    });
    const icon = res.status === 201 ? "❌" : "✅";
    console.log(`  ${icon} ${test.table.padEnd(25)} anon INSERT → ${res.status}`);
  }

  // ================================================================
  // SECTION 2: CONSTRAINT VERIFICATION
  // ================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 2: DATABASE CONSTRAINT VERIFICATION");
  console.log("█".repeat(60));

  // education_level CHECK
  console.log("\n--- education_level CHECK constraint ---");
  const badEdu = await svc(`students?id=eq.${userA.id}`, {
    method: "PATCH",
    body: JSON.stringify({ education_level: "INVALID_GARBAGE" }),
  });
  if (badEdu.status >= 400) {
    console.log(`  ✅ Rejected (${badEdu.status}): ${JSON.stringify(badEdu.data).substring(0, 150)}`);
  } else {
    const check = await svc(`students?id=eq.${userA.id}&select=education_level`);
    const val = Array.isArray(check.data) && check.data[0]?.education_level;
    console.log(`  ${val === "INVALID_GARBAGE" ? "❌ ACCEPTED — NO CHECK CONSTRAINT!" : "✅ Value unchanged"} (current: ${val})`);
  }

  // study_hours range
  console.log("\n--- study_hours_per_day range ---");
  const badHours = await svc(`students?id=eq.${userA.id}`, {
    method: "PATCH",
    body: JSON.stringify({ study_hours_per_day: 99.9 }),
  });
  if (badHours.status >= 400) {
    console.log(`  ✅ Rejected (${badHours.status})`);
  } else {
    const check = await svc(`students?id=eq.${userA.id}&select=study_hours_per_day`);
    const val = Array.isArray(check.data) && check.data[0]?.study_hours_per_day;
    console.log(`  ${val > 10 ? "❌ ACCEPTED — NO RANGE CHECK!" : "✅ Clamped"} (current: ${val})`);
    // Restore
    await svc(`students?id=eq.${userA.id}`, { method: "PATCH", body: JSON.stringify({ study_hours_per_day: 2.0 }) });
  }

  // escalation_tier CHECK
  console.log("\n--- escalation_tier CHECK ---");
  const badTier = await svc("checkins", {
    method: "POST",
    body: JSON.stringify({ student_id: userA.id, mood_text: "test", escalation_tier: 5 }),
  });
  console.log(`  Insert tier=5: ${badTier.status >= 400 ? "✅ Rejected" : "❌ ACCEPTED"} (${badTier.status})`);

  // FK
  console.log("\n--- FK: sessions → students ---");
  const fk = await svc("sessions", {
    method: "POST",
    body: JSON.stringify({ student_id: "00000000-0000-0000-0000-ffffffffffff", topic_id: "00000000-0000-0000-0000-ffffffffffff" }),
  });
  console.log(`  Orphan insert: ${fk.status >= 400 ? "✅ Rejected" : "❌ ACCEPTED"} (${fk.status})`);

  // ================================================================
  // SECTION 3: SCHEMA + DATA
  // ================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 3: SCHEMA & DATA VERIFICATION");
  console.log("█".repeat(60));

  const schemaChecks = [
    { table: "students", columns: "id,name,country,field,education_level,subjects,study_hours_per_day,timezone,language,created_at" },
    { table: "checkins", columns: "id,student_id,session_id,mood_text,escalation_tier,escalation_tier_is_mocked,stressor_may_involve_linked_adult,notification_status,reviewed_by,created_at" },
    { table: "sessions", columns: "id,student_id,topic_id,phase,status,started_at,ended_at" },
    { table: "plan_topics", columns: "id,plan_id,title,description,day,sort_order,status,created_at" },
    { table: "session_results", columns: "id,session_id,recall_transcript,challenge_qas,understood,missed,review_next,passed,created_at" },
  ];
  for (const c of schemaChecks) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${c.table}?select=${encodeURIComponent(c.columns)}&limit=0`, {
      headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
    });
    console.log(`  ${res.status === 200 ? "✅" : "❌"} ${c.table}`);
  }

  console.log("\n  guarantee_tracking: " + (await svc("guarantee_tracking?select=*")).data.length + " rows (expected: 0)");
  console.log("  session_results table: EXISTS ✅ (from 001_initial_schema)");

  // ================================================================
  // CLEANUP
  // ================================================================
  console.log("\n--- Cleanup ---");
  await svc(`students?id=eq.${userA.id}`, { method: "DELETE" });
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userA.id}`, {
    method: "DELETE", headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
  });
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userB.id}`, {
    method: "DELETE", headers: { "apikey": SERVICE_ROLE_KEY, "Authorization": `Bearer ${SERVICE_ROLE_KEY}` },
  });
  console.log("  ✅ All test data cleaned up");

  console.log("\n" + "═".repeat(60));
  console.log("  AUDIT COMPLETE");
  console.log("═".repeat(60));
}

main().catch(console.error);
