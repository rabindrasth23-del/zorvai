# ZORVAI — MASTER WAITLIST PAGE PROMPT
# Domain: zorvai.ca | Stack: Next.js | Style: Minimalist Dark
# Backend: Same Supabase project as main app
# APIs: Stripe + Anthropic (Claude)
# Every detail from backend to frontend — paste into Antigravity or Cursor

---

## PART 1 — PROJECT CONTEXT

This waitlist page lives inside the EXISTING Next.js project at zorvai.ca.
Do NOT create a new project. Add these files to the existing codebase.

The product: Zorvai is an AI voice tutor that teaches students using the
Learn → Recall → Challenge method, backed by a money-back guarantee if
the child's score doesn't improve. Two founders from Nepal built it because
they couldn't afford private tutors growing up.

Target buyers: Parents in India and Bangladesh primarily. Students secondarily.
The emotional trigger for parents: fear that their child is studying the
wrong way. The trust trigger: the guarantee. The sharing trigger: commitment
to their child's future made public.

Minimalism principle for this page: ONE element competes for attention at
any given scroll position. No busy layouts. Generous whitespace. Every word
earns its place. If a section doesn't make someone feel something or do
something, it gets cut.

---

## PART 2 — FILE STRUCTURE TO ADD

Add exactly these files to the existing project.
Do not touch any existing files except to add the new SQL to schema.

```
zorvai/
├── app/
│   ├── waitlist/
│   │   ├── page.jsx                    ← main landing page
│   │   ├── share/
│   │   │   └── page.jsx               ← post-signup share page
│   │   └── [referralCode]/
│   │       └── page.jsx               ← referred landing (personalized)
│   └── api/
│       └── waitlist/
│           ├── join/
│           │   └── route.js           ← signup endpoint
│           ├── commitment/
│           │   └── route.js           ← save commitment text
│           ├── image/
│           │   └── route.js           ← Claude generates SVG card
│           ├── stats/
│           │   └── route.js           ← live counter data
│           ├── leaderboard/
│           │   └── route.js           ← top referrers
│           ├── refer/
│           │   └── route.js           ← track referral click/convert
│           └── payment/
│               ├── intent/
│               │   └── route.js       ← Stripe payment intent
│               └── webhook/
│                   └── route.js       ← Stripe webhook handler
├── lib/
│   └── waitlist/
│       ├── referrals.js               ← referral processing logic
│       ├── tiers.js                   ← tier calculation logic
│       ├── image-generator.js         ← Claude image generation
│       └── emails.js                  ← confirmation + milestone emails
└── supabase/
    └── waitlist-schema.sql            ← run in Supabase SQL editor
```

---

## PART 3 — DATABASE (add to existing Supabase project)

Run this in Supabase SQL Editor. Same project as the main app.

```sql
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
create or replace function generate_waitlist_referral_code(name text)
returns text as $$
declare
  base text;
  code text;
  exists_check boolean;
begin
  base := upper(regexp_replace(name, '[^a-zA-Z]', '', 'g'));
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

create or replace trigger waitlist_insert_trigger
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
```

---

## PART 4 — ENVIRONMENT VARIABLES

Add to .env.local (same file as the rest of the app):

```bash
# Already in your project:
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
# ANTHROPIC_API_KEY=

# Add these new ones:

# Stripe
STRIPE_SECRET_KEY=sk_live_...         # or sk_test_... for testing
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Waitlist config
WAITLIST_TIER_1_LIMIT=100
WAITLIST_TIER_2_LIMIT=500
NEXT_PUBLIC_APP_URL=https://zorvai.ca

# Resend (already in your project for main app emails)
# RESEND_API_KEY=
```

---

## PART 5 — API ROUTE SYSTEM

### Route map

```
POST /api/waitlist/join              ← step 1: sign up for waitlist
POST /api/waitlist/commitment        ← step 2: save their commitment text
POST /api/waitlist/image             ← step 3: Claude generates SVG card
GET  /api/waitlist/stats             ← live counter (polled every 30s)
GET  /api/waitlist/leaderboard       ← top referrers (public)
POST /api/waitlist/refer             ← track referral link click
POST /api/waitlist/payment/intent    ← Stripe: create payment intent
POST /api/waitlist/payment/webhook   ← Stripe: webhook handler (paid=true)
```

### API 1 — POST /api/waitlist/join

```javascript
// app/api/waitlist/join/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const body = await request.json()
    const {
      name, email, phone, countryCode, city,
      role, childName, childGrade, childSubject,
      referredBy, utmSource, utmMedium, utmCampaign
    } = body

    if (!name?.trim() || !email?.trim() || !countryCode) {
      return NextResponse.json(
        { error: 'Name, email, and country are required.' },
        { status: 400 }
      )
    }

    // Check if already on waitlist
    const { data: existing } = await supabase
      .from('waitlist')
      .select('id, referral_code, position, tier, discount_percent, lifetime_discount, child_name')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        referralCode: existing.referral_code,
        position: existing.position,
        tier: existing.tier,
        discountPercent: existing.discount_percent,
        lifetimeDiscount: existing.lifetime_discount,
        childName: existing.child_name
      })
    }

    // Insert new signup — trigger handles position, referral code, tier
    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        country_code: countryCode,
        city: city || null,
        role: role || 'parent',
        child_name: childName?.trim() || null,
        child_grade: childGrade || null,
        child_subject: childSubject || null,
        referred_by: referredBy || null,
        utm_source: utmSource || null,
        utm_medium: utmMedium || null,
        utm_campaign: utmCampaign || null
      })
      .select()
      .single()

    if (error) throw error

    // Process referral if applicable
    if (referredBy) {
      await supabase.rpc('process_referral', {
        p_referrer_code: referredBy,
        p_new_signup_id: data.id
      })
    }

    // Get total count for context
    const { count: total } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    // Send confirmation email (non-blocking)
    sendConfirmationEmail(data).catch(console.error)

    return NextResponse.json({
      ok: true,
      alreadyJoined: false,
      referralCode: data.referral_code,
      position: data.position,
      tier: data.tier,
      discountPercent: data.discount_percent,
      lifetimeDiscount: data.lifetime_discount,
      totalSignups: total,
      name: data.name,
      childName: data.child_name
    })

  } catch (err) {
    console.error('Waitlist join error:', err)
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
```

### API 2 — POST /api/waitlist/commitment

```javascript
// app/api/waitlist/commitment/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const { email, commitmentText, commitmentGoal } = await request.json()

    const { error } = await supabase
      .from('waitlist')
      .update({
        commitment_text: commitmentText,
        commitment_goal: commitmentGoal,
        commitment_made_at: new Date().toISOString()
      })
      .eq('email', email.toLowerCase().trim())

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Commitment error:', err)
    return NextResponse.json({ error: 'Failed to save.' }, { status: 500 })
  }
}
```

### API 3 — POST /api/waitlist/image (Claude API)

This is the Claude integration. Claude generates a beautiful SVG commitment
card. The SVG is uploaded to Supabase Storage and the URL is returned.

```javascript
// app/api/waitlist/image/route.js
import { NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

export async function POST(request) {
  try {
    const { referralCode } = await request.json()

    // Get signup details
    const { data: signup, error: fetchError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('referral_code', referralCode)
      .single()

    if (fetchError || !signup) {
      return NextResponse.json({ error: 'Signup not found.' }, { status: 404 })
    }

    // Build the prompt for Claude
    const tierLabel = signup.tier === 1
      ? 'Founding Member • 60% off forever'
      : signup.tier === 2
      ? 'Early Member • 40% off forever'
      : 'Resistance Member'

    const commitmentLine = signup.commitment_text
      || `I commit to helping ${signup.child_name || 'my child'} study smarter`

    const goalLine = signup.commitment_goal
      || 'Improve this year'

    const prompt = `You are a senior UI designer creating a premium shareable card.

Generate a complete, self-contained SVG card for Zorvai's waitlist.

CARD SPECIFICATIONS:
- Format: SVG with viewBox="0 0 540 960" (Instagram Story proportions)
- Style: Minimalist dark premium — like a luxury brand card, not an app screenshot
- Every element must be inside the SVG — no external fonts, no external images

CONTENT TO INCLUDE (exactly as written):
1. Top area: "ZORVAI" in large bold tracking-widest style — color #4ecdc4
2. Below logo: "AI Tutor • Resistance Member" — color #8a8680, smaller
3. A thin horizontal line divider — color #2a2826
4. Center large text (this is the commitment): "${commitmentLine}"
   Style: italic, white (#f0ede8), 22px equivalent, centered, max width 420px
5. Below commitment: Goal pill badge:
   "${goalLine}"
   Pill: border 1px #4ecdc4, background rgba(78,205,196,0.1), teal text, rounded
6. Another thin divider
7. Tier badge row: "${tierLabel}"
   Pill with teal border and background
8. Large decorative element: subtle teal orb top-right
   (circle with radial gradient from rgba(78,205,196,0.15) to transparent)
9. Smaller amber orb bottom-left
   (circle with radial gradient from rgba(251,191,36,0.06) to transparent)
10. Subtle grid pattern across the background (lines at 32px intervals, 12% opacity, color #2a2826)
11. Bottom section:
    - "Join me:" label in #8a8680
    - "zorvai.ca/?ref=${referralCode}" in #4ecdc4, bold
12. Very bottom: "zorvai.ca" in #5a5753, small

DESIGN RULES:
- Background: rect covering full SVG, fill with linear gradient from #161514 (top) to #0f0e0d (bottom)
- All text: font-family="system-ui, -apple-system, sans-serif"
- Generous padding: nothing within 40px of the edges
- The commitment text in the center is the HERO — make it large and prominent
- No clip art, no emojis rendered as text
- Must look expensive and minimal — lots of breathing room
- The teal color #4ecdc4 appears maximum 3 times — overuse kills the premium feel

Return ONLY valid SVG code.
Start with <svg viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg">
End with </svg>
No explanation. No markdown. No code fences. Just the SVG.`

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    })

    let svgCode = response.content[0].text.trim()

    // Clean up in case Claude adds any wrapper
    if (svgCode.includes('```')) {
      svgCode = svgCode.replace(/```svg\n?/g, '').replace(/```\n?/g, '').trim()
    }

    // Validate it starts with <svg
    if (!svgCode.startsWith('<svg')) {
      const svgStart = svgCode.indexOf('<svg')
      if (svgStart === -1) throw new Error('Claude did not return valid SVG')
      svgCode = svgCode.slice(svgStart)
    }

    // Upload SVG to Supabase Storage
    const fileName = `cards/${referralCode}-${Date.now()}.svg`
    const { error: uploadError } = await supabase.storage
      .from('waitlist-images')
      .upload(fileName, Buffer.from(svgCode), {
        contentType: 'image/svg+xml',
        cacheControl: '31536000',
        upsert: true
      })

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from('waitlist-images')
      .getPublicUrl(fileName)

    // Save URL to the signup record
    await supabase
      .from('waitlist')
      .update({ commitment_image_url: publicUrl })
      .eq('referral_code', referralCode)

    return NextResponse.json({
      ok: true,
      imageUrl: publicUrl,
      svgCode  // also return the raw SVG so the frontend can render inline
    })

  } catch (err) {
    console.error('Image generation error:', err)
    return NextResponse.json(
      { error: 'Failed to generate card. Please try again.' },
      { status: 500 }
    )
  }
}
```

### API 4 — GET /api/waitlist/stats

```javascript
// app/api/waitlist/stats/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Cache response for 15 seconds (Next.js route cache)
export const revalidate = 15

export async function GET() {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

    const [totalResult, recentResult, hourResult] = await Promise.all([
      // Total count
      supabase.from('waitlist').select('*', { count: 'exact', head: true }),

      // Recent locations for the live feed
      supabase.from('waitlist')
        .select('name, city, country_code, created_at')
        .order('created_at', { ascending: false })
        .limit(15),

      // Last hour count
      supabase.from('waitlist')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo)
    ])

    const total = totalResult.count || 0
    const tier1Limit = parseInt(process.env.WAITLIST_TIER_1_LIMIT || '100')
    const tier2Limit = parseInt(process.env.WAITLIST_TIER_2_LIMIT || '500')

    const currentTier = total < tier1Limit ? 1 : total < tier2Limit ? 2 : 3
    const spotsLeft = currentTier === 1
      ? tier1Limit - total
      : currentTier === 2
      ? tier2Limit - total
      : null

    const discountPercent = currentTier === 1 ? 60 : currentTier === 2 ? 40 : 0

    return NextResponse.json({
      total,
      lastHour: hourResult.count || 0,
      currentTier,
      spotsLeft,
      discountPercent,
      lifetimeDeal: currentTier <= 2,
      recentActivity: (recentResult.data || []).map(r => ({
        firstName: r.name.split(' ')[0],
        city: r.city,
        country: r.country_code,
        minutesAgo: Math.max(1, Math.floor(
          (Date.now() - new Date(r.created_at)) / 60000
        ))
      }))
    })
  } catch (err) {
    console.error('Stats error:', err)
    return NextResponse.json({ total: 0, lastHour: 0, currentTier: 1, spotsLeft: 100, discountPercent: 60 })
  }
}
```

### API 5 — GET /api/waitlist/leaderboard

```javascript
// app/api/waitlist/leaderboard/route.js
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const revalidate = 60  // revalidate every minute

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('waitlist')
      .select('name, city, country_code, referral_count, referral_code')
      .gt('referral_count', 0)
      .order('referral_count', { ascending: false })
      .limit(10)

    if (error) throw error

    return NextResponse.json({
      leaders: (data || []).map((r, i) => ({
        rank: i + 1,
        firstName: r.name.split(' ')[0],
        city: r.city || null,
        country: r.country_code,
        referralCount: r.referral_count,
        // Never expose full referral code publicly — only show anonymized data
        anonymizedCode: r.referral_code.slice(0, 3) + '***'
      }))
    })
  } catch (err) {
    return NextResponse.json({ leaders: [] })
  }
}
```

### API 6 — Stripe Payment Intent

```javascript
// app/api/waitlist/payment/intent/route.js
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Pre-launch pricing (parent pays now, gets access at launch + discount locked)
const PLANS = {
  student_solo_monthly:  { amount: 1999,  currency: 'usd', label: 'Student Solo — Monthly' },
  family_monthly:        { amount: 3999,  currency: 'usd', label: 'Family Plan — Monthly'  },
  family_annual:         { amount: 29900, currency: 'usd', label: 'Family Plan — Annual'   },
}

export async function POST(request) {
  try {
    const { email, planId, referralCode } = await request.json()

    // Get signup to verify they're on the waitlist and get their discount
    const { data: signup } = await supabase
      .from('waitlist')
      .select('id, email, name, tier, discount_percent, lifetime_discount')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!signup) {
      return NextResponse.json(
        { error: 'Please join the waitlist first.' },
        { status: 400 }
      )
    }

    const plan = PLANS[planId]
    if (!plan) {
      return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })
    }

    // Apply their waitlist discount
    const discountMultiplier = 1 - (signup.discount_percent / 100)
    const finalAmount = Math.round(plan.amount * discountMultiplier)

    // Create or retrieve Stripe customer
    let customerId = signup.stripe_customer_id

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: signup.email,
        name: signup.name,
        metadata: {
          waitlistId: signup.id,
          referralCode: referralCode || '',
          discountPercent: signup.discount_percent.toString(),
          lifetimeDiscount: signup.lifetime_discount.toString()
        }
      })
      customerId = customer.id

      await supabase
        .from('waitlist')
        .update({ stripe_customer_id: customerId })
        .eq('id', signup.id)
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: finalAmount,
      currency: plan.currency,
      customer: customerId,
      metadata: {
        waitlistId: signup.id,
        planId,
        originalAmount: plan.amount,
        discountPercent: signup.discount_percent,
        lifetimeDiscount: signup.lifetime_discount
      },
      description: `${plan.label} — Zorvai Founding Member (${signup.discount_percent}% off)`,
      receipt_email: signup.email
    })

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      amount: finalAmount,
      originalAmount: plan.amount,
      discountPercent: signup.discount_percent,
      currency: plan.currency
    })

  } catch (err) {
    console.error('Payment intent error:', err)
    return NextResponse.json(
      { error: 'Payment setup failed. Please try again.' },
      { status: 500 }
    )
  }
}
```

### API 7 — Stripe Webhook

```javascript
// app/api/waitlist/payment/webhook/route.js
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')

  let event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    const waitlistId = pi.metadata?.waitlistId

    if (waitlistId) {
      await supabase
        .from('waitlist')
        .update({
          paid: true,
          paid_at: new Date().toISOString(),
          stripe_session_id: pi.id,
          plan: pi.metadata?.planId
        })
        .eq('id', waitlistId)

      // Send payment confirmation email (non-blocking)
      sendPaymentConfirmationEmail(waitlistId).catch(console.error)
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## PART 6 — COMPLETE FRONTEND PROMPT

Paste everything below this line into Cursor or Antigravity.
Build app/waitlist/page.jsx exactly as described.

---

Build the complete Zorvai waitlist landing page at app/waitlist/page.jsx.

This is a Next.js App Router page (use 'use client' only for interactive
sections). The page lives at zorvai.ca/waitlist.

DESIGN PHILOSOPHY — MINIMALISM:
- Background is always #161514. Sections differ only in subtle surface changes.
- Never more than one visual element competing for attention at any scroll position.
- Whitespace is the design. Resist adding more elements.
- Every section has a maximum of: one heading, one subtext, one action.
- The page should feel like it was designed by someone who knew what to remove.
- No gradients on text. No glassmorphism. No heavy shadows. Borders do the work.
- Font: system-ui only. Never load a Google Font.

DESIGN TOKENS (use these exact values everywhere):
```css
--bg:          #161514;
--surface:     #1c1b19;
--raised:      #252320;
--border:      #2a2826;
--border-hi:   #3a3835;
--text:        #f0ede8;
--muted:       #8a8680;
--dim:         #5a5753;
--teal:        #4ecdc4;
--teal-bg:     rgba(78,205,196,0.08);
--teal-border: rgba(78,205,196,0.2);
--amber:       #fbbf24;
--success:     #4ade80;
```

STATE MANAGEMENT:
The page has these states. Manage them with useState at the top level.

```javascript
const [stats, setStats] = useState(null)
const [step, setStep] = useState('landing') // 'landing' | 'commitment' | 'share'
const [signup, setSignup] = useState(null)
const [commitment, setCommitment] = useState({ subject: '', goal: '' })
const [cardImage, setCardImage] = useState(null)
const [generatingCard, setGeneratingCard] = useState(false)
const [formLoading, setFormLoading] = useState(false)
const [referredBy, setReferredBy] = useState(null)
const [activityIndex, setActivityIndex] = useState(0)
```

On mount:
- Read ?ref= from URL params → setReferredBy
- Fetch /api/waitlist/stats → setStats
- Start polling /api/waitlist/stats every 30 seconds
- Start rotating recentActivity every 5 seconds (activityIndex state)

---

## SECTION 1 — NAVIGATION (sticky top)

Height: 56px. Background #161514. Border-bottom: 1px solid #2a2826.
Position: sticky, top 0, z-index 50.
Padding: 0 24px. Display flex, align-items center, justify-content space-between.

Left: "Zorvai" text in #f0ede8, 16px, font-weight 700, letter-spacing -0.3px.
After "Zorvai": a 5px circle, background #4ecdc4, margin-left 3px,
border-radius 50%, vertical-align middle.

Right: "Already joined?" text in #8a8680, 13px, cursor pointer.
On click: scroll to bottom email form.

---

## SECTION 2 — HERO (the first thing they see, no scrolling needed)

Background: #161514. Padding: 80px 24px 60px. Max-width 560px. Margin 0 auto.
Text-align: center.

LIVE BADGE (very top):
A small pill before the heading.
Background #1c1b19. Border 1px solid #2a2826. Border-radius 99px.
Padding 5px 12px. Display inline-flex. Gap 6px. Align-items center.
A pulsing red dot: 6px circle, background #ef4444, animation pulse 2s infinite.
Text: "[total] families on the waitlist" in #8a8680, 12px.
If stats.lastHour > 0: " · [lastHour] joined in the last hour" in #4ecdc4.

HEADING:
Two lines. Each line is a separate element so the teal word stands out.

Line 1: "Your child is studying." — #f0ede8, 36px (mobile: 28px), font-weight 600, line-height 1.2, letter-spacing -0.5px.
Line 2: "They're probably not" in #f0ede8 same style, then " learning." in #4ecdc4 same style.

Do NOT underline the teal word. Let the color do the work.

SUBTEXT:
Margin-top 20px. Color #8a8680. Font-size 17px (mobile: 15px). Line-height 1.65.
Max-width 460px. Margin-left auto. Margin-right auto.

"Most students re-read their notes and hope it sticks. Zorvai teaches the way
a real one-to-one tutor would — checking real understanding before moving on.
And if their scores don't improve, you get your money back."

TIER INDICATOR:
Margin-top 28px. Display inline-flex. Align-items center. Gap 8px.
Background rgba(78,205,196,0.06). Border 1px solid rgba(78,205,196,0.2).
Border-radius 8px. Padding 10px 16px.

Left: lightning bolt icon (SVG inline, 14px, color #4ecdc4).
Text: dynamic based on stats.currentTier:
- Tier 1: "⚡ [spotsLeft] founding spots left — 60% off, forever"
- Tier 2: "⚡ [spotsLeft] early spots left — 40% off, forever"
- Tier 3: "Join the waitlist — standard pricing at launch"
Color: #4ecdc4 for the offer text, #8a8680 for "spots left".
Font-size 13px. Font-weight 500.

---

## SECTION 3 — SIGNUP FORM (below hero, still above fold on desktop)

Max-width 400px. Margin: 32px auto 0. Padding: 0 24px.

Show this form when step === 'landing'.

When step === 'commitment': hide this section entirely.
When step === 'share': hide this section entirely.

FORM FIELDS (stacked, gap 12px):

Full name:
Label: "Your name" in #8a8680, 12px, font-weight 500, letter-spacing 0.03em, uppercase.
Input: width 100%, background #1c1b19, border 1px solid #2a2826,
border-radius 10px, padding 12px 16px, color #f0ede8, font-size 15px.
Placeholder: "Priya Sharma" in #5a5753.
On focus: border-color #4ecdc4, box-shadow 0 0 0 3px rgba(78,205,196,0.1).
Transition: all 200ms ease.

Email:
Label: "Email address" — same label style.
Same input style. Placeholder: "priya@email.com".

Child's first name (optional):
Label: "Child's name (optional)" — same label style.
Same input style. Placeholder: "Aanya".

Country:
Label: "Country" — same label style.
Select element: same styling as inputs.
Options: India, Bangladesh, Nepal, United Kingdom, United States, Canada, Australia, UAE, Singapore, Other.

Role toggle (subtle, below the country):
Two pills side by side: "I'm a parent" | "I'm a student"
Default: "I'm a parent" selected.
Selected: background rgba(78,205,196,0.08), border-color #4ecdc4, color #4ecdc4.
Unselected: background #1c1b19, border-color #2a2826, color #8a8680.
Font-size 13px. Padding 6px 14px. Border-radius 99px. Cursor pointer.
Transition: all 150ms ease.

SUBMIT BUTTON:
Full width. Margin-top 16px.
Background #4ecdc4. Color #161514. Font-weight 600. Font-size 15px.
Padding 14px. Border-radius 10px. Border none. Cursor pointer. Width 100%.
Text: "Join the Resistance →"
Loading state: three bouncing dots + "Joining..." text.
On hover: background #3db8b0. Transition 150ms ease.
On click: ripple animation from click point.

BELOW BUTTON:
"No credit card. No commitment yet. Just your spot."
Color #5a5753. Font-size 12px. Text-align center. Margin-top 10px.

---

## SECTION 4 — COMMITMENT MODULE (shown after signup, step === 'commitment')

This is the most important section psychologically.
Animate in: opacity 0 to 1, translateY 16px to 0, 400ms ease-out.

Max-width 480px. Margin 0 auto. Padding 40px 24px.

HEADING:
"Make your commitment real." in #f0ede8, 24px, font-weight 600.
Below: "The families who improve the most made a specific promise.
Write yours." in #8a8680, 15px, line-height 1.6. Margin-top 8px.

COMMITMENT FIELDS:
Gap 16px between them.

Subject select:
Label: "Subject they struggle with"
Select: Mathematics, Science, English, Biology, Chemistry, Physics,
History, Geography, All subjects.

Goal input:
Label: "What's the specific goal?"
Placeholder: "Pass SEE exam / Improve from C to A in Math / Score above 80%"
Text input.

AUTO-GENERATED COMMITMENT PREVIEW (updates as they type):
Below the goal input, a live-updating preview card.
Background rgba(78,205,196,0.04). Border 1px solid rgba(78,205,196,0.15).
Border-radius 12px. Padding 16px 20px. Margin-top 8px.

Shows: "I commit to helping [childName || 'my child'] master
[subject || '...'] — [goal || '...']"
Font-style italic. Color #f0ede8. Font-size 15px.

As they type, the preview updates with 200ms debounce.
This makes the commitment feel alive and real before they generate the card.

GENERATE CARD BUTTON:
Text: "Generate my commitment card →"
Full width. Same style as submit button.
Shows a loading state while Claude generates: "Creating your card..."
with a subtle pulse animation on the button background.

---

## SECTION 5 — SHARE MODULE (shown after card generated, step === 'share')

Animate in: opacity 0 to 1, 400ms ease-out.
Max-width 480px. Margin 0 auto. Padding 40px 24px.

YOUR COMMITMENT CARD:
The SVG returned by Claude rendered inline in an img tag (or as an SVG).
Width 100%. Max-width 320px. Margin 0 auto. Display block.
Border-radius 16px. Box-shadow 0 24px 64px rgba(0,0,0,0.5).
Float animation: translateY 0px to -8px and back, 5s ease-in-out infinite.

DOWNLOAD BUTTON (below card):
Secondary style. "Download card" with a download icon.
On click: create a blob from the SVG, trigger browser download as
"zorvai-commitment.svg".

SHARE BUTTONS ROW:
Three buttons in a row. Gap 10px.

Instagram Story:
Icon: Instagram outline SVG. Label: "Story".
Background #1c1b19. Border #2a2826. Color #f0ede8.
On click: trigger device share sheet if Web Share API available,
fallback to download the card.

WhatsApp:
Icon: WhatsApp SVG (green). Label: "WhatsApp".
On click: open WhatsApp with pre-written message:
```
wa.me/?text=[encoded message]
```
Pre-written message:
"I just made a commitment to help [childName] master [subject].
Zorvai is an AI tutor that teaches like a real one-to-one tutor —
and gives you money back if scores don't improve.
[spotsLeft] founding spots left at 60% off.
Join here: zorvai.ca/?ref=[referralCode]"

Copy link:
On click: copy zorvai.ca/?ref=[referralCode] to clipboard.
Button text changes to "Copied ✓" for 2 seconds.

YOUR REFERRAL STATS:
Below share buttons. A card showing:
Background #1c1b19. Border #2a2826. Border-radius 12px. Padding 16px 20px.

"Your referral link"
zorvai.ca/?ref=[code] in #4ecdc4, small mono font, truncated if needed.

Three milestone pills in a row (or column on mobile):
Each pill shows locked or unlocked state.
- "1 referral → jump 50 spots" (lock icon if 0 referrals, checkmark if done)
- "3 referrals → best tier, even if sold out" 
- "10 referrals → Founding Resistance Member"

Current count: "You've referred [n] families" in #8a8680, 13px.

---

## SECTION 6 — LIVE ACTIVITY FEED

Position this between the form and the problem section.
Max-width 400px. Margin 0 auto. Padding 0 24px 40px.

A rotating single line of text (changes every 5 seconds with a fade transition).

Background #1c1b19. Border 1px solid #2a2826. Border-radius 10px.
Padding 12px 16px. Display flex. Align-items center. Gap 10px.

Left: pulsing green dot (6px, #4ade80).
Text: "[firstName] from [city || country] joined [minutesAgo] minute[s] ago"
Color: #8a8680. Font-size 13px.

Rotate through stats.recentActivity array.
Fade transition: opacity 1 to 0 (200ms), update text, opacity 0 to 1 (200ms).

If recentActivity is empty: "Be one of the first to join"

---

## SECTION 7 — THE PROBLEM

Full width. Background #161514. Padding 80px 24px.
Max-width 560px. Margin 0 auto.

Heading: "Here's what's actually happening." in #f0ede8, 28px, font-weight 600.
Below: a thin 1px line, color #2a2826, margin 24px 0.

Two paragraphs:
Paragraph 1: "Your child re-reads their notes. It feels productive."
in #f0ede8, 17px, font-weight 500, line-height 1.6.

Paragraph 2 (below, no extra heading):
"Cognitive science consistently shows students forget the majority of
re-read material within 24 hours. They're not lazy. Nobody taught them
how to actually retain what they study."
in #8a8680, 16px, line-height 1.7.

Below paragraphs, a divider, then:
"The students who consistently do better have one thing:
someone who checks real understanding — not just whether they read."
in #f0ede8, 17px, font-style italic, line-height 1.6.

---

## SECTION 8 — HOW IT WORKS

Background #161514. Padding 60px 24px.
Max-width 460px. Margin 0 auto.

Heading: "Three steps. Every session." in #f0ede8, 22px, font-weight 600.

Three rows. Each row: display flex, gap 20px, align-items flex-start, margin-bottom 32px.

Left: a number (1, 2, 3) in #4ecdc4, 32px, font-weight 700, line-height 1,
min-width 32px.

Right:
Title in #f0ede8, 16px, font-weight 600.
Description in #8a8680, 14px, line-height 1.6, margin-top 4px.

Row 1:
Title: "Learn"
Description: "The AI teaches one concept at a time. Not a whole chapter — one idea, explained clearly until it makes sense."

Row 2:
Title: "Recall"
Description: "Your child closes their notes and explains it back in their own words. The AI listens without interrupting."

Row 3:
Title: "Challenge"
Description: "The AI asks harder questions — checking real understanding. If they struggle, it re-teaches that exact part. No moving on until it sticks."

---

## SECTION 9 — THE GUARANTEE

Background #1c1b19. Margin 0. Padding 60px 24px.
Max-width 460px. Margin 0 auto.

A bordered box:
Border: 1px solid #2a2826. Border-radius 16px. Padding 32px.

Heading: "Real improvement." in #f0ede8, 24px, font-weight 600.
Then on the next line: "Or your money back." in #4ecdc4, 24px, font-weight 600.

Divider. 1px solid #2a2826. Margin 24px 0.

Plain description:
"We track your child's score before they start and after they complete
their sessions. If it doesn't go up — full refund. No arguments.
No 'they didn't try hard enough.' Just two numbers: before and after."
in #8a8680, 15px, line-height 1.7.

Divider.

Three rows of how it works. Each row: flex, gap 12px, margin-bottom 12px.

Row layout: a teal number (1, 2, 3) left, text right in #8a8680, 14px.

1. "Take a short quiz when you start — 5 minutes, 10 questions."
2. "Complete at least 12 study sessions in 30 days."
3. "Take the same quiz again. If the score is the same or lower — full refund."

---

## SECTION 10 — JEALOUSY ENGINE

Background #161514. Padding 60px 24px.
Max-width 460px. Margin 0 auto.

Heading: "While you're reading this." in #f0ede8, 22px, font-weight 600.
Below: "Other parents already made the commitment." in #8a8680, 15px.

A rotating card (changes every 8 seconds):
Background #1c1b19. Border 1px solid #2a2826. Border-radius 12px.
Padding 20px 24px. Margin-top 24px.

Two elements:
- Commitment quote (generated from recentActivity data OR static examples):
  Font-style italic. Color #f0ede8. Font-size 15px. Line-height 1.6.
  Example: "I committed to helping Aanya master Mathematics before her
  board exam. She's going to be ready this year."
- Attribution below: "A parent from [city], [minutesAgo] minutes ago"
  Color #5a5753. Font-size 12px. Margin-top 10px.

Below the rotating card:
"Every one of these parents just made their child a promise."
in #8a8680, 14px. Line-height 1.6.

"The question is: when will you?" in #f0ede8, 14px. Font-weight 500.

CTA button: "Make my commitment →"
Same primary button style. Width auto (not full width). Margin-top 24px.
On click: if not signed up, scroll to form. If signed up, scroll to commitment section.

---

## SECTION 11 — LEADERBOARD

Background #161514. Padding 60px 24px.
Max-width 460px. Margin 0 auto.

Heading: "Top Resistance" in #f0ede8, 20px, font-weight 600.
Below: "Parents who brought the most families in this week." in #8a8680, 14px.

A list of up to 5 leaders. Fetch from /api/waitlist/leaderboard.

Each row:
Background #1c1b19. Border 1px solid #2a2826. Border-radius 10px.
Padding 12px 16px. Margin-bottom 8px.
Display flex. Align-items center. Gap 14px.

Left: rank number in #4ecdc4, 18px, font-weight 700. Min-width 24px.
Middle: "[firstName] · [city || country]" in #f0ede8, 14px.
Right: "[n] families" in #8a8680, 13px.

Top row (rank 1) has a slightly different style:
Border-color rgba(78,205,196,0.3). Background rgba(78,205,196,0.04).

Empty state (no leaders yet): hide the section entirely.

---

## SECTION 12 — FOUNDER STORY

Background #161514. Padding 60px 24px.
Max-width 460px. Margin 0 auto.

No heading. Start directly with the story.

"Prince and Rabindra grew up in Nepal without private tutors."
in #f0ede8, 17px, font-weight 500, line-height 1.7.

"They watched classmates with tutors consistently pass exams they
failed — not because those classmates were smarter, but because
someone was checking whether they actually understood the material."
in #8a8680, 16px, line-height 1.7. Margin-top 16px.

"They searched for an AI that could teach the way a real one-to-one
tutor would. They couldn't find one. So they built it."
in #f0ede8, 16px, line-height 1.7. Margin-top 16px.

Two founder cards side by side:
Each: background #1c1b19, border #2a2826, border-radius 10px, padding 14px 16px.
Avatar circle: 36px, background color derived from name, initials in white.
Name in #f0ede8, 14px, font-weight 500.
Role + location in #8a8680, 12px.

Card 1: "Prince · Co-founder · Nepal 🇳🇵"
Card 2: "Rabindra · Co-founder · Nepal 🇳🇵"

---

## SECTION 13 — BOTTOM CTA (repeat the form)

Background #1c1b19. Padding 60px 24px.
Max-width 400px. Margin 0 auto.

Heading: "Secure your spot." in #f0ede8, 22px, font-weight 600.

Tier indicator (same as hero, dynamically updated).

The same form as Section 3 — same fields, same button.
If already signed up: show "You're already in · Refer to move up" instead.

---

## SECTION 14 — FOOTER

Background #161514. Border-top 1px solid #2a2826. Padding 32px 24px.
Display flex. Justify-content space-between. Align-items center.
Max-width 560px. Margin 0 auto. Flex-wrap wrap. Gap 16px.

Left: "Zorvai" + teal dot. Color #f0ede8, 14px, font-weight 600.

Center: Links in a row. Gap 20px.
[Privacy Policy] [Guarantee] [How it works]
Color #5a5753. Font-size 13px. Hover: #8a8680. No underline.

Right: "hello@zorvai.ca" in #5a5753, 13px.

---

## ANIMATIONS (use CSS only — no Framer Motion)

```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.4; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-8px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}

@keyframes ripple {
  to { transform: scale(4); opacity: 0; }
}

.animate-pulse { animation: pulse 2s ease-in-out infinite; }
.animate-float { animation: float 5s ease-in-out infinite; }
.animate-in    { animation: fadeIn 400ms cubic-bezier(0.16,1,0.3,1) both; }
```

Sections animate in on scroll using IntersectionObserver:
```javascript
useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('animate-in')
        observer.unobserve(e.target)
      }
    }),
    { threshold: 0.1 }
  )
  document.querySelectorAll('.animate-on-scroll')
    .forEach(el => observer.observe(el))
  return () => observer.disconnect()
}, [])
```

Add class "animate-on-scroll" to every section div.

---

## MOBILE RESPONSIVENESS

All sections: single column.
Max-width: 100% minus 32px padding (16px each side).
Hero heading: 28px on mobile (36px desktop).
Share buttons: full width on mobile, stacked vertically.
Founder cards: stacked vertically on mobile.
Leaderboard rows: same but smaller padding.
Bottom CTA form: same single-column layout.
Navigation: same — just simpler at smaller width.

---

## REFERRAL LANDING PAGE

Build app/waitlist/[referralCode]/page.jsx

This is shown when someone clicks a referral link.

Personalized heading: "[ReferrerFirstName] thinks you should know about this."
Below: same page content as the main waitlist page BUT:
- The referredBy value is pre-filled from the URL param
- A top banner shows: "You were invited by [firstName]. Joining gives them 50 spots up the waitlist."
- Banner: background rgba(78,205,196,0.06), border-bottom 1px solid rgba(78,205,196,0.2), padding 12px 24px, text color #4ecdc4, font-size 14px.

On load: fetch /api/waitlist/refer with the referral code to track the click.

---

## KEY DESIGN DECISIONS AND WHY

1. NO SIDEBAR, NO COMPLEX LAYOUT: This page has one job. One column. One job.

2. THE COMMITMENT IS THE PRODUCT: The commitment module is not a feature —
   it's the psychological mechanism that converts a curious parent into an
   invested one. Parents who type their child's name + goal feel ownership
   before they pay a cent.

3. CLAUDE FOR IMAGE GENERATION NOT DALL-E: Claude generates SVG which is
   infinitely scalable, small file size, renders perfectly on any screen,
   and can be styled precisely. DALL-E generates raster images that may
   not match the brand and cost more per call.

4. STRIPE PAYMENT INTENT NOT CHECKOUT: PaymentIntent gives you control
   over the UI while keeping PCI compliance. Checkout redirects break the
   flow for a page this focused.

5. SAME SUPABASE PROJECT: The waitlist shares a database with the main app
   so when a waitlist member becomes a paid user at launch, their record
   already exists — no migration, no duplicate data.

6. STATS CACHED AT ROUTE LEVEL: export const revalidate = 15 in the stats
   route means Next.js caches the response for 15 seconds at the edge —
   the live counter feels real without hammering the database on every request.

7. WHATSAPP SHARE IS THE PRIMARY CTA: In India and Bangladesh, WhatsApp is
   the distribution channel. Instagram stories are secondary. Email is tertiary.
   Design and copy weight reflects this.
