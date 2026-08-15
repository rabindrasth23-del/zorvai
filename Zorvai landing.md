# Zorvai Landing Page — Design & Copy Spec
*(Visual system adapted from the reference video; all copy and meaning rebuilt for Zorvai)*

## Shared visual system (carried over, applies to every section below)
- Cream/off-white base background, alternating with full-bleed dark and full-bleed accent-color sections as you scroll
- Serif display type for all big headlines, with italic serif used only on the emphasis phrase within a headline
- Sans-serif for nav, body copy, and buttons
- Pill shape everywhere: nav bar, buttons, tags, badges
- Fixed floating nav bar with soft shadow, stays pinned across every section
- Small-caps eyebrow label above each section headline (e.g. "HOW IT WORKS")
- Persistent brand mark, fixed bottom-left corner, present on every section
- Suggested accent color swap: keep the emerald-green proof section, but consider a warm color (amber/terracotta) instead of pure black for the testimonial section, so the palette reads distinct from the reference rather than identical

---

## 1. Nav bar
- Left: Zorvai logo mark + wordmark
- Center-left pill toggle: **Student** / **Parent** (replaces Dictation/Notetaker — this is your actual two-role split)
- Right: **Pricing**, **How it works**, then a solid pill CTA: **Start free session**

## 2. Hero
**Eyebrow:** ZORVAI AI STUDY COACH
**Headline (serif, italic on second line):**
> Don't cram,
> *actually learn.*

**Subhead:**
> The AI study coach that teaches you, tests what you remember, and won't let you move on until you've actually got it.

**CTA:** pill button — "Start your first session" — with a small icon
**Below CTA:** "Free baseline quiz · No credit card needed"

**Left decorative element (replaces the spiral text path):** a curved path of small text following an arc — real testimonial-style line from your pilot, e.g. *"the topic I was stuck on for weeks — I finally got it in one session"* — mark clearly as a placeholder until you have a real pilot quote to swap in.

**Bottom ribbon (replaces the transcription strip):** a dark pill/ribbon showing a live Recall moment — student's spoken answer streaming across, e.g. *"...so mitochondria is the powerhouse because it's where—"* with a waveform icon, echoing the "AI listens without interrupting" Recall phase.

## 3. Proof section (full-bleed emerald green)
**Headline:**
> Study *smarter,* not longer

**Subhead:**
> Most studying is rereading notes and hoping they stick. Zorvai forces the recall that actually builds memory.

**Comparison cards (side by side, same visual treatment as the wpm cards):**
- Card 1: "Rereading notes" — "20% retained after 1 week" *(placeholder stat — replace with your real baseline-vs-follow-up data once you have pilot numbers; don't ship an invented number as fact)*
- Card 2: "Studying with Zorvai" — "Mastery-gated — you don't move on until it sticks"

## 4. How it works
**Eyebrow:** HOW IT WORKS
**Headline:**
> Every session follows *one proven cycle*

**Steps (vertical accent-bar list, same treatment as the reference):**
1. **Learn** — one topic, taught at your pace
2. **Recall** — explain it back, no notes, AI just listens
3. **Challenge** — four questions, increasing difficulty
4. **Feedback** — what you nailed, what's re-queued for next time

## 5. Feature detail (two-column, soft card + tag pills)
**Left card (sage/soft background, pill tags):**
Tags inside the card: `Organic Chemistry` `Calculus II` `Nepali Grammar` `+ Add a subject`

**Right side headline:**
> Zorvai learns *what you're studying*

**Body:**
> Your plan adapts to your subjects, your deadline, and your confidence level — not a generic syllabus. Tell it what you're stuck on and Day 1 starts there.

**Second feature (fades in on scroll, same as reference):**
**Headline:** Track what you've actually mastered
**Body:** Every topic is marked understood, missed, or re-queued — so review time goes to what you don't know yet, not what you already do.

## 6. Testimonials (full-bleed dark/accent section)
Floating quote cards, slight rotation, small avatar badges — same collage treatment as the reference.

> [!IMPORTANT]
> Do not fabricate quotes and attribute them to real people or invented named students — that's misleading even as placeholder content. Use one of two honest approaches until real pilot feedback exists:
> - Clearly-marked placeholder cards: *"[Pilot feedback coming soon]"*
> - Real quotes from your actual pilot students at Central Point Academy, with their permission, first name + school only

## 7. Footer
**Products (two cards, same layout as Dictation/Notetaker):**
- Card 1: **Zorvai Student** — "Your AI study coach — Learn, Recall, Challenge, Feedback." → "Start free session"
- Card 2: **Zorvai Parent** — "See real progress, not just screen time." → "Create parent account"

**Link columns:**
| GET STARTED | STUDENTS | RESOURCES | COMPANY |
|---|---|---|---|
| Pricing | Exam prep | How it works | About |
| Privacy & Security | School subjects | Blog | Contact |
| The guarantee | Programming | Help center | — |
| Parent dashboard | Medicine track | — | — |

---

## Notes for Antigravity build
- Build this as static marketing/landing content — separate from the authenticated Student/Parent app screens already speced in the TRD.
- The proof-section stat and all testimonials are placeholders flagged above — do not let the agent invent numbers or names to fill them in "for now." Leave them as visibly marked TODOs in the code/copy until you have real data.
- Reuse the Motion (motion/react) library for the scroll-triggered fade-in on the feature section and the floating/rotated testimonial cards — that's the one part of the reference that's genuinely animation-driven, not just static layout.