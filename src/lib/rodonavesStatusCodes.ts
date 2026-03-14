/**
 * Complete mapping of Rodonaves (RTE) tracking codes.
 * Source: https://dev.rodonaves.com.br/docs/retorno-da-api-de-rastreio
 */

export interface RodonavesStatusInfo {
  code: number;
  description: string;
  /** Maps to our entrega_status enum */
  systemStatus: 'pendente' | 'coletado' | 'despachado' | 'em_transito' | 'saiu_entrega' | 'entregue' | 'devolvido' | 'cancelado';
  /** Whether this code represents an ocorrencia that should be logged */
  isOcorrencia: boolean;
  severity: 'info' | 'success' | 'warning' | 'error';
}

export const RODONAVES_CODES: Record<number, RodonavesStatusInfo> = {
  0:  { code: 0,  description: 'Processo de Transporte já Iniciado', systemStatus: 'em_transito', isOcorrencia: false, severity: 'info' },
  1:  { code: 1,  description: 'Entrega Realizada Normalmente', systemStatus: 'entregue', isOcorrencia: false, severity: 'success' },
  2:  { code: 2,  description: 'Entrega Fora da Data Programada', systemStatus: 'entregue', isOcorrencia: true, severity: 'warning' },
  3:  { code: 3,  description: 'Recusa por Falta de Pedido de Compra', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  4:  { code: 4,  description: 'Recusa por Pedido de Compra Cancelado', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  5:  { code: 5,  description: 'Falta de Espaço Físico no Depósito', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  6:  { code: 6,  description: 'Endereço não Localizado', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  7:  { code: 7,  description: 'Devolução não Autorizada pelo Cliente', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  8:  { code: 8,  description: 'Preço em Desacordo com Pedido', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  9:  { code: 9,  description: 'Mercadoria em Desacordo com Pedido', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  10: { code: 10, description: 'Cliente só Recebe com Frete Pago', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  11: { code: 11, description: 'Recusa por Deficiência na Embalagem', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  12: { code: 12, description: 'Redespacho não Indicado', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  13: { code: 13, description: 'Transportadora não Atende a Cidade', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  14: { code: 14, description: 'Mercadoria Sinistrada', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  15: { code: 15, description: 'Embalagem Sinistrada', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  16: { code: 16, description: 'Pedido de Compras em Duplicidade', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  17: { code: 17, description: 'Mercadoria fora da Embalagem', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  18: { code: 18, description: 'Mercadorias Trocadas', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  19: { code: 19, description: 'Reentrega Solicitada pelo Cliente', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  20: { code: 20, description: 'Entrega Prejudicada por Horário', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  21: { code: 21, description: 'Estabelecimento Fechado', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  22: { code: 22, description: 'Reentrega sem Cobrança', systemStatus: 'em_transito', isOcorrencia: true, severity: 'info' },
  23: { code: 23, description: 'Extravio de Mercadoria em Trânsito', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  24: { code: 24, description: 'Mercadoria Reentregue ao Destino', systemStatus: 'entregue', isOcorrencia: false, severity: 'success' },
  25: { code: 25, description: 'Mercadoria Devolvida à Origem', systemStatus: 'devolvido', isOcorrencia: true, severity: 'warning' },
  26: { code: 26, description: 'NF Retida pela Fiscalização', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  27: { code: 27, description: 'Roubo de Carga', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  28: { code: 28, description: 'Mercadoria Retida até Segunda Ordem', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  29: { code: 29, description: 'Cliente Retirou na Transportadora', systemStatus: 'entregue', isOcorrencia: false, severity: 'success' },
  30: { code: 30, description: 'Problema com Documentação', systemStatus: 'em_transito', isOcorrencia: true, severity: 'error' },
  31: { code: 31, description: 'Entrega com Indenização Efetuada', systemStatus: 'entregue', isOcorrencia: true, severity: 'warning' },
  37: { code: 37, description: 'Em Trânsito para Redespacho', systemStatus: 'saiu_entrega', isOcorrencia: false, severity: 'info' },
  38: { code: 38, description: 'Em Trânsito para Devolução', systemStatus: 'em_transito', isOcorrencia: true, severity: 'warning' },
  39: { code: 39, description: 'Mercadoria em Trânsito', systemStatus: 'em_transito', isOcorrencia: false, severity: 'info' },
  43: { code: 43, description: 'Saiu para Entrega', systemStatus: 'saiu_entrega', isOcorrencia: false, severity: 'info' },
  44: { code: 44, description: 'Recebida na Filial Destino', systemStatus: 'despachado', isOcorrencia: false, severity: 'info' },
  45: { code: 45, description: 'Em Transferência', systemStatus: 'despachado', isOcorrencia: false, severity: 'info' },
  46: { code: 46, description: 'Mercadoria Despachada', systemStatus: 'despachado', isOcorrencia: false, severity: 'info' },
  47: { code: 47, description: 'Mercadoria Coletada', systemStatus: 'coletado', isOcorrencia: false, severity: 'info' },
  58: { code: 58, description: 'CT-e Emitido', systemStatus: 'em_transito', isOcorrencia: false, severity: 'info' },
};

/**
 * Get the system status for a Rodonaves tracking code.
 */
export function getSystemStatusFromCode(code: number): RodonavesStatusInfo {
  return RODONAVES_CODES[code] || {
    code,
    description: `Código desconhecido (${code})`,
    systemStatus: 'em_transito',
    isOcorrencia: false,
    severity: 'info' as const,
  };
}
