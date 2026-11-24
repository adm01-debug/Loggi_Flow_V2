/* eslint-disable sonarjs/cognitive-complexity */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'coleta' | 'entrega';
  status: string;
  transportadora: string | null;
  transportadoraId: string | null;
  details: {
    numero: string;
    endereco: string;
    cliente?: string;
    fornecedor?: string;
  };
}

export interface CalendarFilters {
  status: string[];
  transportadoraId: string | null;
  type: 'all' | 'coleta' | 'entrega';
  from: Date;
  to: Date;
}

export const useLogisticsCalendar = ({ from, to, ...filters }: CalendarFilters) => {
  return useQuery({
    // from/to na chave: trocar de mes muda a consulta, entao tem que mudar o cache
    queryKey: ['logistics-calendar', filters, from.toISOString(), to.toISOString()],
    queryFn: async () => {
      const events: CalendarEvent[] = [];

      // Fetch coletas
      if (filters.type === 'all' || filters.type === 'coleta') {
        let coletasQuery = supabase
          .from('coletas')
          .select(`
            id,
            numero_coleta,
            endereco_coleta,
            data_prevista_coleta,
            status,
            transportadora_id,
            transportadoras!fk_coletas_transportadora (nome_fantasia),
            fornecedores!fk_coletas_fornecedor (razao_social)
          `)
          .not('data_prevista_coleta', 'is', null)
          // recorte pelo mes exibido (etapa 209); o teto abaixo segue como rede
          .gte('data_prevista_coleta', from.toISOString())
          .lte('data_prevista_coleta', to.toISOString())
          // teto operacional (mesmo de Coletas.tsx/Envios.tsx); a ordem evita corte arbitrario
          .order('data_prevista_coleta', { ascending: true })
          .limit(500);

        if (filters.status.length > 0) {
          const coletaStatuses = filters.status.filter(s => 
            ['aguardando_liberacao', 'solicitada', 'em_transito', 'chegou_expedicao', 'conferencia_ok', 'divergencia', 'finalizada'].includes(s)
          ) as ('aguardando_liberacao' | 'solicitada' | 'em_transito' | 'chegou_expedicao' | 'conferencia_ok' | 'divergencia' | 'finalizada')[];
          if (coletaStatuses.length > 0) {
            coletasQuery = coletasQuery.in('status', coletaStatuses);
          }
        }

        if (filters.transportadoraId) {
          coletasQuery = coletasQuery.eq('transportadora_id', filters.transportadoraId);
        }

        const { data: coletas } = await coletasQuery;

        interface ColetaRaw {
          id: string;
          numero_coleta: string;
          endereco_coleta: string;
          data_prevista_coleta: string;
          status: string;
          transportadora_id: string | null;
          transportadoras: { nome_fantasia: string } | null;
          fornecedores: { razao_social: string } | null;
        }

        if (coletas) {
          (coletas as unknown as ColetaRaw[]).forEach((coleta) => {
            events.push({
              id: coleta.id,
              title: coleta.numero_coleta,
              date: new Date(coleta.data_prevista_coleta),
              type: 'coleta',
              status: coleta.status,
              transportadora: coleta.transportadoras?.nome_fantasia || null,
              transportadoraId: coleta.transportadora_id,
              details: {
                numero: coleta.numero_coleta,
                endereco: coleta.endereco_coleta,
                fornecedor: coleta.fornecedores?.razao_social,
              },
            });
          });
        }
      }

      // Fetch entregas
      if (filters.type === 'all' || filters.type === 'entrega') {
        let entregasQuery = supabase
          .from('entregas')
          .select(`
            id,
            numero_entrega,
            endereco_entrega,
            previsao_entrega,
            status,
            transportadora_id,
            transportadoras (nome_fantasia),
            clientes (razao_social)
          `)
          .not('previsao_entrega', 'is', null)
          // recorte pelo mes exibido (etapa 209); o teto abaixo segue como rede
          .gte('previsao_entrega', from.toISOString())
          .lte('previsao_entrega', to.toISOString())
          // teto operacional (mesmo de Coletas.tsx/Envios.tsx); a ordem evita corte arbitrario
          .order('previsao_entrega', { ascending: true })
          .limit(500);

        if (filters.status.length > 0) {
          const entregaStatuses = filters.status.filter(s => 
            ['aguardando_producao', 'pronto_despacho', 'cotacao_frete', 'nf_emitida', 'despachado', 'em_transito', 'saiu_entrega', 'entregue', 'ocorrencia', 'finalizado'].includes(s)
          ) as ('aguardando_producao' | 'pronto_despacho' | 'cotacao_frete' | 'nf_emitida' | 'despachado' | 'em_transito' | 'saiu_entrega' | 'entregue' | 'ocorrencia' | 'finalizado')[];
          if (entregaStatuses.length > 0) {
            entregasQuery = entregasQuery.in('status', entregaStatuses);
          }
        }

        if (filters.transportadoraId) {
          entregasQuery = entregasQuery.eq('transportadora_id', filters.transportadoraId);
        }

        const { data: entregas } = await entregasQuery;

        interface EntregaRaw {
          id: string;
          numero_entrega: string;
          endereco_entrega: string;
          previsao_entrega: string;
          status: string;
          transportadora_id: string | null;
          transportadoras: { nome_fantasia: string } | null;
          clientes: { razao_social: string } | null;
        }

        if (entregas) {
          (entregas as EntregaRaw[]).forEach((entrega) => {
            events.push({
              id: entrega.id,
              title: entrega.numero_entrega,
              date: new Date(entrega.previsao_entrega),
              type: 'entrega',
              status: entrega.status,
              transportadora: entrega.transportadoras?.nome_fantasia || null,
              transportadoraId: entrega.transportadora_id,
              details: {
                numero: entrega.numero_entrega,
                endereco: entrega.endereco_entrega,
                cliente: entrega.clientes?.razao_social,
              },
            });
          });
        }
      }

      return events.sort((a, b) => a.date.getTime() - b.date.getTime());
    },
    staleTime: 2 * 60 * 1000,
  });
};

export const useTransportadoras = () => {
  return useQuery({
    queryKey: ['transportadoras-list'],
    queryFn: async () => {
      const { data } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia')
        .eq('homologada', true)
        .order('nome_fantasia');
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};
