-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   MIGRATION: Transform existing schema to target structure
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   This migration transforms existing tables to match the target schema provided by the user.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   WARNING: This migration will DROP and RECREATE tables. Any existing data will be LOST.
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════   IMPORTANT: Run this migration in a TEST environment first before production!
-- ═══════════════════════════════════════════════════════════════════════════════════   IMPORTANT: Backup your database before running this migration!
-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════/backups/row

-- STEP 1: Transform questionnaire_answers to questionnaire_responses
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   Drop old questionnaire_answers table and its policies
DROP TABLE IF EXISTS public.questionnaire_answers CASCADE;

-- Create new questionnaire_responses table with JSONB answers
CREATE TABLE IF NOT EXISTS public.questionnaire_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    answers JSONB NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    consistency_score DOUBLE PRECISION,
    profile_flags JSONB DEFAULT '[]'::JSONB
);

-- Create indexes for questionnaire_responses
CREATE INDEX IF NOT EXISTS idx_questionnaire_responses_user_id ON public.questionnaire_responses(user_id);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   STEP 2: Transform messages table - change is_read to status enum
-- ═══════════   Drop old messages table and recreate with status field
DROP TABLE IF EXISTS public.messages CASCADE;

-- Create new messages table with status enum
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'PENDING'::TEXT CHECK (status = ANY(ARRAY['PENDING'::TEXT, 'SENT'::TEXT, 'DELIVERED'::TEXT, 'READ'::TEXT]))
);

-- Create indexes for messages
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_status ON public.messages(status) WHERE status != 'READ';

-- ═════════════════════════════   STEP 3: Transform users table - update gender and status columns
-- ═══   Drop old users table and recreate with updated schema
DROP TABLE IF EXISTS public.users CASCADE;

-- Create new users table with updated schema
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone_number TEXT,
    avatar_url TEXT,
    bio TEXT,
    gender TEXT NOT NULL CHECK (gender = ANY(ARRAY['MALE'::TEXT, 'FEMALE'::TEXT, 'OTHER'::TEXT)),
    gender_pref TEXT NOT NULL CHECK (gender_pref = ANY(ARRAY['SAME_GENDER'::TEXT, 'ANY_GENDER'::TEXT])),
    course TEXT,
    level INTEGER CHECK (level = ANY(ARRAY[100, 200, 300, 400, 500, 600])),
    has_paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMPTZ,
    status TEXT DEFAULT 'ACTIVE'::TEXT CHECK (status = ANY(ARRAY['ACTIVE'::TEXT, 'COMPLETED'::TEXT, 'EXPIRED'::TEXT, 'HIDDEN'::TEXT, 'SUSPENDED'::TEXT])),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_active TIMESTAMPTZ DEFAULT NOW(),
    fcm_token TEXT,
    is_student_verified BOOLEAN DEFAULT FALSE,
    payment_reference TEXT,
    is_pioneer BOOLEAN DEFAULT FALSE,
    university_id UUID REFERENCES public.university_domains(id) ON DELETE SET NULL,
    student_email TEXT
);

-- Create indexes for users
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_paid ON public.users(has_paid);
CREATE INDEX IF NOT EXISTS idx_users_pioneer ON public.users(is_pioneer);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active DESC);

-- ═════════════════════════   STEP 4: Transform matches table - add missing columns
-- ═══   Drop old matches table and recreate with updated schema
DROP TABLE IF EXISTS public.matches CASCADE;

-- Create new matches table with all target columns
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    match_percentage INTEGER NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
    raw_score DOUBLE PRECISION,
    cross_category_flags JSONB DEFAULT '[]'::JSONB,
    consistency_modifier DOUBLE PRECISION DEFAULT 0,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    user_a_viewed BOOLEAN DEFAULT FALSE,
    user_b_viewed BOOLEAN DEFAULT FALSE,
    category_scores JSONB DEFAULT '[]'::JSONB,
    UNIQUE(user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id) -- Prevent duplicates
);

-- Create indexes for matches
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_match_percentage ON public.matches(match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_matches_calculated_at ON public.matches(calculated_at DESC);

-- ═════════════════════════════════════════════════════════════════   STEP 5: Update RLS policies for transformed tables
-- ═════   Drop old RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Users can insert own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Users can update own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Users can read own answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Users can insert own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can insert own matches" ON public.matches;
DROP POLICY IF EXISTS "Users can read own matches" ON public.matches;
DROP POLICY IF EXISTS "Service role full access to users" ON public.users;
DROP POLICY IF EXISTS "Service role full access to questionnaire answers" ON public.questionnaire_answers;
DROP POLICY IF EXISTS "Service role full access to messages" ON public.messages;
DROP POLICY IF EXISTS "Service role full access to matches" ON public.matches;

-- Create new RLS policies for questionnaire_responses
-- Users can read their own answers
CREATE POLICY "Users can read own responses"
ON public.questionnaire_responses FOR SELECT
USING (auth.uid() = auth_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert own responses"
ON public.questionnaire_responses FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid()));

-- Users can update their own responses
CREATE POLICY "Users can update own responses"
ON public.questionnaire_responses FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth.uid());

-- Service role full access to questionnaire_responses
CREATE POLICY "Service role full access to questionnaire_responses"
ON public.questionnaire_responses FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create new RLS policies for messages
-- Users can read messages in their matches
CREATE POLICY "Users can read own messages"
ON public.messages FOR SELECT
USING (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
            OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    )
);

-- Users can insert messages in their matches
CREATE POLICY "Users can insert own messages"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    AND match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
            OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    )
);

-- Users can update their own messages
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
            OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    )
WITH CHECK (auth.uid() = auth.uid())
WITH CHECK (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
            OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    )
);

-- Service role full access to messages
CREATE POLICY "Service role full access to messages"
ON public.messages FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create new RLS policies for matches
-- Users can read their own matches
CREATE POLICY "Users can read own matches"
ON public.matches FOR SELECT
USING (
    user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
);

-- Users can insert their own matches
CREATE POLICY "Users can insert own matches"
ON public.matches FOR INSERT
WITH CHECK (
    user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    AND user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
);

-- Users can update their own matches
CREATE POLICY "Users can update own matches"
ON public.matches FOR UPDATE
USING (
    user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
)
WITH CHECK (auth.uid() = auth.uid())
WITH CHECK (
    user_a_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
    OR user_b_id IN (SELECT id FROM public.users WHERE auth.uid() = auth.uid())
);

-- Service role full access to matches
CREATE POLICY "Service role full access to matches"
ON public.matches FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create new RLS policies for users (transformed)
-- Users can view own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth.uid());

-- Service role full access to users
CREATE POLICY "Service role full access to users"
ON public.users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   FINAL COMMENTS
-- ═════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════   This migration transforms the database schema to match the target structure provided.
-- ═════════════════════   WARNING: This migration will DROP and RECREATE tables. Any existing data will be LOST.
-- ═══   IMPORTANT: Backup your database before running this migration!
--   IMPORTANT: Test this migration in a TEST environment first before production!

COMMENT ON TABLE public.questionnaire_responses IS 'User responses to compatibility questionnaire - stores all 40 answers as JSONB';
COMMENT ON TABLE public.messages IS 'Chat messages between matched users with status tracking (PENDING, SENT, DELIVERED, READ)';
COMMENT ON TABLE public.users IS 'User profiles with updated gender (MALE/FEMALE/OTHER) and status enum (ACTIVE, COMPLETED, EXPIRED, HIDDEN, SUSPENDED)';
COMMENT ON TABLE public.matches IS 'Calculated compatibility scores with category breakdowns and cross-category flags';
