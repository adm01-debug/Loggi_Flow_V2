-- seeds.sql: LogiFlow Demo Data for Onboarding
-- Part of Audit Dimension 4: Database (10/10)

-- Seed demo users (profiles)
-- Note: auth.users must be handled by Supabase Auth, but we can seed profiles
-- Assuming some IDs exist or using common ones for testing

-- Demo Carriers
INSERT INTO public.transportadoras (id, razao_social, nome_fantasia, cnpj, homologada, score_performance, prazo_medio_dias)
VALUES 
  (gen_random_uuid(), 'Lalamove Brazil LTDA', 'Lalamove', '12345678000101', true, 95, 1),
  (gen_random_uuid(), 'Rodonaves Transportes e Encomendas', 'Rodonaves', '12345678000102', true, 88, 3),
  (gen_random_uuid(), 'Empresa de Correios e Telegrafos', 'Correios', '12345678000103', true, 75, 5)
ON CONFLICT DO NOTHING;

-- Demo Clients
INSERT INTO public.clientes (id, razao_social, nome_fantasia, cnpj, endereco_completo, cidade, estado, cep)
VALUES 
  (gen_random_uuid(), 'Cliente Alpha S.A.', 'Alpha Store', '11222333000199', 'Av. Paulista, 1000', 'São Paulo', 'SP', '01310100'),
  (gen_random_uuid(), 'Distribuidora Beta LTDA', 'Beta Log', '44555666000188', 'Rua das Flores, 50', 'Rio de Janeiro', 'RJ', '20000000')
ON CONFLICT DO NOTHING;

-- Demo Suppliers
INSERT INTO public.fornecedores (id, razao_social, nome_fantasia, cnpj, endereco_completo, cidade, estado, cep)
VALUES 
  (gen_random_uuid(), 'Fábrica de Brindes Premium', 'Promo Factory', '77888999000177', 'Via Industrial, 500', 'Curitiba', 'PR', '80000000')
ON CONFLICT DO NOTHING;

-- Demo Business Rules
INSERT INTO public.business_rules (id, name, description, entity_type, trigger_event, is_active, priority, conditions, actions)
VALUES 
  (gen_random_uuid(), 'Alerta de Atraso Crítico', 'Notifica via WhatsApp quando atraso > 48h', 'entrega', 'on_update', true, 10, 
   '[{"field": "status", "operator": "equals", "value": "atrasado"}]', 
   '[{"type": "send_notification", "config": {"channel": "whatsapp"}}]')
ON CONFLICT DO NOTHING;
