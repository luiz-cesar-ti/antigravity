-- Create table for storing legal terms versions
CREATE TABLE IF NOT EXISTS public.legal_terms (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    version text NOT NULL UNIQUE, -- e.g. 'v1.0'
    content text NOT NULL,
    created_at timestamptz DEFAULT now(),
    active boolean DEFAULT true
);

-- Comment for documentation
COMMENT ON TABLE public.legal_terms IS 'Stores the exact text of legal terms versions for audit purposes.';

-- Insert the current v1.0 term (extracted from Register.tsx)
INSERT INTO public.legal_terms (version, content)
VALUES (
    'v1.0',
    E'Declaro que li e aceito os termos. Estou ciente de que o sistema armazenará meu **Nome**, **E-mail Institucional** e **Unidade** para fins de identificação e acesso.\n\nConcordo que todas as minhas ações de agendamento e empréstimo gerarão **registros digitais (logs)** para segurança e auditoria.\n\nAutorizo também o armazenamento de cópias digitais dos **Termos de Responsabilidade** assinados por mim, para fins de controle de patrimônio da instituição.'
)
ON CONFLICT (version) DO NOTHING;
