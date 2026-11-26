-- Rollback da migration 20261126170000: recria as 7 tabelas exatamente como estavam no banco
-- oficial em 2026-11-26 (pg_dump 17.12 --schema-only, filtrado: sem cabecalho, SET e \restrict),
-- incluindo policies, indices, grants e RLS habilitada, e devolve as 3 linhas de
-- system_contract_schemas que existiam na tabela.
-- Aplicar direto no banco (nao passa pelo aplicar-migration.yml, que so aceita supabase/migrations/).

begin;
CREATE TABLE public.account_lockouts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    email text NOT NULL,
    locked_until timestamp with time zone NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    reason text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.allowed_ips (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    ip_address text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    created_by uuid,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.driver_badges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    driver_id uuid NOT NULL,
    badge_type text NOT NULL,
    level integer DEFAULT 1,
    unlocked_at timestamp with time zone DEFAULT now(),
    metadata jsonb DEFAULT '{}'::jsonb
);
CREATE TABLE public.email_verification_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token text NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code text NOT NULL,
    name text NOT NULL,
    subject text,
    body_text text NOT NULL,
    body_html text,
    channels text[] DEFAULT '{email,whatsapp}'::text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.system_adr (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title text NOT NULL,
    status text NOT NULL,
    context text,
    decision text,
    consequences text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
CREATE TABLE public.system_contract_schemas (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    entity_name text NOT NULL,
    schema jsonb NOT NULL,
    version integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
ALTER TABLE ONLY public.account_lockouts
    ADD CONSTRAINT account_lockouts_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.allowed_ips
    ADD CONSTRAINT allowed_ips_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.driver_badges
    ADD CONSTRAINT driver_badges_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_token_key UNIQUE (token);
ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_code_key UNIQUE (code);
ALTER TABLE ONLY public.notification_templates
    ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_adr
    ADD CONSTRAINT system_adr_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.system_contract_schemas
    ADD CONSTRAINT system_contract_schemas_entity_name_key UNIQUE (entity_name);
ALTER TABLE ONLY public.system_contract_schemas
    ADD CONSTRAINT system_contract_schemas_pkey PRIMARY KEY (id);
CREATE INDEX idx_account_lockouts_email ON public.account_lockouts USING btree (email);
CREATE INDEX idx_allowed_ips_user_id ON public.allowed_ips USING btree (user_id);
CREATE INDEX idx_driver_badges_driver_id ON public.driver_badges USING btree (driver_id);
CREATE INDEX idx_email_verification_tokens_user_id ON public.email_verification_tokens USING btree (user_id);
CREATE TRIGGER audit_log_trigger AFTER INSERT OR DELETE OR UPDATE ON public.account_lockouts FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_log_trigger AFTER INSERT OR DELETE OR UPDATE ON public.allowed_ips FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_log_trigger AFTER INSERT OR DELETE OR UPDATE ON public.email_verification_tokens FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER audit_log_trigger AFTER INSERT OR DELETE OR UPDATE ON public.system_adr FOR EACH ROW EXECUTE FUNCTION public.audit_log_trigger();
CREATE TRIGGER trg_notification_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_system_contract_schemas_updated_at BEFORE UPDATE ON public.system_contract_schemas FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER update_account_lockouts_updated_at BEFORE UPDATE ON public.account_lockouts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_allowed_ips_updated_at BEFORE UPDATE ON public.allowed_ips FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_adr_updated_at BEFORE UPDATE ON public.system_adr FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER TABLE ONLY public.allowed_ips
    ADD CONSTRAINT allowed_ips_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.driver_badges
    ADD CONSTRAINT driver_badges_driver_id_fkey FOREIGN KEY (driver_id) REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.email_verification_tokens
    ADD CONSTRAINT email_verification_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
CREATE POLICY "Admins can manage all allowed IPs" ON public.allowed_ips TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage driver badges" ON public.driver_badges TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.profiles
  WHERE ((profiles.id = auth.uid()) AND (profiles.cargo = 'admin'::text)))));
CREATE POLICY "Admins can manage lockouts" ON public.account_lockouts TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage verification tokens" ON public.email_verification_tokens TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can view lockouts" ON public.account_lockouts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage ADRs" ON public.system_adr TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins manage notification_templates" ON public.notification_templates TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Allow authenticated read for schemas" ON public.system_contract_schemas FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read notification_templates" ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Delete own IPs" ON public.allowed_ips FOR DELETE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Drivers can view their own badges" ON public.driver_badges FOR SELECT TO authenticated USING ((auth.uid() = driver_id));
CREATE POLICY "Insert own IPs" ON public.allowed_ips FOR INSERT TO authenticated WITH CHECK (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Update own IPs" ON public.allowed_ips FOR UPDATE TO authenticated USING (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role))) WITH CHECK (((user_id = auth.uid()) OR public.has_role(auth.uid(), 'admin'::public.app_role)));
CREATE POLICY "Users can view their own allowed IPs" ON public.allowed_ips FOR SELECT TO authenticated USING ((auth.uid() = user_id));
ALTER TABLE public.account_lockouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.allowed_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_adr ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_contract_schemas ENABLE ROW LEVEL SECURITY;
GRANT SELECT,MAINTAIN ON TABLE public.account_lockouts TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.account_lockouts TO authenticated;
GRANT ALL ON TABLE public.account_lockouts TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.allowed_ips TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.allowed_ips TO authenticated;
GRANT ALL ON TABLE public.allowed_ips TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.driver_badges TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.driver_badges TO authenticated;
GRANT ALL ON TABLE public.driver_badges TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.email_verification_tokens TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.email_verification_tokens TO authenticated;
GRANT ALL ON TABLE public.email_verification_tokens TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.notification_templates TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.notification_templates TO authenticated;
GRANT ALL ON TABLE public.notification_templates TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.system_adr TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.system_adr TO authenticated;
GRANT ALL ON TABLE public.system_adr TO service_role;
GRANT SELECT,MAINTAIN ON TABLE public.system_contract_schemas TO anon;
GRANT SELECT,INSERT,DELETE,MAINTAIN,UPDATE ON TABLE public.system_contract_schemas TO authenticated;
GRANT ALL ON TABLE public.system_contract_schemas TO service_role;

-- Dados preservados (3 linhas de system_contract_schemas):
INSERT INTO public.system_contract_schemas (id, entity_name, schema, version, created_at, updated_at) VALUES ('20cf2b53-a6e5-4def-826b-8366e14bc791', 'ocr-receipt-processor', '{"type": "object", "required": ["storage_path", "delivery_id"], "properties": {"delivery_id": {"type": "string", "minLength": 10}, "storage_path": {"type": "string", "minLength": 5}}}', 1, '2026-05-19 17:24:10.781453+00', '2026-05-19 17:24:10.781453+00');
INSERT INTO public.system_contract_schemas (id, entity_name, schema, version, created_at, updated_at) VALUES ('c4d5870b-4a5c-4bd1-a4a3-63f80bb692c9', 'normalize-freight-response', '{"type": "object", "required": ["text", "transportadora_id"], "properties": {"text": {"type": "string", "minLength": 1}, "transportadora_id": {"type": "string", "minLength": 36}}}', 1, '2026-05-19 17:24:10.781453+00', '2026-05-19 17:24:10.781453+00');
INSERT INTO public.system_contract_schemas (id, entity_name, schema, version, created_at, updated_at) VALUES ('f767f03d-6c56-46de-b902-355b47c893da', 'carrier-webhook-receiver', '{"type": "object", "required": ["carrier_id", "event_type"], "properties": {"carrier_id": {"type": "string", "minLength": 2}, "event_type": {"type": "string", "minLength": 3}}}', 1, '2026-05-19 17:24:10.781453+00', '2026-05-19 17:24:10.781453+00');

commit;
