-- Create promo_codes table for student discount hub
CREATE TABLE IF NOT EXISTS public.promo_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_amount INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    usage_limit INTEGER,
    times_used INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to check for promo codes
CREATE POLICY "Users can check promo codes"
ON public.promo_codes FOR SELECT
TO authenticated
USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > now()));

-- Insert initial test code
INSERT INTO public.promo_codes (code, discount_amount)
VALUES ('WELCOME10', 10)
ON CONFLICT (code) DO NOTHING;

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON public.promo_codes(code);

-- Add comment
COMMENT ON TABLE public.promo_codes IS 'Stores promo codes for student verification discounts (e.g. 25 -> 15 GHS).';
