/**
 * Ponte entre o código de ocorrência devolvido pelo rastreio em lote da RTE
 * (`CodigoOcorrencia`) e o sistema canônico EventCode/ProcedaCode consumido
 * pelo motor de anomalias.
 *
 * O lote NÃO devolve EventCode: devolve o código de ocorrência do portal
 * (0-58, o mesmo de RODONAVES_STATUS_MAP). Sem esta tradução, as regras de
 * atrasado/parado/exceção nunca enxergariam os fretes do lote.
 */

import type { RTERawEvent } from "./eventCodes";
import type { FreightSnapshot } from "./freightHealth";

interface OccurrenceMapping {
  /** EventCode canônico equivalente (ver EVENT_CODE_PHASE). */
  readonly eventCode: string;
  /** ProcedaCode canônico equivalente, quando a ocorrência é uma exceção. */
  readonly procedaCode?: string;
  /** Rótulo operacional da ocorrência. */
  readonly label: string;
}

/** Código de ocorrência (portal) → evento canônico equivalente. */
export const OCCURRENCE_EVENTS: Readonly<Record<string, OccurrenceMapping>> = {
  "0": { eventCode: "0", label: "Transporte iniciado" },
  "58": { eventCode: "0", label: "CT-e emitido" },
  "47": { eventCode: "0", label: "Mercadoria coletada" },
  "37": { eventCode: "1", label: "Em trânsito para redespacho" },
  "39": { eventCode: "1", label: "Em trânsito" },
  "45": { eventCode: "1", label: "Em transferência" },
  "46": { eventCode: "1", label: "Mercadoria despachada" },
  "44": { eventCode: "2", label: "Recebida na filial destino" },
  "43": { eventCode: "3", label: "Saiu para entrega" },
  "2": { eventCode: "3", label: "Entrega fora do prazo" },
  "1": { eventCode: "6", label: "Entrega realizada" },
  "24": { eventCode: "6", label: "Mercadoria reentregue" },
  "29": { eventCode: "6", label: "Cliente retirou na transportadora" },
  "3": { eventCode: "3", procedaCode: "3", label: "Recusa — falta pedido" },
  "6": {
    eventCode: "3",
    procedaCode: "5",
    label: "Endereço não localizado",
  },
  "14": { eventCode: "3", procedaCode: "8", label: "Mercadoria sinistrada" },
  "19": { eventCode: "3", procedaCode: "10", label: "Reentrega solicitada" },
  "20": {
    eventCode: "3",
    procedaCode: "2",
    label: "Entrega prejudicada por horário",
  },
  "21": {
    eventCode: "3",
    procedaCode: "4",
    label: "Estabelecimento fechado",
  },
  "23": { eventCode: "3", procedaCode: "9", label: "Extravio em trânsito" },
  "25": { eventCode: "3", procedaCode: "11", label: "Devolvida à origem" },
  "27": { eventCode: "3", procedaCode: "9", label: "Roubo de carga" },
};

/** Normaliza o código de ocorrência para a chave do mapa. */
export function normalizeOccurrence(value: unknown): string {
  if (value === null || value === undefined) return "";
  const text = String(value).trim();
  if (text === "") return "";
  const numeric = Number(text);
  if (!Number.isFinite(numeric)) return text;
  return String(numeric);
}

/**
 * Converte data/hora da RTE em ISO 8601.
 * Aceita "2026-11-20T10:30:00", "2026-11-20" e "20/11/2026" (+ hora opcional).
 */
export function parseRTEDate(
  date: unknown,
  time?: unknown,
): string | null {
  if (typeof date !== "string") return null;
  const raw = date.trim();
  if (raw === "") return null;

  const timePart =
    typeof time === "string" && /^\d{1,2}:\d{2}(:\d{2})?$/.test(time.trim())
      ? time.trim()
      : null;
  const withTime = (iso: string) => (timePart ? `${iso}T${timePart}` : iso);

  const br = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})(.*)$/);
  if (br) {
    const [, day, month, year] = br;
    const rest = br[4]?.replace(/^\s+/, "");
    const inlineTime =
      rest && /^\d{1,2}:\d{2}(:\d{2})?$/.test(rest) ? rest : null;
    if (inlineTime) return `${year}-${month}-${day}T${inlineTime}`;
    return withTime(`${year}-${month}-${day}`);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return withTime(raw);
  // Já é ISO com hora: mantém como veio. Converter para UTC deslocaria o
  // horário do evento em relação ao fuso da transportadora.
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?/.test(raw)) {
    return raw;
  }
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

/** Constrói o evento canônico de uma ocorrência do lote. */
export function eventFromOccurrence(
  code: unknown,
  date?: unknown,
  time?: unknown,
  description?: unknown,
): RTERawEvent {
  const mapping = OCCURRENCE_EVENTS[normalizeOccurrence(code)];
  const iso = parseRTEDate(date, time);
  const label =
    typeof description === "string" && description.trim() !== ""
      ? description.trim()
      : mapping?.label ?? null;
  return {
    system: "event",
    eventCode: mapping?.eventCode ?? null,
    procedaCode: mapping?.procedaCode ?? null,
    description: label,
    date: iso,
  };
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function firstString(
  item: Record<string, unknown>,
  keys: readonly string[],
): string | null {
  for (const key of keys) {
    const value = item[key];
    if (typeof value === "string" && value.trim() !== "") return value.trim();
    if (typeof value === "number" && Number.isFinite(value)) return String(value);
  }
  return null;
}

/** Extrai a lista de fretes de qualquer envelope devolvido pelo rastreio. */
export function extractBatchItems(payload: unknown): Record<string, unknown>[] {
  const envelope = asRecord(payload);
  if (!envelope) return [];
  const body = asRecord(envelope.data) ?? envelope;
  const candidates = ["Tracking", "data", "Items", "items", "Ocorrencias"];
  for (const key of candidates) {
    const value = body[key];
    if (Array.isArray(value)) {
      return value
        .map((item) => asRecord(item))
        .filter((item): item is Record<string, unknown> => item !== null);
    }
  }
  if (Array.isArray(body.data)) {
    return body.data
      .map((item) => asRecord(item))
      .filter((item): item is Record<string, unknown> => item !== null);
  }
  return [];
}

export interface SnapshotOptions {
  /** Prazo previsto em dias úteis usado quando o frete não traz o campo. */
  readonly expectedDeliveryDays: number;
}

export interface SnapshotExtraction {
  readonly snapshots: readonly FreightSnapshot[];
  /** Fretes sem data de emissão e sem evento datado — não avaliáveis. */
  readonly skipped: number;
}

/**
 * Converte um frete do lote em snapshot do motor de anomalias.
 * A trilha completa é usada quando presente; caso contrário, o último código
 * de ocorrência do frete vira um evento único.
 */
export function snapshotFromBatchItem(
  item: Record<string, unknown>,
  options: SnapshotOptions,
): FreightSnapshot | null {
  const nested = ["Ocorrencias", "Tracking", "Events", "events"]
    .map((key) => (Array.isArray(item[key]) ? (item[key] as unknown[]) : null))
    .find((value) => value !== null);

  const events: RTERawEvent[] = nested
    ? nested
        .map((raw) => asRecord(raw))
        .filter((raw): raw is Record<string, unknown> => raw !== null)
        .map((raw) =>
          eventFromOccurrence(
            raw.CodigoOcorrencia ?? raw.OccurrenceCode ?? raw.Code,
            raw.DataOcorrencia ?? raw.Date,
            raw.HoraOcorrencia ?? raw.Time,
            raw.DescricaoOcorrencia ?? raw.Description,
          ),
        )
    : [
        eventFromOccurrence(
          item.CodigoOcorrencia ?? item.OccurrenceCode,
          item.DataOcorrencia ?? item.Date,
          item.HoraOcorrencia ?? item.Time,
          item.DescricaoOcorrencia ?? item.Description,
        ),
      ];

  const datedEvents = events.filter((event) =>
    typeof event.date === "string" && event.date !== ""
  );
  const emissionDate =
    parseRTEDate(firstString(item, ["DataEmissao", "EmissionDate", "DataColeta"])) ??
    datedEvents[0]?.date ??
    null;
  if (emissionDate === null) return null;

  const rawDays = firstString(item, [
    "PrazoEntrega",
    "ExpectedDeliveryDays",
    "Prazo",
    "DeliveryTime",
  ]);
  const expected = rawDays === null ? NaN : Number(rawDays.replace(",", "."));
  const expectedDeliveryDays =
    Number.isFinite(expected) && expected > 0
      ? expected
      : options.expectedDeliveryDays;

  const id =
    firstString(item, [
      "ProtocolNumber",
      "NfNumero",
      "CteNumber",
      "InvoiceNumber",
      "Protocolo",
    ]) ?? "sem-identificacao";

  return {
    id,
    emissionDate,
    expectedDeliveryDays,
    events: datedEvents.length > 0 ? datedEvents : events,
  };
}

/** Converte o payload inteiro do rastreio em lote. */
export function snapshotsFromBatchPayload(
  payload: unknown,
  options: SnapshotOptions,
): SnapshotExtraction {
  const items = extractBatchItems(payload);
  const snapshots: FreightSnapshot[] = [];
  let skipped = 0;
  for (const item of items) {
    const snapshot = snapshotFromBatchItem(item, options);
    if (snapshot === null) skipped += 1;
    else snapshots.push(snapshot);
  }
  return { snapshots, skipped };
}
