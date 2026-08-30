-- ══════════════════════════════════════════════════════════════════
-- Zorvai Waitlist Schema — CLEAN REBUILD
-- Drops existing tables and recreates with the correct schema
-- Run this in Supabase SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- Drop existing (order matters for FK constraints)
DROP TABLE IF EXISTS waitlist_shares CASCADE;
DROP TABLE IF EXISTS waitlist_referral_events CASCADE;
DROP TABLE IF EXISTS waitlist CASCADE;

-- Drop existing functions/triggers
DROP FUNCTION IF EXISTS generate_waitlist_referral_code(text) CASCADE;
DROP FUNCTION IF EXISTS waitlist_before_insert() CASCADE;
DROP FUNCTION IF EXISTS process_referral(text, uuid) CASCADE;

-- ── Waitlist signups ─────────────────────────────────────────
CREATE TABLE waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  phone text,
  country_code char(2) NOT NULL DEFAULT 'NP',
  city text,

  -- Role
  role text NOT NULL DEFAULT 'parent' CHECK (role IN ('parent','student')),
  child_name text,
  child_grade text,
  child_subject text,

  -- Commitment
  commitment_text text,
  commitment_goal text,
  commitment_made_at timestamptz,
  commitment_image_url text,

  -- Referral
  referral_code text UNIQUE NOT NULL,
  referred_by text REFERENCES waitlist(referral_code),
  referral_count int NOT NULL DEFAULT 0,
  referral_bonus text,

  -- Position and tier
  position int,
  position_boosted_by int NOT NULL DEFAULT 0,
  tier int NOT NULL DEFAULT 3,
  discount_percent numeric NOT NULL DEFAULT 0,
  lifetime_discount boolean NOT NULL DEFAULT false,

  -- Payment
  stripe_session_id text,
  stripe_customer_id text,
  paid boolean NOT NULL DEFAULT false,
  paid_at timestamptz,
  plan text,

  -- Tracking
  utm_source text,
  utm_medium text,
  utm_campaign text,
  shared_story boolean NOT NULL DEFAULT false,
  shared_whatsapp boolean NOT NULL DEFAULT false,

  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Referral events ──────────────────────────────────────────
CREATE TABLE waitlist_referral_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  new_signup_id uuid REFERENCES waitlist(id),
  converted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Share events ─────────────────────────────────────────────
CREATE TABLE waitlist_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  waitlist_id uuid NOT NULL REFERENCES waitlist(id),
  platform text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Indexes ──────────────────────────────────────────────────
CREATE INDEX waitlist_referral_code_idx ON waitlist(referral_code);
CREATE INDEX waitlist_referred_by_idx ON waitlist(referred_by);
CREATE INDEX waitlist_country_idx ON waitlist(country_code, city);
CREATE INDEX waitlist_created_idx ON waitlist(created_at DESC);
CREATE INDEX waitlist_paid_idx ON waitlist(paid);

-- ── Auto-assign position and referral code ───────────────────
CREATE OR REPLACE FUNCTION generate_waitlist_referral_code(p_name text)
RETURNS text AS $$
DECLARE
  base text;
  code text;
  exists_check boolean;
BEGIN
  base := upper(regexp_replace(p_name, '[^a-zA-Z]', '', 'g'));
  base := left(base || 'ZORVAI', 5);
  LOOP
    code := base || floor(random() * 9000 + 1000)::text;
    SELECT count(*) > 0 INTO exists_check
    FROM waitlist WHERE referral_code = code;
    EXIT WHEN NOT exists_check;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION waitlist_before_insert()
RETURNS trigger AS $$
DECLARE
  total int;
BEGIN
  -- Assign position
  SELECT coalesce(max(position), 0) + 1 INTO total FROM waitlist;
  NEW.position := total;

  -- Generate referral code
  NEW.referral_code := generate_waitlist_referral_code(NEW.name);

  -- Assign tier based on total signups
  IF total < 100 THEN
    NEW.tier := 1;
    NEW.discount_percent := 60;
    NEW.lifetime_discount := true;
  ELSIF total < 500 THEN
    NEW.tier := 2;
    NEW.discount_percent := 40;
    NEW.lifetime_discount := true;
  ELSE
    NEW.tier := 3;
    NEW.discount_percent := 0;
    NEW.lifetime_discount := false;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER waitlist_insert_trigger
  BEFORE INSERT ON waitlist
  FOR EACH ROW EXECUTE FUNCTION waitlist_before_insert();

-- ── Process referral ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION process_referral(
  p_referrer_code text,
  p_new_signup_id uuid
)
RETURNS void AS $$
DECLARE
  referrer_row waitlist%rowtype;
  new_count int;
BEGIN
  SELECT * INTO referrer_row FROM waitlist
  WHERE referral_code = p_referrer_code;

  IF NOT FOUND THEN RETURN; END IF;

  new_count := referrer_row.referral_count + 1;

  UPDATE waitlist SET
    referral_count = new_count,
    position = greatest(1, position - 50),
    position_boosted_by = position_boosted_by + 50,
    referral_bonus = CASE
      WHEN new_count = 3  THEN 'tier_upgrade'
      WHEN new_count = 5  THEN 'first_month_free'
      WHEN new_count = 10 THEN 'founding_member'
      ELSE referral_bonus
    END,
    tier = CASE
      WHEN new_count >= 3 THEN 1
      ELSE tier
    END,
    discount_percent = CASE
      WHEN new_count >= 3 THEN 60
      ELSE discount_percent
    END,
    lifetime_discount = CASE
      WHEN new_count >= 3 THEN true
      ELSE lifetime_discount
    END
  WHERE referral_code = p_referrer_code;

  INSERT INTO waitlist_referral_events
    (referral_code, new_signup_id, converted)
  VALUES (p_referrer_code, p_new_signup_id, true);
END;
$$ LANGUAGE plpgsql;

-- ── Storage bucket ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('waitlist-images', 'waitlist-images', true)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Public read access for waitlist images'
  ) THEN
    CREATE POLICY "Public read access for waitlist images"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'waitlist-images');
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Service role upload for waitlist images'
  ) THEN
    CREATE POLICY "Service role upload for waitlist images"
      ON storage.objects FOR INSERT
      WITH CHECK (bucket_id = 'waitlist-images');
  END IF;
END $$;
