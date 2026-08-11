# Zorvai — Check-in Escalation Logic v1 (Phase 3.5)

## Status
**Draft — resolves the TODO stub in `/api/checkin`, but is NOT cleared for production.**
Per TRD Section 9 and PRD Section 6, this logic must be reviewed by someone
with real expertise in adolescent mental health before it goes live for real
users. Treat this document as what Antigravity implements *behind a feature
flag* (`ESCALATION_LOGIC_ENABLED=false` by default), not as sign-off to
launch it.

This slots into the existing plan as **Phase 3.5**, between
`session/evaluate` and `chat` — build it once the session routes are stable,
before notifications (Phase 4), since Phase 4's alerting infra
(`fcm_tokens`, `notification_preferences`) is what escalation will reuse.

---

## 1. Three-tier classification, not binary trigger/no-trigger

A binary trigger is what causes both false-negatives (missed real distress)
and false-positives (a stressed-about-an-exam kid gets a "trusted adult
notified" message and never trusts the check-in again). Use three tiers:

| Tier | Meaning | System action |
|---|---|---|
| **Tier 0 — Ordinary stress** | Frustration, tiredness, exam anxiety, "I hate this subject" | AI acknowledges warmly, may suggest a shorter/gentler session. Nothing logged beyond the normal `checkins` row. No escalation. |
| **Tier 1 — Elevated concern** | Persistent language about hopelessness, worthlessness, being a burden, or a stressor that sounds like it's about home/safety rather than school — but no explicit statement of self-harm intent or immediate danger | AI responds with care, gently names that this sounds heavier than usual, and *tells the student* it's going to let a trusted adult know so they can check in — not silently. `escalation_triggered = true`, `escalation_tier = 1`. Notification sent, not urgent-flagged. |
| **Tier 2 — Immediate risk language** | Explicit or strongly implied statement of intent to self-harm, being harmed by someone, or being in immediate danger | AI responds with a fixed, non-improvised safety message (see Section 4) and surfaces crisis resources directly in the student's UI. `escalation_triggered = true`, `escalation_tier = 2`. Notification sent as urgent, immediately. |

The model's job at inference time is **only classification into one of these
three tiers plus a short rationale** — it does not improvise the escalation
message itself for Tier 2. That message is fixed, versioned copy the product
team controls, not a model generation. This is the single most important
implementation constraint: it removes the highest-variance failure mode
(the model inventing something clumsy or wrong in a high-stakes moment).

---

## 2. What the model is asked to do (and not do)

`runAICall('checkin', payload)` returns:

```json
{
  "tier": 0 | 1 | 2,
  "rationale": "one short internal sentence, not shown to student",
  "suggested_session_adjustment": "normal" | "shorter" | "pause_offer"
}
```

The model is **not** asked to:
- draft the notification to the parent/trusted adult (fixed template, Section 3)
- draft the Tier 2 safety message shown to the student (fixed copy, Section 4)
- decide *who* gets notified (deterministic lookup, Section 3)
- counsel, diagnose, or continue a multi-turn conversation about the distress itself

This keeps the AI's role narrow — classify, don't handle — which matches
PRD Section 6's explicit "does not attempt to counsel" boundary and keeps
the highest-risk part of the product (what gets said to a distressed minor)
out of free-generation entirely.

**Calibration bar, in plain language for the prompt:** ordinary academic
stress talk ("I'm stressed about this exam," "I hate this subject," "I'm
tired") is Tier 0 even if the words "stressed" or "hate" appear — frequency
and intensity of *distress vocabulary* alone should not drive tier. What
should: language suggesting the feeling is persistent/pervasive rather than
tied to the study session, language suggesting the student doesn't feel
safe or supported, or any explicit safety-relevant statement. When genuinely
ambiguous, default to Tier 1, not Tier 0 — under-escalation is the costlier
error here, but Tier 1's action (disclosed, non-urgent adult check-in) is
mild enough that a false-positive there is a minor annoyance, not a trust
breach, provided the student is told it's happening and why.

---

## 3. Who gets notified — the parent-as-stressor edge case

Default: the linked parent in `student_parent_links`, via their existing
notification channel preference.

**Edge case (flagged in the original review, still needs a real answer, not
a technical one):** if the check-in content itself suggests the linked
parent is the source of the concern, notifying that same parent could make
things worse, not better.

v1 behavior, pending real policy input (this is a policy question for you,
not something Antigravity should infer):

- The model's classification output gains one more optional field:
  `"stressor_may_involve_linked_adult": boolean`
- If `true` **and** tier is 2: do not auto-send the standard parent
  notification. Instead, surface the case in an internal admin queue
  (new table, `checkin_review_queue`) for manual human review before any
  notification goes out. This trades speed for safety in the one scenario
  where notifying faster could be actively harmful.
- If `true` and tier is 1: same — route to the review queue rather than
  auto-notifying, since Tier 1 already isn't urgent-flagged.
- This is a v1 stopgap, not a real policy. A real policy (alternate
  contact? school counselor escalation path? age-dependent handling?)
  needs input from someone with actual expertise here — flagging this
  explicitly so it doesn't get quietly resolved by whatever the code
  happens to do.

---

## 4. What the student sees (Tier 2 — fixed copy, not model-generated)

Exact wording is a product/clinical decision, not an engineering one — but
the *shape* Antigravity should build toward:

1. Warm, brief acknowledgment (not clinical, not alarmed-sounding)
2. A clear, honest statement that a trusted adult is being notified —
   stated as fact, not asked as permission, but also not sprung silently
3. Crisis resource contact info shown directly in-product (not just
   "talk to someone" — an actual number/link, sourced from a real
   directory for the launch country)
4. No pressure to keep chatting about it in that moment, and no dead-end —
   session can be paused without penalty

Build this as static, versioned UI copy per Tier, not a prompt output.

---

## 5. Schema additions to `checkins` (extends TRD Section 5)

| Column | Type | Purpose |
|---|---|---|
| `escalation_tier` | int (0/1/2) | Replaces the boolean-only `escalation_triggered` with the tier |
| `stressor_may_involve_linked_adult` | bool, nullable | From model output, only meaningful at tier ≥ 1 |
| `notification_status` | text | `not_applicable` / `queued_for_review` / `sent` / `send_failed` |
| `reviewed_by` | uuid, nullable | Set only when a case goes through `checkin_review_queue` |

New table: `checkin_review_queue` — `checkin_id`, `reason`, `status`
(`pending`/`resolved`), `resolved_by`, `resolved_at`.

---

## 6. What this document does NOT resolve

- The actual crisis-resource directory per launch country (needs sourcing,
  not invention — don't let Antigravity hardcode a placeholder number)
- Whether Tier 2 should also do anything synchronous beyond notification
  (e.g., is there ever a case for contacting emergency services directly?
  Out of scope for v1 per PRD Section 10, but worth being deliberate that
  it's *out*, not just unaddressed)
- Final prompt wording for the classifier itself
- The actual expert review this whole document is a placeholder for

---

## Feature flag for Antigravity

```
ESCALATION_LOGIC_ENABLED=false   // default — classifier runs, tier is logged,
                                  // but no real notification fires until
                                  // this flips true post-review
```

With the flag off: `/api/checkin` still logs `mood_text` and the model's
tier classification (useful for you to eyeball real distribution of Tier
0/1/2 before anyone's safety depends on it firing correctly) but takes no
downstream action. This gives you a dry-run period.