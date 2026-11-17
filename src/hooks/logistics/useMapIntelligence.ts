import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const EM_ROTA = ["despachado", "em_transito", "saiu_entrega"] as const;
const FINALIZADAS = ["entregue", "finalizado"] as const;
const JANELA_DIAS = 30;
const PONTOS_TENDENCIA = 10;
const DIA_MS = 86_400_000;

export interface RotaAtencao {
  numero: string;
  atrasoHoras: number;
}

export interface MapIntelligence {
  /** % de entregas finalizadas dentro da previsao. `null` quando nao ha base para calcular. */
  slaPercent: number | null;
  finalizadasComPrazo: number;
  emRota: number;
  atrasadas: number;
  ocorrencias: number;
  rotaAtencao: RotaAtencao | null;
  tendencia: { val: number }[];
  /** Tempo real da consulta ao banco, em ms. */
  latenciaMs: number;
}

interface LinhaEntrega {
  numero_entrega: string;
  status: string;
  previsao_entrega: string | null;
  data_entrega_efetiva: string | null;
  created_at: string | null;
}

interface Agregado {
  finalizadasComPrazo: number;
  noPrazo: number;
  emRota: number;
  atrasadas: number;
  ocorrencias: number;
  pior: RotaAtencao | null;
}

function apuraFinalizada(e: LinhaEntrega, acc: Agregado): void {
  const efetiva = e.data_entrega_efetiva;
  const previsao = e.previsao_entrega;
  if (!efetiva || !previsao) return;
  acc.finalizadasComPrazo += 1;
  if (Date.parse(efetiva) <= Date.parse(previsao)) acc.noPrazo += 1;
}

function apuraEmRota(e: LinhaEntrega, acc: Agregado, agora: number): void {
  acc.emRota += 1;
  const previsao = e.previsao_entrega ? Date.parse(e.previsao_entrega) : NaN;
  if (Number.isNaN(previsao) || previsao >= agora) return;
  acc.atrasadas += 1;
  const atrasoHoras = Math.floor((agora - previsao) / 3_600_000);
  if (!acc.pior || atrasoHoras > acc.pior.atrasoHoras) {
    acc.pior = { numero: e.numero_entrega, atrasoHoras };
  }
}

function agregar(linhas: LinhaEntrega[], agora: number): Agregado {
  const acc: Agregado = {
    finalizadasComPrazo: 0,
    noPrazo: 0,
    emRota: 0,
    atrasadas: 0,
    ocorrencias: 0,
    pior: null,
  };
  for (const e of linhas) {
    if (e.status === "ocorrencia") acc.ocorrencias += 1;
    if ((FINALIZADAS as readonly string[]).includes(e.status)) {
      apuraFinalizada(e, acc);
    }
    if ((EM_ROTA as readonly string[]).includes(e.status)) {
      apuraEmRota(e, acc, agora);
    }
  }
  return acc;
}

function bucketsDiarios(datas: string[], agora: number): { val: number }[] {
  const buckets = new Array<number>(PONTOS_TENDENCIA).fill(0);
  const inicio = agora - PONTOS_TENDENCIA * DIA_MS;
  for (const d of datas) {
    const t = Date.parse(d);
    if (Number.isNaN(t) || t < inicio) continue;
    const idx = Math.min(
      PONTOS_TENDENCIA - 1,
      Math.floor((t - inicio) / DIA_MS),
    );
    buckets[idx] += 1;
  }
  return buckets.map((val) => ({ val }));
}

export function useMapIntelligence() {
  return useQuery<MapIntelligence>({
    queryKey: ["map-intelligence"],
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const t0 = performance.now();
      const desde = new Date(Date.now() - JANELA_DIAS * DIA_MS).toISOString();

      const { data, error } = await supabase
        .from("entregas")
        .select(
          "numero_entrega,status,previsao_entrega,data_entrega_efetiva,created_at",
        )
        .is("deleted_at", null)
        .gte("created_at", desde);

      if (error) throw error;

      const latenciaMs = Math.round(performance.now() - t0);
      const agora = Date.now();
      const linhas = data ?? [];

      const acc = agregar(linhas, agora);

      return {
        slaPercent:
          acc.finalizadasComPrazo > 0
            ? (acc.noPrazo / acc.finalizadasComPrazo) * 100
            : null,
        finalizadasComPrazo: acc.finalizadasComPrazo,
        emRota: acc.emRota,
        atrasadas: acc.atrasadas,
        ocorrencias: acc.ocorrencias,
        rotaAtencao: acc.pior,
        tendencia: bucketsDiarios(
          linhas.map((e) => e.created_at).filter(Boolean) as string[],
          agora,
        ),
        latenciaMs,
      };
    },
  });
}
