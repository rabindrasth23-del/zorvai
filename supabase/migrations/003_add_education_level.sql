-- Add education_level to students table with a CHECK constraint
ALTER TABLE students 
ADD COLUMN IF NOT EXISTS education_level text 
CHECK (education_level IN ('Middle School', 'High School', 'University', 'Professional or Self-Study'));
