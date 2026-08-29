-- ============================================================
-- Migration 009: session_messages
-- Conversation messages for the conversational Learn phase
-- ============================================================

CREATE TABLE session_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user', 'ai')),
  content text NOT NULL,
  -- Optional file attachment metadata
  -- attachment_url points to Supabase Storage; nulled out when file is deleted on phase advance
  attachment_url text,
  attachment_type text,          -- MIME type: 'image/jpeg', 'application/pdf', etc.
  attachment_name text,          -- Original filename for display
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Fast lookups by session, ordered by time
CREATE INDEX idx_session_messages_session_id ON session_messages(session_id, created_at);

-- RLS: enable but no public policies — service_role (admin client) handles all access
ALTER TABLE session_messages ENABLE ROW LEVEL SECURITY;
