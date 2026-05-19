-- 1. Criar a tabela de organizações para isolamento multi-tenant
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Habilitar RLS na tabela de organizações
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Adicionar organization_id em profiles para vincular usuários
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- 3. Função segura para recuperar a organização do contexto atual
CREATE OR REPLACE FUNCTION public.get_current_organization_id()
RETURNS UUID AS $$
BEGIN
  RETURN (SELECT organization_id FROM public.profiles WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Hardening da tabela de Fretes Internos
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'fretes_internos' AND column_name = 'organization_id') THEN
        ALTER TABLE public.fretes_internos ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

ALTER TABLE public.fretes_internos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization's fretes" ON public.fretes_internos;
CREATE POLICY "Users can view their organization's fretes" 
ON public.fretes_internos 
FOR SELECT 
USING (organization_id = public.get_current_organization_id());

DROP POLICY IF EXISTS "Users can insert their organization's fretes" ON public.fretes_internos;
CREATE POLICY "Users can insert their organization's fretes" 
ON public.fretes_internos 
FOR INSERT 
WITH CHECK (organization_id = public.get_current_organization_id());

-- 5. Hardening da tabela de Auditoria (audit_logs)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their organization's audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their organization's audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (user_id IN (SELECT id FROM public.profiles WHERE organization_id = public.get_current_organization_id()));

-- 6. Automação de timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON public.organizations;
CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.organizations
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();
