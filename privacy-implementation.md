# ZORVAI — Complete Privacy Implementation
# Backend to Frontend — Full Technical Specification

---

## 1. WHAT DATA WE COLLECT AND WHY

| Data | Source | Why collected | Who can see it |
|---|---|---|---|
| Name, email, phone | Signup form | Account identification | User only + admin |
| Country, language | Onboarding | Personalize AI teaching | User only |
| Field, grade, subject | Onboarding | Build study plan | User + linked parent |
| Study hours, days | Onboarding | Plan scheduling | User + linked parent |
| Monthly goal | Onboarding | Commitment tracking | User + linked parent |
| Baseline quiz score | First session | Guarantee measurement | User + linked parent |
| Session history | Every session | Progress tracking + personalization | User + linked parent |
| Recall transcripts | Recall phase | Challenge generation only | User only — deleted after Challenge |
| Check-in mood | Session start | Session adjustment | User only |
| Escalation flag | Checkin route | Parent notification | User + linked parent (flag only, not content) |
| Question history | Chatbot | AI personalization | User only |
| Payment info | Stripe/Razorpay | Billing | Never stored by Zorvai |
| IP address | Every request | Security/fraud detection | Admin only |
| Browser/device | Every request | Bug tracking | Admin only |

---

## 2. WHAT WE EXPLICITLY DO NOT COLLECT

- Card numbers, CVV, bank details (all handled by Stripe/Razorpay, never touch our servers)
- Recall transcript content after the Challenge is generated (deleted immediately)
- Check-in content shared with parents (only the escalation flag is shared, never the words)
- Any biometric data
- Location beyond country level
- Browser history outside Zorvai

---

## 3. BACKEND PRIVACY IMPLEMENTATION

### 3.1 Row Level Security (Supabase RLS)

Every table has RLS enabled. No exceptions.

```sql
-- Users can only read their own row
create policy "users_own_data" on users
  for all using (auth.uid() = id);

-- Students can only read their own profile
create policy "student_own_profile" on student_profiles
  for all using (auth.uid() = id);

-- Parents can only read their linked child's profile
create policy "parent_linked_child" on student_profiles
  for select using (
    auth.uid() in (
      select parent_id from student_profiles where id = student_profiles.id
    )
  );

-- Parents can NEVER read check-in content
create policy "checkins_student_only" on checkins
  for select using (auth.uid() = student_id);
-- No parent policy exists for checkins — they literally cannot query this table

-- Parents can only read escalation flag from checkins, not content
-- This is handled via a dedicated view, not direct table access:
create view parent_escalation_view as
  select student_id, escalated, checked_at
  from checkins
  where escalated = true;
-- Parents query this view, never the checkins table directly

-- Session recall transcripts: auto-deleted after challenge is generated
create policy "recall_transcripts_student_only" on sessions
  for select using (
    auth.uid() = student_id
    and phase != 'recall' -- recall transcripts not exposed even to student after challenge phase
  );

-- Question history: student only
create policy "question_history_student_only" on question_history
  for all using (auth.uid() = student_id);

-- Subscriptions: user who owns it only
create policy "subscriptions_owner_only" on subscriptions
  for all using (auth.uid() = user_id);

-- Guarantee claims: user who made the claim only
create policy "guarantee_claims_owner_only" on guarantee_claims
  for all using (auth.uid() = student_id);
```

### 3.2 Recall Transcript Deletion

Recall transcripts are sensitive — they contain the student speaking freely,
potentially including things beyond the study content. They exist only to
generate Challenge questions. Delete them immediately after.

```javascript
// In /api/session/challenge/route.js
export async function POST(request) {
  const { sessionId, recallTranscript } = await request.json()

  // 1. Generate challenge questions using the transcript
  const questions = await generateChallengeQuestions(user, session, recallTranscript)

  // 2. Immediately delete the transcript from the session record
  await supabase
    .from('sessions')
    .update({ recall_transcript: null }) // null, not empty string
    .eq('id', sessionId)

  // 3. Return the questions — transcript is gone from the database
  return NextResponse.json({ ok: true, questions })
}
```

### 3.3 Check-in Escalation — Exactly What Gets Shared

The escalation system sends a flag to the parent. Never the content.

```javascript
// In /api/session/checkin/route.js
export async function POST(request) {
  const { studentId, mood, freeText } = await request.json()

  const escalate = shouldEscalate(mood, freeText)

  // Store the checkin — student_id, mood, escalated flag
  // freeText (what the student actually said) is NOT stored in the database
  // It is used only in memory to determine escalation, then discarded
  await supabase.from('checkins').insert({
    student_id: studentId,
    mood: mood,
    escalated: escalate,
    // freeText deliberately NOT stored
  })

  if (escalate) {
    // Get parent email for this student
    const parent = await getLinkedParent(studentId)
    const student = await getStudentName(studentId)

    // Send notification — no content of what student said, just the flag
    await sendEscalationEmail({
      to: parent.email,
      studentName: student.name,
      // Message is generic — no specifics about what the student said
      message: `${student.name} shared something with Zorvai today that
                we think you should know about. Please check in with them.`
    })
  }

  return NextResponse.json({ ok: true, escalated: escalate })
}

function shouldEscalate(mood, freeText) {
  // Only escalate on 'not_okay' mood combined with high-risk keywords
  // 'stressed' and 'tired' do NOT escalate — these are normal student states
  if (mood !== 'not_okay') return false

  // Check freeText for specific high-risk language patterns
  // This list should be reviewed by a mental health professional before launch
  const highRiskPhrases = [
    'hurt myself', 'end it', "can't go on", 'want to die',
    'nobody cares', 'disappear', 'give up on everything'
  ]
  const lowerText = (freeText || '').toLowerCase()
  return highRiskPhrases.some(phrase => lowerText.includes(phrase))
}
```

### 3.4 API Route Authentication

Every API route must verify the JWT before doing anything else.

```javascript
// lib/auth.js — reused in every API route
import { createClient } from '@supabase/supabase-js'

export async function getAuthenticatedUser(request) {
  const token = request.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null

  return user
}

// Usage in every route:
export async function POST(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // ... rest of the route
}
```

### 3.5 Role Enforcement

```javascript
// lib/roles.js
export async function requireRole(user, requiredRole, supabase) {
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || data.role !== requiredRole) {
    return false
  }
  return true
}

// Usage — parent routes reject student tokens:
export async function GET(request) {
  const user = await getAuthenticatedUser(request)
  const isParent = await requireRole(user, 'parent', supabase)
  if (!isParent) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  // ...
}
```

### 3.6 Parent-Student Link Verification

Before a parent can access any student data, verify they are actually
linked to that student. Never trust the student ID from the request alone.

```javascript
// lib/parentAccess.js
export async function verifyParentChildLink(parentId, studentId, supabase) {
  const { data, error } = await supabase
    .from('student_profiles')
    .select('id')
    .eq('id', studentId)
    .eq('parent_id', parentId)
    .single()

  return !error && !!data
}

// Usage in every parent-facing route:
const canAccess = await verifyParentChildLink(
  user.id,
  requestedStudentId,
  supabase
)
if (!canAccess) {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}
```

### 3.7 Payment Data — Never Touch It

```javascript
// CORRECT — let Stripe handle everything
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  line_items: [{ price: priceId, quantity: 1 }],
  mode: 'subscription',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?subscribed=true`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  metadata: { userId: user.id, plan: planName }
})

// We store ONLY the subscription ID and status — never card details
// Payment details live entirely in Stripe's systems, not ours
await supabase.from('subscriptions').upsert({
  user_id: user.id,
  stripe_subscription_id: subscription.id,
  plan: planName,
  active: true
})
```

### 3.8 Data Minimization in AI Calls

When calling Claude, send only what's needed for that specific call.
Never send the full user record.

```javascript
// WRONG — sending everything
const response = await callClaude({ user: fullUserRecord })

// CORRECT — send only what this specific call needs
const response = await callClaude({
  name: user.name,
  language: user.language,
  field: user.field,
  topic: session.topic,
  recentTopics: recentHistory.map(h => h.topic) // topic names only, not full records
})

// Recall transcripts: never logged, never stored after challenge generation
// They exist only in memory during the API request lifecycle
```

### 3.9 Rate Limiting

Prevent abuse and protect against API cost attacks.

```javascript
// middleware.js (Next.js middleware, runs before every API route)
import { NextResponse } from 'next/server'

const rateLimits = new Map()

export function middleware(request) {
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const ip = request.headers.get('x-forwarded-for') || 'unknown'
  const key = `${ip}:${request.nextUrl.pathname}`
  const now = Date.now()
  const windowMs = 60 * 1000 // 1 minute
  const maxRequests = 30 // 30 requests per minute per IP per route

  const record = rateLimits.get(key) || { count: 0, resetAt: now + windowMs }

  if (now > record.resetAt) {
    record.count = 0
    record.resetAt = now + windowMs
  }

  record.count++
  rateLimits.set(key, record)

  if (record.count > maxRequests) {
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429 }
    )
  }

  return NextResponse.next()
}
```

### 3.10 HTTPS and Security Headers

```javascript
// next.config.js
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(self)' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://js.stripe.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://api.anthropic.com https://api.stripe.com https://*.supabase.co",
              "frame-src https://js.stripe.com",
              "media-src 'self' blob:", // needed for voice recording
            ].join('; ')
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains'
          }
        ]
      }
    ]
  }
}
```

### 3.11 Account Deletion (GDPR/Right to be Forgotten)

```javascript
// /api/auth/delete-account/route.js
export async function DELETE(request) {
  const user = await getAuthenticatedUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // 1. Cancel active subscription in Stripe
  const subscription = await getActiveSubscription(user.id)
  if (subscription?.stripe_subscription_id) {
    await stripe.subscriptions.cancel(subscription.stripe_subscription_id)
  }

  // 2. Delete all user data from Supabase
  // Cascade deletes handle child tables automatically
  // (student_profiles, sessions, question_history, etc. all
  //  have ON DELETE CASCADE referencing users.id)
  await supabase.from('users').delete().eq('id', user.id)

  // 3. Delete the auth account
  await supabase.auth.admin.deleteUser(user.id)

  // 4. Log the deletion (keep the log for legal compliance,
  //    but the log contains only the user ID and timestamp — no PII)
  await logDeletion(user.id)

  return NextResponse.json({ ok: true })
}
```

---

## 4. FRONTEND PRIVACY IMPLEMENTATION

### 4.1 Never Store Sensitive Data in localStorage or sessionStorage

```javascript
// WRONG
localStorage.setItem('user', JSON.stringify(fullUserObject))
localStorage.setItem('authToken', token)

// CORRECT
// Supabase handles session storage internally using httpOnly cookies
// Access user data through supabase.auth.getUser() not from localStorage
// Never manually store tokens anywhere in the browser
```

### 4.2 Microphone Permission Handling

The voice session requires microphone access. Handle it transparently.

```javascript
// components/student/SessionPlayer.jsx
async function requestMicrophonePermission() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    // Show clear permission granted state
    setMicPermission('granted')

    // Stop the stream immediately — we only needed to check permission
    // The actual speech recognition uses Web Speech API, not MediaStream
    stream.getTracks().forEach(track => track.stop())

  } catch (error) {
    if (error.name === 'NotAllowedError') {
      setMicPermission('denied')
      // Show clear message: "Microphone access is needed for voice sessions.
      // You can still use the text chatbot without microphone access."
    }
  }
}

// Show the user exactly when the mic is active
// Green mic icon = listening | Grey = not listening
// Never silently listen when the student isn't in a Recall or Challenge phase
```

### 4.3 Photo Upload Privacy

```javascript
// components/student/Chatbot.jsx
async function handlePhotoUpload(file) {
  // 1. Convert to base64 in the browser — don't upload to storage
  //    Photos go directly to Claude via the API route
  //    They are NOT stored in Supabase Storage
  const base64 = await fileToBase64(file)

  // 2. Send to API route which calls Claude, then discards the image
  const response = await fetch('/api/chat', {
    method: 'POST',
    body: JSON.stringify({ imageBase64: base64, mimeType: file.type })
  })

  // The photo never persists anywhere — it's processed and discarded
}
```

### 4.4 Parent Dashboard — What's Hidden

```javascript
// components/parent/ProgressView.jsx

// SHOW to parents:
// - Session dates, topics, duration, pass/fail
// - Subject progress bars
// - Weak topics and mastered topics lists
// - Guarantee progress
// - Streak calendar

// NEVER show to parents:
// - Check-in mood data
// - Recall transcripts (deleted at server level anyway)
// - Chatbot conversation history
// - Any free-text the student typed or said outside sessions

// Implementation: the /api/progress/student/:id route for parent role
// returns a filtered object with these fields explicitly excluded
const PARENT_VISIBLE_FIELDS = [
  'sessions.subject',
  'sessions.topic',
  'sessions.actual_duration_minutes',
  'sessions.passed',
  'sessions.completed_at',
  'sessions.understood',
  'sessions.missed',
  // NOT included: recall_transcript, challenge_answers
]
```

### 4.5 Consent Collection at Signup

```javascript
// app/(auth)/signup/student/page.js

// Before completing signup, student must actively check:
// □ I agree to the Terms of Service
// □ I agree to the Privacy Policy
// □ I understand that if a parent account is linked, they can see
//   my session progress but NOT my check-in responses

// For students under 13:
// The form must require a parent email before proceeding
// Parent receives an email to confirm and create their linked account
// Student account is not activated until parent confirms

// Store consent with timestamp
await supabase.from('consent_records').insert({
  user_id: user.id,
  terms_accepted_at: new Date().toISOString(),
  privacy_accepted_at: new Date().toISOString(),
  parent_visibility_acknowledged: true,
  ip_address: userIp, // stored for legal compliance only
})
```

### 4.6 Session Timeout

```javascript
// lib/sessionTimeout.js
// Automatically log out inactive users after 30 minutes
// Protects students using shared devices (school computers, family tablets)

const TIMEOUT_MS = 30 * 60 * 1000 // 30 minutes

let timeoutId

export function resetSessionTimeout() {
  clearTimeout(timeoutId)
  timeoutId = setTimeout(async () => {
    await supabase.auth.signOut()
    window.location.href = '/login?reason=timeout'
  }, TIMEOUT_MS)
}

// Reset on any user interaction
document.addEventListener('click', resetSessionTimeout)
document.addEventListener('keypress', resetSessionTimeout)
document.addEventListener('touchstart', resetSessionTimeout)
```

### 4.7 Privacy Settings Page (Student)

```javascript
// app/(student)/settings/page.js

// What the student can control:
// □ Allow linked parent to see my session history (default: ON)
//   (Turning this off breaks the Family Plan guarantee — shown as a warning)
// □ Receive study reminder notifications
// □ Allow Zorvai to use my session data to improve the AI (anonymized)
// □ Download my data (triggers data export)
// □ Delete my account (permanent, requires password confirmation)

// What the student CANNOT turn off:
// - Escalation notifications to linked parent
//   (This is disclosed at signup and is non-negotiable for safety reasons)
//   Shown as: "For your safety, we notify your linked parent if a check-in
//   raises a serious concern. This cannot be turned off."
```

---

## 5. DATA RETENTION POLICY

| Data type | Retention period | Why |
|---|---|---|
| Active user data | While account active | Needed to provide the service |
| Session history | 2 years after last session | Progress tracking, guarantee disputes |
| Recall transcripts | Deleted immediately after Challenge generation | Not needed after use |
| Check-in raw content | Never stored | Only the flag is stored |
| Payment records | 7 years | Legal/tax requirement |
| Deletion request logs | 5 years | Legal compliance |
| IP address logs | 90 days | Security/fraud detection |
| Consent records | 7 years | Legal compliance |

---

## 6. THIRD-PARTY DATA SHARING

| Third party | What we share | Why | Their privacy policy |
|---|---|---|---|
| Anthropic (Claude) | Study questions, topic content, session context | AI tutoring responses | anthropic.com/privacy |
| Stripe | Email, subscription plan | Payment processing | stripe.com/privacy |
| Razorpay | Email, subscription plan | Payment processing (India) | razorpay.com/privacy |
| Resend | Email address, email content | Sending notifications | resend.com/privacy |
| Vercel | Request logs, IP addresses | Hosting | vercel.com/legal/privacy |
| Supabase | All database data | Storage | supabase.com/privacy |

We do NOT share data with:
- Advertisers
- Data brokers
- Analytics platforms (no Google Analytics, no Meta Pixel)
- Any other third party not listed above

---

## 7. COPPA COMPLIANCE (USA — Under 13)

```javascript
// Age verification at signup
if (age < 13 && country === 'US') {
  // 1. Do not create the student account yet
  // 2. Collect parent email
  // 3. Send verifiable parental consent email to parent
  // 4. Parent must click a verification link AND create their account
  // 5. Only after parent verification: activate student account
  // 6. Student account is permanently linked — parent cannot be removed
  //    from an under-13 account
}

// Under-13 accounts additionally:
// - Cannot use the chatbot for off-topic conversations
//   (only study-related Q&A)
// - Check-in free text input is disabled
//   (mood selection only — no free text that could contain sensitive info)
// - Data is not used for any AI training purposes, even anonymized
```

---

## 8. GDPR COMPLIANCE (EU/UK/Germany)

```javascript
// Cookie consent (shown on first visit from EU/UK/Germany)
// We use only:
// - Strictly necessary cookies (Supabase auth session) — no consent needed
// - No analytics cookies
// - No advertising cookies
// So our cookie banner is simple: "We use essential cookies only."
// No accept/reject needed for strictly necessary cookies.

// Data Subject Rights implementation:
// Right to Access: /api/privacy/export — returns all data for the user
// Right to Erasure: /api/auth/delete-account — full deletion
// Right to Portability: /api/privacy/export — returns JSON download
// Right to Rectification: /settings — user can edit name, email, language
// All requests processed within 14 days (logged in deletion_requests table)
```

---

## 9. SECURITY INCIDENT RESPONSE

```javascript
// What happens if there's a data breach:

// 1. Detect: Supabase has built-in anomaly detection for unusual queries
// 2. Contain: Rotate all service role keys immediately via Supabase dashboard
// 3. Assess: Determine which data was accessed
// 4. Notify:
//    - Users affected: within 72 hours (GDPR requirement)
//    - UK ICO / EU DPA: within 72 hours if high risk
//    - Indian CERT-In: within 6 hours (India's requirement)
// 5. Remediate: Fix the vulnerability before re-opening affected routes
// 6. Document: Full incident log kept for minimum 5 years

// Breach notification email template stored in /emails/breach-notification.js
// Ready to send immediately — do not write this for the first time
// during an actual incident
```

---

## 10. PRIVACY BY DEFAULT CHECKLIST

Before launch, verify every item:

**Backend:**
- [ ] RLS enabled on every Supabase table
- [ ] No parent policy exists for the checkins table
- [ ] Recall transcripts auto-deleted after Challenge generation
- [ ] Check-in free text never persisted to database
- [ ] Payment data never stored (Stripe/Razorpay handle it)
- [ ] Data minimization in all Claude API calls
- [ ] Rate limiting on all API routes
- [ ] Security headers configured in next.config.js
- [ ] Account deletion cascades to all child tables
- [ ] Webhook signature verification for Stripe and Razorpay

**Frontend:**
- [ ] No sensitive data in localStorage or sessionStorage
- [ ] Microphone permission requested only when needed, with clear UI state
- [ ] Photos sent directly to API, not stored in Supabase Storage
- [ ] Parent dashboard explicitly excludes check-in and chat data
- [ ] Consent collection at signup with timestamp stored
- [ ] Session timeout after 30 minutes of inactivity
- [ ] Privacy settings page with data export and deletion options
- [ ] Under-13 COPPA flow implemented before USA launch
- [ ] Cookie banner for EU/UK/Germany traffic

**Legal:**
- [ ] Privacy policy live at /privacy before any ads run
- [ ] Terms of service live at /terms before any ads run
- [ ] Guarantee terms live at /guarantee
- [ ] Escalation policy disclosed at signup to both roles
- [ ] Data Processing Agreement with Anthropic, Stripe, Razorpay, Resend
