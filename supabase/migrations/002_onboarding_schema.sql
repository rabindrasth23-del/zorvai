-- ============================================================
-- Migration 002: Onboarding Schema Expansion
-- Expands the students table to support PRD Section 3 requirements
-- and the Baseline Quiz metric.
-- ============================================================

ALTER TABLE students 
  ADD COLUMN grade text,
  ADD COLUMN target_subject text,
  ADD COLUMN confidence_level int CHECK (confidence_level BETWEEN 1 AND 5),
  ADD COLUMN study_days text[], -- Array of days, e.g., ['Monday', 'Wednesday']
  ADD COLUMN best_study_time text,
  ADD COLUMN deadline date,
  ADD COLUMN monthly_goal text,
  ADD COLUMN stuck_topic text,
  ADD COLUMN baseline_score numeric,
  ADD COLUMN onboarded boolean DEFAULT false;

-- Escalation Table for Minor Safety (Added based on moderation review)
CREATE TABLE safety_escalations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES students(id) ON DELETE SET NULL, -- Nullable so records survive account deletion
  flagged_text text NOT NULL,
  flag_reason text NOT NULL,
  route_source text NOT NULL, -- e.g., 'onboarding', 'checkin'
  status text NOT NULL DEFAULT 'pending_review',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid, -- Admin/Reviewer ID
  reviewed_at timestamptz
);

-- RLS Policies for Safety Escalations
ALTER TABLE safety_escalations ENABLE ROW LEVEL SECURITY;

-- Only service_role (backend API) can insert
CREATE POLICY "Service role can insert escalations" 
  ON safety_escalations FOR INSERT 
  TO service_role 
  WITH CHECK (true);

-- Only admins can select/view the table
CREATE POLICY "Only admins can view escalations"
  ON safety_escalations FOR SELECT
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );

-- Only admins can update the table (e.g., resolving status)
CREATE POLICY "Only admins can update escalations"
  ON safety_escalations FOR UPDATE
  USING (
    auth.jwt() ->> 'role' = 'admin'
  );
