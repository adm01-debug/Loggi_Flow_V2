import { describe, it, expect } from "vitest";
import {
  eventFromOccurrence,
  extractBatchItems,
  normalizeOccurrence,
  parseRTEDate,
  snapshotFromBatchItem,
  snapshotsFromBatchPayload,
} from "./occurrencePhase";
import { evaluateFreightHealth } from "./freightHealth";
import { normalizeRTEEvent } from "./eventCodes";

const now = new Date("2026-06-20T12:00:00Z");

describe("normalizeOccurrence", () => {
  it("aceita número, string e string com zeros à esquerda", () => {
    expect(normalizeOccurrence(43)).toBe("43");
    expect(normalizeOccurrence("43")).toBe("43");
    expect(normalizeOccurrence("043")).toBe("43");
    expect(normalizeOccurrence(null)).toBe("");
    expect(normalizeOccurrence(undefined)).toBe("");
  });
});

describe("parseRTEDate", () => {
  it("converte data brasileira com e sem hora", () => {
    expect(parseRTEDate("20/11/2026")).toBe("2026-11-20");
    expect(parseRTEDate("20/11/2026", "10:30")).toBe("2026-11-20T10:30");
    expect(parseRTEDate("20/11/2026 08:05:00")).toBe("2026-11-20T08:05:00");
  });

  it("mantém ISO e combina a hora separada", () => {
    expect(parseRTEDate("2026-11-20", "07:00")).toBe("2026-11-20T07:00");
    expect(parseRTEDate("2026-11-20T09:15:00")).toBe("2026-11-20T09:15:00");
  });

  it("devolve null para valor ausente ou inválido", () => {
    expect(parseRTEDate(null)).toBeNull();
    expect(parseRTEDate("")).toBeNull();
    expect(parseRTEDate("ontem")).toBeNull();
  });
});

describe("eventFromOccurrence", () => {
  it("traduz ocorrência de entrega no evento final", () => {
    const event = eventFromOccurrence(1, "10/06/2026", "14:00");
    const normalized = normalizeRTEEvent(event);
    expect(normalized.phase).toBe("entregue");
    expect(normalized.isFinal).toBe(true);
    expect(normalized.date).toBe("2026-06-10T14:00");
  });

  it("traduz ocorrência de saída para entrega em rota", () => {
    expect(normalizeRTEEvent(eventFromOccurrence(43)).phase).toBe("em_rota");
  });

  it("traduz ocorrência de exceção preservando a categoria", () => {
    const normalized = normalizeRTEEvent(eventFromOccurrence(6));
    expect(normalized.exception).toBe("endereco_nao_localizado");
    expect(normalized.isFinal).toBe(false);
  });

  it("mantém código desconhecido como fase desconhecida", () => {
    expect(normalizeRTEEvent(eventFromOccurrence(999)).phase).toBe(
      "desconhecido",
    );
  });

  it("usa a descrição da RTE em vez do rótulo interno", () => {
    const normalized = normalizeRTEEvent(
      eventFromOccurrence(39, null, null, "Em transito - Curitiba/PR"),
    );
    expect(normalized.label).toBe("Em transito - Curitiba/PR");
  });
});

describe("extractBatchItems", () => {
  it("aceita os três envelopes devolvidos pelo gateway", () => {
    const frete = { NfNumero: "1" };
    expect(extractBatchItems({ success: true, data: { Tracking: [frete] } })).toHaveLength(1);
    expect(extractBatchItems({ success: true, data: [frete] })).toHaveLength(1);
    expect(extractBatchItems({ data: { data: [frete] } })).toHaveLength(1);
  });

  it("devolve lista vazia sem fretes", () => {
    expect(extractBatchItems(null)).toHaveLength(0);
    expect(extractBatchItems({ success: false, error: "x" })).toHaveLength(0);
  });
});

describe("snapshotFromBatchItem", () => {
  it("usa a trilha aninhada quando o frete traz ocorrências", () => {
    const snapshot = snapshotFromBatchItem(
      {
        NfNumero: "123",
        DataEmissao: "01/06/2026",
        PrazoEntrega: 3,
        Ocorrencias: [
          { CodigoOcorrencia: 58, DataOcorrencia: "01/06/2026" },
          { CodigoOcorrencia: 43, DataOcorrencia: "19/06/2026", HoraOcorrencia: "08:00" },
        ],
      },
      { expectedDeliveryDays: 5 },
    );
    expect(snapshot?.id).toBe("123");
    expect(snapshot?.expectedDeliveryDays).toBe(3);
    expect(snapshot?.events).toHaveLength(2);
    expect(snapshot?.emissionDate).toBe("2026-06-01");
  });

  it("cai no último código do frete e no prazo padrão", () => {
    const snapshot = snapshotFromBatchItem(
      {
        ProtocolNumber: "987",
        DataEmissao: "2026-06-18",
        CodigoOcorrencia: 39,
        DataOcorrencia: "2026-06-18T00:00:00",
      },
      { expectedDeliveryDays: 5 },
    );
    expect(snapshot?.id).toBe("987");
    expect(snapshot?.expectedDeliveryDays).toBe(5);
    expect(snapshot?.events).toHaveLength(1);
  });

  it("descarta frete sem qualquer data avaliável", () => {
    expect(
      snapshotFromBatchItem({ NfNumero: "1", CodigoOcorrencia: 43 }, {
        expectedDeliveryDays: 5,
      }),
    ).toBeNull();
  });
});

describe("snapshotsFromBatchPayload + motor de anomalias", () => {
  const payload = {
    success: true,
    data: {
      Tracking: [
        {
          NfNumero: "ENTREGUE",
          DataEmissao: "01/06/2026",
          PrazoEntrega: 5,
          Ocorrencias: [{ CodigoOcorrencia: 1, DataOcorrencia: "10/06/2026" }],
        },
        {
          NfNumero: "ATRASADO",
          DataEmissao: "01/06/2026",
          PrazoEntrega: 2,
          Ocorrencias: [
            { CodigoOcorrencia: 44, DataOcorrencia: "19/06/2026" },
          ],
        },
        {
          NfNumero: "PARADO",
          DataEmissao: "18/06/2026",
          CodigoOcorrencia: 39,
          DataOcorrencia: "18/06/2026T00:00:00",
        },
        {
          NfNumero: "EXCECAO",
          DataEmissao: "01/06/2026",
          PrazoEntrega: 40,
          Ocorrencias: [{ CodigoOcorrencia: 6, DataOcorrencia: "19/06/2026" }],
        },
        { NfNumero: "SEM-DATA" },
      ],
    },
  };

  it("converte o lote inteiro e conta os não avaliáveis", () => {
    const { snapshots, skipped } = snapshotsFromBatchPayload(payload, {
      expectedDeliveryDays: 5,
    });
    expect(snapshots).toHaveLength(4);
    expect(skipped).toBe(1);
  });

  it("classifica cada frete do lote pelas regras do motor", () => {
    const { snapshots } = snapshotsFromBatchPayload(payload, {
      expectedDeliveryDays: 5,
    });
    const result = new Map(
      snapshots.map((snapshot) => [
        snapshot.id,
        evaluateFreightHealth(snapshot, { now }),
      ]),
    );

    expect(result.get("ENTREGUE")?.delivered).toBe(true);
    expect(result.get("ENTREGUE")?.anomalies).toEqual([]);

    expect(result.get("ATRASADO")?.anomalies).toEqual(["atrasado"]);

    expect(result.get("PARADO")?.anomalies).toEqual(["parado"]);

    expect(result.get("EXCECAO")?.anomalies).toEqual(["excecao"]);
    expect(result.get("EXCECAO")?.severity).toBe("atencao");
  });

  it("não acusa parado no frete aguardando retirada no destino", () => {
    const snapshot = snapshotFromBatchItem(
      {
        NfNumero: "DESTINO",
        DataEmissao: "10/06/2026",
        PrazoEntrega: 10,
        CodigoOcorrencia: 44,
        DataOcorrencia: "12/06/2026",
      },
      { expectedDeliveryDays: 5 },
    );
    const health = evaluateFreightHealth(snapshot!, { now });
    expect(health.anomalies).toEqual([]);
  });
});
