-- ═══════════════════════════════════════════════════════════════
-- ROOMMATE LINK — Student Email Support
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add the student_email column to the users table
-- This allows users who use Social Login (Gmail) to verify with a different student email.
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS student_email TEXT;

-- Comment for clarity
COMMENT ON COLUMN users.student_email IS 'Stores the official university email used for student verification.';
