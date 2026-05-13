-- Seed data for LogiFlow (Promo Brindes)
-- Dimension 4: Database - Onboarding / Dev Environment
-- Created: 2026-05-13

-- 1. Create Demo Users (requires Auth setup, but we add to profiles for frontend simulation)
-- Note: Real auth users must be created via Supabase Auth API/Dashboard, 
-- but these profiles linked to UUIDs allow testing RLS and UI.

INSERT INTO public.profiles (id, email, full_name, avatar_url, cargo)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin@logiflow.com', 'Admin Master', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin', 'Diretor de Logística'),
  ('00000000-0000-0000-0000-000000000002', 'operador1@logiflow.com', 'Carlos Operador', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos', 'Analista de Expedição'),
  ('00000000-0000-0000-0000-000000000003', 'financeiro@logiflow.com', 'Ana Financeiro', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Ana', 'Gerente Financeira'),
  ('00000000-0000-0000-0000-000000000004', 'motorista1@logiflow.com', 'João Motorista', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao', 'Motorista Agregado'),
  ('00000000-0000-0000-0000-000000000005', 'cliente@demo.com', 'Cliente VIP Ltda', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Cliente', 'Comprador')
ON CONFLICT (id) DO NOTHING;

-- 2. Assign Roles
INSERT INTO public.user_roles (user_id, role)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin'),
  ('00000000-0000-0000-0000-000000000002', 'operator'),
  ('00000000-0000-0000-0000-000000000003', 'finance'),
  ('00000000-0000-0000-0000-000000000004', 'driver')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Transportadoras (10 carriers)
INSERT INTO public.transportadoras (id, razao_social, nome_fantasia, cnpj, homologada, api_disponivel, score_performance)
VALUES 
  (gen_random_uuid(), 'Lalamove Brasil LTDA', 'Lalamove', '12345678000101', true, true, 95),
  (gen_random_uuid(), 'Rodonaves Transportes e Encomendas', 'Rodonaves', '98765432000199', true, true, 92),
  (gen_random_uuid(), 'Correios - Empresa Brasileira de Correios e Telégrafos', 'Correios', '34028316000103', true, true, 85),
  (gen_random_uuid(), 'Loggi Tecnologia LTDA', 'Loggi', '12345678000102', true, true, 88),
  (gen_random_uuid(), 'Braspress Transportes Urgentes', 'Braspress', '12345678000103', true, false, 90),
  (gen_random_uuid(), 'Jamef Transportes', 'Jamef', '12345678000104', true, false, 93),
  (gen_random_uuid(), 'Azul Cargo Express', 'Azul Cargo', '12345678000105', true, true, 94),
  (gen_random_uuid(), 'Total Express', 'Total Express', '12345678000106', true, true, 87),
  (gen_random_uuid(), 'Jadlog Logística', 'Jadlog', '12345678000107', true, true, 89),
  (gen_random_uuid(), 'Expresso São Miguel', 'São Miguel', '12345678000108', false, false, 75);

-- 4. Entregas Demo (50 deliveries - partial list for brevity, logic follows)
-- Using a loop in a temporary function to generate 50 rows
DO $$
DECLARE 
    i INT;
    t_id UUID;
BEGIN
    SELECT id INTO t_id FROM public.transportadoras LIMIT 1;
    FOR i IN 1..50 LOOP
        INSERT INTO public.entregas (
            id, 
            cliente_id, 
            transportadora_id, 
            status, 
            valor_frete, 
            prazo_estimado,
            data_postagem,
            codigo_rastreio
        )
        VALUES (
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000005',
            (SELECT id FROM public.transportadoras OFFSET (i % 10) LIMIT 1),
            CASE 
                WHEN i % 5 = 0 THEN 'pendente'
                WHEN i % 5 = 1 THEN 'em_transito'
                WHEN i % 5 = 2 THEN 'entregue'
                WHEN i % 5 = 3 THEN 'cancelado'
                ELSE 'devolvido'
            END,
            (random() * 500 + 50)::numeric(10,2),
            current_date + (random() * 10 + 1)::int * interval '1 day',
            current_date - (random() * 5)::int * interval '1 day',
            'TRACK-' || lpad(i::text, 6, '0')
        );
    END LOOP;
END $$;

-- 5. Business Rules
INSERT INTO public.business_rules (name, description, is_active, rule_type)
VALUES 
  ('Bloqueio Frete Caro', 'Bloquear cotações acima de R$ 500 sem aprovação gerente', true, 'validation'),
  ('Prioridade Rodonaves', 'Sugerir Rodonaves para cargas acima de 100kg', true, 'optimization'),
  ('Alerta Atraso', 'Notificar se entrega não for atualizada em 48h', true, 'notification')
ON CONFLICT (name) DO NOTHING;

-- 6. Rate Limit Rules
INSERT INTO public.ip_access_rules (ip_address, rule_type, note)
VALUES 
  ('127.0.0.1', 'allow', 'Localhost access'),
  ('192.168.1.1', 'allow', 'Office network')
ON CONFLICT (ip_address) DO NOTHING;
