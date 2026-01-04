-- Add consent logging columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS terms_accepted boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz DEFAULT NULL,
ADD COLUMN IF NOT EXISTS terms_version text DEFAULT NULL;

-- Comment for documentation
COMMENT ON COLUMN public.users.terms_accepted IS 'Indicates if the user has accepted the terms of use';
COMMENT ON COLUMN public.users.terms_accepted_at IS 'Timestamp of when the terms were accepted';
COMMENT ON COLUMN public.users.terms_version IS 'Version of the terms accepted (e.g. v1.0)';
