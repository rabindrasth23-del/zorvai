# Zorvai — Project Context (read this first every conversation)

> This file captures the full architectural picture so you don't need to re-read PRD_4.md, TRD_3.md, or Checkin escalation.md each time. Updated as decisions are made.

## What Zorvai is
An AI study coach web app for students (ages ~13-18). Structured Learn → Recall → Challenge → Feedback cycle, not a generic chatbot. A separate parent login tracks progress and guarantee status.

## Tech Stack
| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript, `src/` dir) |
| Database | Supabase Postgres (project: `supabase-zorvai`, ref: `kndoposozkemopyuavgb`, region: `ap-south-1`) |
| Auth | Supabase Auth — `students.id` and `parents.id` FK to `auth.users(id)`. No custom auth tables. |
| AI primary | Claude (Anthropic SDK) |
| AI fallbacks | DeepSeek, Qwen, GLM, Kimi — all via OpenAI-compatible adapter with custom baseURL/key |
| Animation | `motion` (npm package, import from `motion/react`) — installed but NOT used until frontend phase |
| Push notifications | Firebase Cloud Messaging — **NOT YET CONFIGURED** (remind user at Phase 4) |
| Email | Resend (or SendGrid) |
| Hosting | Vercel (app) + Supabase (DB) |
| Cron | Vercel Cron |

## Supabase Connection
- API URL: `https://kndoposozkemopyuavgb.supabase.co`
- DB Host: `db.kndoposozkemopyuavgb.supabase.co`
- Postgres: 17.6.1.155
- Status: ACTIVE_HEALTHY
- Supabase SSR helpers already in `src/lib/supabase/` (client.ts, server.ts, middleware.ts)

## Key Architectural Decisions (locked)

### Auth
- Supabase Auth. `students.id` and `parents.id` are `uuid PK REFERENCES auth.users(id)`.
- No standalone email/password tables.

### AI Provider Engine (`src/lib/ai/`)
- Single entrypoint: `runAICall(callType, payload)` — no route calls a provider SDK directly.
- Per-call-type provider chains in `config.ts`.
- Zod validation on every response. Circuit breaker (3 failures → 60s cooldown).
- Logging every call to `ai_provider_logs`.

### Provider Chains
| Call type | Chain |
|---|---|
| plan, teach, recall, challenge, feedback, chatbot | Claude → DeepSeek → Qwen → GLM → Kimi |
| **checkin** | Claude → `CHECKIN_FALLBACK_PROVIDER` (UNSET — throws if called. Compliance decision pending.) |

### 6 AI Call Types
1. **Plan generation** — 7-day study plan from student profile + Plan Maker answers
2. **Teach** — Socratic lesson paced to session length
3. **Recall listener** — transcript capture, no AI output
4. **Challenge generator** — exactly 4 graduated-difficulty questions
5. **Feedback evaluator** — understood/missed/review_next/passed
6. **Chatbot** — ad-hoc Q&A with profile context
7. **Check-in** — 3-tier mood classification (0/1/2) + rationale + session adjustment + stressor_may_involve_linked_adult

### Sessions: Two Columns
- `phase`: state machine — `learn` → `recall` → `challenge` → `feedback` → `done`
- `status`: lifecycle — `active` / `completed` / `abandoned`
- A session can be `phase=learn, status=abandoned` (student dropped off mid-session). This distinction matters for the missed-session cron.

### Plans: Both
- `raw_response jsonb` — full AI output for debugging/regeneration
- Normalized `plan_topics` rows — all queries go through these

### Check-in Escalation (Phase 3.5)
- 3 tiers: 0 (ordinary stress), 1 (elevated concern), 2 (immediate risk language)
- Model returns ONLY: `{ tier, rationale, suggested_session_adjustment, stressor_may_involve_linked_adult }`
- Model does NOT generate: notifications, Tier 2 student-facing messages
- Fixed placeholder copy in `src/lib/checkin/messages.ts` — marked `// TODO: real copy pending expert review`
- Entire notification path gated behind `ESCALATION_LOGIC_ENABLED=false`
- Flag OFF: still log mood_text + tier, take no action
- `stressor_may_involve_linked_adult = true` → always routes to `checkin_review_queue`, never auto-notifies, regardless of tier

### Missed-Session Cron
- An abandoned session (started but dropped) counts as "tried" — only students with NO session for the day get alerted. (User-approved behavior.)

## Database Tables (13)
students, parents, student_parent_links, plans, plan_topics, sessions, session_results, checkins, checkin_review_queue, guarantee_tracking, notification_preferences, fcm_tokens, ai_provider_logs

## Indexes (beyond FK indexes)
- `sessions(student_id, started_at)` — progress queries, missed-session cron
- `checkins(student_id, created_at)` — parent dashboard recent-checkin lookups
- `plan_topics(plan_id, status)` — progress queries filter by status

## Enums
- `session_phase`: learn, recall, challenge, feedback, done
- `session_status`: active, completed, abandoned
- `topic_status`: pending, mastered, re-queued
- `notification_status_type`: not_applicable, queued_for_review, sent, send_failed
- `review_queue_status`: pending, resolved

## API Routes (build order)
1. `POST /api/study-plan`
2. `POST /api/session/teach`
3. `POST /api/session/recall`
4. `POST /api/session/challenge`
5. `POST /api/session/evaluate`
6. `POST /api/checkin` (Phase 3.5)
7. `POST /api/chat`
8. `GET /api/progress`
9. `POST /api/notifications/register-token`
10. `PATCH /api/notifications/preferences`
11. `POST /api/cron/missed-session-check`
12. `POST /api/cron/weekly-digest`

## Pending / Not Yet Done
- Firebase project not created/configured — needed for FCM in Phase 4. User will be reminded.
- `CHECKIN_FALLBACK_PROVIDER` — stays unset until user explicitly sets it after compliance review.
- Expert review of escalation logic before `ESCALATION_LOGIC_ENABLED` flips to `true`.
- Real crisis-resource directory per launch country (don't hardcode placeholder numbers).
- Final prompt wording — first drafts written, user iterates.
- Payment integration (eSewa/Khalti/UPI/Stripe) — not in scope for current phases.

## Build Rules
- Backend only. No frontend until user explicitly says so.
- Show migration SQL before running.
- Show `runAICall('checkin', ...)` contract before wiring route logic.
- Show sample request/response after each Phase 3 route before moving to next.
- Don't batch review checkpoints — show each as completed.
- If anything isn't specified in PRD/TRD/escalation doc/plan — stop and ask.
