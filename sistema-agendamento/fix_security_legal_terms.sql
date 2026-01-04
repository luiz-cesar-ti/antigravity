-- Force RLS Enable
ALTER TABLE public.legal_terms ENABLE ROW LEVEL SECURITY;

-- Remove old weak policies if any
DROP POLICY IF EXISTS "Legal terms are viewable by everyone" ON public.legal_terms;

-- Create strict policy: Only Logged-in users (Authenticated) can read
CREATE POLICY "Strict Access - Authenticated Only"
ON public.legal_terms FOR SELECT
TO authenticated
USING (true);

-- Explicitly deny anon/public access is handled by default when RLS is on and no public policy exists.
