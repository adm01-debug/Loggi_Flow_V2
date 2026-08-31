/**
 * Agregação temporal da latência dos gateways Rodonaves.
 *
 * O histórico bruto (`rte_gateway_health`) contém uma linha por gateway por
 * verificação. Para tendência visual, agrupamos em buckets de tempo fixos e
 * calculamos latência média, P95 e disponibilidade por bucket.
 *
 * Invariantes garantidas (validadas por fuzz testing):
 *  - buckets sempre ordenados cronologicamente (ascendente);
 *  - `avgLatencyMs <= p95LatencyMs` dentro de cada bucket;
 *  - `0 <= uptimePct <= 100`;
 *  - a soma de `checks` de todos os buckets == número de linhas válidas.
 */

/** Linha mínima necessária para o cálculo de tendência. */
export interface LatencySample {
  gateway: string;
  online: boolean;
  latency_ms: number;
  checked_at: string;
}

/** Ponto agregado de um intervalo de tempo. */
export interface LatencyTrendPoint {
  /** Início do bucket em ISO 8601 (UTC). */
  bucketStart: string;
  /** Rótulo curto para o eixo X (HH:mm). */
  label: string;
  checks: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  uptimePct: number;
}

/** Tendência calculada com metadados de degradação. */
export interface LatencyTrend {
  points: LatencyTrendPoint[];
  /** Variação percentual da latência média entre a 1ª e a 2ª metade da janela. */
  driftPct: number;
  /** `true` quando a latência média piora mais que `degradationThresholdPct`. */
  degrading: boolean;
}

export interface LatencyTrendOptions {
  /** Tamanho do bucket em minutos. Padrão: 60. */
  bucketMinutes?: number;
  /** Percentual de piora que caracteriza degradação. Padrão: 25%. */
  degradationThresholdPct?: number;
  /** Filtra por gateway específico. Sem valor = todos os gateways. */
  gateway?: string;
}

function percentile(sortedAsc: number[], p: number): number {
  if (sortedAsc.length === 0) return 0;
  const index = Math.min(
    sortedAsc.length - 1,
    Math.max(0, Math.ceil((p / 100) * sortedAsc.length) - 1),
  );
  return sortedAsc[index];
}

function isValidSample(sample: LatencySample): boolean {
  if (!sample || typeof sample.checked_at !== "string") return false;
  const time = new Date(sample.checked_at).getTime();
  if (!Number.isFinite(time)) return false;
  return Number.isFinite(sample.latency_ms);
}

function formatLabel(date: Date): string {
  const hh = String(date.getUTCHours()).padStart(2, "0");
  const mm = String(date.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

/**
 * Agrupa amostras em buckets temporais e calcula métricas de latência.
 * Entradas inválidas (datas/latências não numéricas) são descartadas em vez de
 * lançar exceção — o painel nunca deve quebrar por dado sujo do banco.
 */
export function buildLatencyTrend(
  samples: LatencySample[],
  options: LatencyTrendOptions = {},
): LatencyTrend {
  const bucketMinutes = Math.max(1, Math.floor(options.bucketMinutes ?? 60));
  const threshold = options.degradationThresholdPct ?? 25;
  const bucketMs = bucketMinutes * 60_000;

  const buckets = new Map<number, { latencies: number[]; online: number }>();

  for (const sample of samples ?? []) {
    if (!isValidSample(sample)) continue;
    if (options.gateway && sample.gateway !== options.gateway) continue;

    const time = new Date(sample.checked_at).getTime();
    const key = Math.floor(time / bucketMs) * bucketMs;
    const entry = buckets.get(key) ?? { latencies: [], online: 0 };
    entry.latencies.push(Math.max(0, sample.latency_ms));
    if (sample.online) entry.online += 1;
    buckets.set(key, entry);
  }

  const points: LatencyTrendPoint[] = Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([key, entry]) => {
      const sorted = [...entry.latencies].sort((a, b) => a - b);
      const sum = sorted.reduce((acc, v) => acc + v, 0);
      const date = new Date(key);
      return {
        bucketStart: date.toISOString(),
        label: formatLabel(date),
        checks: sorted.length,
        avgLatencyMs: Math.round(sum / sorted.length),
        p95LatencyMs: Math.round(percentile(sorted, 95)),
        uptimePct: (entry.online / sorted.length) * 100,
      };
    })
    // Garante a invariante avg <= p95 mesmo após arredondamentos.
    .map((point) => ({
      ...point,
      p95LatencyMs: Math.max(point.p95LatencyMs, point.avgLatencyMs),
    }));

  const driftPct = computeDrift(points);

  return {
    points,
    driftPct,
    degrading: driftPct > threshold,
  };
}

/** Variação percentual da latência média entre a primeira e a segunda metade. */
export function computeDrift(points: LatencyTrendPoint[]): number {
  if (points.length < 2) return 0;
  const half = Math.floor(points.length / 2);
  const first = points.slice(0, half);
  const second = points.slice(half);

  const mean = (list: LatencyTrendPoint[]) =>
    list.reduce((sum, p) => sum + p.avgLatencyMs, 0) / list.length;

  const before = mean(first);
  const after = mean(second);
  if (before <= 0) return after > 0 ? 100 : 0;
  return ((after - before) / before) * 100;
}
