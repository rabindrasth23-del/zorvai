-- ============================================================
-- 007: Add invite_code to students + student_notified to links
-- Project: supabase-zorvai (kndoposozkemopyuavgb)
-- ============================================================

-- 1. Add invite_code column to students
ALTER TABLE students ADD COLUMN invite_code text UNIQUE;

-- 2. Backfill existing students with random 8-char codes
UPDATE students SET invite_code = substr(md5(random()::text || id::text), 1, 8)
WHERE invite_code IS NULL;

-- 3. Make NOT NULL after backfill + set default for new rows
ALTER TABLE students ALTER COLUMN invite_code SET NOT NULL;
ALTER TABLE students ALTER COLUMN invite_code SET DEFAULT substr(md5(random()::text), 1, 8);

-- 4. Add student_notified flag to student_parent_links
-- false = student hasn't seen the "a parent linked" banner yet
ALTER TABLE student_parent_links ADD COLUMN student_notified boolean NOT NULL DEFAULT false;
