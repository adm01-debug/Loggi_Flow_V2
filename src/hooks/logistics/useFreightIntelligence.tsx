import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { QUERY_STALE_TIME } from "@/lib/queryConfig";

export interface FreightImpactEntry {
  id: string;
  numero_entrega: string;
  cliente: string;
  estado: string;
  cidade: string;
  valor_frete: number;
  status: string;
  created_at: string;
  transportadora: string;
}

export interface RegionAnalysis {
  estado: string;
  entregas: number;
  custoTotal: number;
  custoMedio: number;
  custoMax: number;
}

export interface CarrierRouteComparison {
  transportadora: string;
  transportadora_id: string;
  estado: string;
  entregas: number;
  custoTotal: number;
  custoMedio: number;
}

export interface ConsolidationOpportunity {
  estado: string;
  cidade: string;
  entregas: FreightImpactEntry[];
  potentialSavings: number;
}

export function useFreightIntelligence() {
  const { user } = useAuth();

  const {
    data: rawData = [],
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["freight-intelligence", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("entregas")
        .select(
          "id, numero_entrega, status, valor_frete, endereco_entrega, created_at, cliente:clientes(razao_social, nome_fantasia, estado, cidade), transportadora:transportadoras(nome_fantasia)",
        )
        .is("deleted_at", null)
        .not("valor_frete", "is", null)
        .order("created_at", { ascending: false })
        .limit(1000);

      if (error) throw error;
      return (data || []).map((d: Record<string, unknown>) => ({
        id: d.id as string,
        numero_entrega: (d.numero_entrega as string) || "",
        cliente:
          (d.cliente as Record<string, string>)?.nome_fantasia ||
          (d.cliente as Record<string, string>)?.razao_social ||
          "Cliente",
        estado:
          (d.cliente as Record<string, string>)?.estado ||
          extractEstado(d.endereco_entrega as string) ||
          "N/D",
        cidade: (d.cliente as Record<string, string>)?.cidade || "N/D",
        valor_frete: (d.valor_frete as number) || 0,
        status: (d.status as string) || "",
        created_at: d.created_at as string,
        transportadora:
          (d.transportadora as Record<string, string>)?.nome_fantasia ||
          "Sem transportadora",
      })) as FreightImpactEntry[];
    },
    staleTime: QUERY_STALE_TIME.DASHBOARD,
    enabled: !!user?.id,
  });

  // Historical averages per state for abusive freight detection
  const regionAnalysis = useMemo((): RegionAnalysis[] => {
    const byState: Record<
      string,
      { entregas: number; custoTotal: number; custoMax: number }
    > = {};
    rawData.forEach((e) => {
      if (!byState[e.estado])
        byState[e.estado] = { entregas: 0, custoTotal: 0, custoMax: 0 };
      byState[e.estado].entregas++;
      byState[e.estado].custoTotal += e.valor_frete;
      byState[e.estado].custoMax = Math.max(
        byState[e.estado].custoMax,
        e.valor_frete,
      );
    });
    return Object.entries(byState)
      .map(([estado, v]) => ({
        estado,
        entregas: v.entregas,
        custoTotal: v.custoTotal,
        custoMedio: v.entregas > 0 ? v.custoTotal / v.entregas : 0,
        custoMax: v.custoMax,
      }))
      .sort((a, b) => b.custoTotal - a.custoTotal);
  }, [rawData]);

  // Per-carrier per-route comparison for negotiation
  const carrierRouteComparison = useMemo((): CarrierRouteComparison[] => {
    const key = (t: string, e: string) => `${t}|||${e}`;
    const map: Record<
      string,
      {
        transportadora: string;
        transportadora_id: string;
        estado: string;
        entregas: number;
        custoTotal: number;
      }
    > = {};
    rawData.forEach((e) => {
      const k = key(e.transportadora, e.estado);
      if (!map[k])
        map[k] = {
          transportadora: e.transportadora,
          transportadora_id: "",
          estado: e.estado,
          entregas: 0,
          custoTotal: 0,
        };
      map[k].entregas++;
      map[k].custoTotal += e.valor_frete;
    });
    return Object.values(map)
      .map((v) => ({
        ...v,
        custoMedio: v.entregas > 0 ? v.custoTotal / v.entregas : 0,
      }))
      .sort((a, b) => b.custoTotal - a.custoTotal);
  }, [rawData]);

  // Abusive freight detection (>20% above state average)
  const abusiveFreights = useMemo(() => {
    const avgByState: Record<string, number> = {};
    regionAnalysis.forEach((r) => {
      avgByState[r.estado] = r.custoMedio;
    });

    return rawData
      .filter((e) => {
        const avg = avgByState[e.estado];
        if (!avg || avg === 0) return false;
        return e.valor_frete > avg * 1.2;
      })
      .map((e) => ({
        ...e,
        avgForState: avgByState[e.estado] || 0,
        percentAbove: avgByState[e.estado]
          ? ((e.valor_frete - avgByState[e.estado]) / avgByState[e.estado]) *
            100
          : 0,
      }))
      .sort((a, b) => b.percentAbove - a.percentAbove);
  }, [rawData, regionAnalysis]);

  // Consolidation opportunities (same state+city, pending dispatch)
  const consolidationOpportunities = useMemo((): ConsolidationOpportunity[] => {
    const pending = rawData.filter((e) =>
      ["pronto_despacho", "cotacao_frete", "nf_emitida"].includes(e.status),
    );
    const byCityState: Record<string, FreightImpactEntry[]> = {};
    pending.forEach((e) => {
      const k = `${e.estado}|${e.cidade}`;
      if (!byCityState[k]) byCityState[k] = [];
      byCityState[k].push(e);
    });

    return Object.entries(byCityState)
      .filter(([, items]) => items.length >= 2)
      .map(([k, items]) => {
        const [estado, cidade] = k.split("|");
        const totalCost = items.reduce((acc, e) => acc + e.valor_frete, 0);
        // Estimate 30% savings from consolidation
        const potentialSavings = totalCost * 0.3;
        return { estado, cidade, entregas: items, potentialSavings };
      })
      .sort((a, b) => b.potentialSavings - a.potentialSavings);
  }, [rawData]);

  // Best carrier per state (cheapest average)
  const bestCarrierPerState = useMemo(() => {
    const stateCarriers: Record<
      string,
      { carrier: string; avg: number; count: number }[]
    > = {};
    carrierRouteComparison.forEach((c) => {
      if (!stateCarriers[c.estado]) stateCarriers[c.estado] = [];
      stateCarriers[c.estado].push({
        carrier: c.transportadora,
        avg: c.custoMedio,
        count: c.entregas,
      });
    });

    const result: Record<
      string,
      {
        best: string;
        bestAvg: number;
        worst: string;
        worstAvg: number;
        savings: number;
      }
    > = {};
    Object.entries(stateCarriers).forEach(([estado, carriers]) => {
      if (carriers.length < 2) return;
      const sorted = carriers.sort((a, b) => a.avg - b.avg);
      const best = sorted[0];
      const worst = sorted[sorted.length - 1];
      result[estado] = {
        best: best.carrier,
        bestAvg: best.avg,
        worst: worst.carrier,
        worstAvg: worst.avg,
        savings: worst.avg - best.avg,
      };
    });
    return result;
  }, [carrierRouteComparison]);

  // Summary stats
  const summary = useMemo(() => {
    const total = rawData.reduce((acc, e) => acc + e.valor_frete, 0);
    const avg = rawData.length > 0 ? total / rawData.length : 0;
    const totalAbusive = abusiveFreights.reduce(
      (acc, e) => acc + (e.valor_frete - e.avgForState),
      0,
    );
    const totalConsolidationSavings = consolidationOpportunities.reduce(
      (acc, o) => acc + o.potentialSavings,
      0,
    );
    const potentialNegotiationSavings = Object.values(
      bestCarrierPerState,
    ).reduce((acc, v) => acc + v.savings, 0);

    return {
      totalFreight: total,
      avgFreight: avg,
      totalEntregas: rawData.length,
      totalAbusiveValue: totalAbusive,
      abusiveCount: abusiveFreights.length,
      consolidationSavings: totalConsolidationSavings,
      consolidationOpps: consolidationOpportunities.length,
      negotiationSavings: potentialNegotiationSavings,
      totalPotentialSavings:
        totalAbusive + totalConsolidationSavings + potentialNegotiationSavings,
    };
  }, [
    rawData,
    abusiveFreights,
    consolidationOpportunities,
    bestCarrierPerState,
  ]);

  return {
    isLoading,
    isError,
    error,
    rawData,
    regionAnalysis,
    carrierRouteComparison,
    abusiveFreights,
    consolidationOpportunities,
    bestCarrierPerState,
    summary,
  };
}

function extractEstado(endereco: string | null): string {
  if (!endereco) return "N/D";
  const match = endereco.match(/\b([A-Z]{2})\b/);
  return match ? match[1] : "N/D";
}
