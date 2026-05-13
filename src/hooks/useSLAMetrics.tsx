import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { differenceInHours, differenceInDays, parseISO, isAfter, isBefore, startOfDay, subDays } from "date-fns";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

// Type definitions for joined data
interface TransportadoraJoin {
  id: string;
  nome_fantasia: string;
  score_performance?: number;
}

interface ClienteJoin {
  razao_social: string;
}

interface FornecedorJoin {
  razao_social: string;
}

interface EntregaWithJoins {
  id: string;
  numero_entrega: string;
  status: string;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  data_despacho: string | null;
  created_at: string;
  transportadora: TransportadoraJoin | null;
  cliente: ClienteJoin | null;
}

interface ColetaWithJoins {
  id: string;
  numero_coleta: string;
  status: string;
  data_prevista_coleta: string | null;
  data_efetiva_coleta: string | null;
  created_at: string;
  transportadora: TransportadoraJoin | null;
  fornecedor: FornecedorJoin | null;
}

export interface SLAAlert {
  id: string;
  tipo: "entrega" | "coleta";
  numero: string;
  cliente?: string;
  fornecedor?: string;
  transportadora?: string;
  prazo: Date;
  atraso: number;
  nivel: "critico" | "aviso" | "info";
  mensagem: string;
}

export interface TransportadoraPerformance {
  id: string;
  nome: string;
  totalEntregas: number;
  entregasNoPrazo: number;
  taxaOTIF: number;
  tempoMedio: number;
  tendencia: "up" | "down" | "stable";
  score: number;
}

export interface TrendData {
  data: string;
  noPrazo: number;
  atrasadas: number;
  total: number;
  taxaOTIF: number;
}

export interface SLAMetrics {
  totalEntregas: number;
  entregasNoPrazo: number;
  entregasAtrasadas: number;
  entregasPendentes: number;
  taxaOTIF: number;
  tempoMedioEntrega: number;
  totalColetas: number;
  coletasNoPrazo: number;
  coletasAtrasadas: number;
  tempoMedioColeta: number;
  alertasCriticos: SLAAlert[];
  alertasAviso: SLAAlert[];
  performancePorTransportadora: TransportadoraPerformance[];
  tendenciaSemanal: TrendData[];
  tendenciaMensal: TrendData[];
}

// Helper functions to safely extract joined data
function getTransportadora(item: { transportadora: unknown }): TransportadoraJoin | null {
  const t = item.transportadora;
  if (t && typeof t === 'object' && 'id' in t) return t as TransportadoraJoin;
  return null;
}

function getCliente(item: { cliente: unknown }): ClienteJoin | null {
  const c = item.cliente;
  if (c && typeof c === 'object' && 'razao_social' in c) return c as ClienteJoin;
  return null;
}

function getFornecedor(item: { fornecedor: unknown }): FornecedorJoin | null {
  const f = item.fornecedor;
  if (f && typeof f === 'object' && 'razao_social' in f) return f as FornecedorJoin;
  return null;
}

export function useSLAMetrics() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["sla-metrics", user?.id],
    queryFn: async (): Promise<SLAMetrics> => {
      const now = new Date();
      const thirtyDaysAgo = subDays(now, 30);
      
      // Fetch entregas
      const { data: entregas, error: entregasError } = await supabase
        .from("entregas")
        .select(`
          *,
          transportadora:transportadoras(id, nome_fantasia, score_performance),
          cliente:clientes(razao_social)
        `)
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      if (entregasError) throw entregasError;
      
      // Fetch coletas
      const { data: coletas, error: coletasError } = await supabase
        .from("coletas")
        .select(`
          *,
          transportadora:transportadoras(id, nome_fantasia),
          fornecedor:fornecedores(razao_social)
        `)
        .gte("created_at", thirtyDaysAgo.toISOString());
      
      if (coletasError) throw coletasError;
      
      // Fetch transportadoras
      const { data: transportadoras, error: transpError } = await supabase
        .from("transportadoras")
        .select("*")
        .eq("homologada", true);
      
      if (transpError) throw transpError;
      
      // Calculate entrega metrics
      const entregasConcluidas = (entregas || []).filter(e => e.status === "entregue");
      const entregasAtrasadas = entregasConcluidas.filter(e => {
        if (!e.previsao_entrega || !e.data_entrega_efetiva) return false;
        return isAfter(parseISO(e.data_entrega_efetiva), parseISO(e.previsao_entrega));
      });
      const entregasNoPrazo = entregasConcluidas.length - entregasAtrasadas.length;
      
      // Pending deliveries with deadline issues
      const entregasPendentes = (entregas || []).filter(e => 
        !["entregue", "cancelada"].includes(e.status)
      );
      
      // Calculate tempo médio de entrega (in hours)
      const temposEntrega = entregasConcluidas
        .filter(e => e.data_despacho && e.data_entrega_efetiva)
        .map(e => differenceInHours(
          parseISO(e.data_entrega_efetiva),
          parseISO(e.data_despacho)
        ));
      const tempoMedioEntrega = temposEntrega.length > 0
        ? temposEntrega.reduce((a, b) => a + b, 0) / temposEntrega.length
        : 0;
      
      // Coleta metrics
      const coletasConcluidas = (coletas || []).filter(c => c.status === "finalizada");
      const coletasAtrasadas = coletasConcluidas.filter(c => {
        if (!c.data_prevista_coleta || !c.data_efetiva_coleta) return false;
        return isAfter(parseISO(c.data_efetiva_coleta), parseISO(c.data_prevista_coleta));
      });
      const coletasNoPrazo = coletasConcluidas.length - coletasAtrasadas.length;
      
      const temposColeta = coletasConcluidas
        .filter(c => c.created_at && c.data_efetiva_coleta)
        .map(c => differenceInHours(
          parseISO(c.data_efetiva_coleta),
          parseISO(c.created_at)
        ));
      const tempoMedioColeta = temposColeta.length > 0
        ? temposColeta.reduce((a, b) => a + b, 0) / temposColeta.length
        : 0;
      
      // Generate alerts
      const alertasCriticos: SLAAlert[] = [];
      const alertasAviso: SLAAlert[] = [];
      
      // Check pending deliveries
      entregasPendentes.forEach(e => {
        if (!e.previsao_entrega) return;
        
        const prazo = parseISO(e.previsao_entrega);
        const horasAtraso = differenceInHours(now, prazo);
        
        if (horasAtraso > 0) {
          const cliente = getCliente(e as { cliente: unknown });
          const transportadora = getTransportadora(e as { transportadora: unknown });
          alertasCriticos.push({
            id: e.id,
            tipo: "entrega",
            numero: e.numero_entrega,
            cliente: cliente?.razao_social,
            transportadora: transportadora?.nome_fantasia,
            prazo,
            atraso: horasAtraso,
            nivel: "critico",
            mensagem: `Entrega ${e.numero_entrega} atrasada em ${Math.floor(horasAtraso / 24)} dias e ${horasAtraso % 24} horas`,
          });
        } else if (horasAtraso > -24) {
          const cliente = getCliente(e as { cliente: unknown });
          const transportadora = getTransportadora(e as { transportadora: unknown });
          alertasAviso.push({
            id: e.id,
            tipo: "entrega",
            numero: e.numero_entrega,
            cliente: cliente?.razao_social,
            transportadora: transportadora?.nome_fantasia,
            prazo,
            atraso: Math.abs(horasAtraso),
            nivel: "aviso",
            mensagem: `Entrega ${e.numero_entrega} vence em ${Math.abs(horasAtraso)} horas`,
          });
        }
      });
      
      // Check pending coletas
      const coletasPendentes = (coletas || []).filter(c => 
        !["recebida", "cancelada"].includes(c.status)
      );
      
      coletasPendentes.forEach(c => {
        if (!c.data_prevista_coleta) return;
        
        const prazo = parseISO(c.data_prevista_coleta);
        const horasAtraso = differenceInHours(now, prazo);
        
        if (horasAtraso > 0) {
          const fornecedor = getFornecedor(c as { fornecedor: unknown });
          const transportadora = getTransportadora(c as { transportadora: unknown });
          alertasCriticos.push({
            id: c.id,
            tipo: "coleta",
            numero: c.numero_coleta,
            fornecedor: fornecedor?.razao_social,
            transportadora: transportadora?.nome_fantasia,
            prazo,
            atraso: horasAtraso,
            nivel: "critico",
            mensagem: `Coleta ${c.numero_coleta} atrasada em ${Math.floor(horasAtraso / 24)} dias`,
          });
        } else if (horasAtraso > -12) {
          const fornecedor = getFornecedor(c as { fornecedor: unknown });
          const transportadora = getTransportadora(c as { transportadora: unknown });
          alertasAviso.push({
            id: c.id,
            tipo: "coleta",
            numero: c.numero_coleta,
            fornecedor: fornecedor?.razao_social,
            transportadora: transportadora?.nome_fantasia,
            prazo,
            atraso: Math.abs(horasAtraso),
            nivel: "aviso",
            mensagem: `Coleta ${c.numero_coleta} vence em ${Math.abs(horasAtraso)} horas`,
          });
        }
      });
      
      // Performance by carrier
      const performancePorTransportadora: TransportadoraPerformance[] = (transportadoras || []).map(t => {
        const entregasTransp = (entregas || []).filter(e => {
          const transp = getTransportadora(e as { transportadora: unknown });
          return transp?.id === t.id && e.status === "entregue";
        });
        const entregasNoPrazoTransp = entregasTransp.filter(e => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
          return isBefore(parseISO(e.data_entrega_efetiva), parseISO(e.previsao_entrega));
        });
        
        const temposTransp = entregasTransp
          .filter(e => e.data_despacho && e.data_entrega_efetiva)
          .map(e => differenceInHours(
            parseISO(e.data_entrega_efetiva),
            parseISO(e.data_despacho)
          ));
        
        const taxa = entregasTransp.length > 0 
          ? (entregasNoPrazoTransp.length / entregasTransp.length) * 100
          : 100;
        
        const tendencia: "up" | "down" | "stable" = taxa >= 95 ? "up" : taxa >= 85 ? "stable" : "down";
        
        return {
          id: t.id,
          nome: t.nome_fantasia,
          totalEntregas: entregasTransp.length,
          entregasNoPrazo: entregasNoPrazoTransp.length,
          taxaOTIF: taxa,
          tempoMedio: temposTransp.length > 0 
            ? temposTransp.reduce((a, b) => a + b, 0) / temposTransp.length 
            : 0,
          tendencia,
          score: t.score_performance || 0,
        };
      }).filter(p => p.totalEntregas > 0).sort((a, b) => b.taxaOTIF - a.taxaOTIF);
      
      // Weekly trends
      const tendenciaSemanal: TrendData[] = [];
      for (let i = 6; i >= 0; i--) {
        const dia = subDays(now, i);
        const diaStr = dia.toISOString().split("T")[0];
        
        const entregasDia = entregasConcluidas.filter(e => 
          e.data_entrega_efetiva?.startsWith(diaStr)
        );
        const noPrazoDia = entregasDia.filter(e => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
          return isBefore(parseISO(e.data_entrega_efetiva), parseISO(e.previsao_entrega));
        });
        
        tendenciaSemanal.push({
          data: diaStr,
          noPrazo: noPrazoDia.length,
          atrasadas: entregasDia.length - noPrazoDia.length,
          total: entregasDia.length,
          taxaOTIF: entregasDia.length > 0 
            ? (noPrazoDia.length / entregasDia.length) * 100 
            : 100,
        });
      }
      
      // Monthly trends (last 4 weeks)
      const tendenciaMensal: TrendData[] = [];
      for (let i = 3; i >= 0; i--) {
        const inicioSemana = subDays(now, (i + 1) * 7);
        const fimSemana = subDays(now, i * 7);
        
        const entregasSemana = entregasConcluidas.filter(e => {
          if (!e.data_entrega_efetiva) return false;
          const data = parseISO(e.data_entrega_efetiva);
          return isAfter(data, inicioSemana) && isBefore(data, fimSemana);
        });
        
        const noPrazoSemana = entregasSemana.filter(e => {
          if (!e.previsao_entrega || !e.data_entrega_efetiva) return true;
          return isBefore(parseISO(e.data_entrega_efetiva), parseISO(e.previsao_entrega));
        });
        
        tendenciaMensal.push({
          data: `Semana ${4 - i}`,
          noPrazo: noPrazoSemana.length,
          atrasadas: entregasSemana.length - noPrazoSemana.length,
          total: entregasSemana.length,
          taxaOTIF: entregasSemana.length > 0 
            ? (noPrazoSemana.length / entregasSemana.length) * 100 
            : 100,
        });
      }
      
      const totalEntregas = entregasConcluidas.length;
      const taxaOTIF = totalEntregas > 0 
        ? (entregasNoPrazo / totalEntregas) * 100 
        : 100;
      
      return {
        totalEntregas,
        entregasNoPrazo,
        entregasAtrasadas: entregasAtrasadas.length,
        entregasPendentes: entregasPendentes.length,
        taxaOTIF,
        tempoMedioEntrega,
        
        totalColetas: coletasConcluidas.length,
        coletasNoPrazo,
        coletasAtrasadas: coletasAtrasadas.length,
        tempoMedioColeta,
        
        alertasCriticos: alertasCriticos.slice(0, 10),
        alertasAviso: alertasAviso.slice(0, 10),
        
        performancePorTransportadora,
        tendenciaSemanal,
        tendenciaMensal,
      };
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    refetchInterval: 1000 * 60 * 5,
    enabled: !!user?.id,
  });
}
