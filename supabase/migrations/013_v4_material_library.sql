-- ============================================================
-- Zorvai v4 — Material Library, Mock Exams, Review Deck
-- Project: supabase-zorvai (kndoposozkemopyuavgb)
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- ============================================================
-- ENUMS
-- ============================================================

CREATE TYPE material_status AS ENUM ('queued', 'extracting', 'ready', 'failed');
CREATE TYPE material_type AS ENUM ('pdf', 'image', 'text');

-- ============================================================
-- TABLES
-- ============================================================

-- 14. materials
-- Uploaded study materials (PDFs, images, text files) per student per subject
CREATE TABLE materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  filename text NOT NULL,
  type material_type NOT NULL DEFAULT 'pdf',
  storage_url text NOT NULL,
  status material_status NOT NULL DEFAULT 'queued',
  page_count integer,
  file_size_bytes bigint,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 15. material_chunks
-- Chunked + embedded text from materials for RAG retrieval
CREATE TABLE material_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  page_ref text,
  chunk_index integer NOT NULL DEFAULT 0,
  text text NOT NULL,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 16. extracted_topics
-- AI-extracted topic list from uploaded material, used to seed/override Plan Maker
CREATE TABLE extracted_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
  name text NOT NULL,
  source_pages text[] DEFAULT '{}',
  approved boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 17. mock_exams
-- Timed multi-topic assessments
CREATE TABLE mock_exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject text NOT NULL,
  questions_json jsonb NOT NULL DEFAULT '[]'::jsonb,
  answers_json jsonb,
  score numeric(5,2),
  total_questions integer NOT NULL DEFAULT 0,
  correct_count integer,
  duration_seconds integer NOT NULL DEFAULT 1800,
  time_spent_seconds integer,
  status text NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- 18. review_states
-- Spaced repetition state per student per topic
CREATE TABLE review_states (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  topic_id uuid NOT NULL REFERENCES plan_topics(id) ON DELETE CASCADE,
  last_reviewed_at timestamptz,
  next_due_at timestamptz NOT NULL DEFAULT now(),
  streak_count integer NOT NULL DEFAULT 0,
  interval_days integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Materials
CREATE INDEX idx_materials_user_id ON materials(user_id);
CREATE INDEX idx_materials_user_subject ON materials(user_id, subject);
CREATE INDEX idx_materials_status ON materials(status);

-- Material chunks — vector similarity search index
CREATE INDEX idx_material_chunks_material_id ON material_chunks(material_id);
CREATE INDEX idx_material_chunks_embedding ON material_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Extracted topics
CREATE INDEX idx_extracted_topics_material_id ON extracted_topics(material_id);

-- Mock exams
CREATE INDEX idx_mock_exams_user_id ON mock_exams(user_id);
CREATE INDEX idx_mock_exams_user_subject ON mock_exams(user_id, subject);
CREATE INDEX idx_mock_exams_started ON mock_exams(user_id, started_at);

-- Review states
CREATE INDEX idx_review_states_user_id ON review_states(user_id);
CREATE INDEX idx_review_states_due ON review_states(user_id, next_due_at);
CREATE INDEX idx_review_states_topic ON review_states(topic_id);

-- ============================================================
-- RLS POLICIES
-- ============================================================

ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE material_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE extracted_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE mock_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_states ENABLE ROW LEVEL SECURITY;

-- Materials: students can CRUD their own
CREATE POLICY "Students can view own materials"
  ON materials FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own materials"
  ON materials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own materials"
  ON materials FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Students can delete own materials"
  ON materials FOR DELETE
  USING (auth.uid() = user_id);

-- Material chunks: students can read chunks from their own materials
CREATE POLICY "Students can view own material chunks"
  ON material_chunks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = material_chunks.material_id
        AND materials.user_id = auth.uid()
    )
  );

-- Service role can insert/update/delete chunks (ingestion pipeline)
CREATE POLICY "Service can manage chunks"
  ON material_chunks FOR ALL
  USING (auth.role() = 'service_role');

-- Extracted topics: students can view/update their own
CREATE POLICY "Students can view own extracted topics"
  ON extracted_topics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = extracted_topics.material_id
        AND materials.user_id = auth.uid()
    )
  );

CREATE POLICY "Students can update own extracted topics"
  ON extracted_topics FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM materials
      WHERE materials.id = extracted_topics.material_id
        AND materials.user_id = auth.uid()
    )
  );

-- Mock exams: students can CRUD their own
CREATE POLICY "Students can view own mock exams"
  ON mock_exams FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own mock exams"
  ON mock_exams FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own mock exams"
  ON mock_exams FOR UPDATE
  USING (auth.uid() = user_id);

-- Review states: students can CRUD their own
CREATE POLICY "Students can view own review states"
  ON review_states FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Students can insert own review states"
  ON review_states FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can update own review states"
  ON review_states FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- HELPER FUNCTION: Vector similarity search
-- ============================================================

CREATE OR REPLACE FUNCTION match_material_chunks(
  query_embedding vector(1536),
  match_material_ids uuid[],
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  material_id uuid,
  page_ref text,
  text text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    mc.id,
    mc.material_id,
    mc.page_ref,
    mc.text,
    1 - (mc.embedding <=> query_embedding) AS similarity
  FROM material_chunks mc
  WHERE mc.material_id = ANY(match_material_ids)
    AND 1 - (mc.embedding <=> query_embedding) > match_threshold
  ORDER BY mc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
