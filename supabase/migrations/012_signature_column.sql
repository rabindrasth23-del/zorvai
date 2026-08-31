-- Add signature column for commitment workflow
ALTER TABLE waitlist ADD COLUMN IF NOT EXISTS signature_data_url text;
