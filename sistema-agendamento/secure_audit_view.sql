-- 1. Enable RLS on the legal_terms table (Secure the base table)
ALTER TABLE public.legal_terms ENABLE ROW LEVEL SECURITY;

-- 2. Create Policy: Allow everyone to read terms (since they are public legal docs)
CREATE POLICY "Legal terms are viewable by everyone" 
ON public.legal_terms FOR SELECT 
USING (true);

-- 3. Create Policy: Only service_role can insert/update (Immutable for standard users)
-- (No policy for INSERT/UPDATE implies deny by default for normal users)

-- 4. Recreate the View with Security Invoker
-- This ensures the View enforces the RLS policies of the underlying tables (users table)
CREATE OR REPLACE VIEW public.audit_consent_view 
WITH (security_invoker = true) 
AS
SELECT 
    u.full_name as "Nome do Professor",
    u.email as "Email",
    u.totvs_number as "Matrícula/TOTVS",
    u.terms_accepted_at as "Data/Hora do Aceite",
    u.terms_version as "Versão do Termo",
    lt.content as "Texto Exato Aceito"
FROM 
    public.users u
JOIN 
    public.legal_terms lt ON u.terms_version = lt.version
WHERE 
    u.role = 'teacher' 
    AND u.terms_accepted = true;

-- Comment
COMMENT ON VIEW public.audit_consent_view IS 'Audit view showing teachers and the exact legal text they accepted. Enforces RLS.';
