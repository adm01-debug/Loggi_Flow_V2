-- Tabela de workflows n8n cadastrados
CREATE TABLE IF NOT EXISTS n8n_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  webhook_url TEXT NOT NULL,
  webhook_path TEXT,
  trigger_type TEXT DEFAULT 'manual', -- manual, schedule, event
  event_trigger TEXT, -- nova_entrega, alerta_sla, etc
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de logs de execução
CREATE TABLE IF NOT EXISTS n8n_execution_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID REFERENCES n8n_workflows(id),
  workflow_name TEXT,
  trigger_type TEXT,
  input_data JSONB,
  output_data JSONB,
  status TEXT DEFAULT 'pending', -- pending, success, error
  error_message TEXT,
  executed_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INT
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_n8n_workflows_active ON n8n_workflows(is_active);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_workflow ON n8n_execution_logs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_n8n_logs_date ON n8n_execution_logs(executed_at DESC);

-- RLS
ALTER TABLE n8n_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE n8n_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view workflows" ON n8n_workflows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage workflows" ON n8n_workflows FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Authenticated users can view logs" ON n8n_execution_logs FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "System can insert logs" ON n8n_execution_logs FOR INSERT WITH CHECK (true);

-- Inserir workflows padrão
INSERT INTO n8n_workflows (name, description, webhook_path, trigger_type, event_trigger) VALUES
('Nova Entrega', 'Notifica equipe sobre nova entrega', '/nova-entrega', 'event', 'entrega_criada'),
('Alerta SLA', 'Alerta quando entrega está atrasando', '/alerta-sla', 'event', 'sla_risco'),
('Sync Bitrix24', 'Sincroniza dados com Bitrix24', '/sync-bitrix24', 'event', 'sync_requested'),
('Relatório Diário', 'Envia relatório diário por email', '/relatorio-diario', 'schedule', null),
('WhatsApp Tracking', 'Envia atualização de tracking via WhatsApp', '/whatsapp', 'event', 'status_changed')
ON CONFLICT DO NOTHING;
