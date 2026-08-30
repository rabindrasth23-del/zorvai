-- ══════════════════════════════════════════════════════════════════
-- Zorvai Waitlist Schema
-- Run in Supabase SQL Editor (same project as main app)
-- ══════════════════════════════════════════════════════════════════

-- ── Waitlist signups ─────────────────────────────────────────
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),

  -- Identity
  email text unique not null,
  name text not null,
  phone text,
  country_code char(2) not null default 'IN',
  city text,

  -- Role
  role text not null default 'parent' check (role in ('parent','student')),
  child_name text,
  child_grade text,
  child_subject text,

  -- Commitment
  commitment_text text,
  commitment_goal text,
  commitment_made_at timestamptz,
  commitment_image_url text,

  -- Referral
  referral_code text unique not null,
  referred_by text references waitlist(referral_code),
  referral_count int not null default 0,
  referral_bonus text,

  -- Position and tier
  position int,
  position_boosted_by int not null default 0,
  tier int not null default 3,
  discount_percent numeric not null default 0,
  lifetime_discount boolean not null default false,

  -- Payment (for pre-launch founding members who pay now)
  stripe_session_id text,
  stripe_customer_id text,
  paid boolean not null default false,
  paid_at timestamptz,
  plan text,

  -- Tracking
  utm_source text,
  utm_medium text,
  utm_campaign text,
  shared_story boolean not null default false,
  shared_whatsapp boolean not null default false,

  created_at timestamptz not null default now()
);

-- ── Referral events ──────────────────────────────────────────
create table if not exists waitlist_referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  new_signup_id uuid references waitlist(id),
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── Share events ─────────────────────────────────────────────
create table if not exists waitlist_shares (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references waitlist(id),
  platform text not null,
  created_at timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists waitlist_referral_code_idx on waitlist(referral_code);
create index if not exists waitlist_referred_by_idx on waitlist(referred_by);
create index if not exists waitlist_country_idx on waitlist(country_code, city);
create index if not exists waitlist_created_idx on waitlist(created_at desc);
create index if not exists waitlist_paid_idx on waitlist(paid);

-- ── Auto-assign position and referral code ───────────────────
create or replace function generate_waitlist_referral_code(p_name text)
returns text as $$
declare
  base text;
  code text;
  exists_check boolean;
begin
  base := upper(regexp_replace(p_name, '[^a-zA-Z]', '', 'g'));
  base := left(base || 'ZORVAI', 5);
  loop
    code := base || floor(random() * 9000 + 1000)::text;
    select count(*) > 0 into exists_check
    from waitlist where referral_code = code;
    exit when not exists_check;
  end loop;
  return code;
end;
$$ language plpgsql;

create or replace function waitlist_before_insert()
returns trigger as $$
declare
  total int;
begin
  -- Assign position
  select coalesce(max(position), 0) + 1 into total from waitlist;
  new.position := total;

  -- Generate referral code
  new.referral_code := generate_waitlist_referral_code(new.name);

  -- Assign tier based on total signups
  if total < 100 then
    new.tier := 1;
    new.discount_percent := 60;
    new.lifetime_discount := true;
  elsif total < 500 then
    new.tier := 2;
    new.discount_percent := 40;
    new.lifetime_discount := true;
  else
    new.tier := 3;
    new.discount_percent := 0;
    new.lifetime_discount := false;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists waitlist_insert_trigger on waitlist;
create trigger waitlist_insert_trigger
  before insert on waitlist
  for each row execute function waitlist_before_insert();

-- ── Process referral (called after insert) ───────────────────
create or replace function process_referral(
  p_referrer_code text,
  p_new_signup_id uuid
)
returns void as $$
declare
  referrer_row waitlist%rowtype;
  new_count int;
begin
  select * into referrer_row from waitlist
  where referral_code = p_referrer_code;

  if not found then return; end if;

  new_count := referrer_row.referral_count + 1;

  update waitlist set
    referral_count = new_count,
    position = greatest(1, position - 50),
    position_boosted_by = position_boosted_by + 50,
    referral_bonus = case
      when new_count = 3  then 'tier_upgrade'
      when new_count = 5  then 'first_month_free'
      when new_count = 10 then 'founding_member'
      else referral_bonus
    end,
    tier = case
      when new_count >= 3 then 1
      else tier
    end,
    discount_percent = case
      when new_count >= 3 then 60
      else discount_percent
    end,
    lifetime_discount = case
      when new_count >= 3 then true
      else lifetime_discount
    end
  where referral_code = p_referrer_code;

  insert into waitlist_referral_events
    (referral_code, new_signup_id, converted)
  values (p_referrer_code, p_new_signup_id, true);
end;
$$ language plpgsql;

-- ── Create storage bucket for commitment cards ───────────────
insert into storage.buckets (id, name, public)
values ('waitlist-images', 'waitlist-images', true)
on conflict (id) do nothing;

-- Allow public read access to waitlist-images
create policy "Public read access for waitlist images"
  on storage.objects for select
  using (bucket_id = 'waitlist-images');

-- Allow service role to upload waitlist images
create policy "Service role upload for waitlist images"
  on storage.objects for insert
  with check (bucket_id = 'waitlist-images');

