-- Create verification_codes table for secure OTP storage
CREATE TABLE IF NOT EXISTS public.verification_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '10 minutes'),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_codes ENABLE ROW LEVEL SECURITY;

-- Block all public access (Service Role Only)
-- This table is purely for the Edge Function (Beast Mode)
CREATE POLICY "No public access to codes" 
ON public.verification_codes 
FOR ALL 
USING (false);

-- Add Index for fast cleanup
CREATE INDEX IF NOT EXISTS idx_verification_codes_expires_at ON public.verification_codes(expires_at);
CREATE INDEX IF NOT EXISTS idx_verification_codes_email ON public.verification_codes(email);

-- Add comment
COMMENT ON TABLE public.verification_codes IS 'Secure OTP storage for student identity verification (Beast Mode).';
