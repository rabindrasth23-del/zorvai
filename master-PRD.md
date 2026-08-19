# ZORVAI — Master Product Requirements Document (PRD)
# Version 1.0 — Complete Specification

---

## 1. PRODUCT OVERVIEW

**Name:** Zorvai (zorvai.ai)
**Tagline:** "Study smarter — or your money back."
**What it is:** A web app where an AI voice teacher teaches students using
the Learn → Recall → Challenge → Feedback method. Not a Q&A chatbot.
Not a homework helper. A structured, voice-first study coach that forces
real understanding and tracks real improvement — backed by a measurable
improvement guarantee.

**Two roles:** Student and Parent. Both login separately. Different
dashboards, different data visibility, same underlying product.

**Core belief:** Re-reading notes is the worst way to study. Explaining
something back in your own words is the best. The whole product is built
around making students do the second thing, not the first.

---

## 2. THE STUDY METHOD (Learn → Recall → Challenge → Feedback)

This is the engine behind every session. Not optional, not skippable.

**Step 1 — Learn (15-20 minutes, or whatever the student set)**
AI teaches one specific, narrow topic. Not a whole subject — one concept.
Socratic where possible (asks guiding questions, doesn't just lecture).
Timer visible on screen. No chatting during this phase unless the student
is genuinely stuck on something.

**Step 2 — Recall (5 minutes)**
AI stops teaching. Student closes their notes.
Student explains everything they remember — by voice.
AI listens without interrupting. Does not correct, does not prompt.
Just listens and transcribes.

**Step 3 — Challenge (5-10 minutes)**
AI generates 4 questions based on what the student said (or didn't say)
during Recall, in increasing difficulty:
- Level 1: Basic fact ("What is mitosis?")
- Level 2: Understanding ("Why does mitosis matter?")
- Level 3: Application ("How would wound healing be affected without mitosis?")
- Level 4: Mixed — connects to a topic from a previous session

**Step 4 — Feedback**
Structured output, shown visually and read aloud:
- ✅ What they understood well
- ❌ What they missed
- 📌 What to review before next session
- Pass/fail on whether the topic is mastered enough to advance

**Step 5 — Repeat (if failed)**
Student re-studies the weak areas for 10-15 minutes.
Recall and Challenge run again on those specific gaps.
Mastery-gated, not time-gated — they don't advance until they've
actually understood, not just sat there for the allocated time.

**Step 6 — Review Later (spaced repetition)**
AI schedules short review sessions over the following days
to reinforce what was learned before it fades from memory.

**Example 1-hour session breakdown:**
- 📚 Learn: 15 minutes
- 🎤 Recall: 5 minutes
- ❓ Challenge: 10 minutes
- 📚 Re-study weak areas: 15 minutes
- 🎤 Recall again: 5 minutes
- 📝 Final quiz + summary: 10 minutes

---

## 3. ONBOARDING — STUDENT (Deep Understanding Questions)

These questions are not a form. They are a conversation. The AI asks them
one at a time, waits for the answer, and responds naturally before asking
the next one. The goal is for the student to feel understood, not processed.

**Round 1 — Identity (who are you)**
Q1: "What's your name?"
Q2: "Which country are you studying in?"
Q3: "How old are you?"
Q4: "What field are you in? (School / College / Engineering / Medicine /
     Programming / Exam prep / Self-learning)"
Q5: "Which grade or year are you in?"

**Round 2 — Study situation (what's actually going on)**
Q6: "Which subject do you want to start with — or say every subject and
     I'll build you a full 7-day plan?"
Q7: "On a scale of 1 to 5, how confident do you feel in that subject
     right now?"
Q8: "Is there a specific topic inside that subject that's been tripping
     you up?"
Q9: "How many hours can you realistically study per day — honestly,
     not ideally?"
Q10: "Which days of the week can you actually study?"
Q11: "What time of day do you focus best?"
Q12: "Do you have an exam or deadline coming up? When?"

**Round 3 — The real stuff (feelings and problems)**
Q13: "How do you feel about studying right now — excited, okay, stressed,
      or just exhausted?"
Q14: "What's the biggest thing getting in the way of you studying
      properly right now?"
Q15: "Have you ever felt like you studied hard but still did badly on
      a test? What happened?"
Q16: "What does a good study session feel like for you when it
      actually goes well?"

**Round 4 — Commitment**
Q17: "What's one specific goal you want to hit this month?" (free text)
Q18: "What language should I teach in?"

**Baseline quiz (after onboarding, before first session)**
5-10 questions matched to their stated subject and confidence level.
This score is stored. This is the "before" number the guarantee is
measured against. Never shown to the student as a grade — framed as
"helping me understand where to start with you."

---

## 4. ONBOARDING — PARENT

Q1: "Your name?"
Q2: "Your child's name and age?"
Q3: "Are they already on Zorvai, or are you setting up their account
     now?"
Q4: "What are you hoping to see improve for your child this month?"
     (This becomes the parent-set goal — shown on the parent dashboard
     as the commitment the subscription is working toward)
Q5: "How do you want to stay updated? (Weekly email digest / Check
     the dashboard yourself / Both)"
Q6: Payment details and plan selection.

---

## 5. SUBSCRIPTION PLANS — FINAL PRICING

**Student Solo (Monthly)**
USA: $19.99/month | India: ₹349/month
- One student, self-managed
- All subjects, full session access
- AI chatbot + voice teacher + plan maker
- Guarantee applies (minimum 12 sessions in 30 days)
- No parent dashboard

**Family Starter (Weekly)**
USA: $12.99/week | India: ₹199/week
- One child, one subject
- Full session access for 7 days
- No guarantee (too short to measure real improvement)
- Designed to convert to Family Monthly after one week
- No missed-session alerts on this plan

**Family Plan (Monthly)**
USA: $39.99/month | India: ₹649/month
- Up to 2 children
- All subjects, full session access
- Parent dashboard with full progress visibility
- Missed-session alerts to parent
- Weekly email digest
- Guarantee applies (minimum 12 sessions in 30 days)

**Family Annual**
USA: $299/year (~$24.92/month) | India: ₹4,999/year (~₹417/month)
- Everything in Family Monthly
- Sibling add-on: second child at 50% extra (not full price)
- Quarterly progress report (pushed to parent, not just on dashboard)
- Guarantee resets every 90 days
- Priority support
- ~38% cheaper than paying monthly

**Waitlist pricing (tiered scarcity — applies to Monthly or Annual only)**
- First 100 signups: 60% off, forever
- Signups 101-500: 40% off, forever
- After 500: normal pricing
- Discount is permanent — even as prices increase later, founding
  members stay at their locked-in rate

---

## 6. THE GUARANTEE — EXACT FORMULA

**Public-facing claim:** "Improve your study or get your money back."

**The actual rules (written into the Terms of Service, not hidden):**

Eligibility requirements:
1. Student must complete a minimum of 12 full Learn→Recall→Challenge
   sessions within the 30-day period
2. Student must have completed the baseline quiz at onboarding
3. Student must complete the follow-up quiz (same difficulty,
   different questions) at the end of the 30-day period

How improvement is measured:
- Baseline quiz score (taken at onboarding) vs follow-up quiz score
  (taken after 30 days)
- If follow-up score is not higher than baseline score: full refund,
  no questions asked, processed within 5 business days

What disqualifies a refund claim:
- Fewer than 12 completed sessions in 30 days
- No follow-up quiz completed
- Account sharing (multiple users on one login)

What is NOT used to disqualify:
- No "did they try hard enough" judgment
- No behavioral review
- No blacklisting, no public shaming, no leaderboard of failed users
- The only criteria is the two numbers: before score and after score

Annual plan guarantee:
- Guarantee resets every 90 days
- Each 90-day window requires 12 sessions to qualify
- Student can claim at the end of any qualifying 90-day window

Refund process:
- Student or parent submits a claim through a simple in-app form
- System verifies session count and quiz completion automatically
- If eligible: refund processed in 5 business days, no manual review
- If not eligible: system explains exactly which requirement wasn't
  met, offers an extension window to complete the remaining requirement

---

## 7. STUDENT APP — COMPLETE FEATURE LIST

### 7.1 Dashboard
The first thing a student sees after login. Clean, uncluttered, actionable.

**Elements:**
- Greeting with their name and a one-line status ("You're on Day 4
  of your 7-day plan")
- Today's session card: subject, topic, estimated time, "Start" button
- 7-day plan progress bar (how many topics completed vs planned)
- Streak counter (consecutive days studied)
- Goal progress card: their stated monthly goal + a simple progress
  indicator toward it
- "Focus area" alert: the topic the AI identified as their weakest
  from the last session's Feedback
- Quick-access chatbot button (always visible, bottom right)
- Quick-access voice session button (prominent, center)

### 7.2 Plan Maker
Runs automatically after onboarding. Can be regenerated anytime.

**What it does:**
Takes the student's country, field, subject(s), study hours/day,
available days, deadline (if any), confidence level, and specific
stuck topic, and generates a 7-day plan of specific, narrow topics.

**Plan structure:**
- One topic per session block (not a whole subject — one concept)
- Basics before advanced — never jumps to complex topics before
  foundations are covered
- If "every subject" was chosen: topics rotate across subjects
  through the week rather than finishing one before starting the next
- Adjusts daily session count to fit the student's stated available hours
- If a deadline was given: back-plans from the deadline date,
  prioritizing topics the student rated low confidence on

**What the student sees:**
A visual 7-day calendar showing each day's topic(s), subject color-coded,
estimated session length, and which days are rest days.

**Regen trigger:**
Student can tap "Rebuild my plan" at any time. AI asks 2-3 quick
questions (what changed? any new deadline? how did last week go?) and
regenerates without going through the full onboarding again.

### 7.3 Voice AI Teacher
The core product. A live voice conversation with the AI tutor.

**Session start flow:**
1. Student taps "Start Session"
2. AI confirms today's topic from the plan ("Today we're covering
   [topic]. Ready to start?")
3. Student can adjust session length before starting (default from
   their plan, but slideable)
4. AI asks a 30-second check-in question ("Before we start — how are
   you feeling today?") — see Section 7.7

**During Learn phase:**
- AI teaches by voice, Socratic where possible
- Student can interrupt to ask questions — AI answers, then returns
  to the teaching flow
- A visible timer counts down the Learn phase
- Student's notes area visible on screen (they can type or write
  on paper — up to them)

**Recall phase trigger:**
- Timer ends, AI says "Okay — close your notes. Tell me everything
  you remember about [topic]."
- Student speaks freely for up to 5 minutes
- AI's mic indicator is visible but AI is silent
- A gentle "take your time" nudge if more than 30 seconds of silence

**Challenge phase:**
- AI delivers each of the 4 questions one at a time
- Student answers by voice
- AI does not reveal whether the answer was right or wrong until all
  4 are complete (prevents gaming by adjusting answers based on
  reactions)

**Feedback phase:**
- AI delivers verbal feedback, simultaneously shown visually on screen
- ✅ Understood / ❌ Missed / 📌 Review
- Clear pass/fail on whether to advance or re-study

### 7.4 AI Chatbot
Always available, separate from the voice session.

**What it does:**
Answers any study question the student has, personalized using their
saved profile (country, field, subject, language, session history).
Text or photo input. Never just gives the answer — guides the student
toward it (Socratic), same as the voice teacher.

**What makes it different from ChatGPT:**
- Knows who the student is without being re-told
- Knows which topics they've covered and which they struggled with
- Tailors explanations to their field and country without being asked
- Refuses to just hand over an answer — explains the method instead
- References their recent session history ("We covered this in your
  session on Thursday — remember the part about...")

**Input types:**
- Text question
- Photo of a textbook page, handwritten notes, or a problem on paper
- Voice note (transcribed, then processed)

### 7.5 Progress Tracker
A visual history of everything the student has done and improved.

**Elements:**
- Subject-by-subject progress bars (% of plan completed)
- Session history: date, topic, pass/fail, time spent
- Weak topics list (auto-updated from Feedback phases)
- Mastered topics list (topics that passed on first Challenge attempt)
- Streak history calendar (GitHub-style contribution graph, but for
  study sessions)
- Goal progress: stated goal vs. current trajectory
- Baseline quiz score (shown privately to student only)
- "You've improved by X% since you started" — the guarantee number,
  shown motivationally, not just as a refund trigger

### 7.6 Spaced Repetition System
Runs in the background. Not a separate feature the student manages.

**How it works:**
After a topic passes the Challenge, the AI schedules review sessions
at increasing intervals (next day, 3 days later, 7 days later, 14
days later) using a simple spaced repetition algorithm. These reviews
appear as short bonus sessions on the student's plan — not full
Learn cycles, just a quick 5-minute Recall + 2 Challenge questions
to confirm the knowledge is still there.

**Why it's invisible:**
Students don't set the intervals. They don't manage cards. They just
see "5-min review: Mitosis" appear on a day in their plan and do it.
The system handles the scheduling.

### 7.7 Check-in / Emotional Layer
Runs at the start of every session. Takes 30-60 seconds.

**What the AI asks:**
"Before we start — how are you feeling today?"
Options (voice or tap): Great / Okay / Stressed / Really tired / Not
okay

**What happens based on the answer:**
- Great / Okay: normal session, no adjustment
- Stressed: AI acknowledges it briefly ("Sounds like today's been a
  lot — let's keep today's session shorter and focus on just one
  thing"), offers a shorter session length
- Really tired: AI suggests a 10-minute session instead of full
  session, or a review-only session (no new content)
- Not okay: AI responds with care, does NOT attempt to counsel,
  says "I'm glad you told me — studying can wait. Is there someone
  you can talk to today?" and surfaces the option to end the session
  with no pressure. Escalation policy applies (see Section 7.7.1)

**7.7.1 Escalation policy (stated clearly in the product to both
student and parent at signup):**
- Day-to-day emotional check-ins are private to the student
- If the student's language triggers the escalation criteria (specific
  phrases indicating serious distress, not ordinary stress), the
  parent linked to the account receives one notification:
  "[Child's name] shared something with Zorvai today that we think
  you should know about. Please check in with them."
- No content of what the student said is shared. Only the fact that
  the check-in raised a flag.
- This policy is written in plain language on the signup page for
  both roles, so neither is surprised by it.

### 7.8 Shareable Win Cards
Triggered after a student completes a Challenge with a passing grade.

**What it shows:**
- Their stated goal
- Today's topic and subject
- A simple progress indicator toward their goal
- "Powered by Zorvai" branding, small and non-intrusive

**One tap shares to WhatsApp.** This is organic distribution baked
into the product — every win becomes a potential referral.

---

## 8. PARENT APP — COMPLETE FEATURE LIST

### 8.1 Parent Dashboard
Clean overview. Everything a parent actually wants to know, nothing
they don't.

**Elements:**
- Child's name and current streak
- Goal progress: the goal the parent stated at onboarding + a simple
  "on track / needs attention" indicator
- Guarantee status: "Your child has completed X of 12 sessions needed
  to qualify for the improvement guarantee this month"
- Last session: subject, topic, pass/fail, when it happened
- Focus area: what the AI identified as the current weak topic
- "Send a nudge" button: sends a friendly push notification to the
  child's device ("Your parent wants to say: you've got this 💪")
- Quick link to the full progress view

### 8.2 Progress View (Full)
Everything the student sees in their Progress Tracker, visible to the
parent. Except: emotional check-in content is not shown here (see
Section 7.7.1 escalation policy).

**Elements:**
- Session history: date, topic, time spent, pass/fail
- Subject progress bars
- Weak topics and mastered topics lists
- Streak calendar
- Baseline score and current trajectory

### 8.3 Missed-Session Alert
If the student doesn't start their planned session by 9pm on a
scheduled study day, the parent receives one notification through
their chosen channel (email or in-app).

Message: "[Child's name] hasn't studied today yet. Today's topic was
[topic]. You might want to give them a gentle nudge."

**One alert per missed day only.** Not repeated. Not naggy. One
message that the parent can choose to act on or not.

### 8.4 Weekly Digest (email)
Sent every Sunday if the parent chose this option at onboarding.

**Contains:**
- Sessions completed this week vs. planned
- Topics covered
- One highlight (something the child did well)
- One focus area (something to keep an eye on)
- Guarantee progress: sessions completed toward the monthly minimum
- A simple "on track / falling behind / back on track" status

Plain language, no jargon, readable in 60 seconds.

### 8.5 Quarterly Progress Report (Annual plan only)
A proper document pushed to the parent via email every 90 days.

**Contains:**
- Baseline score vs. current score (the guarantee number)
- Total sessions completed
- Topics mastered (full list)
- Topics still in progress
- Streak history
- A plain-language AI-generated summary: "Over the last 90 days,
  [child] has shown the most improvement in [subject]. They still
  find [topic] challenging and the plan has scheduled additional
  review sessions for it over the next 2 weeks."

### 8.6 Guarantee Management
**Where:**  Settings → Guarantee

**Shows:**
- Current month's session count vs. 12-session minimum
- Baseline quiz score
- Days remaining in current guarantee window
- "Claim a refund" button (only active if minimum sessions are met
  and 30 days have elapsed)

### 8.7 Billing and Plan Management
- Current plan and price (including any waitlist discount applied)
- Next billing date
- Upgrade/downgrade options
- Sibling add-on (Annual plan only)
- Cancel option — no dark patterns, no "are you really sure" guilt
  screens, just a clean cancellation with a confirmation email

### 8.8 Notification Preferences
- Missed-session alerts: on/off
- Weekly digest: on/off
- Guarantee milestone alerts: on/off
- Escalation alerts: always on, cannot be turned off

---

## 9. TECHNICAL ARCHITECTURE

**Stack:**
- Frontend + Backend: Next.js (App Router) on Vercel
- Database: Supabase (Postgres)
- AI: Claude API (Anthropic) — claude-sonnet-4-6
- Voice (MVP): Browser Web Speech API (free, no extra cost)
- Payments: Stripe (USA) + Razorpay (India)
- Email: Resend (3,000 free/month, more than enough for early stage)
- Hosting: Vercel (app) + Supabase (DB)

**Why this stack:**
Next.js handles both the web app and the API routes in one codebase.
Supabase gives real Postgres with auth and RLS without managing a
database server. Vercel deploys automatically from GitHub pushes.
Total infrastructure cost for MVP: near zero until real scale.

---

## 10. DATABASE SCHEMA

```sql
-- Users table (both students and parents)
create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  role text not null check (role in ('student', 'parent')),
  name text,
  country text,
  language text,
  created_at timestamptz default now()
);

-- Student profiles
create table student_profiles (
  id uuid primary key references users(id),
  parent_id uuid references users(id),
  age int,
  field text,
  grade text,
  study_hours_per_day numeric,
  study_days text[],
  best_study_time text,
  deadline date,
  monthly_goal text,
  confidence_level int check (confidence_level between 1 and 5),
  stuck_topic text,
  wants_full_plan boolean default false,
  baseline_score numeric,
  current_score numeric,
  streak int default 0,
  last_session_date date,
  onboarded boolean default false,
  onboarding_step int default 0
);

-- Study plans
create table study_plans (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  plan jsonb not null,
  created_at timestamptz default now(),
  active boolean default true
);

-- Sessions
create table sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  subject text,
  topic text,
  planned_duration_minutes int,
  actual_duration_minutes int,
  phase text check (phase in ('learn', 'recall', 'challenge', 'feedback', 'complete')),
  recall_transcript text,
  challenge_questions jsonb,
  challenge_answers jsonb,
  understood text[],
  missed text[],
  review_items text[],
  passed boolean,
  started_at timestamptz,
  completed_at timestamptz
);

-- Question history (for chatbot personalization)
create table question_history (
  id bigint generated always as identity primary key,
  student_id uuid references users(id),
  question text,
  subject text,
  answered_at timestamptz default now()
);

-- Spaced repetition schedule
create table review_schedule (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  subject text,
  topic text,
  scheduled_for date,
  completed boolean default false,
  interval_days int
);

-- Check-ins
create table checkins (
  id bigint generated always as identity primary key,
  student_id uuid references users(id),
  mood text check (mood in ('great', 'okay', 'stressed', 'tired', 'not_okay')),
  escalated boolean default false,
  checked_at timestamptz default now()
);

-- Subscriptions
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  plan text check (plan in ('student_solo', 'family_starter', 'family_monthly', 'family_annual')),
  price_usd numeric,
  price_inr numeric,
  discount_percent numeric default 0,
  lifetime_discount boolean default false,
  stripe_subscription_id text,
  razorpay_subscription_id text,
  active boolean default true,
  started_at timestamptz default now(),
  expires_at timestamptz,
  guarantee_window_start timestamptz,
  sessions_in_window int default 0
);

-- Guarantee claims
create table guarantee_claims (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references users(id),
  baseline_score numeric,
  followup_score numeric,
  sessions_completed int,
  eligible boolean,
  reason text,
  refund_processed boolean default false,
  claimed_at timestamptz default now()
);
```

---

## 11. AI PIPELINE — 6 CALL TYPES

Every AI interaction in the product uses one of these 6 distinct prompts.
This is what makes Zorvai behave differently from a generic chatbot — the
structure around the model is the product.

**Call Type 1 — Onboarding (conversational)**
Input: current question index + student's previous answers
System prompt: "You are Zorvai, meeting a new student for the first time.
Ask the questions one at a time, respond naturally to each answer before
moving to the next, and make the student feel genuinely understood, not
processed. Adjust your tone based on how they're presenting — if they
say they're stressed, acknowledge it warmly before moving on."
Output: next question or confirmation that onboarding is complete

**Call Type 2 — Plan Generation (structured JSON)**
Input: all onboarding data (country, field, subject, hours, days,
deadline, confidence, stuck topic)
System prompt: "Generate a 7-day study plan. One specific narrow topic
per session block. Basics before advanced. Rotate subjects if multiple
were requested. Size session count to daily hours available. Back-plan
from deadline if given. Return ONLY valid JSON, no markdown fences."
Output: structured 7-day JSON plan saved to study_plans table

**Call Type 3 — Teach (Learn phase)**
Input: today's topic, student profile, session length, their language
System prompt: "You are Zorvai, a patient voice teacher. Teach [topic]
to a [grade/field] student in [country] in [language]. Use the Socratic
method where possible — ask guiding questions rather than lecturing. Pace
yourself to fit [X] minutes. Do not quiz them yet — that comes later.
If they ask a question, answer it, then return to the teaching flow."
Output: teaching content delivered by voice

**Call Type 4 — Challenge Generation**
Input: topic + recall transcript (what student said, or didn't say)
System prompt: "Generate exactly 4 quiz questions based on [topic].
Use the recall transcript to identify what the student got right and
what they seemed to miss. Level 1: basic fact. Level 2: why/how.
Level 3: application to a new situation. Level 4: connects to a prior
topic from their session history if possible, otherwise a harder
application. Return ONLY valid JSON."
Output: 4 structured questions with type labels

**Call Type 5 — Feedback Evaluation**
Input: the 4 Q&A pairs from the Challenge phase
System prompt: "Evaluate the student's answers fairly and kindly.
Identify what they clearly understood, what they missed, and 1-3
specific things to review before the next session. Determine whether
they have grasped the core concept well enough to advance.
Return ONLY valid JSON with: understood[], missed[], review[],
pass_threshold_met: true/false"
Output: structured feedback saved to sessions table

**Call Type 6 — Chatbot (always-on)**
Input: student's question (text/photo) + full student profile +
last 5 questions from question_history
System prompt: "You are Zorvai, a patient study coach for [name],
a [grade/field] student in [country] studying in [language]. You know
this student — their recent sessions covered [topics], and they've been
struggling with [weak topics]. Answer their question using the Socratic
method — guide them toward the answer rather than giving it directly.
Reference their recent sessions where relevant. Keep your response
readable on a phone screen."
Output: personalized Socratic answer

---

## 12. API ROUTES

**Onboarding**
POST /api/onboarding/advance — advances question state machine
POST /api/onboarding/complete — saves full profile, triggers plan generation

**Study Plan**
POST /api/plan/generate — generates 7-day plan
POST /api/plan/regenerate — quick regen with delta questions

**Sessions**
POST /api/session/start — creates session record, returns topic + context
POST /api/session/teach — Learn phase content
POST /api/session/recall — stores recall transcript
POST /api/session/challenge — generates 4 challenge questions
POST /api/session/evaluate — grades answers, returns feedback, closes session
POST /api/session/checkin — stores mood, runs escalation check

**Chatbot**
POST /api/chat — handles text, photo, or voice note input

**Progress**
GET /api/progress/student/:id — full progress data (used by both dashboards)
GET /api/progress/guarantee/:id — guarantee window status

**Spaced Repetition**
GET /api/reviews/due/:id — returns due review sessions for today
POST /api/reviews/complete/:id — marks review complete, schedules next

**Notifications**
POST /api/notify/missed-session — called by a daily cron job at 9pm
POST /api/notify/digest — called by weekly cron job on Sundays
POST /api/notify/escalation — called when checkin triggers escalation

**Payments**
POST /api/payments/stripe/webhook — handles Stripe events
POST /api/payments/razorpay/webhook — handles Razorpay events
POST /api/payments/guarantee/claim — processes guarantee claim

**Auth**
POST /api/auth/signup — creates user + role-specific profile
POST /api/auth/login — returns session token
POST /api/auth/link-parent — links parent account to student account

---

## 13. COST PER ACTION

| Action | API cost |
|---|---|
| Full onboarding conversation | ~$0.02 |
| 7-day plan generation | ~$0.016 (one-time) |
| One Learn phase (10-20 mins of teaching) | ~$0.006-0.012 |
| Challenge generation (4 questions) | ~$0.008 |
| Feedback evaluation | ~$0.006 |
| Full Learn→Recall→Challenge→Feedback cycle | ~$0.03-0.04 |
| Chatbot Q&A (text) | ~$0.006 |
| Chatbot Q&A (with photo) | ~$0.008 |
| **Monthly cost per active student (daily sessions)** | **~$0.90-1.20/month** |

Voice: $0 extra — Browser Web Speech API
Email: $0 up to 3,000/month (Resend free tier)
Database: $0 up to 500MB (Supabase free tier)
Hosting: $0 up to generous limits (Vercel free tier)

**Your real financial risk is not API cost — it's guarantee refund payouts.**
Track the guarantee claim rate as a primary business metric from day one.

---

## 14. FRONTEND — PAGE BY PAGE

**Public pages (before login)**
/ — Landing page (waitlist offer, guarantee badge, how it works, founder story)
/parents — Parent-specific landing page
/students — Student-specific landing page

**Auth pages**
/signup/student — Student signup flow
/signup/parent — Parent signup flow
/login — Shared login

**Onboarding (post-signup, pre-dashboard)**
/onboarding — Conversational onboarding flow (chatbot-style UI)
/baseline-quiz — Baseline assessment

**Student app**
/dashboard — Main student dashboard
/session — Live voice session (Learn → Recall → Challenge → Feedback)
/chat — AI chatbot
/plan — 7-day study plan view
/progress — Progress tracker + spaced repetition schedule
/settings — Language, notification preferences, subscription

**Parent app**
/parent/dashboard — Parent overview dashboard
/parent/progress — Full child progress view
/parent/guarantee — Guarantee status + claim
/parent/billing — Plan management
/parent/settings — Notification preferences, linked child

---

## 15. SECURITY AND COMPLIANCE

- All API routes authenticated via Supabase JWT
- Row Level Security enabled on all tables
- Parents can only see data for linked student accounts
- Student check-in content never exposed through parent-facing API routes
- Service role key server-side only, never in client code
- Stripe and Razorpay webhook signature verification required
- GDPR-compliant data deletion on request
- COPPA-aware: students under 13 require parent account to be created
  first and linked before student can access the product

---

## 16. WHAT'S NOT IN V1 (EXPLICITLY OUT OF SCOPE)

- Custom voice pipeline (ElevenLabs/Whisper) — browser speech only for MVP
- Continuous video monitoring — photo check-ins only
- Multiple children per parent on the weekly plan
- Automated refund processing — manual review for first 50 claims
- Multi-language UI (the AI teaches in the student's language,
  but the UI itself is English-first for MVP)
- Native mobile apps (iOS/Android) — web app only, PWA-capable
- Group study sessions
- Teacher/tutor accounts
