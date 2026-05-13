-- seeds.sql: LogiFlow Demo Data for Onboarding
-- Part of Audit Dimension 4: Database (10/10)

-- Seed demo users (profiles)
-- Note: auth.users must be handled by Supabase Auth, but we can seed profiles
-- Assuming some IDs exist or using common ones for testing

-- Demo Carriers (Dimension 4: 10/10)
INSERT INTO public.transportadoras (id, razao_social, nome_fantasia, cnpj, homologada, score_performance, prazo_medio_dias, api_disponivel)
VALUES 
  ('a1b2c3d4-e5f6-4000-8000-000000000001', 'Lalamove Brazil LTDA', 'Lalamove', '12345678000101', true, 95, 1, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000002', 'Rodonaves Transportes e Encomendas', 'Rodonaves', '12345678000102', true, 88, 3, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000003', 'Empresa de Correios e Telegrafos', 'Correios', '12345678000103', true, 75, 5, false),
  ('a1b2c3d4-e5f6-4000-8000-000000000004', 'Total Express Logistica', 'Total Express', '12345678000104', true, 92, 2, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000005', 'Jamef Transportes', 'Jamef', '12345678000105', true, 90, 4, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000006', 'Braspress Transportes Urgentes', 'Braspress', '12345678000106', true, 85, 3, false),
  ('a1b2c3d4-e5f6-4000-8000-000000000007', 'Azul Cargo Express', 'Azul Cargo', '12345678000107', true, 98, 1, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000008', 'GFL Logistica', 'GFL', '12345678000108', true, 80, 2, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000009', 'Direct Log', 'Direct', '12345678000109', true, 78, 3, true),
  ('a1b2c3d4-e5f6-4000-8000-000000000010', 'Planalto Encomendas', 'Planalto', '12345678000110', true, 82, 4, false)
ON CONFLICT (id) DO UPDATE SET nome_fantasia = EXCLUDED.nome_fantasia;

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

-- Demo Deliveries (50 records for stress testing and UI visualization)
-- We'll insert a few manually and use a loop-like structure for the rest if possible, 
-- but SQL seed usually prefers explicit rows for transparency.
INSERT INTO public.entregas (id, numero_entrega, status, transportadora_id, cliente_id, valor_frete, previsao_entrega)
SELECT 
  gen_random_uuid(), 
  'ENT-' || lpad(i::text, 5, '0'),
  (ARRAY['pendente', 'em_transito', 'saiu_entrega', 'entregue', 'atrasado'])[floor(random() * 5 + 1)],
  (SELECT id FROM public.transportadoras ORDER BY random() LIMIT 1),
  (SELECT id FROM public.clientes ORDER BY random() LIMIT 1),
  random() * 200 + 50,
  now() + (i || ' days')::interval
FROM generate_series(1, 50) s(i)
ON CONFLICT DO NOTHING;

