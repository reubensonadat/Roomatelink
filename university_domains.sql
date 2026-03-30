-- ═══════════════════════════════════════════════════════════════
-- ROOMMATE LINK — University Domains Table
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Create the university_domains table
-- This allows you to easily add new universities without touching code.
-- Just insert a new row with the university name and email domain.
CREATE TABLE IF NOT EXISTS university_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_name TEXT NOT NULL,           -- e.g. "University of Cape Coast"
  short_name TEXT NOT NULL UNIQUE,         -- e.g. "UCC" (used in dropdown)
  email_domain TEXT NOT NULL UNIQUE,       -- e.g. "stu.ucc.edu.gh"
  is_active BOOLEAN DEFAULT TRUE,         -- flip to false to disable signups
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Seed it with UCC as the first university
INSERT INTO university_domains (university_name, short_name, email_domain)
VALUES ('University of Cape Coast', 'UCC', 'stu.ucc.edu.gh')
ON CONFLICT (short_name) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════
-- HOW TO ADD MORE UNIVERSITIES LATER:
-- ═══════════════════════════════════════════════════════════════
-- Just run this in the SQL editor (one line per university):
--
-- INSERT INTO university_domains (university_name, short_name, email_domain)
-- VALUES ('Kwame Nkrumah University of Science and Technology', 'KNUST', 'st.knust.edu.gh');
--
-- INSERT INTO university_domains (university_name, short_name, email_domain)
-- VALUES ('University of Ghana', 'UG', 'st.ug.edu.gh');
--
-- INSERT INTO university_domains (university_name, short_name, email_domain)
-- VALUES ('University of Education, Winneba', 'UEW', 'stu.uew.edu.gh');
-- ═══════════════════════════════════════════════════════════════

-- 3. Add a university_id column to the users table (for V2 matching by university)
ALTER TABLE users ADD COLUMN IF NOT EXISTS university_id UUID REFERENCES university_domains(id);

-- 4. Enable Row Level Security
ALTER TABLE university_domains ENABLE ROW LEVEL SECURITY;

-- Everyone can read the list of universities (for the dropdown)
CREATE POLICY "Anyone can view active universities"
  ON university_domains FOR SELECT
  USING (is_active = true);
