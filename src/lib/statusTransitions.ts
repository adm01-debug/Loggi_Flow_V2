import type { Database } from "@/integrations/supabase/types";

export type EntregaStatus =
  Database["public"]["Enums"]["entrega_status"];
export type ColetaStatus =
  Database["public"]["Enums"]["coleta_status"];

/**
 * Mapa completo de transicoes validas de entrega.
 * Espelha o que a funcao fn_valida_transicao_entrega do banco aplica (etapas 028-029).
 */
export const TRANSICOES_ENTREGA: Record<EntregaStatus, EntregaStatus[]> = {
  aguardando_producao: ["pronto_despacho"],
  pronto_despacho: ["cotacao_frete"],
  cotacao_frete: ["nf_emitida"],
  nf_emitida: ["despachado"],
  despachado: ["em_transito"],
  em_transito: ["saiu_entrega"],
  saiu_entrega: ["entregue", "ocorrencia"],
  entregue: ["finalizado"],
  ocorrencia: ["saiu_entrega", "finalizado"],
  finalizado: [],
};

/**
 * Mapa completo de transicoes validas de coleta.
 * Espelha o que a funcao fn_valida_transicao_coleta do banco aplica (etapa 030).
 */
export const TRANSICOES_COLETA: Record<ColetaStatus, ColetaStatus[]> = {
  aguardando_liberacao: ["solicitada"],
  solicitada: ["em_transito"],
  em_transito: ["chegou_expedicao"],
  chegou_expedicao: ["conferencia_ok", "divergencia"],
  conferencia_ok: ["finalizada"],
  divergencia: ["conferencia_ok", "finalizada"],
  finalizada: [],
};

/** Retorna true se a transicao de -> para e valida para entregas. */
export function podeTransicionarEntrega(
  de: EntregaStatus,
  para: EntregaStatus,
): boolean {
  return (TRANSICOES_ENTREGA[de] ?? []).includes(para);
}

/** Retorna true se a transicao de -> para e valida para coletas. */
export function podeTransicionarColeta(
  de: ColetaStatus,
  para: ColetaStatus,
): boolean {
  return (TRANSICOES_COLETA[de] ?? []).includes(para);
}