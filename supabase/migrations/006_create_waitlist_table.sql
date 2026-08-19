-- Create waitlist table
CREATE TABLE public.waitlist (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email text UNIQUE NOT NULL,
  phone text,
  referral_code text UNIQUE NOT NULL,
  referred_by text,
  tier integer NOT NULL CHECK (tier IN (1, 2, 3)),
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous INSERT
CREATE POLICY "Allow anonymous insert to waitlist"
  ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- No SELECT policy for anon or authenticated.
-- By default, without a SELECT policy, RLS denies SELECT for all roles (except superuser/service_role).
