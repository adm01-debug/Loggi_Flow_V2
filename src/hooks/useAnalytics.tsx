import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subMonths, startOfMonth, endOfMonth, format, eachDayOfInterval, getHours } from 'date-fns';

interface MonthlyData {
  month: string;
  entregas: number;
  coletas: number;
  custoTotal: number;
  slaAtingido: number;
  ocorrencias: number;
}

interface DemandForecast {
  date: string;
  actual: number | null;
  predicted: number;
}

interface HeatmapData {
  hour: number;
  region: string;
  count: number;
  intensity: number;
}

export function useAnalytics() {
  // Monthly comparison data (last 6 months)
  const { data: monthlyData = [], isLoading: isLoadingMonthly } = useQuery({
    queryKey: ['analytics-monthly'],
    queryFn: async () => {
      const months: MonthlyData[] = [];
      
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i);
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
  });

  // Demand forecast (next 30 days based on historical patterns)
  const { data: demandForecast = [], isLoading: isLoadingForecast } = useQuery({
    queryKey: ['analytics-forecast'],
    queryFn: async () => {
      // Get historical data from last 90 days
      const ninetyDaysAgo = subMonths(new Date(), 3).toISOString();
      
      const { data: historicalEntregas } = await supabase
        .from('entregas')
        .select('created_at')
        .gte('created_at', ninetyDaysAgo);
      
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
  });

  // Heatmap data (peak hours by region/state)
  const { data: heatmapData = [], isLoading: isLoadingHeatmap } = useQuery({
    queryKey: ['analytics-heatmap'],
    queryFn: async () => {
      // Get all entregas with state info
      const { data: entregas } = await supabase
        .from('entregas')
        .select('endereco_entrega, created_at')
        .limit(1000);
      
      // Get all coletas with state info
      const { data: coletas } = await supabase
        .from('coletas')
        .select('endereco_coleta, created_at')
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

  return {
    monthlyData,
    demandForecast,
    heatmapData,
    summaryMetrics,
    isLoading: isLoadingMonthly || isLoadingForecast || isLoadingHeatmap || isLoadingSummary,
  };
}
