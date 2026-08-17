-- ============================================================
-- Zorvai — RLS + Constraint Hardening Migration
-- FIXES CRITICAL SECURITY ISSUE: No RLS was enabled on any table.
-- ============================================================

-- ============================================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_parent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkin_review_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE guarantee_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE fcm_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_provider_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. STUDENTS — user can only read/write their own row
-- ============================================================
CREATE POLICY "students_select_own" ON students
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "students_insert_own" ON students
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "students_update_own" ON students
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Students should NOT be able to delete their own profile via client
-- (account deletion should go through a server action / admin flow)
-- No DELETE policy = no client deletes allowed.

-- ============================================================
-- 3. PLANS — student can only see their own plans
-- ============================================================
CREATE POLICY "plans_select_own" ON plans
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "plans_insert_own" ON plans
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- No UPDATE/DELETE from client — plan management is server-side.

-- ============================================================
-- 4. PLAN_TOPICS — student can read topics from their own plans
-- ============================================================
CREATE POLICY "plan_topics_select_own" ON plan_topics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM plans WHERE plans.id = plan_topics.plan_id AND plans.student_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE from client — topics are server-managed.

-- ============================================================
-- 5. SESSIONS — student can only see/create their own sessions
-- ============================================================
CREATE POLICY "sessions_select_own" ON sessions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "sessions_insert_own" ON sessions
  FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "sessions_update_own" ON sessions
  FOR UPDATE USING (auth.uid() = student_id)
  WITH CHECK (auth.uid() = student_id);

-- ============================================================
-- 6. SESSION_RESULTS — student can read their own results
-- ============================================================
CREATE POLICY "session_results_select_own" ON session_results
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = session_results.session_id AND sessions.student_id = auth.uid()
    )
  );

CREATE POLICY "session_results_insert_own" ON session_results
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions WHERE sessions.id = session_results.session_id AND sessions.student_id = auth.uid()
    )
  );

-- ============================================================
-- 7. CHECKINS — student can see/create their own checkins
-- ============================================================
CREATE POLICY "checkins_select_own" ON checkins
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "checkins_insert_own" ON checkins
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- No UPDATE/DELETE — checkin data is immutable from client.

-- ============================================================
-- 8. CHECKIN_REVIEW_QUEUE — NO client access at all
-- This is an internal admin table.
-- ============================================================
-- No policies = no client access (RLS is enabled, so default-deny).

-- ============================================================
-- 9. GUARANTEE_TRACKING — NO client writes, read own only
-- This table holds the app's core guarantee data.
-- It should ONLY be writable via service_role (server actions).
-- ============================================================
CREATE POLICY "guarantee_tracking_select_own" ON guarantee_tracking
  FOR SELECT USING (auth.uid() = student_id);

-- No INSERT/UPDATE/DELETE policies = client cannot write.

-- ============================================================
-- 10. PARENTS — parent can only see/edit their own row
-- ============================================================
CREATE POLICY "parents_select_own" ON parents
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "parents_insert_own" ON parents
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "parents_update_own" ON parents
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ============================================================
-- 11. STUDENT_PARENT_LINKS — readable by linked parent or student
-- ============================================================
CREATE POLICY "student_parent_links_select" ON student_parent_links
  FOR SELECT USING (
    auth.uid() = student_id OR auth.uid() = parent_id
  );

-- No INSERT/UPDATE/DELETE from client — linking is server-managed.

-- ============================================================
-- 12. NOTIFICATION_PREFERENCES — parent can manage their own
-- ============================================================
CREATE POLICY "notification_preferences_select_own" ON notification_preferences
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "notification_preferences_update_own" ON notification_preferences
  FOR UPDATE USING (auth.uid() = parent_id)
  WITH CHECK (auth.uid() = parent_id);

-- ============================================================
-- 13. FCM_TOKENS — parent can manage their own device tokens
-- ============================================================
CREATE POLICY "fcm_tokens_select_own" ON fcm_tokens
  FOR SELECT USING (auth.uid() = parent_id);

CREATE POLICY "fcm_tokens_insert_own" ON fcm_tokens
  FOR INSERT WITH CHECK (auth.uid() = parent_id);

CREATE POLICY "fcm_tokens_delete_own" ON fcm_tokens
  FOR DELETE USING (auth.uid() = parent_id);

-- ============================================================
-- 14. AI_PROVIDER_LOGS — NO client access at all
-- Internal observability table, service_role only.
-- ============================================================
-- No policies = no client access (RLS enabled, default-deny).

-- ============================================================
-- 15. DATA CONSTRAINT: study_hours_per_day range
-- Frontend allows 0.5–8.0; enforce at DB level too.
-- ============================================================
ALTER TABLE students
  ADD CONSTRAINT students_study_hours_range
  CHECK (study_hours_per_day >= 0.5 AND study_hours_per_day <= 8.0);

-- ============================================================
-- 16. CLEANUP: Remove junk data from guarantee_tracking
-- The audit script accidentally inserted 2 rows via anon key.
-- ============================================================
DELETE FROM guarantee_tracking WHERE status IN ('hacked', 'fake', 'test');
