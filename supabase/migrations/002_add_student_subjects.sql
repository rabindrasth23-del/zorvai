-- 002_add_student_subjects.sql

ALTER TABLE students ADD COLUMN subjects text[] DEFAULT '{}';
