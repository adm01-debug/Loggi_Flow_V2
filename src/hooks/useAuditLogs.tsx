import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AuditLog {
  id: string;
  table_name: string;
  record_id: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  old_data: Record<string, unknown> | null;
  new_data: Record<string, unknown> | null;
  changed_fields: string[] | null;
  user_id: string | null;
  user_email: string | null;
  user_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export interface AuditLogFilters {
  table_name?: string;
  action?: 'INSERT' | 'UPDATE' | 'DELETE';
  record_id?: string;
  user_id?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export function useAuditLogs(filters: AuditLogFilters = {}) {
  return useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: async (): Promise<AuditLog[]> => {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.record_id) {
        query = query.eq('record_id', filters.record_id);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      query = query.limit(filters.limit || 100);

      const { data, error } = await query;

      if (error) throw error;

      return (data as AuditLog[]) || [];
    },
    staleTime: 1000 * 60 * 1, // 1 minute
  });
}

export function useRecordHistory(recordId: string, tableName: string) {
  return useQuery({
    queryKey: ['record-history', recordId, tableName],
    queryFn: async (): Promise<AuditLog[]> => {
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .eq('record_id', recordId)
        .eq('table_name', tableName)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data as AuditLog[]) || [];
    },
    enabled: !!recordId && !!tableName,
  });
}

// Helper to get human-readable table names
export const tableNameLabels: Record<string, string> = {
  coletas: 'Coletas',
  entregas: 'Entregas',
  fornecedores: 'Fornecedores',
  clientes: 'Clientes',
  transportadoras: 'Transportadoras',
  ocorrencias: 'Ocorrências',
  cotacoes_frete: 'Cotações de Frete',
  profiles: 'Perfis',
  user_roles: 'Papéis de Usuário',
};

// Helper to get human-readable action names
export const actionLabels: Record<string, string> = {
  INSERT: 'Criação',
  UPDATE: 'Atualização',
  DELETE: 'Exclusão',
};

// Helper to get human-readable field names
export const fieldNameLabels: Record<string, string> = {
  status: 'Status',
  numero_coleta: 'Número da Coleta',
  numero_entrega: 'Número da Entrega',
  endereco_coleta: 'Endereço de Coleta',
  endereco_entrega: 'Endereço de Entrega',
  data_prevista_coleta: 'Data Prevista de Coleta',
  data_efetiva_coleta: 'Data Efetiva de Coleta',
  previsao_entrega: 'Previsão de Entrega',
  data_entrega_efetiva: 'Data de Entrega Efetiva',
  divergencia_percentual: 'Divergência (%)',
  qtd_volumes: 'Quantidade de Volumes',
  qtd_recebida: 'Quantidade Recebida',
  peso_estimado_kg: 'Peso Estimado (kg)',
  valor_frete: 'Valor do Frete',
  tipo_frete: 'Tipo de Frete',
  transportadora_id: 'Transportadora',
  fornecedor_id: 'Fornecedor',
  cliente_id: 'Cliente',
  observacoes: 'Observações',
  nf_remessa: 'NF Remessa',
  codigo_rastreamento: 'Código de Rastreamento',
  updated_at: 'Atualizado em',
  created_at: 'Criado em',
};
