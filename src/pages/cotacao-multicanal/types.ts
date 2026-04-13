import type { TransportadoraRota } from '@/hooks/useTransportadoraRotas';

export interface CotacaoManual {
  id: string;
  transportadora_id: string;
  transportadora_nome: string;
  canal: 'api' | 'whatsapp' | 'email';
  valor: number | null;
  prazo_dias: number | null;
  status: 'pendente' | 'respondido' | 'expirado';
  observacoes: string;
  created_at: string;
}

export interface TransportadoraComCanal extends TransportadoraRota {
  canal_cotacao: 'api' | 'whatsapp' | 'email';
  whatsapp?: string | null;
  email?: string | null;
  api_disponivel?: boolean;
}
