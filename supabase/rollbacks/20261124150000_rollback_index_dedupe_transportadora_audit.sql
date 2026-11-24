-- Desfaz 20261124150000_index_dedupe_transportadora_audit.sql.
-- Os dois primeiros sao parciais: recriar SEM o predicado muda o custo, por isso o WHERE original.
CREATE INDEX IF NOT EXISTS idx_entregas_transportadora
  ON public.entregas (transportadora_id) WHERE transportadora_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_coletas_transportadora
  ON public.coletas (transportadora_id) WHERE transportadora_id IS NOT NULL;

-- audit_logs e particionada: recriar no pai cascateia para as 13 particoes.
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id_table
  ON public.audit_logs (record_id, table_name);
