# TRD — Zorvai: AI Study Coach (Web App)

## 1. Tech stack
| Layer | Choice | Why |
|---|---|---|
| Frontend + backend | Next.js (App Router) | One codebase for both the Student and Parent apps and the API routes |
| Database | Supabase (Postgres) | Managed, real persistence, RLS available |
| AI — primary | Claude API (Anthropic) | Text + vision in one call, strong instruction-following for phase-specific prompts |
| AI — fallback chain | DeepSeek, Qwen (Alibaba), GLM (Zhipu), Kimi (Moonshot) | OpenAI-compatible endpoints; keeps the coaching cycle alive if Claude has an outage |
| Voice (MVP) | Browser Web Speech API | Free, no custom pipeline, supports enough languages for a pilot |
| Push notifications | Firebase Cloud Messaging | Missed-session alerts, weekly digest (push channel) |
| Email | Resend or SendGrid | Weekly digest (email channel) — Firebase does not send email |
| Payments | eSewa/Khalti/UPI/Stripe depending on launch market | Match local payment norms |
| Hosting | Vercel (app) + Supabase (DB) | Minimal DevOps for MVP scale |
| Scheduled jobs | Vercel Cron (or Supabase Edge Functions + pg_cron) | Missed-session check, weekly digest send |
| UI | Motion (`motion` npm package, import from `motion/react`) + ui-ux-pro-max skill | Animation and component layer on top of Next.js |

## 2. Architecture
Student app and Parent app are both Next.js pages talking to the same
backend. The backend is the single hub — it's the only thing that talks to
Supabase, the AI provider layer, Firebase, the email service, and the
payment gateway. Neither client app calls those services directly.

All AI calls route through one internal engine (`lib/ai/`), never directly
through a provider SDK from an API route. See Section 4.

## 3. AI pipeline — one call type per phase, not one generic "chat"
Every AI interaction in the product is one of six distinct call types, each
with its own system prompt:

1. **Plan generation** — input: country, field, subject(s), study hours/day, available days, deadline, confidence level. Output: structured JSON, a 7-day list of narrow topics sequenced basics-first. Runs once at onboarding, regenerable on request.
2. **Teach (Learn phase)** — input: today's topic, student's profile, session length. Output: a paced explanation, Socratic where possible, sized to fit the time the student chose.
3. **Recall listener** — input: the student's spoken explanation (transcribed). Does not grade or interrupt — captures the transcript as context for the next call.
4. **Challenge generator** — input: topic + the Recall transcript. Output: exactly 4 questions, increasing difficulty (fact → understanding → application → mixed-with-prior-topic).
5. **Feedback evaluator** — input: the 4 Q&A pairs. Output: structured JSON — understood / missed / review-next, plus a pass/fail on mastery.
6. **Chatbot** — input: any ad-hoc student question (text or photo) + saved profile and recent history. Output: a personalized, Socratic answer.

All six share the same underlying student-profile context (country, field,
subject, language, history) but use distinct prompts and distinct output
schemas — this is the actual product, not the model underneath it.

## 4. AI provider engine — fallback architecture

**Principle:** every route calls one internal function, never a provider SDK
directly.

```
lib/ai/
  index.ts              // runAICall(callType, payload) — the only entrypoint routes use
  config.ts             // per-call-type provider chain + timeouts
  adapters/
    anthropic.ts         // Claude
    openaiCompatible.ts  // shared adapter: DeepSeek, Qwen, GLM, Kimi (same wire format, different baseURL/key)
  schema.ts              // Zod schemas per call type, validated against ANY provider's output
```

**Default chain for the five coaching/plan call types** (Plan, Teach, Recall,
Challenge, Feedback, Chatbot):
1. Claude (primary)
2. DeepSeek
3. Qwen
4. GLM or Kimi

Each provider is tried in order with a short timeout; on failure or on a
response that fails Zod validation, the engine falls through to the next
provider. A circuit breaker skips a provider for a cooldown window after
repeated failures rather than retrying it on every request.

**Exception — the check-in / escalation call type is pinned separately.**
`/api/checkin` does not use the full five-provider chain. It uses a short,
deliberately conservative provider list (Claude + one vetted fallback only).
Reasons:
- This route handles a minor's mood/distress language — the private-by-default
  promise in PRD Section 6 depends on tight control over where that text goes.
- Data residency and regulatory posture differ across providers and
  jurisdictions; **this needs a compliance check against your actual launch
  market before you wire any provider into this specific route** — treat this
  as an open legal/privacy question, not a default to inherit from the other
  five call types.
- This route's prompt logic also needs review by someone with real expertise
  in adolescent mental health before launch (carried over from the prior TRD
  — still true, still unresolved).

**Logging:** every AI call writes to `ai_provider_logs` (call type, provider
used, latency, success/fail, error if any). This is what makes provider
failures visible and gives you real numbers for the cost-tracking concern in
Section 6.

## 5. Data model (Postgres / Supabase)

| Table | Purpose |
|---|---|
| `students` | profile: name, country, field, language, study hours/day, timezone |
| `parents` | profile: name, notification_preference |
| `student_parent_links` | one student ↔ one parent (v1) |
| `plans` | one active 7-day plan per student, regenerable |
| `plan_topics` | ordered topics within a plan, status (pending/mastered/re-queued) |
| `sessions` | one row per study session: student_id, topic_id, phase, started_at, ended_at, status |
| `session_results` | session_id, recall_transcript, challenge_qas (jsonb), understood, missed, review_next, passed |
| `checkins` | student_id, session_id (nullable), mood_text, escalation_triggered, created_at |
| `guarantee_tracking` | student_id, baseline_score, follow_up_score, agreed_sessions, status, updated_by (manual v1), updated_at |
| `notification_preferences` | parent_id, push_enabled, email_enabled |
| `fcm_tokens` | parent_id, token, device_info, created_at (a parent may have multiple devices) |
| `ai_provider_logs` | call_type, provider, latency_ms, success, error, created_at |

`sessions.phase` needs an explicit state machine (`learn` → `recall` →
`challenge` → `feedback` → `done`) since the phase-specific routes below are
stateless per-call and rely on this row to know where a session is.

## 6. Workflow — step by step

**Student, first time:**
1. Sign up → onboarding questions → baseline quiz → Plan Maker questions → 7-day plan generated and shown
2. Starts a session → sets session length → Learn phase begins
3. Learn ends → Recall (voice, AI silent) → Challenge (4 questions) → Feedback shown
4. If topic not mastered, it's re-queued; otherwise plan advances to next topic
5. Between sessions: chatbot available anytime for ad-hoc questions

**Parent, first time:**
1. Sign up → link to student account → set notification preference (push/email/both) → payment
2. Views dashboard: session history, understood/missed/review areas, guarantee status
3. Receives digest weekly via chosen channel(s), or checks dashboard manually
4. Gets a missed-session push/email if the student hasn't started their session by end of day (student's local timezone)

## 7. API endpoints
| Route | Purpose |
|---|---|
| `POST /api/onboarding` | Advances the onboarding/Plan-Maker question state machine |
| `POST /api/study-plan` | Generates (or regenerates) the 7-day plan |
| `POST /api/session/teach` | Learn-phase content for the current topic |
| `POST /api/session/recall` | Stores the Recall transcript |
| `POST /api/session/challenge` | Generates the 4 Challenge questions |
| `POST /api/session/evaluate` | Grades Challenge answers, returns Feedback, logs to `session_results` |
| `POST /api/chat` | Chatbot Q&A (text or photo) |
| `GET /api/progress` | Returns a student's session history — used by both Student and Parent dashboards |
| `POST /api/checkin` | Logs the mood check-in; runs escalation-detection logic (conservative provider list — see Section 4) |
| `POST /api/notifications/register-token` | Registers/refreshes an FCM token for a parent device |
| `PATCH /api/notifications/preferences` | Updates a parent's push/email preference |
| `POST /api/cron/missed-session-check` | Scheduled job: finds students who haven't started today's session, fires the alert |
| `POST /api/cron/weekly-digest` | Scheduled job: builds and sends the weekly digest via each parent's chosen channel(s) |

## 8. Cost per action (rough estimate, provider-dependent)
Costs vary by which provider in the chain actually served the call — Claude
is the highest-quality/highest-cost option, the OpenAI-compatible fallbacks
are generally cheaper. Track actual per-provider cost via `ai_provider_logs`
rather than assuming Claude pricing for every call once the fallback chain is
live.

**The bigger cost to model is still guarantee payout risk, not API spend.**
A refund on a subscription because the guarantee wasn't met is a much larger
line item than any single session's AI cost — track this explicitly via
`guarantee_tracking`, don't assume it away.

## 9. Security & safety
- Standard: service role key server-side only, RLS enabled, payment webhook signature verification.
- Firebase server key and all AI provider keys live server-side only — never exposed to either client app.
- **Escalation logic is a product requirement, not just a safety checkbox.** `/api/checkin` needs real, tested logic for recognizing when a student's language suggests something beyond ordinary stress, a clear and disclosed action when it triggers, and a clear boundary for when it does *not* trigger, so ordinary "I'm stressed about this exam" doesn't get over-escalated.
- This logic — and the provider choice backing it — should be reviewed by someone with real expertise in adolescent mental health, and checked against data-residency/privacy requirements for your launch market, before launch.

## 10. Deployment
Push to GitHub → connect to Vercel → set environment variables (Supabase
keys, Anthropic key, DeepSeek/Qwen/GLM/Kimi keys, Firebase server key,
Resend/SendGrid key) → create the Supabase project and run the schema →
register the production URL wherever the payment gateway and Firebase need a
webhook/callback.
