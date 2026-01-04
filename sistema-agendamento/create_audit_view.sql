-- Create a specific view for Legal Audit
-- This view combines the User data with the exact Term Content they accepted
CREATE OR REPLACE VIEW public.audit_consent_view AS
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
COMMENT ON VIEW public.audit_consent_view IS 'Audit view showing teachers and the exact legal text they accepted.';
