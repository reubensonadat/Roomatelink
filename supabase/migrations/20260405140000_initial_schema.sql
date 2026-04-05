-- ═══════════════════════════════════════════════════════════════════
-- Roommate Link - Initial Database Schema
-- ═══════════════════════════════════════════════════════════════════
-- This migration creates the complete database schema for Roommate Link
-- including all tables, indexes, RLS policies, and triggers.
-- ═══════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ═══════════════════════════════════════════════════════════════════

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    auth_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    gender TEXT CHECK (gender IN ('M', 'F')),
    avatar_url TEXT,
    date_of_birth DATE,
    university_id UUID REFERENCES public.university_domains(id) ON DELETE SET NULL,
    student_email TEXT,
    is_student_verified BOOLEAN DEFAULT FALSE,
    has_paid BOOLEAN DEFAULT FALSE,
    payment_date TIMESTAMPTZ,
    payment_reference TEXT,
    payment_amount NUMERIC(10,2),
    is_pioneer BOOLEAN DEFAULT FALSE,
    pioneer_claimed_at TIMESTAMPTZ,
    profile_status TEXT DEFAULT 'INCOMPLETE' CHECK (profile_status IN ('INCOMPLETE', 'ACTIVE', 'HIDDEN', 'COMPLETED')),
    has_completed_questionnaire BOOLEAN DEFAULT FALSE,
    questionnaire_completed_at TIMESTAMPTZ,
    last_active TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- University domains table (for student verification)
CREATE TABLE IF NOT EXISTS public.university_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email_domain TEXT NOT NULL UNIQUE,
    university_name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification codes table (for OTP-based verification)
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Questionnaire answers table
CREATE TABLE IF NOT EXISTS public.questionnaire_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    answer TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, question_id)
);

-- Matches table (calculated compatibility scores)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    user_b_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    compatibility_score NUMERIC(5,2) NOT NULL CHECK (compatibility_score BETWEEN 0 AND 100),
    match_tier TEXT CHECK (match_tier IN ('POOR', 'FAIR', 'GOOD', 'EXCELLENT', 'PERFECT')),
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_a_id, user_b_id),
    CHECK (user_a_id < user_b_id) -- Prevent duplicates
);

-- Messages table (chat functionality)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Roommate found notifications (when users match and connect)
CREATE TABLE IF NOT EXISTS public.roommate_found (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    found_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ═══════════════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════════════

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_gender ON public.users(gender);
CREATE INDEX IF NOT EXISTS idx_users_university ON public.users(university_id);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(profile_status);
CREATE INDEX IF NOT EXISTS idx_users_paid ON public.users(has_paid);
CREATE INDEX IF NOT EXISTS idx_users_pioneer ON public.users(is_pioneer);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON public.users(last_active DESC);

-- Verification codes indexes
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);
CREATE INDEX IF NOT EXISTS idx_verification_codes_user_id ON public.verification_codes(user_id);

-- Questionnaire answers indexes
CREATE INDEX IF NOT EXISTS idx_questionnaire_answers_user_id ON public.questionnaire_answers(user_id);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a_id);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b_id);
CREATE INDEX IF NOT EXISTS idx_matches_score ON public.matches(compatibility_score DESC);
CREATE INDEX IF NOT EXISTS idx_matches_tier ON public.matches(match_tier);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_match_id ON public.messages(match_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON public.messages(match_id, is_read) WHERE is_read = FALSE;

-- Roommate found indexes
CREATE INDEX IF NOT EXISTS idx_roommate_found_user_id ON public.roommate_found(user_id);

-- ═══════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.university_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questionnaire_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommate_found ENABLE ROW LEVEL SECURITY;

-- ═══════════════════════════════════════════════════════════════════
-- USERS TABLE RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
USING (auth.uid() = auth_id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
USING (auth.uid() = auth_id)
WITH CHECK (auth.uid() = auth_id);

-- Service role can do anything
CREATE POLICY "Service role full access to users"
ON public.users FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- UNIVERSITY DOMAINS RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Public can read active university domains (for verification)
CREATE POLICY "Public can read active universities"
ON public.university_domains FOR SELECT
USING (is_active = TRUE);

-- Service role full access
CREATE POLICY "Service role full access to universities"
ON public.university_domains FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- VERIFICATION CODES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Service role only (no public access)
CREATE POLICY "Service role full access to verification codes"
ON public.verification_codes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- QUESTIONNAIRE ANSWERS RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Users can read their own answers
CREATE POLICY "Users can read own answers"
ON public.questionnaire_answers FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Users can insert their own answers
CREATE POLICY "Users can insert own answers"
ON public.questionnaire_answers FOR INSERT
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Users can update their own answers
CREATE POLICY "Users can update own answers"
ON public.questionnaire_answers FOR UPDATE
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access to questionnaire answers"
ON public.questionnaire_answers FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- MATCHES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Users can read their own matches
CREATE POLICY "Users can read own matches"
ON public.matches FOR SELECT
USING (
    user_a_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) OR
    user_b_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- Service role full access
CREATE POLICY "Service role full access to matches"
ON public.matches FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- MESSAGES RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Users can read messages in their matches
CREATE POLICY "Users can read own messages"
ON public.messages FOR SELECT
USING (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
           OR user_b_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- Users can insert messages in their matches
CREATE POLICY "Users can insert own messages"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()) AND
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
           OR user_b_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update own messages"
ON public.messages FOR UPDATE
USING (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
           OR user_b_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
)
WITH CHECK (
    match_id IN (
        SELECT id FROM public.matches
        WHERE user_a_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
           OR user_b_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    )
);

-- Service role full access
CREATE POLICY "Service role full access to messages"
ON public.messages FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- ROOMMATE FOUND RLS POLICIES
-- ═══════════════════════════════════════════════════════════════════

-- Users can read their own roommate found status
CREATE POLICY "Users can read own roommate found"
ON public.roommate_found FOR SELECT
USING (user_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

-- Service role full access
CREATE POLICY "Service role full access to roommate found"
ON public.roommate_found FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- ═══════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════

-- Update updated_at timestamp on users
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_questionnaire_answers_updated_at
    BEFORE UPDATE ON public.questionnaire_answers
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ═══════════════════════════════════════════════════════════════════
-- FUNCTIONS
-- ═══════════════════════════════════════════════════════════════════

-- Function to get user's match candidates (60-day window)
CREATE OR REPLACE FUNCTION public.get_match_candidates(user_uuid UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    gender TEXT,
    avatar_url TEXT,
    university_id UUID,
    is_student_verified BOOLEAN,
    has_paid BOOLEAN,
    profile_status TEXT,
    last_active TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.email,
        u.full_name,
        u.gender,
        u.avatar_url,
        u.university_id,
        u.is_student_verified,
        u.has_paid,
        u.profile_status,
        u.last_active
    FROM public.users u
    WHERE u.id != user_uuid
        AND u.has_paid = TRUE
        AND u.profile_status = 'ACTIVE'
        AND u.has_completed_questionnaire = TRUE
        AND (
            -- Same gender preference or any
            (SELECT gender_preference FROM public.users WHERE id = user_uuid) = 'same' 
                AND u.gender = (SELECT gender FROM public.users WHERE id = user_uuid)
            OR
            (SELECT gender_preference FROM public.users WHERE id = user_uuid) = 'any'
        )
        AND (
            -- Within 60-day window for pioneer users, or any time for regular users
            (SELECT is_pioneer FROM public.users WHERE id = user_uuid) = TRUE
                AND u.created_at >= NOW() - INTERVAL '60 days'
            OR
            (SELECT is_pioneer FROM public.users WHERE id = user_uuid) = FALSE
        )
    ORDER BY u.last_active DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate match tier from score
CREATE OR REPLACE FUNCTION public.get_match_tier(score NUMERIC)
RETURNS TEXT AS $$
BEGIN
    IF score >= 95 THEN RETURN 'PERFECT';
    ELSIF score >= 85 THEN RETURN 'EXCELLENT';
    ELSIF score >= 70 THEN RETURN 'GOOD';
    ELSIF score >= 50 THEN RETURN 'FAIR';
    ELSE RETURN 'POOR';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ═══════════════════════════════════════════════════════════════════
-- INITIAL DATA
-- ═══════════════════════════════════════════════════════════════════

-- Insert university domains for Ghana
INSERT INTO public.university_domains (email_domain, university_name, is_active) VALUES
    ('stu.ucc.edu.gh', 'University of Cape Coast', TRUE),
    ('ug.edu.gh', 'University of Ghana', TRUE),
    ('knust.edu.gh', 'Kwame Nkrumah University of Science and Technology', TRUE),
    ('uhas.edu.gh', 'University of Health and Allied Sciences', TRUE),
    ('uew.edu.gh', 'University of Education, Winneba', TRUE),
    ('uds.edu.gh', 'University for Development Studies', TRUE),
    ('umat.edu.gh', 'University of Mines and Technology', TRUE),
    ('aamusted.edu.gh', 'Akenten Appiah-Menka University of Skills Training and Entrepreneurial Development', TRUE),
    ('kstu.edu.gh', 'Koforidua Technical University', TRUE),
    ('ktu.edu.gh', 'Kumasi Technical University', TRUE),
    ('atu.edu.gh', 'Accra Technical University', TRUE),
    ('gctu.edu.gh', 'Ghana Communication Technology University', TRUE),
    ('ctu.edu.gh', 'Cape Coast Technical University', TRUE),
    ('htu.edu.gh', 'Ho Technical University', TRUE),
    ('tatu.edu.gh', 'Takoradi Technical University', TRUE)
ON CONFLICT (email_domain) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- COMMENTS
-- ═══════════════════════════════════════════════════════════════════

COMMENT ON TABLE public.users IS 'User profiles extending Supabase auth.users';
COMMENT ON TABLE public.university_domains IS 'Approved university email domains for student verification';
COMMENT ON TABLE public.verification_codes IS 'OTP codes for secure email verification (service role only)';
COMMENT ON TABLE public.questionnaire_answers IS 'User responses to compatibility questionnaire';
COMMENT ON TABLE public.matches IS 'Calculated compatibility scores between users';
COMMENT ON TABLE public.messages IS 'Chat messages between matched users';
COMMENT ON TABLE public.roommate_found IS 'Notifications when users find their roommate';

COMMENT ON FUNCTION public.get_match_candidates IS 'Returns potential matches for a user with 60-day window for pioneer users';
COMMENT ON FUNCTION public.get_match_tier IS 'Returns match tier based on compatibility score';

-- ═══════════════════════════════════════════════════════════════════
-- GRANTS
-- ═══════════════════════════════════════════════════════════════════

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT ON public.questionnaire_answers TO authenticated;
GRANT INSERT ON public.messages TO authenticated;
GRANT UPDATE ON public.users TO authenticated;
GRANT UPDATE ON public.questionnaire_answers TO authenticated;
GRANT UPDATE ON public.messages TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_match_candidates TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_match_tier TO authenticated;
