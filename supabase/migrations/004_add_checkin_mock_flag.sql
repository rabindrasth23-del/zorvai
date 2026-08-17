-- Add flag to distinguish mocked escalation data from real data
ALTER TABLE checkins ADD COLUMN escalation_tier_is_mocked boolean NOT NULL DEFAULT false;
