-- ============================================================
-- Migration 003: Plan Idempotency
-- Adds a unique partial index to prevent concurrent plan generations
-- (e.g. from double-clicks on the onboarding finish screen).
-- ============================================================

-- Ensure a student can only have ONE active plan at a time
CREATE UNIQUE INDEX unique_active_plan_per_student 
  ON plans (student_id) 
  WHERE is_active = true;
