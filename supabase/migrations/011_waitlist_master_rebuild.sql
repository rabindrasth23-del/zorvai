-- ══════════════════════════════════════════════════════════════════
-- Waitlist Schema Enhancement — Master Rebuild
-- Adds columns from master-waitlist-rebuild-prompt.md
-- ══════════════════════════════════════════════════════════════════

-- Add commitment_subject (separate from commitment_text)
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS commitment_subject text;

-- Add pricing choice columns
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS chosen_plan text; -- 'weekly' | 'monthly' | 'annual'
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS plan_price_usd numeric;
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS plan_original_price_usd numeric;

-- Add stripe_payment_intent_id for webhook tracking
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text;

-- Add referral_count index for leaderboard queries
CREATE INDEX IF NOT EXISTS waitlist_referral_count_idx ON waitlist(referral_count DESC);
