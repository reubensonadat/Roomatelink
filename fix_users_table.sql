-- This script adds the missing columns to your 'users' table 
-- to match the new profile logic.

-- 1. Create the Gender Preference Enum (if it doesn't exist)
DO $$ BEGIN
    CREATE TYPE gender_preference_type AS ENUM ('SAME_GENDER', 'ANY_GENDER');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Add 'gender_preference' to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender_preference gender_preference_type DEFAULT 'ANY_GENDER';

-- 3. Add 'gender' to users table (if missing)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS gender text;

-- 4. Add 'status' to users table (for ACTIVE/HIDDEN/COMPLETED)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'ACTIVE';

-- 5. Add 'phone_number' to users table (just in case)
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS phone_number text;

-- 6. Refresh the Schema Cache
-- This tells Supabase to "notice" the new columns immediately
NOTIFY pgrst, 'reload schema';
