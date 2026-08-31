// Módulo puro de saúde de canais externos.
// Analisa registros de notifications (metadata.channels) e produz agregados
// por canal: sucesso, erro, throw, taxa, últimos disparos e MTTR simples.

export type ChannelName = "email" | "whatsapp";
export type ChannelStatus = "ok" | "error" | "throw" | "unknown";

export interface ChannelRecord {
  id: string;
  created_at: string; // ISO
  channels: Partial<Record<ChannelName, string>>; // valor: "ok" | "error:..." | "throw:..."
}

export interface ChannelSample {
  id: string;
  created_at: string;
  status: ChannelStatus;
  detail: string | null;
}

export interface ChannelStats {
  channel: ChannelName;
  total: number;
  ok: number;
  error: number;
  thrown: number;
  successRate: number; // 0..1
  lastDispatchAt: string | null;
  lastFailureAt: string | null;
  lastFailureReason: string | null;
  samples: ChannelSample[]; // ordenado do mais novo para o mais antigo
}

export interface ChannelHealthReport {
  windowStart: string | null;
  windowEnd: string | null;
  channels: Record<ChannelName, ChannelStats>;
}

const CHANNEL_LIST: ChannelName[] = ["email", "whatsapp"];

/** Classifica um valor bruto salvo em metadata.channels[<canal>]. */
export function classifyChannelValue(raw: unknown): { status: ChannelStatus; detail: string | null } {
  if (typeof raw !== "string" || raw.length === 0) return { status: "unknown", detail: null };
  if (raw === "ok") return { status: "ok", detail: null };
  if (raw.startsWith("error:")) return { status: "error", detail: raw.slice("error:".length) || null };
  if (raw.startsWith("throw:")) return { status: "throw", detail: raw.slice("throw:".length) || null };
  return { status: "unknown", detail: raw };
}

function emptyStats(channel: ChannelName): ChannelStats {
  return {
    channel,
    total: 0,
    ok: 0,
    error: 0,
    thrown: 0,
    successRate: 0,
    lastDispatchAt: null,
    lastFailureAt: null,
    lastFailureReason: null,
    samples: [],
  };
}

export interface AggregateOptions {
  sampleLimit?: number; // amostras mantidas por canal (default 20)
}

/**
 * Agrega registros em estatísticas por canal.
 * - Ignora canais ausentes no registro.
 * - Timestamps inválidos são descartados (não contam no total).
 * - `successRate` = ok / total (0 quando total = 0).
 */
export function aggregateChannelHealth(
  records: ChannelRecord[],
  opts: AggregateOptions = {},
): ChannelHealthReport {
  const sampleLimit = Math.max(1, opts.sampleLimit ?? 20);
  const stats: Record<ChannelName, ChannelStats> = {
    email: emptyStats("email"),
    whatsapp: emptyStats("whatsapp"),
  };
  let windowStart: number | null = null;
  let windowEnd: number | null = null;

  for (const rec of records) {
    const ts = Date.parse(rec.created_at);
    if (Number.isNaN(ts)) continue;
    windowStart = windowStart === null ? ts : Math.min(windowStart, ts);
    windowEnd = windowEnd === null ? ts : Math.max(windowEnd, ts);

    for (const ch of CHANNEL_LIST) {
      const raw = rec.channels?.[ch];
      if (raw === undefined) continue;
      const { status, detail } = classifyChannelValue(raw);
      const s = stats[ch];
      s.total++;
      if (status === "ok") s.ok++;
      else if (status === "error") s.error++;
      else if (status === "throw") s.thrown++;

      if (!s.lastDispatchAt || ts > Date.parse(s.lastDispatchAt)) {
        s.lastDispatchAt = rec.created_at;
      }
      if (status !== "ok" && (!s.lastFailureAt || ts > Date.parse(s.lastFailureAt))) {
        s.lastFailureAt = rec.created_at;
        s.lastFailureReason = detail;
      }
      s.samples.push({ id: rec.id, created_at: rec.created_at, status, detail });
    }
  }

  for (const ch of CHANNEL_LIST) {
    const s = stats[ch];
    s.successRate = s.total === 0 ? 0 : s.ok / s.total;
    s.samples.sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
    s.samples = s.samples.slice(0, sampleLimit);
  }

  return {
    windowStart: windowStart === null ? null : new Date(windowStart).toISOString(),
    windowEnd: windowEnd === null ? null : new Date(windowEnd).toISOString(),
    channels: stats,
  };
}
