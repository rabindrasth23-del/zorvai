# UI/UX Design Specification v2 — Zorvai
*For Antigravity build. Plain-language descriptions throughout — every
screen entry explains what it's for and why, not just what's on it, so
anyone reading this (design, eng, or a non-technical stakeholder) can
follow it without translation.*

Three surfaces, one design system: **Student app**, **Parent dashboard**,
**Admin panel** (new in v2). Each gets its own section below.

---

## 1. Design Philosophy

Zorvai is used by stressed students and worried parents. The UI should
feel warm and encouraging, not clinical or corporate — like a good tutor's
study room, not a spreadsheet. "Pretty" here means: soft rounded shapes,
generous white space, a friendly accent color, small celebratory moments
(not gamified-to-death, just enough to feel good when a topic is
mastered) — while staying calm and legible for genuinely difficult study
content like equations and long explanations.

Guiding rule: **the AI should sound like a patient, encouraging tutor —
never like a corporate dashboard.** Copy is written for a 13-year-old and
a working parent to both understand on first read. No jargon like
"mastery vector," "session throughput," or "escalation trigger" ever
reaches the screen — that language stays internal (see Admin section).

---

## 2. Design System

### Color tokens
| Token | Value | Usage |
|---|---|---|
| Brand primary | `#FF6B5A` (warm coral) | Primary CTAs, active states, "start session" button |
| Brand secondary | `#2FB8AC` (teal) | Secondary accents, Parent-dashboard highlights (visually distinct from Student) |
| Success | `#22B573` | Mastered topic, correct answer, guarantee "on track" |
| Warning | `#F0A93B` | Needs review, plan behind schedule |
| Danger | `#E5484D` | Destructive actions, missed sessions, guarantee "at risk" |
| Ink 900 | `#20222B` | Primary text |
| Ink 600 | `#666B7A` | Secondary text |
| Surface | `#FFFFFF` | Cards |
| Canvas | `#FAF9F6` (warm off-white, not stark white) | App background |
| Border | `#ECE9E3` | Dividers |

Student app uses coral as primary. Parent dashboard uses teal as primary
(same components, different accent) so a parent always knows visually
which surface they're in if they ever share a screen with their kid.
Admin panel uses a neutral slate primary (`#4B5566`) — deliberately less
"pretty," since it's an internal tool where clarity beats charm.

### Typography
- Headings: rounded-friendly sans (e.g., "Quicksand" or "Nunito" for
  Student surface headings only — this is where "pretty" shows up most).
- Body text everywhere (Student, Parent, Admin): a plain, highly legible
  sans (e.g., "Inter") — 16px minimum in any lesson or explanation
  content, never smaller, since this is read under stress.
- Equations/code: monospace, 16px minimum, with a "copy" affordance.

### Components
- Buttons: filled primary / outlined secondary / text tertiary, 44×44px
  minimum hit target, rounded 12px corners (softer than a typical SaaS
  8px — part of the "pretty" feel).
- Cards: 16px radius, 1px border, soft shadow only on hover/focus, not
  at rest (keeps the page calm).
- Progress rings/bars: always paired with a plain-language label
  ("3 of 7 topics mastered this week"), never color-only.
- Celebratory micro-moment: a single small confetti-burst animation
  (under 1 second, dismissible, respects reduced-motion) the first time
  a topic passes the mastery gate in a session — not on every correct
  answer, to avoid gamification fatigue.
- Toasts/modals: same rules as standard practice — errors persist until
  resolved, modals only for single focused tasks.

---

## 3. Information Architecture

```
Zorvai
├── Student App
│   ├── Onboarding + Baseline Quiz + Plan Maker
│   ├── Home (today's session, plan preview)
│   ├── Study Session (Learn → Recall → Challenge → Feedback)
│   ├── Chatbot (always-on, text/photo)
│   ├── Material Library (upload notes/slides/past papers)
│   ├── Mock Exams
│   ├── Review Deck (spaced repetition)
│   ├── My Progress
│   └── Check-in (session-start mood, private by default)
│
├── Parent Dashboard
│   ├── Onboarding + Link to Student
│   ├── Overview (guarantee status, this week at a glance)
│   ├── Session History (detail, not raw transcripts)
│   ├── Guarantee Tracker (baseline → sessions → follow-up)
│   ├── Notification Preferences
│   └── Billing / Subscription
│
└── Admin Panel (internal, new in v2)
    ├── Student & Parent Account Management
    ├── Guarantee Queue (manual tracking + refund workflow)
    ├── Escalation Review Queue (check-in safety flags)
    ├── Content Quality Queue (AI-generated content flagged by users)
    ├── Usage & Cost Dashboard
    ├── Material Moderation (uploaded file review, copyright flags)
    └── Feature Flags / Config
```

---

## 4. Student App — Screens

### 4.1 Onboarding Wizard
5–6 step wizard, progress dots at top, one question per screen so it
never feels like a form. Steps map directly to PRD Section 3: name,
country, study hours/day, field, subject(s), language, baseline quiz,
then Plan Maker follow-ups (deadline, available days, confidence 1–5,
stuck topic, focus time). Last step: optional Material Upload with
explicit skip path ("Start without notes — you can add these anytime").

*Copy example:* "How confident do you feel in this subject right now?"
with 5 friendly emoji-style markers (not clinical 1–5 radio buttons) —
this is the kind of moment where "pretty" and "understandable" are the
same thing: a nervous 14-year-old should be able to answer without
overthinking the UI.

### 4.2 Home
Single most important screen. Top: today's session card — subject,
topic, estimated length, one big "Start session" button in coral. Below:
a horizontal 7-day plan strip (today highlighted, past days show
mastered/needs-review dots). If a Review Deck item is due, a small
secondary card: "2 topics ready for a quick review" — clearly visually
subordinate to today's main session so it never competes with the core
loop.

### 4.3 Study Session (Learn → Recall → Challenge → Feedback)
One phase per screen, a slim progress indicator at top showing which of
the 4 phases you're in — never a raw percentage, always "Learn → Recall →
Challenge → Feedback" as labeled steps so the student always knows what
kind of thinking is being asked of them right now.
- **Learn:** clean reading/listening view. If grounded in uploaded
  material, a small "from your notes, p.4" chip appears next to the
  relevant section — clickable to see the source excerpt.
- **Recall:** large mic button, calm waveform animation while listening,
  explicit "I'm just listening, no notes needed" reassurance text.
- **Challenge:** one question at a time, 4 total, a small dot-tracker
  (●●○○) — never all 4 shown at once, keeps focus.
- **Feedback:** three clearly labeled sections — "What you got," "What to
  review," "Next up" — plus the mastery-gate outcome stated in plain
  language: "You've got this — moving to the next topic" or "Let's go
  over this once more before we move on" (never "FAILED" or a red X).

### 4.4 Chatbot
Persistent floating entry point from anywhere in the app. Photo capture
button prominent for Snap & Solve. Answer hierarchy: short direct answer
first, "why" explanation below, hint-first toggle for math/science
problems clearly visible as a switch, not buried in settings.

### 4.5 Material Library
Card grid, one card per uploaded file: thumbnail/icon, filename, status
chip (queued/extracting/ready/failed), subject tag. Empty state: "Add
your class notes and Zorvai will teach straight from them" with upload
CTA and a clearly secondary "skip, teach me the standard way" link —
never guilt the student for not uploading.

### 4.6 Mock Exams
Subject picker → timer/length choice → clean timed-exam UI (question
count, time remaining, no distracting chrome). Results screen: score,
then a list of missed topics each linking directly back into that
topic's Learn content — the fix is always one tap away from the mistake.

### 4.7 Review Deck
Simple flashcard-flip interaction, short queue ("4 quick reviews
today"), explicitly separate visual style from the main session cards so
it never gets confused with today's real session — smaller cards, lighter
weight, positioned below the fold on Home.

### 4.8 My Progress
Subject-by-subject mastery bars, a simple trend line of mock-exam scores
over time, streak count (small, not the focus). Copy avoids "you failed"
language anywhere — "review again" instead.

### 4.9 Check-in
Appears at session start only: "How are you feeling about studying
today?" with a few friendly options plus free text. If escalation logic
triggers, the student sees calm, clear language: "It sounds like things
are tough right now. I'm going to let [parent name] know so they can
check in with you — you're not in trouble." Never silent, never
alarming.

---

## 5. Parent Dashboard — Screens

### 5.1 Overview
The single most important thing a busy parent needs, above the fold:
**guarantee status** as a plain-language badge — "On track," "Needs a
look," or "Review recommended" — never a raw score. Below: this week's
sessions completed vs. planned, one sentence per subject on how it's
going.

### 5.2 Session History
List of past sessions with date, subject, topic, and the same
Feedback summary (what they got / what to review) the student saw — full
study detail, by design (PRD Section 2: parents see study progress in
full).

**What parents explicitly do NOT see, stated on-screen:** day-to-day
check-in/mood content. A visible, permanent note on this screen: *"Zorvai
keeps [student]'s daily check-ins private, the same way a school
counselor would. If something in a check-in raises real concern, you'll
be notified directly — separately from this dashboard."* This is not
buried in settings — it's on the main history screen, because the trust
boundary only works if it's visible where a parent would naturally look
for it.

### 5.3 Guarantee Tracker
Visual: baseline score → sessions completed (progress bar toward the
agreed number) → follow-up quiz (locked until due). Plain-language
explainer permanently visible: "If [student] doesn't improve by the
agreed amount after [N] sessions, you get a refund — no forms, just
message support."

### 5.4 Notification Preferences
Simple choice: weekly digest email, missed-session alerts (on by
default, one alert per missed day — PRD explicitly rejects guilt-trip
streak nagging), or dashboard-only. Single toggle screen, not a settings
maze.

### 5.5 Billing
Standard subscription management — plan, payment method, next billing
date, cancel path that's not hidden.

---

## 6. Admin Panel — Screens *(new in v2)*

This is the internal tool your team uses to run Zorvai day-to-day. It
does not need to be "pretty" — it needs to be fast and unambiguous.

### 6.1 Student & Parent Account Management
Search/filter accounts, view linked parent-student pairs, impersonate
(with audit log) for support debugging, manually adjust subscription
status.

### 6.2 Guarantee Queue
**This is the most business-critical admin screen.** A list of every
student approaching or past their agreed follow-up checkpoint, with:
baseline score, current session count, agreed session target, follow-up
score (once taken), and a computed "met guarantee / did not meet" flag.
Since v1 refund processing is manual by design (PRD Section 8), this
screen is where an admin reviews the case and clicks "Approve refund" —
which logs the decision and hands off to the payment gateway, but never
auto-fires. A running total of "refunds issued this month" against
revenue, so the guarantee's real cost is visible, not assumed away (TRD
Section 6 flagged this as the actual financial risk to watch, not API
spend).

### 6.3 Escalation Review Queue
When a check-in triggers the escalation logic (TRD Section 7), it lands
here — not just in a parent notification. An admin/reviewer sees: the
triggering check-in text, the student, the parent-notification status
(sent/pending), and a resolution field. This exists so escalations are
auditable and reviewable by someone with the training to judge whether
the detection logic is working, not just fired-and-forgotten. Flagged as
needing a workflow reviewed by someone with real adolescent
mental-health expertise before launch — this screen is the place that
review actually happens on an ongoing basis, not just once.

### 6.4 Content Quality Queue
When a student marks a Chatbot answer, lesson, or Snap & Solve
explanation as unhelpful or wrong, it queues here with the original
question, the AI's answer, and the student's flag reason. Lets the team
catch systematic AI errors (a wrong method being taught repeatedly)
before they affect the guarantee metric at scale.

### 6.5 Usage & Cost Dashboard
Per-call-type cost tracking matching TRD Section 7's cost table — Teach,
Challenge, Chatbot, Mock Exam, ingestion — with daily/weekly spend
trends, so a cost spike (e.g., students suddenly uploading huge PDFs) is
visible before the bill is.

### 6.6 Material Moderation
Spot-check queue for uploaded materials — flags for potential copyright
issues (e.g., a full scanned textbook rather than class notes) or
inappropriate content, since uploads are untrusted user content (TRD
Section 8).

### 6.7 Feature Flags / Config
Toggle Phase 2/3 features (oral mock exams, audio recap, curriculum
mapping) per user cohort for staged rollout, without a code deploy.

---

## 7. UX Copy Guidelines — Zorvai-specific

| Situation | Recommended copy |
|---|---|
| Start session | "Start today's 20-minute session" |
| Topic mastered | "You've got this — moving to the next topic" |
| Topic needs another pass | "Let's go over this once more before we move on" |
| Guarantee on track (parent) | "On track — [student] is on pace for the agreed improvement" |
| Guarantee needs attention (parent) | "Needs a look — a quick review with [student] could help" |
| Check-in escalation (student) | "It sounds like things are tough right now. I'm going to let [parent] know so they can check in — you're not in trouble." |
| Check-in boundary (parent, always visible) | "Zorvai keeps daily check-ins private, the same way a counselor would, unless something raises real concern." |
| Missed session alert (parent) | "Heads up — [student] hasn't started today's session yet." (single alert, no streak-shaming) |
| No uploaded material yet | "Add your class notes and I'll teach straight from them — or skip, and I'll use the standard course material." |
| Snap & Solve low-confidence OCR | "I might have misread part of this — check the highlighted bit before I solve it." |

Rules: short sentences, plain verbs (study/practice/review/explain), no
clinical or corporate jargon anywhere a student or parent sees it, never
blame the student for a missed session, never say "failed" — say
"review again."

---

## 8. Responsive & Accessibility (brief)
- Mobile-first for Student surface (most usage will be on phones between
  sessions); Parent and Admin can be desktop-first.
- 16px minimum body text everywhere, WCAG AA contrast minimum on every
  token pairing above, all interactive elements keyboard-navigable,
  reduced-motion respected on the confetti/celebration moment.
- Voice UI (Recall phase, Chatbot) always has a text-input fallback for
  accessibility and for noisy environments.

---

## 9. Note to Antigravity (build priority)
Build order matches the PRD v2 phasing: Student Home + Study Session
cycle first (this is the whole product if nothing else ships), then
Parent Overview + Guarantee Tracker (this is what sells the guarantee
promise), then Material Library, then the Admin Guarantee Queue and
Escalation Review Queue (these two are not optional polish — the
guarantee and the check-in safety policy are both real commitments made
in the PRD, and the admin tools that make them operable need to exist
before real users hit them, not after).