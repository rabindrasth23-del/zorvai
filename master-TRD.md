# ZORVAI — Technical Requirements Document (TRD)
# Version 1.0 — Complete Technical Specification

---

## 1. TECH STACK

| Layer | Technology | Version | Why |
|---|---|---|---|
| Framework | Next.js (App Router) | 15.x | One codebase, web app + API |
| Language | JavaScript (ES Modules) | ES2024 | No TypeScript overhead for MVP |
| Database | Supabase (Postgres) | Latest | Managed, auth built in, RLS |
| AI | Claude API (Anthropic) | claude-sonnet-4-6 | Vision + text, strong instruction following |
| Voice input | Browser Web Speech API | Native | Free, no API key, supports major languages |
| Voice output | Browser SpeechSynthesis API | Native | Free text-to-speech, no external service |
| Payments (USA) | Stripe | Latest SDK | Industry standard, subscriptions built in |
| Payments (India) | Razorpay | Latest SDK | UPI, cards, wallets — dominant in India |
| Email | Resend | Latest | 3,000 free emails/month, simple API |
| Hosting | Vercel | Latest | Auto-deploys from GitHub, edge functions |
| File storage | Supabase Storage | Included | For photo uploads to chatbot |
| Auth | Supabase Auth | Included | JWT-based, handles both roles |

---

## 2. FOLDER STRUCTURE

```
zorvai/
├── app/
│   ├── (public)/
│   │   ├── page.js                    # Landing page
│   │   ├── parents/page.js            # Parent landing
│   │   └── students/page.js           # Student landing
│   ├── (auth)/
│   │   ├── login/page.js
│   │   ├── signup/student/page.js
│   │   └── signup/parent/page.js
│   ├── (student)/
│   │   ├── onboarding/page.js
│   │   ├── baseline-quiz/page.js
│   │   ├── dashboard/page.js
│   │   ├── session/page.js            # Live voice session
│   │   ├── chat/page.js               # AI chatbot
│   │   ├── plan/page.js               # 7-day plan view
│   │   ├── progress/page.js
│   │   └── settings/page.js
│   ├── (parent)/
│   │   ├── parent/dashboard/page.js
│   │   ├── parent/progress/page.js
│   │   ├── parent/guarantee/page.js
│   │   ├── parent/billing/page.js
│   │   └── parent/settings/page.js
│   └── api/
│       ├── onboarding/
│       │   ├── advance/route.js
│       │   └── complete/route.js
│       ├── plan/
│       │   ├── generate/route.js
│       │   └── regenerate/route.js
│       ├── session/
│       │   ├── start/route.js
│       │   ├── teach/route.js
│       │   ├── recall/route.js
│       │   ├── challenge/route.js
│       │   ├── evaluate/route.js
│       │   └── checkin/route.js
│       ├── chat/route.js
│       ├── progress/
│       │   ├── student/[id]/route.js
│       │   └── guarantee/[id]/route.js
│       ├── reviews/
│       │   ├── due/[id]/route.js
│       │   └── complete/[id]/route.js
│       ├── notify/
│       │   ├── missed-session/route.js
│       │   ├── digest/route.js
│       │   └── escalation/route.js
│       ├── payments/
│       │   ├── stripe/webhook/route.js
│       │   ├── razorpay/webhook/route.js
│       │   └── guarantee/claim/route.js
│       └── auth/
│           ├── signup/route.js
│           ├── login/route.js
│           └── link-parent/route.js
├── lib/
│   ├── supabase.js                    # DB client + all data access functions
│   ├── ai.js                          # All 6 Claude call types
│   ├── studyPlan.js                   # Plan generation logic
│   ├── onboarding.js                  # Question state machine
│   ├── spacedRepetition.js            # Review scheduling logic
│   ├── guarantee.js                   # Guarantee eligibility checker
│   ├── notifications.js               # Email + push notification helpers
│   ├── stripe.js                      # Stripe SDK wrapper
│   └── razorpay.js                    # Razorpay SDK wrapper
├── components/
│   ├── student/
│   │   ├── Dashboard.jsx
│   │   ├── SessionPlayer.jsx          # The live voice session UI
│   │   ├── PlanCalendar.jsx
│   │   ├── ProgressTracker.jsx
│   │   ├── Chatbot.jsx
│   │   └── CheckIn.jsx
│   └── parent/
│       ├── ParentDashboard.jsx
│       ├── ProgressView.jsx
│       ├── GuaranteeStatus.jsx
│       └── BillingPanel.jsx
├── supabase/
│   └── schema.sql
├── .env.local.example
└── package.json
```

---

## 3. ENVIRONMENT VARIABLES

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Claude (Anthropic)
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-4-6

# Stripe (USA payments)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Razorpay (India payments)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Resend (email)
RESEND_API_KEY=
FROM_EMAIL=no-reply@zorvai.ai

# App
NEXT_PUBLIC_APP_URL=https://zorvai.ai
FREE_SESSION_LIMIT=3
CRON_SECRET=

# Feature flags
ENABLE_VOICE=true
ENABLE_PHOTO_UPLOAD=true
```

---

## 4. AI PIPELINE — DETAILED IMPLEMENTATION

### 4.1 Call Type 1 — Onboarding (lib/onboarding.js)

```javascript
const QUESTIONS = [
  { key: 'name', text: "What's your name?" },
  { key: 'country', text: "Which country are you studying in?" },
  { key: 'age', text: "How old are you?" },
  { key: 'field', text: "What field are you in? School, College, Engineering, Medicine, Programming, Exam prep, or something else?" },
  { key: 'grade', text: "Which grade or year are you in?" },
  { key: 'subject', text: "Which subject do you want to start with — or say 'every subject' and I'll build you a full 7-day plan?" },
  { key: 'confidence', text: "On a scale of 1 to 5, how confident do you feel in that subject right now?" },
  { key: 'stuck_topic', text: "Is there a specific topic inside that subject that's been tripping you up?" },
  { key: 'study_hours', text: "How many hours can you realistically study per day — honestly, not ideally?" },
  { key: 'study_days', text: "Which days of the week can you actually study?" },
  { key: 'best_time', text: "What time of day do you focus best?" },
  { key: 'deadline', text: "Do you have an exam or deadline coming up? When?" },
  { key: 'feeling', text: "How do you feel about studying right now — excited, okay, stressed, or just exhausted?" },
  { key: 'biggest_obstacle', text: "What's the biggest thing getting in the way of you studying properly right now?" },
  { key: 'bad_test_story', text: "Have you ever felt like you studied hard but still did badly on a test? What happened?" },
  { key: 'good_session_feeling', text: "What does a good study session feel like for you when it actually goes well?" },
  { key: 'monthly_goal', text: "What's one specific goal you want to hit this month?" },
  { key: 'language', text: "What language should I teach in?" }
];
```

Claude system prompt for onboarding:
```
You are Zorvai meeting a new student for the first time. Your goal is to
make them feel genuinely understood — not like they're filling out a form.
Ask questions one at a time. Respond naturally and warmly to each answer
before moving to the next one. If they say something emotional (stressed,
exhausted, failed a test), acknowledge it briefly before continuing.
Keep each response short — this is a conversation, not a speech.
Current question index: {index}. Student's previous answers: {answers}.
```

### 4.2 Call Type 2 — Plan Generation (lib/studyPlan.js)

System prompt:
```
Generate a 7-day study plan for this student:
- Country: {country}
- Field: {field}
- Subject(s): {subject} (wants_full_plan: {wantsFullPlan})
- Study hours per day: {hours}
- Available days: {days}
- Deadline: {deadline}
- Confidence level: {confidence}/5
- Specific stuck topic: {stuckTopic}

Rules:
1. One narrow, specific topic per session block (not a whole subject)
2. Basics before advanced — never skip foundations
3. If multiple subjects: rotate through them daily
4. Size session count to fit available hours per day
5. If deadline given: back-plan from that date, prioritize low-confidence topics
6. Each session should be completable in one Learn→Recall→Challenge cycle

Return ONLY valid JSON, no markdown:
{
  "days": [
    {
      "day": 1,
      "date_offset": 0,
      "sessions": [
        {
          "subject": "",
          "topic": "",
          "duration_minutes": 45,
          "is_review": false,
          "prior_topic_reference": null
        }
      ]
    }
  ]
}
```

### 4.3 Call Type 3 — Teach (lib/ai.js)

System prompt:
```
You are Zorvai, a patient and encouraging AI teacher.
Student: {name}, {grade}, {field}, studying in {country}.
Teaching language: {language}.
Today's topic: {topic} (subject: {subject}).
Session length: {minutes} minutes.
Student's recent struggles: {weakTopics}.
Student's recent sessions covered: {recentTopics}.

Teaching rules:
1. Use the Socratic method — ask guiding questions, don't just lecture
2. Teach ONE concept thoroughly, not multiple concepts partially
3. Pace yourself to fit {minutes} minutes exactly
4. If the student asks a question, answer it, then return to the flow
5. Do not quiz them yet — the Recall and Challenge phases come after
6. End by saying "Okay — close your notes. Tell me everything you remember."
7. Keep each response short enough to read on a phone
```

### 4.4 Call Type 4 — Challenge Generation (lib/ai.js)

System prompt:
```
A student just studied "{topic}" (subject: {subject}).
During their Recall phase, they said:
"{recallTranscript}"

Recent prior topics from their session history: {priorTopics}

Generate exactly 4 quiz questions:
Level 1 — Basic fact (what, who, when)
Level 2 — Understanding (why, how)
Level 3 — Application (apply to a new situation)
Level 4 — Mixed: connects to one prior topic if relevant, otherwise
           a harder application question

Base questions on what the student DID and DIDN'T mention in their recall.
Ask one question at a time — do not reveal all 4 upfront.
Return ONLY valid JSON:
{
  "questions": [
    { "level": 1, "type": "fact", "text": "" },
    { "level": 2, "type": "understanding", "text": "" },
    { "level": 3, "type": "application", "text": "" },
    { "level": 4, "type": "mixed", "text": "", "references_topic": "" }
  ]
}
```

### 4.5 Call Type 5 — Feedback Evaluation (lib/ai.js)

System prompt:
```
A student was quizzed on "{topic}" ({subject}).
Here are their answers:
{qaPairs formatted as Q: / A: pairs}

Evaluate their understanding fairly and kindly.
Teaching language: {language}.
Return ONLY valid JSON:
{
  "understood": ["short phrase for each thing clearly grasped"],
  "missed": ["short phrase for each thing missed or wrong"],
  "review": ["1-3 specific things to review before next session"],
  "pass_threshold_met": true or false,
  "verbal_feedback": "2-3 sentences of warm, specific spoken feedback
                      acknowledging what went well and what to focus on"
}
```

### 4.6 Call Type 6 — Chatbot (lib/ai.js)

System prompt:
```
You are Zorvai, a patient AI study coach.
Student: {name}, {grade} in {country}, studying {field} in {language}.
Their recent sessions covered: {recentTopics}.
Topics they've been struggling with: {weakTopics}.
Their stated goal this month: {monthlyGoal}.

Answer their question using the Socratic method — guide them toward the
answer rather than giving it directly. Reference their recent sessions
where genuinely relevant ("We covered something similar on Tuesday...").
If they send a photo, read the actual content before answering.
Keep your response readable on a phone screen.
Never just give the final answer — help them get there themselves.
```

---

## 5. FRONTEND COMPONENT SPECS

### 5.1 SessionPlayer.jsx (the most important component)

States the component manages:
- phase: 'checkin' | 'learn' | 'recall' | 'challenge' | 'feedback' | 'complete'
- timer: countdown in seconds
- isListening: boolean (microphone active)
- isSpeaking: boolean (AI voice active)
- transcript: current speech-to-text buffer
- challengeQuestions: array of 4 questions
- currentQuestion: index 0-3
- answers: array of student answers
- feedback: the evaluation result

Phase transitions:
1. checkin → learn (after mood recorded)
2. learn → recall (when timer hits 0 OR student taps "I'm ready")
3. recall → challenge (after 5 minutes OR student taps "Done")
4. challenge → feedback (after all 4 answers received)
5. feedback → complete (student taps "Finish")
6. feedback → learn (if pass_threshold_met is false — loops back to re-study)

Voice implementation (browser-native, no external API):
```javascript
// Speech to text (student speaks, AI listens)
const recognition = new window.SpeechRecognition()
recognition.continuous = true
recognition.interimResults = true
recognition.lang = studentLanguage // e.g. 'hi-IN', 'en-US', 'bn-BD'

// Text to speech (AI speaks, student listens)
const utterance = new SpeechSynthesisUtterance(text)
utterance.lang = studentLanguage
utterance.rate = 0.9 // slightly slower than default
window.speechSynthesis.speak(utterance)
```

### 5.2 Chatbot.jsx

- Floating button visible on all student pages (bottom right)
- Opens as a slide-up panel, not a new page
- Input: text field + photo upload icon + mic icon (voice note)
- Messages display with student messages right-aligned, AI left-aligned
- Photo messages show the image inline before the AI response
- "Zorvai is thinking..." typing indicator during API call
- Session history persists within the browser session, clears on logout

### 5.3 PlanCalendar.jsx

- 7-column grid, one column per day
- Each session shown as a color-coded card (color per subject)
- Today's session highlighted, with "Start" button
- Completed sessions show a checkmark
- Failed sessions (didn't pass Challenge) show a subtle retry indicator
- Review sessions shown in a lighter style, differentiated from main sessions
- "Rebuild my plan" button accessible from this view

### 5.4 ProgressTracker.jsx

- Subject progress bars at the top (% of planned sessions completed)
- Session log below: date, topic, duration, pass/fail chip
- Weak topics section: auto-populated from missed[] arrays in session records
- Mastered topics section: topics that passed on the first Challenge attempt
- Streak calendar: 30-day grid, study days filled in color
- Goal progress: stated goal text + a simple progress ring

### 5.5 ParentDashboard.jsx

- Child selector at top (v1 shows one child, v2 adds siblings)
- Goal card: parent's stated goal + "on track" / "needs attention" chip
- Guarantee card: sessions completed X/12 + days remaining this window
- Last session card: topic, result, how long ago
- Focus area card: current weak topic from child's session data
- "Send a nudge" button → POST /api/notify/nudge → push notification to child
- Link to full progress view

---

## 6. PAYMENT FLOW — DETAILED

### 6.1 Stripe (USA)

**Subscription creation:**
1. User selects plan on /signup/parent or /settings
2. Frontend calls POST /api/payments/stripe/create-subscription
3. Backend creates Stripe Customer + Subscription with trial if applicable
4. Returns client_secret for payment confirmation
5. Frontend uses Stripe.js to confirm payment (handles 3DS, card auth)
6. On success: Stripe fires subscription.created webhook
7. Webhook verifies signature, updates subscriptions table: active=true

**Waitlist discount implementation:**
- Store discount_percent in subscriptions table at signup
- Apply as Stripe Coupon with percent_off field
- lifetime_discount = true means the coupon has duration='forever'

**Guarantee refund:**
1. Parent submits claim via /parent/guarantee
2. POST /api/payments/guarantee/claim
3. Backend verifies: sessions_in_window >= 12, followup_score exists
4. If eligible: Stripe.refunds.create() for the subscription amount
5. subscription.active stays true (refund doesn't cancel)
6. guarantee_claims record created

### 6.2 Razorpay (India)

Same flow, different SDK:
- Razorpay Subscription object instead of Stripe Subscription
- Payment captured via Razorpay checkout (popup or redirect)
- Webhook verifies Razorpay signature via crypto.createHmac
- Refund via razorpay.payments.refund(paymentId, { amount })

---

## 7. NOTIFICATIONS — IMPLEMENTATION

### 7.1 Missed-session alert (daily cron, 9pm local time)
Vercel Cron job calls GET /api/notify/missed-session with CRON_SECRET header.
Logic:
1. Query students whose study_plan includes today as a study day
2. Check if any session record exists for that student today
3. If no session found: get parent email for linked account
4. Send email via Resend: "[Child] hasn't studied today — today's topic was [topic]"
5. Only sends if parent has missed-session alerts enabled

### 7.2 Weekly digest (Sunday cron)
Vercel Cron calls GET /api/notify/digest.
Logic:
1. For each active subscription with digest enabled
2. Query sessions from the past 7 days
3. Build digest: sessions completed, topics covered, highlight, focus area,
   guarantee progress
4. Generate plain-text + HTML email via Resend

### 7.3 Escalation (triggered by checkin route)
When POST /api/session/checkin receives mood='not_okay' or escalation
keywords are detected in a free-text checkin response:
1. Log checkin with escalated=true
2. Fetch parent email for linked account
3. Send email: "[Child's name] shared something with Zorvai today that
   we think you should know about. Please check in with them."
4. No content of what the student said is included.

---

## 8. SPACED REPETITION LOGIC (lib/spacedRepetition.js)

Algorithm (simplified Leitner-style):
```javascript
const INTERVALS = [1, 3, 7, 14, 30] // days

function scheduleNextReview(topic, studentId, passedOnFirstAttempt) {
  const baseInterval = passedOnFirstAttempt ? 3 : 1
  // On subsequent reviews, multiply the interval
  // Stored in review_schedule table with scheduled_for date
}
```

Review sessions appear on the student's plan as short blocks:
- 5 minutes (not a full session)
- Recall only (no Learn phase — just "tell me what you remember about X")
- 2 Challenge questions instead of 4
- If they pass: schedule next review at double the interval
- If they fail: reset to 1-day interval and re-add to weak topics

---

## 9. SECURITY IMPLEMENTATION

**Route protection:**
All /api routes check for valid Supabase JWT in Authorization header.
Role check on every request — student routes reject parent tokens,
parent routes reject student tokens.

**Parent-student data isolation:**
```javascript
// Parent can only query their linked student's data
const { data: link } = await supabase
  .from('student_profiles')
  .select('id')
  .eq('parent_id', parentId)
  .eq('id', requestedStudentId)
  .single()

if (!link) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
```

**Check-in content isolation:**
The /api/progress/student/:id route never returns checkin table rows.
The /api/notify/escalation route sends a flag, not content.

**Webhook security:**
```javascript
// Stripe
const event = stripe.webhooks.constructEvent(
  rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET
)

// Razorpay
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
  .update(rawBody)
  .digest('hex')
if (expectedSignature !== receivedSignature) return 401
```

---

## 10. DEPLOYMENT CHECKLIST

**Before first deploy:**
- [ ] Supabase project created, schema.sql run
- [ ] All environment variables set in Vercel project settings
- [ ] Stripe products and prices created (4 plans)
- [ ] Razorpay plans created (4 plans, INR)
- [ ] Resend domain verified (zorvai.ai)
- [ ] Vercel Cron jobs configured (missed-session: daily 9pm, digest: Sunday)
- [ ] Stripe webhook endpoint registered
- [ ] Razorpay webhook endpoint registered
- [ ] Custom domain configured in Vercel (zorvai.ai)

**Launch day checks:**
- [ ] Signup flow tested end-to-end (student + parent)
- [ ] Payment flow tested with Stripe test mode
- [ ] One full session tested (checkin → learn → recall → challenge → feedback)
- [ ] Chatbot tested with text and photo
- [ ] Missed-session cron tested manually
- [ ] Guarantee claim flow tested
- [ ] Mobile browser tested (Chrome on Android, Safari on iOS)
