# Zorvai Guarantee Section — Corrected Spec

*(Replaces the version currently in GuaranteeSection.tsx — that version contains fabricated statistics and copy that contradicts PRD Section 8. This is the version to build instead.)*

## Why the current version is wrong (context for Antigravity, not for the page)

- `+27%`, `62% → 89%`, and the Math/Science/English breakdown are invented numbers with zero backing data. No pilot has run yet.
- "No asterisks, no fine print about 'engagement minimums'" directly contradicts PRD Section 8, which conditions the refund on "an agreed number of sessions" — that IS an engagement minimum. The copy needs to describe the real mechanic honestly, not deny it exists.
- The section is built as a single top-level `"use client"` component wrapping static text in `motion.div` for entrance animation. Every other section in this build isolates animation into a `FadeInSection` leaf and keeps the section itself server-rendered — this one should follow the same pattern.

---

## Content

**Eyebrow:** THE GUARANTEE

**Headline (serif, italic on emphasis phrase — same treatment as other sections):**
> Prove it, or get your money back.

**Body paragraph 1 (the real mechanic, stated plainly):**
> Take a baseline quiz before you start. Study with Zorvai for the number of sessions we agree on upfront. Take a follow-up quiz. If your score hasn't improved by the amount we agreed on, you get a full refund.

**Body paragraph 2 (honest transparency — replaces the false "no fine print" line):**
> The only condition is the one we set together, in writing, before you start: how many sessions, and how much improvement. Nothing hidden beyond that.

**CTA:** "Start your baseline quiz" → `/signup`

## Right-column visual — replace the stats card with a mechanic diagram

Same frosted-glass card container (`rgba(255,255,255,0.06)` background, blur, border) as the current build — just different content inside. A vertical 4-step flow, not a before/after percentage comparison:

1. **Baseline Quiz** — icon: a clipboard/pencil
2. **Study with Zorvai** — icon representing the Learn→Recall→Challenge→Feedback loop (could reuse a simplified version of the How It Works step icons if any exist, or a simple looping-arrow icon)
3. **Follow-up Quiz** — icon: clipboard/checkmark
4. **Two outcomes, shown side by side or stacked:**
   - "Hit the target" → "Keep going" (or similar — not a dead end)
   - "Missed it" → "Full refund"

No percentages, no subject breakdown, no specific numbers anywhere in this card. The diagram illustrates the *process* you can honestly show today, not outcomes you can't back up yet.

## Component structure notes for Antigravity

- Rebuild as a Server Component. Move `useInView`/`motion.div` entrance animation into `FadeInSection` (already exists in the codebase) wrapping the left copy block and the right visual card separately, same pattern used in Features and Parents sections.
- Keep the existing background gradient, texture rings, and dot pattern — those are decorative and not a content-accuracy issue.
- Keep `useReducedMotion` gating on whatever remains animated (e.g. if the 4-step flow has a sequential reveal, gate it the same way the other sections do).

## One open question to resolve before shipping

The Parents/Testimonials section currently names "Central Point Academy" in the placeholder card. If there's a real, current pilot agreement with that school, keep it. If it's aspirational rather than confirmed, change it to `[School name]` — worth deciding this explicitly rather than leaving a real school name attached to a quote that doesn't exist yet.
