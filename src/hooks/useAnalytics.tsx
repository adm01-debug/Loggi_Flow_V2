import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { subMonths, startOfMonth, endOfMonth, format, getHours, eachMonthOfInterval } from 'date-fns';

export interface MonthlyData {
  month: string;
  entregas: number;
  coletas: number;
  custoTotal: number;
  slaAtingido: number;
  ocorrencias: number;
}

export interface DemandForecast {
  date: string;
  actual: number | null;
  predicted: number;
}

export interface HeatmapData {
  hour: number;
  region: string;
  count: number;
  intensity: number;
}

export interface TransportadoraStats {
  id: string;
  nome: string;
  entregas: number;
  sla: number;
  custoMedio: number;
  ocorrencias: number;
  prazoMedio: number;
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function useAnalytics(dateRange?: DateRange) {
  const { user } = useAuth();
  const startDate = dateRange?.from || subMonths(new Date(), 6);
  const endDate = dateRange?.to || new Date();

  // Monthly comparison data
  const { data: monthlyData = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['analytics-monthly', user?.id, startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      const months: MonthlyData[] = [];
      const monthsInRange = eachMonthOfInterval({ start: startDate, end: endDate });
      
      for (const date of monthsInRange) {
        const start = startOfMonth(date).toISOString();
        const end = endOfMonth(date).toISOString();
        const monthLabel = format(date, 'MMM yyyy');
        
        // Get entregas count
        const { count: entregasCount } = await supabase
          .from('entregas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);
        
        // Get coletas count
        const { count: coletasCount } = await supabase
          .from('coletas')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);
        
        // Get total cost
        const { data: entregasWithCost } = await supabase
          .from('entregas')
          .select('valor_frete')
          .gte('created_at', start)
          .lte('created_at', end)
          .not('valor_frete', 'is', null);
        
        const custoTotal = entregasWithCost?.reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0) || 0;
        
        // Get SLA (entregas delivered on time)
        const { data: entregasSLA } = await supabase
          .from('entregas')
          .select('previsao_entrega, data_entrega_efetiva')
          .gte('created_at', start)
          .lte('created_at', end)
          .eq('status', 'entregue');
        
        const onTime = entregasSLA?.filter(e => 
          e.previsao_entrega && e.data_entrega_efetiva && 
          new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega)
        ).length || 0;
        
        const slaAtingido = entregasSLA?.length ? Math.round((onTime / entregasSLA.length) * 100) : 100;
        
        // Get ocorrencias count
        const { count: ocorrenciasCount } = await supabase
          .from('ocorrencias')
          .select('*', { count: 'exact', head: true })
          .gte('created_at', start)
          .lte('created_at', end);
        
        months.push({
          month: monthLabel,
          entregas: entregasCount || 0,
          coletas: coletasCount || 0,
          custoTotal,
          slaAtingido,
          ocorrencias: ocorrenciasCount || 0,
        });
      }
      
      return months;
    },
    enabled: !!user?.id,
  });

  // Demand forecast (next 30 days based on historical patterns)
  const { data: demandForecast = [], isLoading: isLoadingForecast } = useQuery({
    queryKey: ['analytics-forecast', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get historical data from the selected range
      const { data: historicalEntregas } = await supabase
        .from('entregas')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString());
      
      // Calculate average daily volume
      const dailyCounts: Record<string, number> = {};
      historicalEntregas?.forEach(e => {
        const day = format(new Date(e.created_at), 'yyyy-MM-dd');
        dailyCounts[day] = (dailyCounts[day] || 0) + 1;
      });
      
      const values = Object.values(dailyCounts);
      const avgDaily = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 5;
      const stdDev = Math.sqrt(values.reduce((sum, v) => sum + Math.pow(v - avgDaily, 2), 0) / (values.length || 1));
      
      // Generate forecast with trend and seasonality
      const forecast: DemandForecast[] = [];
      const today = new Date();
      
      // Past 30 days (actual)
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const actual = dailyCounts[dateStr] || null;
        
        // Predict based on weekday pattern
        const dayOfWeek = date.getDay();
        const weekdayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.1;
        
        forecast.push({
          date: format(date, 'dd/MM'),
          actual,
          predicted: Math.round(avgDaily * weekdayFactor),
        });
      }
      
      // Next 30 days (predicted)
      for (let i = 1; i <= 30; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        
        const dayOfWeek = date.getDay();
        const weekdayFactor = dayOfWeek === 0 || dayOfWeek === 6 ? 0.3 : 1.1;
        const trendFactor = 1 + (i * 0.002); // Slight upward trend
        const noise = (Math.random() - 0.5) * stdDev * 0.5;
        
        forecast.push({
          date: format(date, 'dd/MM'),
          actual: null,
          predicted: Math.max(0, Math.round(avgDaily * weekdayFactor * trendFactor + noise)),
        });
      }
      
      return forecast;
    },
    enabled: !!user?.id,
  });

  // Heatmap data (peak hours by region/state)
  const { data: heatmapData = [], isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['analytics-heatmap', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get entregas within date range
      const { data: entregas } = await supabase
        .from('entregas')
        .select('endereco_entrega, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(1000);
      
      // Get coletas within date range
      const { data: coletas } = await supabase
        .from('coletas')
        .select('endereco_coleta, created_at')
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .limit(1000);
      
      // Extract state and hour patterns
      const patterns: Record<string, Record<number, number>> = {};
      
      const extractState = (address: string) => {
        // Try to extract state from address (common Brazilian patterns)
        const stateMatch = address.match(/\b([A-Z]{2})\b/);
        if (stateMatch) return stateMatch[1];
        
        // Fallback regions
        const states = ['SP', 'RJ', 'MG', 'RS', 'PR', 'SC', 'BA', 'PE', 'CE', 'GO'];
        const lowerAddr = address.toLowerCase();
        if (lowerAddr.includes('são paulo') || lowerAddr.includes('sao paulo')) return 'SP';
        if (lowerAddr.includes('rio de janeiro')) return 'RJ';
        if (lowerAddr.includes('minas') || lowerAddr.includes('belo horizonte')) return 'MG';
        
        return states[Math.floor(Math.random() * states.length)];
      };
      
      // Process entregas
      entregas?.forEach(e => {
        const state = extractState(e.endereco_entrega);
        const hour = getHours(new Date(e.created_at));
        
        if (!patterns[state]) patterns[state] = {};
        patterns[state][hour] = (patterns[state][hour] || 0) + 1;
      });
      
      // Process coletas
      coletas?.forEach(c => {
        const state = extractState(c.endereco_coleta);
        const hour = getHours(new Date(c.created_at));
        
        if (!patterns[state]) patterns[state] = {};
        patterns[state][hour] = (patterns[state][hour] || 0) + 1;
      });
      
      // Convert to heatmap format
      const heatmap: HeatmapData[] = [];
      const maxCount = Math.max(1, ...Object.values(patterns).flatMap(h => Object.values(h)));
      
      Object.entries(patterns).forEach(([region, hours]) => {
        for (let hour = 6; hour <= 20; hour++) {
          const count = hours[hour] || 0;
          heatmap.push({
            hour,
            region,
            count,
            intensity: count / maxCount,
          });
        }
      });
      
      return heatmap;
    },
    enabled: !!user?.id,
  });

  // Summary metrics
  const { data: summaryMetrics, isLoading: isLoadingSummary } = useQuery({
    queryKey: ['analytics-summary'],
    queryFn: async () => {
      const thisMonth = startOfMonth(new Date()).toISOString();
      const lastMonth = startOfMonth(subMonths(new Date(), 1)).toISOString();
      const lastMonthEnd = endOfMonth(subMonths(new Date(), 1)).toISOString();
      
      // This month
      const { count: thisMonthEntregas } = await supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thisMonth);
      
      // Last month
      const { count: lastMonthEntregas } = await supabase
        .from('entregas')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', lastMonth)
        .lte('created_at', lastMonthEnd);
      
      const entregasGrowth = lastMonthEntregas && lastMonthEntregas > 0
        ? Math.round(((thisMonthEntregas || 0) - lastMonthEntregas) / lastMonthEntregas * 100)
        : 0;
      
      // Average cost per delivery
      const { data: custos } = await supabase
        .from('entregas')
        .select('valor_frete')
        .not('valor_frete', 'is', null)
        .gte('created_at', thisMonth);
      
      const avgCost = custos && custos.length > 0
        ? custos.reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0) / custos.length
        : 0;
      
      // Peak hour
      const peakHourData = heatmapData.reduce((max, curr) => 
        curr.count > (max?.count || 0) ? curr : max
      , heatmapData[0] || { hour: 10, region: 'SP', count: 0 });
      
      return {
        totalEntregas: thisMonthEntregas || 0,
        entregasGrowth,
        avgCost,
        peakHour: peakHourData?.hour || 10,
        peakRegion: peakHourData?.region || 'SP',
      };
    },
    enabled: heatmapData.length > 0,
  });

  // Transportadora comparison
  const { data: transportadoraStats = [], isLoading: isLoadingTransportadoras } = useQuery({
    queryKey: ['analytics-transportadoras', startDate.toISOString(), endDate.toISOString()],
    queryFn: async () => {
      // Get all transportadoras
      const { data: transportadoras } = await supabase
        .from('transportadoras')
        .select('id, nome_fantasia, razao_social, prazo_medio_dias');
      
      if (!transportadoras) return [];

      const stats: TransportadoraStats[] = [];

      for (const t of transportadoras) {
        // Get entregas for this transportadora in date range
        const { data: entregas } = await supabase
          .from('entregas')
          .select('id, status, valor_frete, previsao_entrega, data_entrega_efetiva')
          .eq('transportadora_id', t.id)
          .gte('created_at', startDate.toISOString())
          .lte('created_at', endDate.toISOString());

        if (!entregas || entregas.length === 0) continue;

        // Calculate SLA
        const entregasConcluidas = entregas.filter(e => e.status === 'entregue' || e.status === 'finalizado');
        const onTime = entregasConcluidas.filter(e =>
          e.previsao_entrega && e.data_entrega_efetiva &&
          new Date(e.data_entrega_efetiva) <= new Date(e.previsao_entrega)
        );
        const sla = entregasConcluidas.length > 0 
          ? Math.round((onTime.length / entregasConcluidas.length) * 100) 
          : 100;

        // Calculate average cost
        const entregasComCusto = entregas.filter(e => e.valor_frete);
        const custoMedio = entregasComCusto.length > 0
          ? entregasComCusto.reduce((sum, e) => sum + (Number(e.valor_frete) || 0), 0) / entregasComCusto.length
          : 0;

        // Get ocorrencias for this transportadora's entregas
        const entregaIds = entregas.map(e => e.id);
        const { count: ocorrenciasCount } = await supabase
          .from('ocorrencias')
          .select('*', { count: 'exact', head: true })
          .in('entrega_id', entregaIds);

        stats.push({
          id: t.id,
          nome: t.nome_fantasia || t.razao_social,
          entregas: entregas.length,
          sla,
          custoMedio,
          ocorrencias: ocorrenciasCount || 0,
          prazoMedio: t.prazo_medio_dias || 5,
        });
      }

      // Sort by entregas count descending
      return stats.sort((a, b) => b.entregas - a.entregas);
    },
  });

  return {
    monthlyData,
    demandForecast,
    heatmapData,
    summaryMetrics,
    transportadoraStats,
    isLoading: isLoadingMonthly || isLoadingForecast || isLoadingHeatmap || isLoadingSummary || isLoadingTransportadoras,
  };
}
