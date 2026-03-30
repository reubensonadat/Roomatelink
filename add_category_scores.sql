-- ═══════════════════════════════════════════════════════════════
-- ROOMMATE LINK — Match Category Details
-- Run this in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- Add the category_scores column to store the 10-dimension breakdown
ALTER TABLE matches 
ADD COLUMN IF NOT EXISTS category_scores JSONB DEFAULT '[]'::jsonb;

-- Comment for clarity
COMMENT ON COLUMN matches.category_scores IS 'Stores the 10-category compatibility breakdown (name, score, insight)';
