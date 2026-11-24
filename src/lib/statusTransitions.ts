import type { Database } from "@/integrations/supabase/types";

export type EntregaStatus =
  Database["public"]["Enums"]["entrega_status"];
export type ColetaStatus =
  Database["public"]["Enums"]["coleta_status"];

/**
 * Transicoes de entrega oferecidas pela UI (caminho linear).
 * A funcao fn_valida_transicao_entrega do banco (etapas 028-029) aceita tambem
 * atalhos usados por despacho e rastreio: despachado/em_transito -> entregue,
 * despachado -> saiu_entrega|ocorrencia, saiu_entrega -> em_transito e
 * ocorrencia -> em_transito|entregue. O banco e sempre mais permissivo que este mapa.
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
  return TRANSICOES_ENTREGA[de].includes(para);
}

/** Retorna true se a transicao de -> para e valida para coletas. */
export function podeTransicionarColeta(
  de: ColetaStatus,
  para: ColetaStatus,
): boolean {
  return TRANSICOES_COLETA[de].includes(para);
}

/** Rotulo de operacao de cada status de entrega, completo em relacao ao enum. */
export const ROTULOS_ENTREGA: Record<EntregaStatus, string> = {
  aguardando_producao: "Aguardando Produção",
  pronto_despacho: "Pronto para Despacho",
  cotacao_frete: "Cotação de Frete",
  nf_emitida: "NF Emitida",
  despachado: "Despachado",
  em_transito: "Em Trânsito",
  saiu_entrega: "Saiu para Entrega",
  entregue: "Entregue",
  ocorrencia: "Ocorrência",
  finalizado: "Finalizado",
};

/** Rotulo de operacao de cada status de coleta. */
export const ROTULOS_COLETA: Record<ColetaStatus, string> = {
  aguardando_liberacao: "Aguardando Liberação",
  solicitada: "Solicitada",
  em_transito: "Em Trânsito",
  chegou_expedicao: "Chegou na Expedição",
  conferencia_ok: "Conferência OK",
  divergencia: "Divergência",
  finalizada: "Finalizada",
};

/** SQLSTATE que as etapas 029 e 030 usam ao recusar uma transicao no banco. */
export const ERRCODE_TRANSICAO_INVALIDA = "23514";

/** O codigo do erro decide; a mensagem so entrega os status envolvidos. */
const RECUSA_TRANSICAO = /transi..o de status inv.lida:\s*([a-z_]+)\s*->\s*([a-z_]+)/i;

export type TipoTransicao = "entrega" | "coleta";

interface RecusaTransicao {
  atual: string;
  pretendido: string;
}

/** Devolve os status da recusa quando o erro e uma transicao recusada pelo banco. */
export function reconhecerRecusaTransicao(
  error: unknown,
  tipo: TipoTransicao,
): RecusaTransicao | null {
  if (typeof error !== "object" || error === null) return null;
  const { code, message } = error as { code?: unknown; message?: unknown };
  if (code !== ERRCODE_TRANSICAO_INVALIDA || typeof message !== "string")
    return null;
  const encontrado = RECUSA_TRANSICAO.exec(message);
  if (!encontrado) return null;
  return { atual: encontrado[1], pretendido: encontrado[2] };
}

function rotularStatus(tipo: TipoTransicao, status: string): string {
  const rotulos = tipo === "coleta" ? ROTULOS_COLETA : ROTULOS_ENTREGA;
  return (rotulos as Record<string, string>)[status] ?? status;
}

function proximosPassos(tipo: TipoTransicao, atual: string): string[] {
  const mapa: Record<string, string[]> =
    tipo === "coleta" ? TRANSICOES_COLETA : TRANSICOES_ENTREGA;
  return [...(mapa[atual] ?? [])];
}

/**
 * Frase de operacao para uma transicao recusada pelo banco: diz onde o registro
 * esta e qual e o proximo passo. Devolve null para os demais erros, para as telas
 * manterem o tratamento que ja usam.
 */
export function mensagemRecusaTransicao(
  error: unknown,
  tipo: TipoTransicao,
): string | null {
  const recusa = reconhecerRecusaTransicao(error, tipo);
  if (!recusa) return null;

  const sujeito = tipo === "coleta" ? "Esta coleta" : "Esta entrega";
  const atual = rotularStatus(tipo, recusa.atual);
  const pretendido = rotularStatus(tipo, recusa.pretendido);
  const proximos = proximosPassos(tipo, recusa.atual);

  let passo: string;
  if (proximos.length === 0) {
    passo = "Não há próximo passo a partir daqui \u2014 o fluxo já terminou.";
  } else if (proximos.length === 1) {
    passo = 'O próximo passo é "' + rotularStatus(tipo, proximos[0]) + '".';
  } else {
    const ultimo = rotularStatus(tipo, proximos[proximos.length - 1]);
    const anteriores = proximos
      .slice(0, -1)
      .map((s) => '"' + rotularStatus(tipo, s) + '"')
      .join(", ");
    passo = "Os próximos passos são " + anteriores + ' ou "' + ultimo + '".';
  }

  return (
    sujeito +
    ' está em "' +
    atual +
    '" e não pode ir para "' +
    pretendido +
    '". ' +
    passo
  );
}
