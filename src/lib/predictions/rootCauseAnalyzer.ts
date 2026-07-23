/**
 * Root Cause Analyzer — categoriza motivos de atraso em buckets estáveis
 * a partir de registros de `delay_predictions_history`.
 *
 * Puro/determinístico: usado tanto no frontend quanto em testes
 * de simulação (centenas de cenários) para prevenir regressões.
 */

export type RootCauseCategory =
  | "clima"
  | "transportadora"
  | "distancia"
  | "feriado"
  | "demanda"
  | "endereco"
  | "documentacao"
  | "outros";

export interface PredictionRecord {
  entity_id: string;
  transportadora: string | null;
  was_accurate: boolean | null;
  actual_delay_hours: number | null;
  horas_estimadas_atraso: number | null;
  motivos: unknown; // jsonb — normalmente string[]
  predicted_at: string;
}

export interface CategoryBucket {
  category: RootCauseCategory;
  count: number;
  totalDelayHours: number;
  carriers: Record<string, number>;
  sampleMotivos: string[];
}

export interface RootCauseReport {
  totalAnalyzed: number;
  totalWithDelay: number;
  buckets: CategoryBucket[];
  topCarrier: string | null;
  topCategory: RootCauseCategory | null;
}

const KEYWORD_MAP: ReadonlyArray<readonly [RegExp, RootCauseCategory]> = [
  [/\b(chuva|clima|tempo|temporal|neblina|alagament|enchente)/i, "clima"],
  [/\b(feriad|recess|ponto\s*facultat)/i, "feriado"],
  [/\b(endere[cç]o|cep|localiza[cç][aã]o|acesso)/i, "endereco"],
  [/(document|nota\s*fiscal|nf-?e|ct-?e)/i, "documentacao"],
  [/\b(dist[aâ]ncia|rota|km|percurso|longe)/i, "distancia"],
  [/\b(demanda|volume|pico|black|natal|sazon)/i, "demanda"],
  [/\b(transportadora|carrier|frota|motorista|ve[ií]culo|greve|opera[cç][aã]o)/i, "transportadora"],
];

/** Classifica um motivo textual em uma categoria de causa raiz. */
export function classifyMotivo(motivo: string): RootCauseCategory {
  const trimmed = motivo?.trim();
  if (!trimmed) return "outros";
  for (const [pattern, category] of KEYWORD_MAP) {
    if (pattern.test(trimmed)) return category;
  }
  return "outros";
}

/** Normaliza o campo `motivos` (jsonb) em uma lista textual limpa. */
export function normalizeMotivos(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((m) => (typeof m === "string" ? m : typeof m === "object" && m !== null ? JSON.stringify(m) : String(m)))
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 500);
  }
  if (typeof raw === "string") {
    return raw
      .split(/[;,\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Considera "com atraso" quando o preditor errou OU houve atraso real registrado. */
export function hasDelay(rec: PredictionRecord): boolean {
  if (rec.was_accurate === false) return true;
  if (typeof rec.actual_delay_hours === "number" && rec.actual_delay_hours > 0) return true;
  return false;
}

/** Estima horas de atraso a atribuir à ocorrência (fallback para estimativa). */
export function delayHoursOf(rec: PredictionRecord): number {
  if (typeof rec.actual_delay_hours === "number" && rec.actual_delay_hours > 0) {
    return rec.actual_delay_hours;
  }
  if (typeof rec.horas_estimadas_atraso === "number" && rec.horas_estimadas_atraso > 0) {
    return rec.horas_estimadas_atraso;
  }
  return 0;
}

/**
 * Agrega uma lista de predições em um relatório de causa raiz.
 * Cada motivo do registro conta uma vez por bucket detectado.
 */
export function analyzeRootCauses(records: readonly PredictionRecord[]): RootCauseReport {
  const map = new Map<RootCauseCategory, CategoryBucket>();
  const carrierCount: Record<string, number> = {};
  let totalWithDelay = 0;

  for (const rec of records) {
    if (!hasDelay(rec)) continue;
    totalWithDelay += 1;

    const carrier = (rec.transportadora ?? "desconhecida").trim() || "desconhecida";
    carrierCount[carrier] = (carrierCount[carrier] ?? 0) + 1;

    const motivos = normalizeMotivos(rec.motivos);
    const categoriesInRec = new Set<RootCauseCategory>();
    for (const motivo of motivos) categoriesInRec.add(classifyMotivo(motivo));
    if (categoriesInRec.size === 0) categoriesInRec.add("outros");

    const delayShare = delayHoursOf(rec);
    for (const cat of categoriesInRec) {
      const bucket = map.get(cat) ?? {
        category: cat,
        count: 0,
        totalDelayHours: 0,
        carriers: {},
        sampleMotivos: [],
      };
      bucket.count += 1;
      bucket.totalDelayHours += delayShare;
      bucket.carriers[carrier] = (bucket.carriers[carrier] ?? 0) + 1;
      if (bucket.sampleMotivos.length < 5 && motivos.length > 0) {
        for (const m of motivos) {
          if (classifyMotivo(m) === cat && !bucket.sampleMotivos.includes(m)) {
            bucket.sampleMotivos.push(m);
            if (bucket.sampleMotivos.length >= 5) break;
          }
        }
      }
      map.set(cat, bucket);
    }
  }

  const buckets = Array.from(map.values()).sort((a, b) => b.count - a.count);
  const topCarrierEntry = Object.entries(carrierCount).sort((a, b) => b[1] - a[1])[0];

  return {
    totalAnalyzed: records.length,
    totalWithDelay,
    buckets,
    topCarrier: topCarrierEntry?.[0] ?? null,
    topCategory: buckets[0]?.category ?? null,
  };
}

export const ROOT_CAUSE_LABELS: Record<RootCauseCategory, string> = {
  clima: "Clima",
  transportadora: "Transportadora",
  distancia: "Distância / Rota",
  feriado: "Feriado / Recesso",
  demanda: "Alta demanda",
  endereco: "Endereço / Acesso",
  documentacao: "Documentação",
  outros: "Outros",
};
