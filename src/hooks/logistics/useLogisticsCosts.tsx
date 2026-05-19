import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks';
import { startOfMonth, endOfMonth, subMonths, format, parseISO } from 'date-fns';

export interface CostByCarrier {
  transportadora_id: string;
  transportadora_nome: string;
  total_value: number;
  total_deliveries: number;
  avg_value: number;
}

export interface CostByRoute {
  estado_destino: string;
  total_value: number;
  total_deliveries: number;
  avg_value: number;
}

export interface CostByPeriod {
  period: string;
  month: string;
  total_value: number;
  total_deliveries: number;
}

export interface CostSummary {
  total_spent: number;
  total_deliveries: number;
  avg_per_delivery: number;
  most_expensive_carrier: string;
  most_used_carrier: string;
  top_route: string;
}

export const useLogisticsCosts = (startDate: Date, endDate: Date) => {
  const { user } = useAuth();
  const { data: entregas, isLoading } = useQuery({
    queryKey: ['logistics-costs', user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('entregas')
        .select(`
          id,
          numero_entrega,
          valor_frete,
          created_at,
          data_despacho,
          data_entrega_efetiva,
          endereco_entrega,
          status,
          transportadora:transportadoras(id, nome_fantasia),
          cliente:clientes(id, razao_social, estado)
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .not('valor_frete', 'is', null);

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!user?.id,
  });

  // Calculate costs by carrier
  const costsByCarrier: CostByCarrier[] = (() => {
    if (!entregas) return [];

    const carrierMap = new Map<string, { nome: string; total: number; count: number }>();

    entregas.forEach((e) => {
      if (e.transportadora && e.valor_frete) {
        const id = e.transportadora.id;
        const existing = carrierMap.get(id) || { nome: e.transportadora.nome_fantasia, total: 0, count: 0 };
        existing.total += Number(e.valor_frete);
        existing.count += 1;
        carrierMap.set(id, existing);
      }
    });

    return Array.from(carrierMap.entries())
      .map(([id, data]) => ({
        transportadora_id: id,
        transportadora_nome: data.nome,
        total_value: data.total,
        total_deliveries: data.count,
        avg_value: data.total / data.count,
      }))
      .sort((a, b) => b.total_value - a.total_value);
  })();

  // Calculate costs by route (state)
  const costsByRoute: CostByRoute[] = (() => {
    if (!entregas) return [];

    const routeMap = new Map<string, { total: number; count: number }>();

    entregas.forEach((e) => {
      if (e.cliente?.estado && e.valor_frete) {
        const estado = e.cliente.estado;
        const existing = routeMap.get(estado) || { total: 0, count: 0 };
        existing.total += Number(e.valor_frete);
        existing.count += 1;
        routeMap.set(estado, existing);
      }
    });

    return Array.from(routeMap.entries())
      .map(([estado, data]) => ({
        estado_destino: estado,
        total_value: data.total,
        total_deliveries: data.count,
        avg_value: data.total / data.count,
      }))
      .sort((a, b) => b.total_value - a.total_value);
  })();

  // Calculate costs by period (monthly)
  const costsByPeriod: CostByPeriod[] = (() => {
    if (!entregas) return [];

    const periodMap = new Map<string, { total: number; count: number }>();

    // Generate all months in range
    const months: string[] = [];
    let current = startOfMonth(startDate);
    while (current <= endOfMonth(endDate)) {
      months.push(format(current, 'yyyy-MM'));
      current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    }

    months.forEach((m) => periodMap.set(m, { total: 0, count: 0 }));

    entregas.forEach((e) => {
      if (e.valor_frete && e.data_despacho) {
        const month = format(parseISO(e.data_despacho), 'yyyy-MM');
        const existing = periodMap.get(month);
        if (existing) {
          existing.total += Number(e.valor_frete);
          existing.count += 1;
        }
      }
    });

    return Array.from(periodMap.entries())
      .map(([period, data]) => ({
        period,
        month: format(parseISO(period + '-01'), 'MMM/yy'),
        total_value: data.total,
        total_deliveries: data.count,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  })();

  // Calculate summary
  const summary: CostSummary = (() => {
    if (!entregas || entregas.length === 0) {
      return {
        total_spent: 0,
        total_deliveries: 0,
        avg_per_delivery: 0,
        most_expensive_carrier: 'N/A',
        most_used_carrier: 'N/A',
        top_route: 'N/A',
      };
    }

    const totalSpent = entregas.reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0);
    const totalDeliveries = entregas.length;

    return {
      total_spent: totalSpent,
      total_deliveries: totalDeliveries,
      avg_per_delivery: totalSpent / totalDeliveries,
      most_expensive_carrier: costsByCarrier[0]?.transportadora_nome || 'N/A',
      most_used_carrier: [...costsByCarrier].sort((a, b) => b.total_deliveries - a.total_deliveries)[0]?.transportadora_nome || 'N/A',
      top_route: costsByRoute[0]?.estado_destino || 'N/A',
    };
  })();

  return {
    entregas,
    costsByCarrier,
    costsByRoute,
    costsByPeriod,
    summary,
    isLoading,
  };
};
