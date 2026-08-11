-- ============================================================
-- Zorvai — Initial Schema Migration
-- Project: supabase-zorvai (kndoposozkemopyuavgb)
-- ============================================================

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE session_phase AS ENUM ('learn', 'recall', 'challenge', 'feedback', 'done');
CREATE TYPE session_status AS ENUM ('active', 'completed', 'abandoned');
CREATE TYPE topic_status AS ENUM ('pending', 'mastered', 're-queued');
CREATE TYPE notification_status_type AS ENUM ('not_applicable', 'queued_for_review', 'sent', 'send_failed');
CREATE TYPE review_queue_status AS ENUM ('pending', 'resolved');

-- ============================================================
-- TABLES
-- ============================================================

-- 1. students
-- id references auth.users(id) — Supabase Auth, no custom auth tables
CREATE TABLE students (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  country text NOT NULL,
  field text NOT NULL,
  language text NOT NULL DEFAULT 'en',
  study_hours_per_day numeric(3,1) NOT NULL DEFAULT 1.0,
  timezone text NOT NULL DEFAULT 'UTC',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. parents
-- id references auth.users(id) — Supabase Auth, no custom auth tables
CREATE TABLE parents (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  notification_preference text NOT NULL DEFAULT 'both',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 3. student_parent_links
-- v1: one student ↔ one parent
CREATE TABLE student_parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, parent_id)
);

-- 4. plans
-- raw_response stores full AI output for debugging/regeneration
-- All queries go through plan_topics, not raw_response
CREATE TABLE plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  raw_response jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 5. plan_topics
-- Normalized rows from the plan — all progress queries use this table
CREATE TABLE plan_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  day integer NOT NULL,
  sort_order integer NOT NULL,
  status topic_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 6. sessions
-- phase: state machine (learn → recall → challenge → feedback → done)
-- status: lifecycle (active / completed / abandoned)
-- A session can be phase=learn, status=abandoned if someone drops off mid-session
CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES plan_topics(id) ON DELETE CASCADE,
  phase session_phase NOT NULL DEFAULT 'learn',
  status session_status NOT NULL DEFAULT 'active',
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- 7. session_results
CREATE TABLE session_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  recall_transcript text,
  challenge_qas jsonb,
  understood text[] DEFAULT '{}',
  missed text[] DEFAULT '{}',
  review_next text[] DEFAULT '{}',
  passed boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. checkins
-- Includes escalation columns from checkin-escalation-v1.md Section 5
-- escalation_tier replaces the boolean-only escalation_triggered
CREATE TABLE checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  session_id uuid REFERENCES sessions(id) ON DELETE SET NULL,
  mood_text text NOT NULL,
  escalation_tier integer NOT NULL DEFAULT 0 CHECK (escalation_tier IN (0, 1, 2)),
  stressor_may_involve_linked_adult boolean,
  notification_status notification_status_type NOT NULL DEFAULT 'not_applicable',
  reviewed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 9. checkin_review_queue
-- Cases routed here when stressor_may_involve_linked_adult = true
-- or any case needing manual human review before notification
CREATE TABLE checkin_review_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id uuid NOT NULL REFERENCES checkins(id) ON DELETE CASCADE,
  reason text NOT NULL,
  status review_queue_status NOT NULL DEFAULT 'pending',
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. guarantee_tracking
-- v1: tracked manually per student, not automated
CREATE TABLE guarantee_tracking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  baseline_score numeric(5,2),
  follow_up_score numeric(5,2),
  agreed_sessions integer NOT NULL,
  status text NOT NULL DEFAULT 'in_progress',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 11. notification_preferences
CREATE TABLE notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  email_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(parent_id)
);

-- 12. fcm_tokens
-- A parent may have multiple devices
CREATE TABLE fcm_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  token text NOT NULL,
  device_info text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 13. ai_provider_logs
-- Every AI call writes here — makes provider failures visible
CREATE TABLE ai_provider_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_type text NOT NULL,
  provider text NOT NULL,
  latency_ms integer,
  success boolean NOT NULL DEFAULT false,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- FK indexes (for join performance)
CREATE INDEX idx_student_parent_links_student_id ON student_parent_links(student_id);
CREATE INDEX idx_student_parent_links_parent_id ON student_parent_links(parent_id);
CREATE INDEX idx_plans_student_id ON plans(student_id);
CREATE INDEX idx_plan_topics_plan_id ON plan_topics(plan_id);
CREATE INDEX idx_sessions_student_id ON sessions(student_id);
CREATE INDEX idx_sessions_topic_id ON sessions(topic_id);
CREATE INDEX idx_session_results_session_id ON session_results(session_id);
CREATE INDEX idx_checkins_student_id ON checkins(student_id);
CREATE INDEX idx_checkins_session_id ON checkins(session_id);
CREATE INDEX idx_checkin_review_queue_checkin_id ON checkin_review_queue(checkin_id);
CREATE INDEX idx_guarantee_tracking_student_id ON guarantee_tracking(student_id);
CREATE INDEX idx_notification_preferences_parent_id ON notification_preferences(parent_id);
CREATE INDEX idx_fcm_tokens_parent_id ON fcm_tokens(parent_id);
CREATE INDEX idx_ai_provider_logs_call_type ON ai_provider_logs(call_type);

-- Composite indexes for specific query patterns
CREATE INDEX idx_sessions_student_started ON sessions(student_id, started_at);
CREATE INDEX idx_checkins_student_created ON checkins(student_id, created_at);
CREATE INDEX idx_plan_topics_plan_status ON plan_topics(plan_id, status);
