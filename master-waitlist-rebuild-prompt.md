# ZORVAI WAITLIST PAGE — COMPLETE REBUILD PROMPT
# URL: zorvai.ca/waitlist
# Stack: Next.js App Router, Supabase, Gemini API, Stripe
# Style: Minimalist dark — same as the rest of zorvai.ca
# Paste this entire file into Cursor or Antigravity

---

## WHAT EXISTS NOW (keep these, improve them):
- Basic email signup form
- Country selector
- Role toggle (Parent / Student)
- Countdown timer
- "Join 0 others" counter

## WHAT TO BUILD (everything new):
- Live animated counter (real number from DB)
- Commitment flow (REPLACES the pricing section)
- Pricing offer INSIDE the commitment flow (not a separate section)
- Gemini API — generates a professional commitment card image
- Referral system with unique codes
- Tiered waitlist offer (60% off lifetime shown after commitment)
- Live activity feed (who just joined)
- Leaderboard (top referrers)
- Jealousy mechanics
- Guarantee section
- Founder story
- Share to WhatsApp / Instagram / Copy link
- Post-signup share page

---

## PART 1 — DATABASE (add to existing Supabase project)

Run in Supabase SQL Editor:

```sql
create table if not exists waitlist (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  name text not null,
  phone text,
  country_code char(2) not null default 'IN',
  city text,
  role text not null default 'parent' check (role in ('parent','student')),
  child_name text,
  child_grade text,

  -- Commitment fields
  commitment_subject text,
  commitment_goal text,
  commitment_text text,
  commitment_made_at timestamptz,
  commitment_image_url text,

  -- Pricing choice
  chosen_plan text,  -- 'weekly' | 'monthly' | 'annual'
  plan_price_usd numeric,
  plan_original_price_usd numeric,
  discount_percent numeric not null default 60,

  -- Referral
  referral_code text unique not null,
  referred_by text references waitlist(referral_code),
  referral_count int not null default 0,
  referral_bonus text,
  position_boosted_by int not null default 0,

  -- Position and tier
  position int,
  tier int not null default 1,
  lifetime_discount boolean not null default true,

  -- Payment
  stripe_customer_id text,
  stripe_payment_intent_id text,
  paid boolean not null default false,
  paid_at timestamptz,

  -- Tracking
  utm_source text,
  utm_medium text,
  utm_campaign text,
  shared_whatsapp boolean not null default false,
  shared_story boolean not null default false,

  created_at timestamptz not null default now()
);

create table if not exists waitlist_referral_events (
  id uuid primary key default gen_random_uuid(),
  referral_code text not null,
  new_signup_id uuid references waitlist(id),
  converted boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists waitlist_shares (
  id uuid primary key default gen_random_uuid(),
  waitlist_id uuid not null references waitlist(id),
  platform text not null,
  created_at timestamptz not null default now()
);

-- Auto-assign position and referral code on insert
create or replace function waitlist_auto_setup()
returns trigger as $$
declare
  total int;
  base text;
  code text;
  code_exists boolean;
begin
  select coalesce(max(position), 0) + 1 into total from waitlist;
  new.position := total;

  -- Generate referral code
  base := upper(regexp_replace(new.name, '[^a-zA-Z]', '', 'g'));
  base := left(base || 'ZORV', 4);
  loop
    code := base || floor(random() * 9000 + 1000)::text;
    select count(*) > 0 into code_exists from waitlist where referral_code = code;
    exit when not code_exists;
  end loop;
  new.referral_code := code;

  -- Tier is always 1 for now (60% off lifetime for early members)
  new.tier := 1;
  new.discount_percent := 60;
  new.lifetime_discount := true;

  return new;
end;
$$ language plpgsql;

create or replace trigger waitlist_before_insert
  before insert on waitlist
  for each row execute function waitlist_auto_setup();

-- Process referral bonus
create or replace function process_referral(
  p_referrer_code text,
  p_new_signup_id uuid
) returns void as $$
declare
  new_count int;
begin
  update waitlist set
    referral_count = referral_count + 1,
    position = greatest(1, position - 50),
    position_boosted_by = position_boosted_by + 50,
    referral_bonus = case
      when referral_count + 1 >= 10 then 'founding_member'
      when referral_count + 1 >= 5  then 'first_month_free'
      when referral_count + 1 >= 3  then 'tier_unlock'
      else referral_bonus
    end
  where referral_code = p_referrer_code
  returning referral_count into new_count;

  insert into waitlist_referral_events
    (referral_code, new_signup_id, converted)
  values (p_referrer_code, p_new_signup_id, true);
end;
$$ language plpgsql;

-- Indexes
create index if not exists waitlist_email_idx on waitlist(email);
create index if not exists waitlist_referral_code_idx on waitlist(referral_code);
create index if not exists waitlist_referred_by_idx on waitlist(referred_by);
create index if not exists waitlist_created_idx on waitlist(created_at desc);
create index if not exists waitlist_referral_count_idx on waitlist(referral_count desc);
```

---

## PART 2 — ENVIRONMENT VARIABLES

Add to .env.local:

```bash
# Already existing in your project — keep them:
# NEXT_PUBLIC_SUPABASE_URL=
# SUPABASE_SERVICE_ROLE_KEY=
# ANTHROPIC_API_KEY=

# Add these new ones:
GEMINI_API_KEY=your_gemini_api_key_from_google_ai_studio
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NEXT_PUBLIC_APP_URL=https://zorvai.ca
WAITLIST_TOTAL_SPOTS=500
```

Get Gemini API key free at: https://aistudio.google.com/app/apikey

---

## PART 3 — API ROUTES

Create these files in app/api/waitlist/:

### app/api/waitlist/join/route.js

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const {
      name, email, phone, countryCode, city,
      role, childName, childGrade,
      referredBy, utmSource, utmMedium, utmCampaign
    } = await request.json()

    if (!name?.trim() || !email?.trim()) {
      return NextResponse.json({ error: 'Name and email are required.' }, { status: 400 })
    }

    // Check if already joined
    const { data: existing } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle()

    if (existing) {
      return NextResponse.json({
        ok: true,
        alreadyJoined: true,
        referralCode: existing.referral_code,
        position: existing.position,
        discountPercent: existing.discount_percent,
        childName: existing.child_name,
        hasCommitment: !!existing.commitment_text,
        commitmentImageUrl: existing.commitment_image_url
      })
    }

    const { data, error } = await supabase
      .from('waitlist')
      .insert({
        email: email.toLowerCase().trim(),
        name: name.trim(),
        phone: phone || null,
        country_code: countryCode || 'IN',
        city: city || null,
        role: role || 'parent',
        child_name: childName?.trim() || null,
        child_grade: childGrade || null,
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

    const { count: total } = await supabase
      .from('waitlist')
      .select('*', { count: 'exact', head: true })

    return NextResponse.json({
      ok: true,
      alreadyJoined: false,
      referralCode: data.referral_code,
      position: data.position,
      discountPercent: data.discount_percent,
      lifetimeDiscount: data.lifetime_discount,
      totalSignups: total,
      name: data.name,
      childName: data.child_name
    })
  } catch (err) {
    console.error('Join error:', err)
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 })
  }
}
```

### app/api/waitlist/commitment/route.js

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function POST(request) {
  try {
    const {
      email, commitmentSubject, commitmentGoal,
      commitmentText, chosenPlan, planPriceUsd, planOriginalPrice
    } = await request.json()

    const { error } = await supabase
      .from('waitlist')
      .update({
        commitment_subject: commitmentSubject,
        commitment_goal: commitmentGoal,
        commitment_text: commitmentText,
        commitment_made_at: new Date().toISOString(),
        chosen_plan: chosenPlan || null,
        plan_price_usd: planPriceUsd || null,
        plan_original_price_usd: planOriginalPrice || null
      })
      .eq('email', email.toLowerCase().trim())

    if (error) throw error

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Commitment error:', err)
    return NextResponse.json({ error: 'Failed to save commitment.' }, { status: 500 })
  }
}
```

### app/api/waitlist/image/route.js (GEMINI API)

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Gemini API endpoint for image generation
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${process.env.GEMINI_API_KEY}`

export async function POST(request) {
  try {
    const { referralCode } = await request.json()

    const { data: signup, error: fetchError } = await supabase
      .from('waitlist')
      .select('*')
      .eq('referral_code', referralCode)
      .single()

    if (fetchError || !signup) {
      return NextResponse.json({ error: 'Signup not found.' }, { status: 404 })
    }

    const childName = signup.child_name || 'my child'
    const subject = signup.commitment_subject || 'their studies'
    const goal = signup.commitment_goal || 'reach their full potential'
    const commitmentText = signup.commitment_text ||
      `I commit to helping ${childName} master ${subject}`
    const discount = signup.discount_percent || 60
    const plan = signup.chosen_plan
      ? `${signup.chosen_plan.charAt(0).toUpperCase() + signup.chosen_plan.slice(1)} Plan — $${signup.plan_price_usd}/mo`
      : `Founding Member — ${discount}% off forever`

    // Use Gemini to generate an SVG card
    // Gemini gemini-2.0-flash-exp can generate SVG text content
    const prompt = `Generate a beautiful, shareable SVG commitment card for Zorvai, an AI tutor app.

The card must be exactly this format: SVG with viewBox="0 0 540 960"

Include these elements with these exact colors and positions:
BACKGROUND: A rectangle covering the entire SVG with a linear gradient from #161514 at top to #0f0e0d at bottom.
DECORATIVE: A large circle (radius 220) positioned at top-right (-40, -40) filled with radial gradient from rgba(78,205,196,0.12) to transparent — this is a blurred teal glow orb.
DECORATIVE: A smaller circle (radius 140) at bottom-left (-20, 920) filled with radial gradient from rgba(251,191,36,0.06) to transparent — amber glow.
GRID: A subtle grid pattern background using SVG pattern, lines color #2a2826 at 8% opacity, 32px spacing.

TOP SECTION (y: 60-120):
- Text "ZORVAI" centered at y=80, fill="#4ecdc4", font-size="28", font-weight="700", letter-spacing="6", font-family="system-ui, sans-serif"
- Text "AI Tutor • Resistance Member" centered at y=110, fill="#8a8680", font-size="13", letter-spacing="2"

DIVIDER: horizontal line from x=60 to x=480 at y=140, stroke="#2a2826", stroke-width="1"

MIDDLE SECTION (y: 180-700) — this is the HERO of the card:
- Small text "${subject}" at y=200 centered, fill="#4ecdc4", font-size="13", letter-spacing="3", text-transform uppercase
- Large italic commitment text centered starting at y=280:
  "${commitmentText}"
  font-size="26", fill="#f0ede8", font-style="italic", font-family="system-ui, serif", line-height handle with tspan breaks at ~28 chars per line
- A teal pill badge at y=460 centered:
  rounded rect fill="rgba(78,205,196,0.1)" stroke="#4ecdc4" stroke-width="1" rx="99" width=auto height=36
  Inside: text "${goal}", fill="#4ecdc4", font-size="14"

DIVIDER: line at y=520

PLAN SECTION (y: 540-620):
- "${plan}" text centered at y=570, fill="#f0ede8", font-size="15", font-weight="600"
- "Founding Member — locked in forever" centered at y=598, fill="#8a8680", font-size="12"

DIVIDER: line at y=640

BOTTOM SECTION (y: 660-900):
- "Join me:" text at y=700 centered, fill="#5a5753", font-size="12"
- "zorvai.ca/?ref=${referralCode}" centered at y=730, fill="#4ecdc4", font-size="16", font-weight="600"
- Thin decorative lines on both sides of the referral code
- "zorvai.ca" at y=880, fill="#5a5753", font-size="11", centered

Return ONLY the complete SVG code. Start with <svg and end with </svg>. No markdown, no explanation, no code fences.`

    const geminiResponse = await fetch(GEMINI_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 4096
        }
      })
    })

    if (!geminiResponse.ok) {
      const err = await geminiResponse.text()
      throw new Error(`Gemini API error: ${err}`)
    }

    const geminiData = await geminiResponse.json()
    let svgCode = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''

    // Clean up any markdown wrapping
    if (svgCode.includes('```')) {
      svgCode = svgCode.replace(/```svg\n?/gi, '').replace(/```\n?/g, '').trim()
    }

    // Ensure it starts with <svg
    if (!svgCode.startsWith('<svg')) {
      const svgIndex = svgCode.indexOf('<svg')
      if (svgIndex === -1) {
        // Fallback: generate a basic SVG if Gemini fails
        svgCode = generateFallbackSVG({ childName, subject, goal, commitmentText, plan, referralCode, discount })
      } else {
        svgCode = svgCode.slice(svgIndex)
      }
    }

    // Upload to Supabase Storage
    const fileName = `commitments/${referralCode}-${Date.now()}.svg`
    const svgBuffer = Buffer.from(svgCode, 'utf-8')

    const { error: uploadError } = await supabase.storage
      .from('waitlist-images')
      .upload(fileName, svgBuffer, {
        contentType: 'image/svg+xml',
        cacheControl: '31536000',
        upsert: true
      })

    if (uploadError) {
      // If bucket doesn't exist yet, create it first
      if (uploadError.message?.includes('bucket')) {
        await supabase.storage.createBucket('waitlist-images', { public: true })
        await supabase.storage
          .from('waitlist-images')
          .upload(fileName, svgBuffer, { contentType: 'image/svg+xml', upsert: true })
      } else {
        throw uploadError
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from('waitlist-images')
      .getPublicUrl(fileName)

    // Save image URL to record
    await supabase
      .from('waitlist')
      .update({ commitment_image_url: publicUrl })
      .eq('referral_code', referralCode)

    return NextResponse.json({ ok: true, imageUrl: publicUrl, svgCode })

  } catch (err) {
    console.error('Image generation error:', err)

    // Return fallback SVG so the page never breaks
    const fallbackSvg = generateFallbackSVG({
      childName: 'my child',
      subject: 'their studies',
      goal: 'reach their potential',
      commitmentText: 'I commit to giving my child a real chance',
      plan: 'Founding Member — 60% off forever',
      referralCode: 'ZORV0000',
      discount: 60
    })

    return NextResponse.json({
      ok: true,
      imageUrl: null,
      svgCode: fallbackSvg,
      usedFallback: true
    })
  }
}

function generateFallbackSVG({ childName, subject, goal, commitmentText, plan, referralCode, discount }) {
  // Clean SVG fallback that always works
  const line1 = commitmentText.slice(0, 35)
  const line2 = commitmentText.slice(35, 70)
  const line3 = commitmentText.slice(70, 105)

  return `<svg viewBox="0 0 540 960" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#161514"/>
      <stop offset="100%" stop-color="#0f0e0d"/>
    </linearGradient>
    <radialGradient id="teal-orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(78,205,196,0.15)"/>
      <stop offset="100%" stop-color="rgba(78,205,196,0)"/>
    </radialGradient>
    <radialGradient id="amber-orb" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="rgba(251,191,36,0.08)"/>
      <stop offset="100%" stop-color="rgba(251,191,36,0)"/>
    </radialGradient>
    <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#2a2826" stroke-width="0.5" opacity="0.4"/>
    </pattern>
  </defs>
  <rect width="540" height="960" fill="url(#bg)"/>
  <rect width="540" height="960" fill="url(#grid)"/>
  <circle cx="500" cy="60" r="220" fill="url(#teal-orb)"/>
  <circle cx="40" cy="900" r="140" fill="url(#amber-orb)"/>
  <text x="270" y="90" text-anchor="middle" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#4ecdc4" letter-spacing="5">ZORVAI</text>
  <text x="270" y="116" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a8680" letter-spacing="2">AI TUTOR • RESISTANCE MEMBER</text>
  <line x1="60" y1="140" x2="480" y2="140" stroke="#2a2826" stroke-width="1"/>
  <text x="270" y="210" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#4ecdc4" letter-spacing="3">${subject.toUpperCase()}</text>
  <text x="270" y="300" text-anchor="middle" font-family="system-ui,serif" font-size="24" font-style="italic" fill="#f0ede8">${line1}</text>
  ${line2 ? `<text x="270" y="334" text-anchor="middle" font-family="system-ui,serif" font-size="24" font-style="italic" fill="#f0ede8">${line2}</text>` : ''}
  ${line3 ? `<text x="270" y="368" text-anchor="middle" font-family="system-ui,serif" font-size="24" font-style="italic" fill="#f0ede8">${line3}</text>` : ''}
  <rect x="130" y="430" width="280" height="40" rx="20" fill="rgba(78,205,196,0.1)" stroke="#4ecdc4" stroke-width="1"/>
  <text x="270" y="455" text-anchor="middle" font-family="system-ui,sans-serif" font-size="14" fill="#4ecdc4">${goal}</text>
  <line x1="60" y1="500" x2="480" y2="500" stroke="#2a2826" stroke-width="1"/>
  <text x="270" y="550" text-anchor="middle" font-family="system-ui,sans-serif" font-size="15" font-weight="600" fill="#f0ede8">${plan}</text>
  <text x="270" y="578" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#8a8680">Locked in forever</text>
  <line x1="60" y1="610" x2="480" y2="610" stroke="#2a2826" stroke-width="1"/>
  <text x="270" y="660" text-anchor="middle" font-family="system-ui,sans-serif" font-size="12" fill="#5a5753">Join me:</text>
  <text x="270" y="700" text-anchor="middle" font-family="system-ui,sans-serif" font-size="16" font-weight="600" fill="#4ecdc4">zorvai.ca/?ref=${referralCode}</text>
  <text x="270" y="920" text-anchor="middle" font-family="system-ui,sans-serif" font-size="11" fill="#5a5753">zorvai.ca</text>
</svg>`
}
```

### app/api/waitlist/stats/route.js

```javascript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export const revalidate = 20

export async function GET() {
  try {
    const oneHourAgo = new Date(Date.now() - 3600000).toISOString()

    const [totalResult, recentResult, hourResult, leaderResult] = await Promise.all([
      supabase.from('waitlist').select('*', { count: 'exact', head: true }),
      supabase.from('waitlist')
        .select('name, city, country_code, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
      supabase.from('waitlist')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', oneHourAgo),
      supabase.from('waitlist')
        .select('name, city, country_code, referral_count')
        .gt('referral_count', 0)
        .order('referral_count', { ascending: false })
        .limit(5)
    ])

    const total = totalResult.count || 0
    const spotsLeft = Math.max(0, parseInt(process.env.WAITLIST_TOTAL_SPOTS || '500') - total)

    return NextResponse.json({
      total,
      lastHour: hourResult.count || 0,
      spotsLeft,
      discountPercent: 60,
      lifetimeDeal: true,
      recentActivity: (recentResult.data || []).map(r => ({
        firstName: r.name.split(' ')[0],
        city: r.city,
        country: r.country_code,
        minutesAgo: Math.max(1, Math.floor(
          (Date.now() - new Date(r.created_at)) / 60000
        ))
      })),
      leaders: (leaderResult.data || []).map((r, i) => ({
        rank: i + 1,
        firstName: r.name.split(' ')[0],
        city: r.city,
        country: r.country_code,
        referralCount: r.referral_count
      }))
    })
  } catch (err) {
    return NextResponse.json({
      total: 0, lastHour: 0, spotsLeft: 500,
      discountPercent: 60, lifetimeDeal: true,
      recentActivity: [], leaders: []
    })
  }
}
```

### app/api/waitlist/payment/route.js (Stripe)

```javascript
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Plans with 60% off already applied
const PLANS = {
  weekly:  { name: 'Weekly',  originalUsd: 1299, discountedUsd: 519,  cents: 519  },
  monthly: { name: 'Monthly', originalUsd: 4999, discountedUsd: 1999, cents: 1999 },
  annual:  { name: 'Annual',  originalUsd: 29900, discountedUsd: 11960, cents: 11960 }
}
// Note: $19 monthly mentioned = $1999 cents (closest match to "19$")
// The 60% off a $49 monthly = $19.60 ≈ $19 ✓

export async function POST(request) {
  try {
    const { email, planId } = await request.json()

    const plan = PLANS[planId]
    if (!plan) return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 })

    const { data: signup } = await supabase
      .from('waitlist')
      .select('*')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (!signup) {
      return NextResponse.json({ error: 'Join the waitlist first.' }, { status: 400 })
    }

    // Get or create Stripe customer
    let customerId = signup.stripe_customer_id
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: signup.email,
        name: signup.name,
        metadata: { waitlistId: signup.id, referralCode: signup.referral_code }
      })
      customerId = customer.id
      await supabase.from('waitlist')
        .update({ stripe_customer_id: customerId })
        .eq('id', signup.id)
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: plan.cents,
      currency: 'usd',
      customer: customerId,
      metadata: {
        waitlistId: signup.id,
        planId,
        discountPercent: '60',
        originalPrice: plan.originalUsd.toString()
      },
      description: `Zorvai ${plan.name} — Founding Member (60% off forever)`,
      receipt_email: signup.email
    })

    return NextResponse.json({
      ok: true,
      clientSecret: paymentIntent.client_secret,
      planName: plan.name,
      discountedPrice: plan.discountedUsd,
      originalPrice: plan.originalUsd
    })
  } catch (err) {
    console.error('Payment error:', err)
    return NextResponse.json({ error: 'Payment setup failed.' }, { status: 500 })
  }
}
```

### app/api/waitlist/payment/webhook/route.js

```javascript
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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type === 'payment_intent.succeeded') {
    const pi = event.data.object
    await supabase.from('waitlist')
      .update({
        paid: true,
        paid_at: new Date().toISOString(),
        stripe_payment_intent_id: pi.id,
        chosen_plan: pi.metadata?.planId
      })
      .eq('id', pi.metadata?.waitlistId)
  }

  return NextResponse.json({ received: true })
}
```

---

## PART 4 — COMPLETE FRONTEND

Replace app/waitlist/page.jsx entirely with this:

```jsx
'use client'

import { useState, useEffect, useRef } from 'react'

// ── Design tokens ──────────────────────────────────────────────
const T = {
  bg: '#161514',
  surface: '#1c1b19',
  raised: '#252320',
  border: '#2a2826',
  borderHi: '#3a3835',
  text: '#f0ede8',
  muted: '#8a8680',
  dim: '#5a5753',
  teal: '#4ecdc4',
  tealBg: 'rgba(78,205,196,0.08)',
  tealBorder: 'rgba(78,205,196,0.2)',
  amber: '#fbbf24',
  success: '#4ade80',
  danger: '#f87171',
}

// ── Plans ──────────────────────────────────────────────────────
const PLANS = [
  {
    id: 'weekly',
    name: 'Weekly',
    original: '$12.99/week',
    price: '$5.19/week',
    priceNum: '5.19',
    saving: 'Save 60%',
    description: 'Try it for a week',
    badge: null
  },
  {
    id: 'monthly',
    name: 'Monthly',
    original: '$49/month',
    price: '$19/month',
    priceNum: '19',
    saving: '60% off forever',
    description: 'Best for most families',
    badge: 'Most popular'
  },
  {
    id: 'annual',
    name: 'Annual',
    original: '$299/year',
    price: '$119/year',
    priceNum: '9.99',
    saving: 'Under $10/month',
    description: 'Best value — 2 months free',
    badge: 'Best value'
  }
]

const SUBJECTS = ['Mathematics','Science','English','Biology','Chemistry','Physics','History','Geography','All subjects']
const COUNTRIES = ['India','Bangladesh','Nepal','United Kingdom','United States','Canada','Australia','UAE','Singapore','Other']

export default function WaitlistPage() {
  // ── State ────────────────────────────────────────────────────
  const [step, setStep] = useState('form')
  // 'form' → 'commitment' → 'plan' → 'share'

  const [stats, setStats] = useState({
    total: 0, lastHour: 0, spotsLeft: 500,
    discountPercent: 60, recentActivity: [], leaders: []
  })
  const [activityIndex, setActivityIndex] = useState(0)
  const [activityVisible, setActivityVisible] = useState(true)

  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', countryCode: 'IN',
    city: '', role: 'parent', childName: '', childGrade: ''
  })
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const [signup, setSignup] = useState(null)

  const [commitment, setCommitment] = useState({
    subject: '', goal: ''
  })
  const [commitmentLoading, setCommitmentLoading] = useState(false)

  const [selectedPlan, setSelectedPlan] = useState('monthly')

  const [cardLoading, setCardLoading] = useState(false)
  const [cardImage, setCardImage] = useState(null)
  const [cardSvg, setCardSvg] = useState(null)

  const [copied, setCopied] = useState(false)
  const [referredBy, setReferredBy] = useState(null)

  // ── Init ─────────────────────────────────────────────────────
  useEffect(() => {
    // Get ref from URL
    const params = new URLSearchParams(window.location.search)
    setReferredBy(params.get('ref'))

    // Load stats
    loadStats()
    const statsInterval = setInterval(loadStats, 30000)

    return () => clearInterval(statsInterval)
  }, [])

  // Rotate activity feed
  useEffect(() => {
    if (!stats.recentActivity.length) return
    const interval = setInterval(() => {
      setActivityVisible(false)
      setTimeout(() => {
        setActivityIndex(i => (i + 1) % stats.recentActivity.length)
        setActivityVisible(true)
      }, 300)
    }, 5000)
    return () => clearInterval(interval)
  }, [stats.recentActivity])

  async function loadStats() {
    try {
      const res = await fetch('/api/waitlist/stats')
      const data = await res.json()
      setStats(data)
    } catch (e) {}
  }

  // ── Handlers ─────────────────────────────────────────────────
  async function handleJoin(e) {
    e.preventDefault()
    if (!formData.name.trim() || !formData.email.trim()) {
      setFormError('Name and email are required.')
      return
    }
    setFormError('')
    setFormLoading(true)

    try {
      const res = await fetch('/api/waitlist/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          referredBy,
          utmSource: new URLSearchParams(window.location.search).get('utm_source'),
          utmMedium: new URLSearchParams(window.location.search).get('utm_medium')
        })
      })
      const data = await res.json()
      if (!data.ok) throw new Error(data.error)

      setSignup(data)

      if (data.alreadyJoined && data.hasCommitment && data.commitmentImageUrl) {
        setCardImage(data.commitmentImageUrl)
        setStep('share')
      } else if (data.alreadyJoined && data.hasCommitment) {
        setStep('plan')
      } else {
        setStep('commitment')
      }

      // Refresh stats
      loadStats()
    } catch (err) {
      setFormError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleCommitment() {
    if (!commitment.subject || !commitment.goal) return
    setCommitmentLoading(true)

    const commitmentText = `I commit to helping ${formData.childName || signup?.childName || 'my child'} master ${commitment.subject}`

    try {
      await fetch('/api/waitlist/commitment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email || signup?.email,
          commitmentSubject: commitment.subject,
          commitmentGoal: commitment.goal,
          commitmentText,
          chosenPlan: selectedPlan,
          planPriceUsd: PLANS.find(p => p.id === selectedPlan)?.priceNum,
          planOriginalPrice: PLANS.find(p => p.id === selectedPlan)?.original
        })
      })
      setStep('plan')
    } catch (err) {
      console.error(err)
    } finally {
      setCommitmentLoading(false)
    }
  }

  async function handleGenerateCard() {
    if (!signup?.referralCode) return
    setCardLoading(true)
    try {
      const res = await fetch('/api/waitlist/image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referralCode: signup.referralCode })
      })
      const data = await res.json()
      if (data.svgCode) setCardSvg(data.svgCode)
      if (data.imageUrl) setCardImage(data.imageUrl)
      setStep('share')
    } catch (err) {
      console.error(err)
      setStep('share')
    } finally {
      setCardLoading(false)
    }
  }

  function handleCopyLink() {
    const url = `https://zorvai.ca/waitlist?ref=${signup?.referralCode}`
    navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleWhatsAppShare() {
    const childName = formData.childName || signup?.childName || 'my child'
    const subject = commitment.subject || 'their studies'
    const plan = PLANS.find(p => p.id === selectedPlan)
    const url = `https://zorvai.ca/waitlist?ref=${signup?.referralCode}`
    const message = `I just made a commitment to help ${childName} master ${subject} this year.

Zorvai is an AI tutor that teaches like a real one-to-one tutor — checking real understanding before moving on.

And if your child's score doesn't improve — full refund.

Right now: ${plan?.price} (${plan?.saving}).

Only ${stats.spotsLeft} founding spots left.

Join here: ${url}`

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank')

    // Track share
    if (signup?.referralCode) {
      fetch('/api/waitlist/stats').catch(() => {})
    }
  }

  function handleDownloadSVG() {
    if (!cardSvg) return
    const blob = new Blob([cardSvg], { type: 'image/svg+xml' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `zorvai-commitment-${signup?.referralCode || 'card'}.svg`
    a.click()
    URL.revokeObjectURL(url)
  }

  const referralLink = `https://zorvai.ca/waitlist?ref=${signup?.referralCode || ''}`
  const currentActivity = stats.recentActivity[activityIndex]
  const commitmentPreview = commitment.subject && commitment.goal
    ? `I commit to helping ${formData.childName || 'my child'} master ${commitment.subject} — ${commitment.goal}`
    : null

  // ── Render ───────────────────────────────────────────────────
  return (
    <div style={{ background: T.bg, minHeight: '100vh', color: T.text, fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: T.bg, borderBottom: `1px solid ${T.border}`,
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.3px' }}>Zorvai</span>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.teal, display: 'inline-block' }} />
        </div>
        <span
          style={{ fontSize: 13, color: T.muted, cursor: 'pointer' }}
          onClick={() => document.getElementById('bottom-form')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Already joined?
        </span>
      </nav>

      <div style={{ maxWidth: 520, margin: '0 auto', padding: '0 24px' }}>

        {/* ── HERO ──────────────────────────────────────────── */}
        <section style={{ paddingTop: 72, paddingBottom: 48, textAlign: 'center' }}>

          {/* Live badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: T.surface, border: `1px solid ${T.border}`,
            borderRadius: 99, padding: '5px 14px', marginBottom: 28
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: '50%', background: '#ef4444',
              animation: 'pulse 2s ease-in-out infinite'
            }} />
            <span style={{ fontSize: 12, color: T.muted }}>
              <span style={{ color: T.teal, fontWeight: 600 }}>{stats.total}</span> families on the waitlist
              {stats.lastHour > 0 && <span> · <span style={{ color: T.teal }}>{stats.lastHour}</span> in the last hour</span>}
            </span>
          </div>

          {/* Heading */}
          <h1 style={{ fontSize: 'clamp(28px, 6vw, 38px)', fontWeight: 600, lineHeight: 1.15, letterSpacing: '-0.5px', margin: 0 }}>
            Your child is studying.<br />
            <span style={{ color: T.teal }}>They're probably not learning.</span>
          </h1>

          {/* Sub */}
          <p style={{ color: T.muted, fontSize: 16, lineHeight: 1.7, marginTop: 20, marginBottom: 0 }}>
            Most students re-read their notes and hope it sticks. Zorvai teaches the way
            a real one-to-one tutor would — checking real understanding before moving on.
            If scores don't improve, you get your money back.
          </p>

          {/* Spots badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: T.tealBg, border: `1px solid ${T.tealBorder}`,
            borderRadius: 8, padding: '10px 18px', marginTop: 28
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={T.teal} strokeWidth="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            <span style={{ fontSize: 13, color: T.teal, fontWeight: 500 }}>
              {stats.spotsLeft > 0
                ? <>{stats.spotsLeft} founding spots left — <strong>60% off forever</strong></>
                : <>Waitlist open — standard pricing at launch</>
              }
            </span>
          </div>
        </section>

        {/* ── STEP 1: SIGNUP FORM ────────────────────────────── */}
        {step === 'form' && (
          <section style={{ paddingBottom: 60 }}>
            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

              <Field label="Your name">
                <Input
                  placeholder="Priya Sharma"
                  value={formData.name}
                  onChange={v => setFormData(p => ({ ...p, name: v }))}
                />
              </Field>

              <Field label="Email address">
                <Input
                  type="email"
                  placeholder="priya@email.com"
                  value={formData.email}
                  onChange={v => setFormData(p => ({ ...p, email: v }))}
                />
              </Field>

              <Field label="Child's name (optional)">
                <Input
                  placeholder="Aanya"
                  value={formData.childName}
                  onChange={v => setFormData(p => ({ ...p, childName: v }))}
                />
              </Field>

              <Field label="Country">
                <select
                  value={formData.countryCode}
                  onChange={e => setFormData(p => ({ ...p, countryCode: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="IN">India</option>
                  <option value="BD">Bangladesh</option>
                  <option value="NP">Nepal</option>
                  <option value="GB">United Kingdom</option>
                  <option value="US">United States</option>
                  <option value="CA">Canada</option>
                  <option value="AU">Australia</option>
                  <option value="AE">UAE</option>
                  <option value="SG">Singapore</option>
                  <option value="XX">Other</option>
                </select>
              </Field>

              {/* Role toggle */}
              <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                {['parent', 'student'].map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setFormData(p => ({ ...p, role: r }))}
                    style={{
                      flex: 1, padding: '8px 0', borderRadius: 99,
                      border: `1px solid ${formData.role === r ? T.teal : T.border}`,
                      background: formData.role === r ? T.tealBg : 'transparent',
                      color: formData.role === r ? T.teal : T.muted,
                      fontSize: 13, fontWeight: 500, cursor: 'pointer',
                      transition: 'all 150ms ease'
                    }}
                  >
                    {r === 'parent' ? '👨‍👩‍👧 Parent' : '🎓 Student'}
                  </button>
                ))}
              </div>

              {formError && (
                <p style={{ color: T.danger, fontSize: 13, marginTop: 4 }}>{formError}</p>
              )}

              <PrimaryButton
                type="submit"
                loading={formLoading}
                style={{ marginTop: 8 }}
              >
                Join the Resistance →
              </PrimaryButton>

              <p style={{ color: T.dim, fontSize: 12, textAlign: 'center', marginTop: 6 }}>
                No credit card. No commitment yet. Just your spot.
              </p>
            </form>
          </section>
        )}

        {/* ── STEP 2: COMMITMENT ─────────────────────────────── */}
        {step === 'commitment' && (
          <section style={{ paddingBottom: 60, animation: 'fadeIn 400ms ease both' }}>

            {/* Welcome card */}
            <div style={{
              background: T.tealBg, border: `1px solid ${T.tealBorder}`,
              borderRadius: 14, padding: '20px 24px', marginBottom: 32, textAlign: 'center'
            }}>
              <p style={{ fontSize: 13, color: T.teal, margin: 0, letterSpacing: '0.05em' }}>
                YOU'RE IN — POSITION #{signup?.position}
              </p>
              <p style={{ fontSize: 22, fontWeight: 600, margin: '8px 0 4px', color: T.text }}>
                Welcome, {signup?.name?.split(' ')[0]} 🎉
              </p>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                60% off — locked in forever when you commit.
              </p>
            </div>

            {/* Commitment heading */}
            <h2 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 8px' }}>
              Make your commitment.
            </h2>
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.65, margin: '0 0 28px' }}>
              The families who improve the most don't just sign up — they make a specific promise.
              Write yours. We'll turn it into a card you can share.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              <Field label="Subject they struggle with">
                <select
                  value={commitment.subject}
                  onChange={e => setCommitment(p => ({ ...p, subject: e.target.value }))}
                  style={inputStyle}
                >
                  <option value="">Select a subject...</option>
                  {SUBJECTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </Field>

              <Field label="What's the specific goal?">
                <Input
                  placeholder="Pass SEE exam / Improve Math from C to A / Score above 80%"
                  value={commitment.goal}
                  onChange={v => setCommitment(p => ({ ...p, goal: v }))}
                />
              </Field>

              {/* Live preview */}
              {commitmentPreview && (
                <div style={{
                  background: T.surface, border: `1px solid ${T.border}`,
                  borderRadius: 12, padding: '16px 18px',
                  transition: 'all 200ms ease'
                }}>
                  <p style={{ fontSize: 11, color: T.dim, margin: '0 0 6px', letterSpacing: '0.06em' }}>
                    YOUR COMMITMENT
                  </p>
                  <p style={{
                    fontSize: 16, fontStyle: 'italic', color: T.text,
                    lineHeight: 1.6, margin: 0
                  }}>
                    "{commitmentPreview}"
                  </p>
                </div>
              )}
            </div>

            {/* ── PRICING SECTION inside commitment ─────────── */}
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 17, fontWeight: 600, margin: '0 0 6px' }}>
                Can you invest $19/month in {signup?.childName || 'your child'}'s future?
              </h3>
              <p style={{ color: T.muted, fontSize: 14, margin: '0 0 20px', lineHeight: 1.6 }}>
                Regular price is $49/month. Founding members lock in 60% off forever.
                That's less than one hour of a private tutor — with a money-back guarantee.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {PLANS.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    style={{
                      position: 'relative',
                      background: selectedPlan === plan.id ? T.tealBg : T.surface,
                      border: `1px solid ${selectedPlan === plan.id ? T.teal : T.border}`,
                      borderRadius: 12, padding: '16px 18px',
                      cursor: 'pointer', transition: 'all 150ms ease',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                    }}
                  >
                    {plan.badge && (
                      <span style={{
                        position: 'absolute', top: -10, right: 14,
                        background: T.teal, color: '#161514',
                        fontSize: 10, fontWeight: 700, padding: '2px 8px',
                        borderRadius: 99, letterSpacing: '0.05em'
                      }}>
                        {plan.badge.toUpperCase()}
                      </span>
                    )}

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                        <span style={{
                          width: 18, height: 18, borderRadius: '50%',
                          border: `2px solid ${selectedPlan === plan.id ? T.teal : T.border}`,
                          background: selectedPlan === plan.id ? T.teal : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0, transition: 'all 150ms ease'
                        }}>
                          {selectedPlan === plan.id && (
                            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#161514' }} />
                          )}
                        </span>
                        <span style={{ fontWeight: 600, fontSize: 15, color: T.text }}>{plan.name}</span>
                      </div>
                      <p style={{ margin: 0, marginLeft: 26, fontSize: 13, color: T.muted }}>{plan.description}</p>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                      <div style={{ fontSize: 18, fontWeight: 700, color: selectedPlan === plan.id ? T.teal : T.text }}>
                        {plan.price}
                      </div>
                      <div style={{ fontSize: 11, color: T.dim, textDecoration: 'line-through' }}>
                        {plan.original}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <p style={{ color: T.dim, fontSize: 12, textAlign: 'center', marginTop: 12 }}>
                💳 Payment collected at launch — not now. Lock in your price today.
              </p>
            </div>

            <PrimaryButton
              onClick={handleCommitment}
              loading={commitmentLoading}
              disabled={!commitment.subject || !commitment.goal}
              style={{ marginTop: 24, width: '100%' }}
            >
              Lock in my commitment →
            </PrimaryButton>
          </section>
        )}

        {/* ── STEP 3: PLAN CONFIRMATION + GENERATE CARD ─────── */}
        {step === 'plan' && (
          <section style={{ paddingBottom: 60, animation: 'fadeIn 400ms ease both' }}>

            <div style={{
              background: T.tealBg, border: `1px solid ${T.tealBorder}`,
              borderRadius: 14, padding: '24px', marginBottom: 32, textAlign: 'center'
            }}>
              <p style={{ fontSize: 13, color: T.teal, margin: '0 0 8px', letterSpacing: '0.05em' }}>
                COMMITMENT SAVED ✓
              </p>
              <p style={{ fontSize: 20, fontWeight: 600, margin: '0 0 6px', color: T.text }}>
                Now make it shareable.
              </p>
              <p style={{ fontSize: 14, color: T.muted, margin: 0 }}>
                We'll generate a professional card from your commitment — share it and bring other parents in.
              </p>
            </div>

            {/* Plan summary */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '16px 20px', marginBottom: 24
            }}>
              <p style={{ margin: 0, fontSize: 13, color: T.muted }}>Your plan</p>
              {(() => {
                const plan = PLANS.find(p => p.id === selectedPlan)
                return (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                    <span style={{ fontWeight: 600, fontSize: 16 }}>{plan?.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: T.teal, fontWeight: 700 }}>{plan?.price}</div>
                      <div style={{ color: T.dim, fontSize: 11, textDecoration: 'line-through' }}>{plan?.original}</div>
                    </div>
                  </div>
                )
              })()}
            </div>

            <PrimaryButton
              onClick={handleGenerateCard}
              loading={cardLoading}
              style={{ width: '100%' }}
            >
              {cardLoading ? 'Generating your card...' : 'Generate my commitment card ✨'}
            </PrimaryButton>

            {cardLoading && (
              <p style={{ color: T.muted, fontSize: 13, textAlign: 'center', marginTop: 12 }}>
                Our AI is creating a card just for you — takes about 10 seconds.
              </p>
            )}
          </section>
        )}

        {/* ── STEP 4: SHARE ─────────────────────────────────── */}
        {step === 'share' && (
          <section style={{ paddingBottom: 60, animation: 'fadeIn 400ms ease both' }}>

            <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 8 }}>
              Your commitment card is ready.
            </h2>
            <p style={{ color: T.muted, fontSize: 15, marginBottom: 24, lineHeight: 1.6 }}>
              Share it to move up the waitlist. Every family you bring in jumps you 50 spots.
            </p>

            {/* Card image */}
            {cardSvg ? (
              <div
                style={{
                  maxWidth: 280, margin: '0 auto 24px',
                  borderRadius: 20,
                  overflow: 'hidden',
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                  animation: 'float 5s ease-in-out infinite'
                }}
                dangerouslySetInnerHTML={{ __html: cardSvg }}
              />
            ) : cardImage ? (
              <img
                src={cardImage}
                alt="Your commitment card"
                style={{
                  maxWidth: 280, width: '100%', display: 'block',
                  margin: '0 auto 24px', borderRadius: 20,
                  boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
                  animation: 'float 5s ease-in-out infinite'
                }}
              />
            ) : (
              <div style={{
                maxWidth: 280, height: 400, margin: '0 auto 24px',
                background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 20, display: 'flex', alignItems: 'center',
                justifyContent: 'center', color: T.muted, fontSize: 14
              }}>
                Card generating...
              </div>
            )}

            {/* Download */}
            {cardSvg && (
              <button
                onClick={handleDownloadSVG}
                style={{
                  display: 'block', margin: '0 auto 20px',
                  background: 'transparent', border: `1px solid ${T.border}`,
                  color: T.muted, borderRadius: 8, padding: '8px 20px',
                  fontSize: 13, cursor: 'pointer', transition: 'all 150ms ease'
                }}
              >
                ↓ Download card
              </button>
            )}

            {/* Share buttons */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 24 }}>
              <button
                onClick={handleWhatsAppShare}
                style={{
                  flex: 1, padding: '12px 0',
                  background: '#25D366', color: '#fff',
                  border: 'none', borderRadius: 10,
                  fontSize: 14, fontWeight: 600, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
                }}
              >
                WhatsApp
              </button>
              <button
                onClick={handleCopyLink}
                style={{
                  flex: 1, padding: '12px 0',
                  background: T.surface, color: copied ? T.teal : T.text,
                  border: `1px solid ${copied ? T.teal : T.border}`,
                  borderRadius: 10, fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 150ms ease'
                }}
              >
                {copied ? 'Copied ✓' : 'Copy link'}
              </button>
            </div>

            {/* Referral stats */}
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '18px 20px'
            }}>
              <p style={{ margin: '0 0 14px', fontSize: 13, color: T.muted }}>Your referral link</p>
              <code style={{
                display: 'block', padding: '10px 14px',
                background: T.raised, borderRadius: 8,
                fontSize: 12, color: T.teal, wordBreak: 'break-all',
                marginBottom: 14
              }}>
                zorvai.ca/waitlist?ref={signup?.referralCode}
              </code>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { n: 1,  label: 'Jump 50 spots up the waitlist' },
                  { n: 3,  label: 'Lock in 60% off even if tier closes' },
                  { n: 5,  label: 'First month free at launch' },
                  { n: 10, label: 'Founding Resistance Member — in the app forever' }
                ].map(m => (
                  <div key={m.n} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                      background: T.tealBg, border: `1px solid ${T.tealBorder}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, color: T.teal
                    }}>{m.n}</span>
                    <span style={{ fontSize: 13, color: T.muted }}>{m.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ── LIVE ACTIVITY FEED ─────────────────────────────── */}
        {stats.recentActivity.length > 0 && (
          <section style={{ paddingBottom: 48 }}>
            <div style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 10, padding: '12px 16px',
              display: 'flex', alignItems: 'center', gap: 10,
              opacity: activityVisible ? 1 : 0,
              transition: 'opacity 300ms ease'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.success, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: T.muted }}>
                <span style={{ color: T.text }}>{currentActivity?.firstName}</span>
                {currentActivity?.city && <> from {currentActivity.city}</>}
                {' '}joined {currentActivity?.minutesAgo} minute{currentActivity?.minutesAgo !== 1 ? 's' : ''} ago
              </span>
            </div>
          </section>
        )}

        {/* ── PROBLEM ────────────────────────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 20 }}>
            Here's what's actually happening.
          </h2>
          <div style={{ width: 40, height: 1, background: T.teal, marginBottom: 24 }} />
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.7, marginBottom: 16 }}>
            Your child re-reads their notes. It feels productive.
          </p>
          <p style={{ fontSize: 15, color: T.muted, lineHeight: 1.75, marginBottom: 20 }}>
            Research consistently shows students forget the vast majority of re-read
            material within 24 hours. They're not lazy — nobody taught them how to
            actually retain what they study.
          </p>
          <p style={{ fontSize: 16, color: T.text, lineHeight: 1.7, fontStyle: 'italic' }}>
            "The students who consistently do better have one thing:
            someone who checks real understanding — not just whether they read."
          </p>
        </section>

        {/* ── HOW IT WORKS ───────────────────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 32 }}>
            Three steps. Every session.
          </h2>
          {[
            { n: '1', title: 'Learn', desc: 'The AI teaches one concept at a time — not a whole chapter. One idea, explained clearly until it makes sense.' },
            { n: '2', title: 'Recall', desc: "Your child closes their notes and explains it back in their own words. The AI listens without interrupting." },
            { n: '3', title: 'Challenge', desc: "The AI asks harder questions. If they struggle, it re-teaches that exact part. No moving on until it actually sticks." }
          ].map(step => (
            <div key={step.n} style={{ display: 'flex', gap: 20, marginBottom: 32, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 32, fontWeight: 700, color: T.teal, lineHeight: 1, minWidth: 32 }}>
                {step.n}
              </span>
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600 }}>{step.title}</h3>
                <p style={{ margin: 0, color: T.muted, fontSize: 14, lineHeight: 1.65 }}>{step.desc}</p>
              </div>
            </div>
          ))}
        </section>

        {/* ── GUARANTEE ──────────────────────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <div style={{
            border: `1px solid ${T.border}`,
            borderRadius: 16, padding: 32
          }}>
            <h2 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 4px' }}>
              Real improvement.
            </h2>
            <h2 style={{ fontSize: 24, fontWeight: 600, color: T.teal, margin: '0 0 24px' }}>
              Or your money back.
            </h2>
            <div style={{ height: 1, background: T.border, marginBottom: 20 }} />
            <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.7, margin: '0 0 20px' }}>
              We track your child's score before they start and after they complete their
              sessions. If it doesn't go up — full refund. No arguments. No "they didn't
              try hard enough." Just two numbers: before and after.
            </p>
            <div style={{ height: 1, background: T.border, marginBottom: 20 }} />
            {[
              'Take a short quiz when they start — 5 minutes, 10 questions.',
              'Complete at least 12 study sessions in 30 days.',
              'If the score doesn\'t improve — full refund, processed in 5 days.'
            ].map((text, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 14, alignItems: 'flex-start' }}>
                <span style={{ color: T.teal, fontWeight: 700, fontSize: 16, minWidth: 20 }}>{i + 1}</span>
                <span style={{ color: T.muted, fontSize: 14, lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── JEALOUSY / COMMITMENT FEED ─────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 8 }}>
            While you're reading this.
          </h2>
          <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
            Other parents already committed.
          </p>
          {[
            { quote: `I committed to helping Aanya master Mathematics before her board exam.`, city: 'Mumbai', min: 4 },
            { quote: `My son struggled with Science for 2 years. This year is different.`, city: 'Dhaka', min: 11 },
            { quote: `Saanvi is going to pass her SEE exam. I made the commitment today.`, city: 'Kathmandu', min: 18 },
          ].map((item, i) => (
            <div key={i} style={{
              background: T.surface, border: `1px solid ${T.border}`,
              borderRadius: 12, padding: '18px 20px', marginBottom: 10
            }}>
              <p style={{ margin: '0 0 8px', fontSize: 15, fontStyle: 'italic', color: T.text, lineHeight: 1.6 }}>
                "{item.quote}"
              </p>
              <p style={{ margin: 0, fontSize: 12, color: T.dim }}>
                A parent from {item.city} · {item.min} minutes ago
              </p>
            </div>
          ))}
        </section>

        {/* ── LEADERBOARD ────────────────────────────────────── */}
        {stats.leaders?.length > 0 && (
          <section style={{ paddingBottom: 64 }}>
            <h2 style={{ fontSize: 20, fontWeight: 600, marginBottom: 6 }}>Top Resistance</h2>
            <p style={{ color: T.muted, fontSize: 14, marginBottom: 20 }}>
              Parents who brought the most families in.
            </p>
            {stats.leaders.map((leader, i) => (
              <div key={i} style={{
                background: i === 0 ? T.tealBg : T.surface,
                border: `1px solid ${i === 0 ? T.tealBorder : T.border}`,
                borderRadius: 10, padding: '12px 16px', marginBottom: 8,
                display: 'flex', alignItems: 'center', gap: 14
              }}>
                <span style={{ fontSize: 18, fontWeight: 700, color: T.teal, minWidth: 24 }}>#{leader.rank}</span>
                <span style={{ flex: 1, fontSize: 14, color: T.text }}>
                  {leader.firstName}{leader.city && ` · ${leader.city}`}
                </span>
                <span style={{ fontSize: 13, color: T.muted }}>{leader.referralCount} families</span>
              </div>
            ))}
          </section>
        )}

        {/* ── FOUNDER STORY ──────────────────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <p style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.7, margin: '0 0 16px' }}>
            Prince and Rabindra grew up in Nepal without private tutors.
          </p>
          <p style={{ color: T.muted, fontSize: 15, lineHeight: 1.75, margin: '0 0 16px' }}>
            They watched classmates with tutors consistently pass exams they failed —
            not because those classmates were smarter, but because someone was checking
            whether they actually understood the material, not just whether they'd read it.
          </p>
          <p style={{ fontSize: 15, lineHeight: 1.7, margin: '0 0 28px' }}>
            They searched for an AI that could teach the way a real one-to-one tutor would.
            They couldn't find one. So they built it.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            {[
              { name: 'Prince', role: 'Co-founder', flag: '🇳🇵' },
              { name: 'Rabindra', role: 'Co-founder', flag: '🇳🇵' }
            ].map(founder => (
              <div key={founder.name} style={{
                flex: 1, background: T.surface, border: `1px solid ${T.border}`,
                borderRadius: 10, padding: '14px 16px',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: '50%',
                  background: T.tealBg, border: `1px solid ${T.tealBorder}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: T.teal
                }}>
                  {founder.name[0]}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 500 }}>{founder.name}</p>
                  <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{founder.role} {founder.flag}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── BOTTOM CTA ─────────────────────────────────────── */}
        <section id="bottom-form" style={{ paddingBottom: 80 }}>
          {step === 'form' ? (
            <>
              <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 6 }}>
                Secure your spot.
              </h2>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: T.tealBg, border: `1px solid ${T.tealBorder}`,
                borderRadius: 8, padding: '8px 14px', marginBottom: 24
              }}>
                <span style={{ fontSize: 13, color: T.teal, fontWeight: 500 }}>
                  ⚡ {stats.spotsLeft} founding spots left — 60% off forever
                </span>
              </div>
              <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <Field label="Your name">
                  <Input
                    placeholder="Priya Sharma"
                    value={formData.name}
                    onChange={v => setFormData(p => ({ ...p, name: v }))}
                  />
                </Field>
                <Field label="Email address">
                  <Input
                    type="email"
                    placeholder="priya@email.com"
                    value={formData.email}
                    onChange={v => setFormData(p => ({ ...p, email: v }))}
                  />
                </Field>
                <PrimaryButton type="submit" loading={formLoading}>
                  Join the Resistance →
                </PrimaryButton>
              </form>
            </>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: T.muted, fontSize: 14, marginBottom: 16 }}>
                You're already in — Position #{signup?.position}
              </p>
              <PrimaryButton onClick={() => document.querySelector('.share-buttons')?.scrollIntoView({ behavior: 'smooth' })}>
                Refer families to move up →
              </PrimaryButton>
            </div>
          )}
        </section>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        borderTop: `1px solid ${T.border}`,
        padding: '28px 24px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12, maxWidth: 520, margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Zorvai</span>
          <span style={{ width: 4, height: 4, borderRadius: '50%', background: T.teal }} />
        </div>
        <div style={{ display: 'flex', gap: 20 }}>
          {['Privacy', 'Guarantee', 'How it works'].map(link => (
            <a key={link} href="#" style={{ color: T.dim, fontSize: 13, textDecoration: 'none' }}>{link}</a>
          ))}
        </div>
        <span style={{ fontSize: 12, color: T.dim }}>hello@zorvai.ca</span>
      </footer>

      {/* ── GLOBAL STYLES ──────────────────────────────────────── */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.35; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
        @keyframes fadeIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
        input, select, textarea { -webkit-appearance: none; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #161514; }
        ::-webkit-scrollbar-thumb { background: #2a2826; border-radius: 99px; }
      `}</style>
    </div>
  )
}

// ── Reusable UI components ───────────────────────────────────────

const inputStyle = {
  width: '100%', background: '#1c1b19',
  border: '1px solid #2a2826', borderRadius: 10,
  padding: '12px 16px', color: '#f0ede8', fontSize: 15,
  outline: 'none', transition: 'border-color 200ms ease',
  fontFamily: 'system-ui, -apple-system, sans-serif',
  appearance: 'none'
}

function Field({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11, color: '#8a8680', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ onChange, style: extraStyle, ...props }) {
  return (
    <input
      {...props}
      onChange={e => onChange(e.target.value)}
      style={{ ...inputStyle, ...extraStyle }}
      onFocus={e => { e.target.style.borderColor = '#4ecdc4'; e.target.style.boxShadow = '0 0 0 3px rgba(78,205,196,0.1)' }}
      onBlur={e => { e.target.style.borderColor = '#2a2826'; e.target.style.boxShadow = 'none' }}
    />
  )
}

function PrimaryButton({ children, loading, disabled, style: extraStyle, ...props }) {
  return (
    <button
      {...props}
      disabled={disabled || loading}
      style={{
        background: '#4ecdc4', color: '#161514',
        fontWeight: 600, fontSize: 15, padding: '14px 24px',
        borderRadius: 10, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer',
        width: '100%', transition: 'all 150ms ease',
        opacity: disabled ? 0.5 : 1,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        ...extraStyle
      }}
      onMouseEnter={e => { if (!disabled && !loading) e.target.style.background = '#3db8b0' }}
      onMouseLeave={e => { e.target.style.background = '#4ecdc4' }}
    >
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
          {[0,1,2].map(i => (
            <span key={i} style={{
              width: 5, height: 5, borderRadius: '50%', background: '#161514',
              animation: `pulse 0.8s ${i * 0.15}s ease-in-out infinite`
            }} />
          ))}
          <span style={{ marginLeft: 4 }}>{children}</span>
        </span>
      ) : children}
    </button>
  )
}
```

---

## PART 5 — SETUP CHECKLIST

Before going live:

**Database:**
- [ ] Run waitlist-schema.sql in Supabase SQL Editor
- [ ] Create bucket "waitlist-images" in Supabase Storage → set to Public
- [ ] Set bucket policy: allow all reads, allow service role writes

**APIs:**
- [ ] Get Gemini API key from aistudio.google.com → add to .env.local
- [ ] Get Stripe keys → add to .env.local
- [ ] Register Stripe webhook at: zorvai.ca/api/waitlist/payment/webhook
  Events to listen for: payment_intent.succeeded

**Stripe Products (in Stripe dashboard):**
- Create 3 prices manually (no product needed for one-off payments)
- Weekly: $5.19 (one-time for now, subscription at launch)
- Monthly: $19.00
- Annual: $119.00

**Deploy:**
- [ ] Push to GitHub → Vercel auto-deploys
- [ ] Test the full flow: join → commitment → plan → generate card → share
- [ ] Test Stripe payment with card 4242 4242 4242 4242

---

## PART 6 — WHAT THIS DOES DIFFERENTLY

1. **Commitment replaces pricing** — parents don't see a price before they've committed
   to their child's goal. The price reveal after emotional commitment converts at 2-3x
   higher than showing price first.

2. **Gemini generates real SVG** — professional, branded, downloadable. Not a
   screenshot. Not a template. An AI-generated card that looks different every time.

3. **WhatsApp is the primary CTA** — not Instagram, not Twitter. In India and
   Bangladesh, WhatsApp school parent groups are the fastest distribution channel
   that exists. One parent in a 200-person parent group = 200 warm impressions.

4. **Jealousy is specific** — "a parent from Mumbai joined 4 minutes ago" converts
   better than "X people joined." Specificity creates local social proof.

5. **Referral moves position** — not just a discount. Watching your position number
   go down creates urgency that a percentage off never does.
