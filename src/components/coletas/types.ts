export type ColetaStatus =
  | "aguardando_liberacao"
  | "solicitada"
  | "em_transito"
  | "chegou_expedicao"
  | "conferencia_ok"
  | "divergencia"
  | "finalizada";
export type ColetaTipo = "lalamove" | "transportadora";

export interface Coleta {
  id: string;
  numero_coleta: string;
  fornecedor_id: string | null;
  endereco_coleta: string;
  contato_coleta: string | null;
  tipo_coleta: ColetaTipo;
  transportadora_id: string | null;
  data_prevista_coleta: string | null;
  data_efetiva_coleta: string | null;
  qtd_volumes: number | null;
  qtd_recebida?: number | null;
  peso_estimado_kg: number | null;
  peso_efetivo?: number | null;
  codigo_rastreamento: string | null;
  status: ColetaStatus;
  observacoes: string | null;
  is_reverse?: boolean;
  is_urgent?: boolean;
  custo_estimado?: number;
  custo_real?: number;
  created_at: string;
  fornecedores?: {
    razao_social: string;
    nome_fantasia: string | null;
  } | null;
  transportadoras?: {
    nome_fantasia: string;
  } | null;
}
