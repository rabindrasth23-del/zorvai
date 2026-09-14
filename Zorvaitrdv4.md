# TRD v2 — Zorvai: AI Study Coach (Web App)
*Supersedes v1. Additions marked **[NEW]**.*

## 1. Tech stack
*(unchanged from v1, plus)*

| Layer | Choice | Why |
|---|---|---|
| **[NEW]** OCR / document extraction | `pdf-parse` or cloud OCR API (e.g., Google Vision / AWS Textract) for scanned/handwritten notes | Needed for Material Library ingestion |
| **[NEW]** Vector store | Supabase `pgvector` extension | Keeps everything in the existing Postgres instance instead of standing up a separate vector DB — right-sized for a pilot's data volume |
| **[NEW]** Symbolic math solver | `mathjs` or a hosted CAS API | Verifies math answers in Snap & Solve instead of relying on the LLM alone |
| **[NEW]** TTS (Phase 2) | Browser-native `speechSynthesis` first; upgrade to a paid TTS API only if quality complaints justify the cost | Matches v1's "free before paid" philosophy on voice |

## 2. Architecture
Unchanged hub-and-spoke pattern: Student app and Parent app are both
Next.js pages talking to a single backend, which is the only thing that
talks to Supabase, Claude, and the payment gateway.

**[NEW]** Add one new backend responsibility: an **Ingestion pipeline**
that runs asynchronously after material upload (extract → OCR if needed →
chunk → embed → store), independent of the request/response cycle so
uploads don't block the UI.

## 3. AI pipeline — call types

Unchanged six call types from v1, plus:

7. **[NEW] Material ingestion (topic extraction)** — input: extracted/OCR'd
   text from an uploaded file. Output: a structured topic list with
   source references (page/section), used to seed or override the Plan
   Maker's generic topic generation for that subject.
8. **[NEW] Grounded Teach** — same as call type 2 (Teach), but when
   material exists for the topic, the prompt is constructed
   RAG-style: retrieve the top-k relevant chunks from `pgvector` for this
   topic, inject them into the Teach prompt with citation instructions,
   fall back to ungrounded Teach if retrieval returns nothing useful.
9. **[NEW] Mock exam generator** — input: full plan history + topic
   mastery states. Output: a timed, multi-topic question set weighted
   toward weaker topics, structured for auto-grading where possible.
   Reuses the Challenge-generator prompt pattern at a larger scale.
10. **[NEW] Review Deck scheduler** — not an LLM call; a deterministic
    background job. Input: mastery timestamps. Output: which mastered
    topics are due for resurfacing today, using a standard spaced-interval
    curve (e.g., 1 day → 3 days → 7 days → 21 days after last pass,
    resetting on a failed review).
11. **[NEW] Snap & Solve solver step** — input: OCR'd math/science
    expression. Output: exact result from a symbolic solver, passed to the
    LLM as ground truth before it writes the step-by-step explanation —
    the LLM explains the solver's answer, it doesn't compute independently.

## 4. Workflow additions

**Material upload:**
1. Student uploads file(s) in Material Library → status shows "queued"
2. Ingestion pipeline: extract text (or OCR for images/scans) → chunk →
   embed → store in `pgvector`, tagged by subject/course
3. Topic-extraction call proposes a topic list with source references →
   shown to student for review/override before it feeds the Plan Maker
4. Status updates to "ready"; subsequent Plan Maker and Teach calls for
   that subject use this material

**Mock exam:**
1. Student selects subject → "Mock Exam" → chosen length/timer
2. Mock exam generator call assembles questions weighted by mastery data
3. Auto-grades objective questions on submit; Feedback evaluator call
   handles free-response items
4. Results link back to the specific Learn-phase content that covers each
   missed question; mastery states update accordingly

**Review Deck:**
1. Runs as a daily background job (cron or Supabase scheduled function)
2. Surfaces due topics as short flashcard-style prompts, separate from the
   main session flow — student can do these anytime, they never block or
   substitute for a Learn→Recall→Challenge→Feedback session

## 5. API endpoints — additions

| Route | Purpose |
|---|---|
| `POST /api/materials` | Upload a file, create a material record, kick off ingestion |
| `GET /api/materials/:id/status` | Poll ingestion status |
| `GET/PATCH /api/materials/:id/topics` | Review/override AI-extracted topics before they feed the plan |
| `DELETE /api/materials/:id` | Remove an uploaded file and its embeddings |
| `POST /api/mock-exam/generate` | Assemble a mock exam for a subject |
| `POST /api/mock-exam/:id/submit` | Grade and return feedback |
| `GET /api/review-deck/today` | Return topics due for spaced review today |
| `POST /api/review-deck/:topicId/complete` | Log a review outcome, update the next-due interval |
| `POST /api/solve` | Snap & Solve: OCR → symbolic solver → LLM explanation |

## 6. Data model additions

| Entity | Key fields |
|---|---|
| **Material** | `id, user_id, subject_id, type (pdf/image/text), storage_url, status, page_count` |
| **MaterialChunk** | `id, material_id, page_ref, text, embedding (vector)` |
| **ExtractedTopic** | `id, material_id, name, source_pages[], approved (bool)` |
| **MockExam** | `id, user_id, subject_id, questions_json, score, taken_at` |
| **ReviewState** | `user_id, topic_id, last_reviewed_at, next_due_at, streak_count` |

## 7. Cost per action — additions

| Action | Est. cost |
|---|---|
| Material topic extraction (one file) | ~$0.01–0.03 depending on length |
| Grounded Teach (RAG retrieval + generation) | ~$0.008 (slightly higher than ungrounded Teach due to retrieved context) |
| Mock exam generation (10–15 questions) | ~$0.02 |
| Snap & Solve with solver step | ~$0.008 (solver call itself is near-free; LLM explanation is the cost) |
| Review Deck scheduling | $0 — deterministic, no LLM call |

**Storage cost note:** uploaded PDFs/images and their embeddings are new,
ongoing storage cost (Supabase storage + `pgvector` rows) that didn't
exist in v1 — budget for this separately from the API-cost table above,
it scales with active users' upload volume, not session count.

## 8. Security & safety — additions
- Uploaded materials may contain copyrighted textbook content or other
  students' shared notes — store per-user, never used for model
  training without explicit consent, and deletable on request (same
  policy as v1's general data-retention stance, extended to this new
  data type).
- OCR/ingestion pipeline runs on untrusted user-uploaded files — validate
  file type/size before processing, and don't let extracted document
  content control system prompts or tool calls (prompt-injection risk
  from a malicious PDF).

## 9. Deployment
Unchanged from v1. Add `pgvector` extension to the Supabase schema
migration, and provision the OCR API key alongside the existing Claude
API key.