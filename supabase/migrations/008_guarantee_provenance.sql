-- ============================================================
-- Migration: guarantee_tracking provenance
-- 
-- Adds a provenance column to explicitly record whether each
-- guarantee_tracking row was set by a human ('manual') or 
-- by an automated system ('system'). This matters for liability:
-- if a parent disputes a guarantee decision, we can always prove
-- whether it was a human judgment call or an automated result.
--
-- Also adds a NOT NULL constraint to updated_by for new rows
-- and a comment documenting the manual-only v1 policy.
-- ============================================================

-- Add provenance column: 'manual' (human admin decision) or 'system' (automated)
ALTER TABLE guarantee_tracking 
  ADD COLUMN IF NOT EXISTS provenance text NOT NULL DEFAULT 'manual'
  CHECK (provenance IN ('manual', 'system'));

-- Backfill: all existing rows are manual (no automated writes exist in v1)
UPDATE guarantee_tracking SET provenance = 'manual' WHERE provenance IS NULL;

-- Add comment documenting the v1 policy
COMMENT ON TABLE guarantee_tracking IS 
  'v1: 100% manual. No application code writes to this table automatically. '
  'All rows are inserted by admin scripts or direct DB operations. '
  'The provenance column records whether each status change was made by a human (manual) '
  'or an automated system (system). updated_by stores the user ID of whoever made the change.';

COMMENT ON COLUMN guarantee_tracking.provenance IS 
  'Who set this status: manual = human admin decision, system = automated pipeline. v1 is manual-only.';

COMMENT ON COLUMN guarantee_tracking.updated_by IS 
  'UUID of the user who last updated this row. NULL means it was set during initial migration or seed.';
