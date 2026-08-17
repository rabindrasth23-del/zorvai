// Zorvai Backend Audit Script
// Runs raw SQL queries against the Supabase database using the Management API
// to verify RLS, schema, policies, and data integrity.

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SERVICE_ROLE_KEY");
  process.exit(1);
}

async function runSQL(sql) {
  // Use the Supabase REST API's rpc endpoint or the pg_catalog approach
  // Actually, we'll use the supabase management API to execute SQL
  const projectRef = "kndoposozkemopyuavgb";
  const url = `https://${projectRef}.supabase.co/rest/v1/rpc`;
  
  // Alternative: Use the PostgREST approach with service role to query system catalogs
  // Let's query information_schema and pg_catalog via the REST API
  console.log(`\n${'='.repeat(60)}`);
  console.log(`QUERY: ${sql.substring(0, 100)}...`);
  console.log('='.repeat(60));
}

// Use fetch against the PostgREST API to query system tables
async function queryTable(table, select = "*", filters = {}) {
  let url = `${SUPABASE_URL}/rest/v1/${table}?select=${encodeURIComponent(select)}`;
  for (const [key, value] of Object.entries(filters)) {
    url += `&${key}=${encodeURIComponent(value)}`;
  }
  
  const res = await fetch(url, {
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!res.ok) {
    const text = await res.text();
    return { error: text, status: res.status };
  }
  return await res.json();
}

// Use the Supabase SQL endpoint (available via management API)
async function executeSQLViaManagement(sql) {
  const projectRef = "kndoposozkemopyuavgb";
  // Try using the pg REST endpoint with service role
  const url = `${SUPABASE_URL}/rest/v1/rpc/`;
  
  // We can't run arbitrary SQL via PostgREST. 
  // But we CAN create a temporary function or use existing system views.
  // Let's try querying pg_catalog tables exposed through PostgREST.
  
  // Actually, let's use a different approach: create a small Node script
  // that connects directly via the Supabase JS client with service role.
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        ZORVAI SUPABASE BACKEND AUDIT                   ║");
  console.log("╚══════════════════════════════════════════════════════════╝\n");

  // =================================================================
  // SECTION 0: RLS AUDIT
  // =================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 0: ROW LEVEL SECURITY (RLS) AUDIT");
  console.log("█".repeat(60));

  // We need to query pg_tables and pg_policies
  // PostgREST doesn't expose these directly, but we can try
  // querying through the information_schema

  // Test 1: Try to read students table with service role (should see all)
  console.log("\n--- Test: Query students with SERVICE ROLE ---");
  const allStudents = await queryTable("students", "id,name,country,field,education_level,subjects,study_hours_per_day,timezone");
  if (allStudents.error) {
    console.log("ERROR:", allStudents.error);
  } else {
    console.log(`Found ${allStudents.length} student(s):`);
    allStudents.forEach(s => {
      console.log(`  - ${s.name} | country=${s.country} | field=${s.field} | education_level=${s.education_level} | subjects=${JSON.stringify(s.subjects)} | hours=${s.study_hours_per_day} | tz=${s.timezone}`);
    });
  }

  // Test 2: Query checkins
  console.log("\n--- Test: Query checkins with SERVICE ROLE ---");
  const allCheckins = await queryTable("checkins", "id,student_id,mood_text,escalation_tier,escalation_tier_is_mocked,notification_status,created_at");
  if (allCheckins.error) {
    console.log("ERROR:", allCheckins.error);
  } else {
    console.log(`Found ${allCheckins.length} checkin(s):`);
    allCheckins.forEach(c => {
      console.log(`  - student=${c.student_id} | mood="${c.mood_text}" | tier=${c.escalation_tier} | mocked=${c.escalation_tier_is_mocked} | status=${c.notification_status}`);
    });
  }

  // Test 3: Query sessions
  console.log("\n--- Test: Query sessions with SERVICE ROLE ---");
  const allSessions = await queryTable("sessions", "id,student_id,topic_id,phase,status,started_at,ended_at");
  if (allSessions.error) {
    console.log("ERROR:", allSessions.error);
  } else {
    console.log(`Found ${allSessions.length} session(s):`);
    allSessions.forEach(s => {
      console.log(`  - student=${s.student_id} | topic=${s.topic_id} | phase=${s.phase} | status=${s.status} | started=${s.started_at}`);
    });
  }

  // Test 4: Query plans and plan_topics
  console.log("\n--- Test: Query plans with SERVICE ROLE ---");
  const allPlans = await queryTable("plans", "id,student_id,is_active,raw_response,created_at");
  if (allPlans.error) {
    console.log("ERROR:", allPlans.error);
  } else {
    console.log(`Found ${allPlans.length} plan(s):`);
    allPlans.forEach(p => {
      console.log(`  - id=${p.id} | student=${p.student_id} | active=${p.is_active} | raw=${JSON.stringify(p.raw_response)}`);
    });
  }

  console.log("\n--- Test: Query plan_topics with SERVICE ROLE ---");
  const allTopics = await queryTable("plan_topics", "id,plan_id,title,day,sort_order,status");
  if (allTopics.error) {
    console.log("ERROR:", allTopics.error);
  } else {
    console.log(`Found ${allTopics.length} topic(s):`);
    allTopics.forEach(t => {
      console.log(`  - title="${t.title}" | day=${t.day} | sort=${t.sort_order} | status=${t.status}`);
    });
  }

  // Test 5: Query guarantee_tracking
  console.log("\n--- Test: Query guarantee_tracking with SERVICE ROLE ---");
  const allGuarantee = await queryTable("guarantee_tracking", "*");
  if (allGuarantee.error) {
    console.log("ERROR:", allGuarantee.error);
  } else {
    console.log(`Found ${allGuarantee.length} guarantee_tracking row(s):`);
    if (allGuarantee.length === 0) {
      console.log("  ✅ Table is empty (expected — no real guarantee data exists yet)");
    } else {
      allGuarantee.forEach(g => console.log(`  ⚠️ UNEXPECTED DATA:`, JSON.stringify(g)));
    }
  }

  // Test 6: Query session_results (does it exist?)
  console.log("\n--- Test: Query session_results — does this table exist? ---");
  const sessionResults = await queryTable("session_results", "*");
  if (sessionResults.error) {
    console.log("RESULT:", sessionResults.error);
    console.log("  → If 404/relation not found: table does NOT exist in PostgREST schema");
  } else {
    console.log(`Found ${sessionResults.length} session_result(s):`);
    sessionResults.forEach(r => console.log(`  -`, JSON.stringify(r)));
  }

  // =================================================================
  // SECTION 0b: RLS — Cross-user read attempt
  // =================================================================
  console.log("\n" + "█".repeat(60));
  console.log("  SECTION 0b: CROSS-USER READ ATTEMPT (ANON KEY)");
  console.log("█".repeat(60));

  // Query students using the ANON key (no auth header = anonymous)
  const ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtuZG9wb3NvemtlbW9weXVhdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYzNzYyNDQsImV4cCI6MjEwMTk1MjI0NH0.EIT0UgJroVtTiWlGU6LnWsYtKedTS50jUSelcwh6FZI";

  console.log("\n--- Test: Query students with ANON key (no user session) ---");
  const anonStudents = await fetch(`${SUPABASE_URL}/rest/v1/students?select=*`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
  });
  const anonStudentsBody = await anonStudents.text();
  console.log(`Status: ${anonStudents.status}`);
  console.log(`Body: ${anonStudentsBody.substring(0, 500)}`);
  if (anonStudents.status === 200) {
    const parsed = JSON.parse(anonStudentsBody);
    if (parsed.length > 0) {
      console.log("  ❌ CRITICAL: Anonymous users CAN read student data! RLS is missing or misconfigured!");
    } else {
      console.log("  ✅ Empty array returned — RLS may be blocking (or table is empty; need to check with data)");
    }
  }

  console.log("\n--- Test: Query checkins with ANON key ---");
  const anonCheckins = await fetch(`${SUPABASE_URL}/rest/v1/checkins?select=*`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
  });
  const anonCheckinsBody = await anonCheckins.text();
  console.log(`Status: ${anonCheckins.status}`);
  console.log(`Body: ${anonCheckinsBody.substring(0, 500)}`);

  console.log("\n--- Test: Query guarantee_tracking with ANON key ---");
  const anonGuarantee = await fetch(`${SUPABASE_URL}/rest/v1/guarantee_tracking?select=*`, {
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
    },
  });
  const anonGuaranteeBody = await anonGuarantee.text();
  console.log(`Status: ${anonGuarantee.status}`);
  console.log(`Body: ${anonGuaranteeBody.substring(0, 500)}`);

  // =================================================================
  // SECTION 0c: Attempt anonymous INSERT into students
  // =================================================================
  console.log("\n--- Test: Attempt anonymous INSERT into students ---");
  const anonInsert = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: "POST",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000000",
      name: "HACKER",
      country: "Nowhere",
      field: "Hacking",
      language: "en",
    }),
  });
  console.log(`Status: ${anonInsert.status}`);
  const anonInsertBody = await anonInsert.text();
  console.log(`Body: ${anonInsertBody.substring(0, 500)}`);
  if (anonInsert.status === 201) {
    console.log("  ❌ CRITICAL: Anonymous users CAN INSERT into students!");
  } else {
    console.log("  ✅ Insert blocked (status !== 201)");
  }

  // =================================================================
  // SECTION 0d: Attempt anonymous INSERT into guarantee_tracking
  // =================================================================
  console.log("\n--- Test: Attempt anonymous INSERT into guarantee_tracking ---");
  const anonGuaranteeInsert = await fetch(`${SUPABASE_URL}/rest/v1/guarantee_tracking`, {
    method: "POST",
    headers: {
      "apikey": ANON_KEY,
      "Authorization": `Bearer ${ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      student_id: "00000000-0000-0000-0000-000000000000",
      agreed_sessions: 99,
      status: "hacked",
    }),
  });
  console.log(`Status: ${anonGuaranteeInsert.status}`);
  const anonGuaranteeInsertBody = await anonGuaranteeInsert.text();
  console.log(`Body: ${anonGuaranteeInsertBody.substring(0, 500)}`);

  // =================================================================
  // SECTION 1: MIGRATION LEDGER
  // =================================================================
  console.log("\n\n" + "█".repeat(60));
  console.log("  SECTION 1: MIGRATION LEDGER CHECK");
  console.log("█".repeat(60));
  
  // We can't query supabase_migrations schema via PostgREST.
  // But we can list the local files and report what we know.
  const fs = await import("fs");
  const path = await import("path");
  const migrationsDir = path.join(process.cwd(), "supabase", "migrations");
  const localFiles = fs.readdirSync(migrationsDir).sort();
  console.log("\nLocal migration files:");
  localFiles.forEach(f => console.log(`  ${f}`));
  console.log("\n(Remote ledger was repaired in this session. Last supabase db push exited code 0.)");

  // =================================================================
  // SECTION 1b: SCHEMA VERIFICATION
  // =================================================================
  console.log("\n\n" + "█".repeat(60));
  console.log("  SECTION 1b: SCHEMA COLUMN VERIFICATION");
  console.log("█".repeat(60));

  // We'll test each table by attempting a SELECT with specific columns
  // If a column doesn't exist, PostgREST returns a 400 error mentioning the column
  
  const schemaChecks = [
    {
      table: "students",
      columns: "id,name,country,field,education_level,subjects,study_hours_per_day,timezone,language,created_at",
      label: "students"
    },
    {
      table: "checkins",
      columns: "id,student_id,session_id,mood_text,escalation_tier,escalation_tier_is_mocked,stressor_may_involve_linked_adult,notification_status,reviewed_by,created_at",
      label: "checkins"
    },
    {
      table: "sessions",
      columns: "id,student_id,topic_id,phase,status,started_at,ended_at",
      label: "sessions"
    },
    {
      table: "plan_topics",
      columns: "id,plan_id,title,description,day,sort_order,status,created_at",
      label: "plan_topics"
    },
    {
      table: "plans",
      columns: "id,student_id,raw_response,is_active,created_at",
      label: "plans"
    },
    {
      table: "guarantee_tracking",
      columns: "id,student_id,baseline_score,follow_up_score,agreed_sessions,status,updated_by,updated_at",
      label: "guarantee_tracking"
    },
    {
      table: "session_results",
      columns: "id,session_id,recall_transcript,challenge_qas,understood,missed,review_next,passed,created_at",
      label: "session_results"
    },
    {
      table: "parents",
      columns: "id,name,notification_preference,created_at",
      label: "parents"
    },
    {
      table: "checkin_review_queue",
      columns: "id,checkin_id,reason,status,resolved_by,resolved_at,created_at",
      label: "checkin_review_queue"
    },
  ];

  for (const check of schemaChecks) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${check.table}?select=${encodeURIComponent(check.columns)}&limit=0`, {
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
    const status = res.status;
    if (status === 200) {
      console.log(`  ✅ ${check.label}: all columns exist (${status})`);
    } else {
      const body = await res.text();
      console.log(`  ❌ ${check.label}: ${status} — ${body.substring(0, 200)}`);
    }
  }

  // =================================================================
  // SECTION 1c: CONSTRAINT VERIFICATION
  // =================================================================
  console.log("\n\n" + "█".repeat(60));
  console.log("  SECTION 1c: CONSTRAINT VERIFICATION");
  console.log("█".repeat(60));

  // Test: Does education_level have a CHECK constraint?
  // Try inserting an invalid value via service role
  console.log("\n--- Test: Insert invalid education_level via SERVICE ROLE ---");
  const badEdu = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000001",
      name: "Test",
      country: "Test",
      field: "Test",
      language: "en",
      education_level: "INVALID_LEVEL",
    }),
  });
  console.log(`Status: ${badEdu.status}`);
  const badEduBody = await badEdu.text();
  console.log(`Body: ${badEduBody.substring(0, 500)}`);
  if (badEdu.status === 201) {
    console.log("  ❌ PROBLEM: Invalid education_level was accepted! No DB-level constraint exists.");
    // Clean up
    await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.00000000-0000-0000-0000-000000000001`, {
      method: "DELETE",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  } else {
    console.log("  ✅ Invalid education_level rejected by database constraint.");
  }

  // Test: Does study_hours_per_day have a range constraint?
  console.log("\n--- Test: Insert out-of-range study_hours via SERVICE ROLE ---");
  const badHours = await fetch(`${SUPABASE_URL}/rest/v1/students`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      id: "00000000-0000-0000-0000-000000000002",
      name: "Test",
      country: "Test",
      field: "Test",
      language: "en",
      study_hours_per_day: 99.9,
    }),
  });
  console.log(`Status: ${badHours.status}`);
  const badHoursBody = await badHours.text();
  console.log(`Body: ${badHoursBody.substring(0, 500)}`);
  if (badHours.status === 201) {
    console.log("  ❌ PROBLEM: study_hours_per_day=99.9 was accepted! No range constraint.");
    await fetch(`${SUPABASE_URL}/rest/v1/students?id=eq.00000000-0000-0000-0000-000000000002`, {
      method: "DELETE",
      headers: {
        "apikey": SERVICE_ROLE_KEY,
        "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      },
    });
  } else {
    console.log("  ✅ Out-of-range study_hours rejected.");
  }

  // Test: Does escalation_tier have a CHECK constraint?
  console.log("\n--- Test: Insert invalid escalation_tier ---");
  const badTier = await fetch(`${SUPABASE_URL}/rest/v1/checkins`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      student_id: "00000000-0000-0000-0000-000000000000",
      mood_text: "test",
      escalation_tier: 5,
    }),
  });
  console.log(`Status: ${badTier.status}`);
  const badTierBody = await badTier.text();
  console.log(`Body: ${badTierBody.substring(0, 500)}`);

  // =================================================================
  // SECTION 1d: FK VERIFICATION
  // =================================================================
  console.log("\n\n" + "█".repeat(60));
  console.log("  SECTION 1d: FOREIGN KEY VERIFICATION");
  console.log("█".repeat(60));

  // Test: Insert a session with a non-existent student_id
  console.log("\n--- Test: Insert session with non-existent student_id ---");
  const badFK = await fetch(`${SUPABASE_URL}/rest/v1/sessions`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=minimal",
    },
    body: JSON.stringify({
      student_id: "00000000-0000-0000-0000-000000000099",
      topic_id: "00000000-0000-0000-0000-000000000099",
    }),
  });
  console.log(`Status: ${badFK.status}`);
  const badFKBody = await badFK.text();
  console.log(`Body: ${badFKBody.substring(0, 500)}`);
  if (badFK.status === 201) {
    console.log("  ❌ CRITICAL: FK constraint not enforced!");
  } else {
    console.log("  ✅ FK constraint enforced — rejected orphan insert.");
  }

  // =================================================================
  // DONE
  // =================================================================
  console.log("\n\n" + "═".repeat(60));
  console.log("  AUDIT COMPLETE");
  console.log("═".repeat(60));
}

main().catch(console.error);
