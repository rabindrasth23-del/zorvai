# PRD v2 — Zorvai: AI Study Coach (Web App)
*Supersedes v1. Additions from Astra AI feature research are marked **[NEW]**. Everything unmarked is unchanged from v1.*

## 1. Concept
A web app where a student studies any subject with an AI voice/text coach
that runs a structured Learn → Recall → Challenge → Feedback cycle instead
of just answering questions. A separate parent login tracks progress and
guarantee status. Backed by a real, measurable improvement guarantee.

**[NEW]** Sessions can now be grounded in the student's own class materials
(notes, slides, past papers) instead of relying only on the AI's general
knowledge of a subject.

## 2. Roles
*(unchanged from v1 — Student, Parent)*

## 3. Onboarding questions
*(unchanged from v1 — see Sections 3.1–3.2)*

**[NEW] Optional Material Upload step**, offered right after the Plan Maker
questions, before the first plan is generated:
- "Want to upload your class notes, slides, or past papers? Your plan and
  lessons will be built from these instead of a generic version of the
  subject." (Optional — skippable. Plan Maker works fine without it.)

## 4. Core features (v2)

1. **Chatbot** — always-available, text or photo input, personalized using
   the student's saved profile and session history.
   **[NEW]** Photo-based math/science questions now route through a
   symbolic solver (CAS) before the LLM explains steps, so exact
   computations (algebra, calculus, equation balancing) are verified, not
   just LLM-generated. Two modes: **Hint-first** (Socratic, default) and
   **Full solution** (student can switch anytime).
2. **Voice study sessions** — the Learn → Recall → Challenge → Feedback
   cycle (Section 5).
3. **Check-in layer** *(unchanged from v1 — Section 6)*
4. **Progress dashboard** *(unchanged from v1)*
5. **Missed-session alert** *(unchanged from v1)*
6. **[NEW] Material Library** — students can upload PDFs, slide decks,
   photos of handwritten notes, or past papers per subject. The Plan Maker
   and Teach phase use this material as source content when available,
   falling back to general subject knowledge when it isn't. Students see
   upload status (queued/extracting/ready/failed) and can delete files.
7. **[NEW] Mock Exams** — a timed, multi-topic assessment assembled from
   the student's plan, weighted toward weaker topics. Auto-grades
   objective questions, gives structured feedback linked back to the
   relevant Learn-phase content. Written mode ships first; **oral mode**
   (spoken answers via the same voice infra as Recall) is Phase 2.
8. **[NEW] Review Deck (spaced repetition)** — a separate, optional
   long-term retention system, distinct from the Challenge mastery-gate.
   See Section 5a for exactly how it differs and why it doesn't compete
   with mastery-gating.
9. **[NEW, Phase 2] Audio recap** — TTS narration of a completed Learn
   phase, for passive re-listening (commute, walk, etc.). Not a new
   teaching path — same content, different format.

## 5. The Learn → Recall → Challenge → Feedback cycle
*(unchanged from v1)*
1. **Learn** — AI teaches one topic from the day's plan, paced to the
   session length the student chose. **[NEW]** If the student uploaded
   material for this subject, Learn draws directly from it (with a
   citation back to "from your notes, p.4" style references) instead of
   generating a generic explanation.
2. **Recall** — student closes their notes and explains, by voice,
   everything they remember.
3. **Challenge** — AI asks 4 questions of increasing difficulty.
4. **Feedback** — structured output; mastery-gated re-queue if not cleared.

## 5a. Mastery-gating vs. the Review Deck — why both exist and don't conflict
These answer two different questions on two different timescales:

| | Mastery-gate (Challenge/Feedback) | Review Deck (spaced repetition) |
|---|---|---|
| Question it answers | "Did the student get this well enough to move on **today**?" | "Is this topic at risk of being **forgotten in 2–4 weeks**?" |
| Trigger | End of every session, immediately | Background scheduler, independent of session cycle |
| Failure action | Re-queue the topic before advancing the plan | Resurface the topic as a short flashcard-style review, doesn't block plan progress |
| Data source | The day's Challenge Q&A | Historical mastery + time-since-last-review |

A topic only enters the Review Deck **after** it has passed the mastery
gate at least once. This keeps the guarantee's definition of "mastered"
single-sourced — the Review Deck never re-defines what counts as learned,
it just decides when to remind the student of something they already
learned.

## 6. The check-in / emotional layer
*(unchanged from v1 — Section 6)*

## 7. The Plan Maker
*(unchanged from v1, with one addition)*
**[NEW]** When Material Library content exists for a subject, the Plan
Maker's topic list is generated from that material's actual table of
contents/structure first, and only falls back to general-knowledge topic
generation for subjects/areas with no uploaded material.

## 8. The guarantee
*(unchanged from v1 — guarantee-refund model only, no freemium tiers.
This was evaluated against Astra's freemium approach and rejected: the
guarantee is Zorvai's core differentiator and a freemium tier would blur
what the guarantee is measuring against.)*

## 9. Explicitly out of scope for v2
- Freemium subscription tiers (business-model conflict with the guarantee — rejected, not deferred)
- Full knowledge-graph / curriculum-board mapping (real standalone project — Phase 3 at earliest)
- Continuous video monitoring of handwriting — photo uploads only
- Multiple children per parent account
- Automated refund processing
- Multi-country simultaneous launch

## 10. Success metrics
*(v1 metrics unchanged, plus)*
- **[NEW]** % of sessions using uploaded material vs. general knowledge (adoption of Material Library)
- **[NEW]** Review Deck completion rate and its effect on mock-exam scores over time
- **[NEW]** Mock exam score trend per student (leading indicator ahead of the baseline→follow-up guarantee checkpoint)

## Phasing
- **Phase 1 (build now):** Material Upload/Library, grounded Teach phase, Snap & Solve solver upgrade, written Mock Exams, Review Deck (spaced repetition)
- **Phase 2:** Oral mock exams, audio recap (TTS)
- **Phase 3:** Curriculum/exam-board mapping, knowledge graph, collaborative teacher/parent features