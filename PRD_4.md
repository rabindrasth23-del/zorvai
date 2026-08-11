# PRD — Zorvai: AI Study Coach (Web App)

## 1. Concept
A web app where a student studies any subject with an AI voice/text coach
that runs a structured Learn → Recall → Challenge → Feedback cycle instead
of just answering questions. A separate parent login tracks progress and
guarantee status. Backed by a real, measurable improvement guarantee.

## 2. Roles

### Student
- Runs study sessions (voice, self-set length)
- Uses the always-on chatbot for ad-hoc questions
- Sees their own progress and history
- Private check-in / how-they're-feeling layer (see Section 6)

### Parent
- Linked to one (v1) student account
- Sees study progress and guarantee status — not the student's private check-in content (see Section 6 for the exact boundary)
- Manages subscription/billing
- Chooses how they're updated: **push notification, email digest, both, or dashboard-only** (v1 default: both push + email, changeable anytime)

## 3. Onboarding questions

**Student:**
1. What's your name?
2. Which country are you studying in?
3. How many hours can you realistically study per day?
4. What field are you studying? (School, Engineering, Medicine, Programming, exam prep, etc.)
5. Which subject do you want to start with — or say "every subject" for a full 7-day plan?
6. What language should I teach in?
7. Short baseline quiz (5-10 questions) — establishes the "before" number the guarantee is measured against

**Plan Maker follow-up questions** (asked right after onboarding, feeds the 7-day plan):
8. Do you have an exam or deadline coming up? When?
9. Which days of the week can you actually study? (not everyone studies 7/7)
10. On a scale of 1-5, how confident do you feel in this subject right now?
11. Is there a specific topic you're already stuck on? (optional — seeds Day 1 if given)
12. What time of day do you focus best? (used for reminder timing, not enforced)

**Parent:**
1. Your name
2. Your child's name / which student account to link to
3. What are you hoping to see improve?
4. How do you want updates? (push notification, email digest, both, or check the dashboard yourself)
5. Payment details / plan selection

## 4. Core features (v1 — nothing beyond this list)

1. **Chatbot** — always-available, text or photo input, personalized using the student's saved profile and session history. This is the "ask me anything, anytime" surface.
2. **Voice study sessions** — the Learn → Recall → Challenge → Feedback cycle (see Section 5). Student sets session length; the Learn phase paces itself to fit.
3. **Check-in layer** — brief mood check at session start; AI can acknowledge stress and offer a lighter session, but does not counsel. Escalates to a disclosed policy if something sounds serious (see Section 6). Ships with v1, not deferred.
4. **Progress dashboard** — student sees their own full history; parent sees the same underlying data plus a plain-language guarantee status ("on track" / "needs review").
5. **Missed-session alert** — if a student doesn't start their planned session by end of day (student's local time), the parent gets one notification through their chosen channel(s) — push, email, or both ("heads up, [name] hasn't studied today"). One alert, not a guilt-trip streak counter — nagging notifications get muted within a week and stop being useful.
6. **Weekly parent digest** — delivered via push and/or email per the parent's preference: sessions completed, topics mastered vs. re-queued, guarantee status. Cadence is weekly regardless of channel; channel is the only thing that's configurable in v1.

## 5. The Learn → Recall → Challenge → Feedback cycle
1. **Learn** — AI teaches one topic from the day's plan, paced to the session length the student chose. No quizzing during this phase unless the student is stuck and asks.
2. **Recall** — student closes their notes and explains, by voice, everything they remember. The AI listens without interrupting.
3. **Challenge** — AI asks 4 questions of increasing difficulty: a basic fact, a "why/how" understanding question, an application question, and one that mixes in an earlier topic if relevant.
4. **Feedback** — structured output: what they understood well, what they missed, what to review next. If they didn't clear the core concept, that topic gets re-queued before moving on — mastery-gated, not just time-gated.

## 6. The check-in / emotional layer — explicit policy, not an afterthought
- The AI can acknowledge how a student says they're feeling and adjust the session (shorter, gentler pacing) accordingly.
- The AI does not attempt to counsel a student through real distress. If language suggests something beyond ordinary school stress, the AI's job is to respond with care and point toward a trusted adult — not to handle it itself.
- **Parent visibility boundary:** parents see study progress in full detail. Day-to-day check-in/mood content stays private to the student, *unless* the AI's escalation logic is triggered — at which point a disclosed, predictable process (not silent surveillance, not silent inaction) notifies a trusted adult. This boundary needs to be written in plain language in the product itself, so both the student and the parent know exactly what is and isn't shared, before either of them relies on it.
- **Reliability note:** because this layer is trust-sensitive, it is held to a stricter technical standard than the rest of the product — see TRD Section 7 for the AI-provider policy specific to this feature.

## 7. The Plan Maker
Runs once after onboarding (and can be regenerated on request). Takes country,
field, subject(s), study hours/day, available days, deadline (if any), and
confidence level, and produces a 7-day plan of specific, narrow topics — not
whole subjects in one sitting — sequenced so basics come before advanced
material. If the student asked for "every subject," topics rotate across
subjects through the week rather than finishing one before starting the other.

## 8. The guarantee
Public-facing hook can use punchy language ("grow 10x"). The actual trigger
is the measured number: baseline quiz score vs. a follow-up quiz after an
agreed number of sessions. If the agreed improvement isn't met, refund. V1:
tracked manually per student, not automated — don't automate a payout
mechanism before the underlying teaching loop is proven to work.

## 9. Reliability commitment
The coaching cycle (Learn → Recall → Challenge → Feedback) should not go down
because a single AI provider has an outage. This is a backend reliability
requirement (see TRD) and is treated as a product-level promise: a session in
progress should not stall or fail visibly to the student due to a provider
issue.

## 10. Explicitly out of scope for v1
- Continuous video monitoring of handwriting — photo check-ins only, if/when added
- Multiple children per parent account
- Automated refund processing
- Multi-country simultaneous launch — pick one market to pilot
- SMS notifications (push + email only for v1)

## 11. Success metrics
- % of students who complete onboarding through to first session
- Sessions per week per active student
- % of Challenge attempts that pass the mastery threshold on first try (this is your real "is the method working" number)
- Baseline-to-follow-up quiz score delta (the guarantee metric itself)
- Parent-reported trust in the check-in boundary (qualitative, early feedback)
- Parent digest open/engagement rate, split by channel (push vs. email)
