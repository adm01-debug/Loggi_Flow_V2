import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  DEFAULT_ESCALATION,
  decideEscalation,
  HistoricalNotification,
} from "./escalation.ts";

const NOW = new Date("2026-07-20T12:00:00Z");

function n(
  id: string,
  hoursAgo: number,
  opts: Partial<HistoricalNotification["metadata"]> & { read?: boolean } = {},
): HistoricalNotification {
  const { read = false, ...meta } = opts;
  return {
    id,
    created_at: new Date(NOW.getTime() - hoursAgo * 3600_000).toISOString(),
    read,
    metadata: {
      source: "accuracy-meta-monitor",
      carrier: "RTE",
      channels: { email: "ok" },
      ...meta,
    },
  };
}

Deno.test("escalonamento dispara ao atingir threshold de ignorados", () => {
  const hist = [n("a", 1), n("b", 20), n("c", 40)];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.escalate, true);
  assertEquals(d.ignoredCount, 3);
  assertEquals(d.reason, "threshold_met");
});

Deno.test("abaixo do threshold não escala", () => {
  const hist = [n("a", 1), n("b", 20)];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.escalate, false);
  assertEquals(d.reason, "below_threshold");
});

Deno.test("notificações lidas não contam", () => {
  const hist = [n("a", 1, { read: true }), n("b", 20, { read: true }), n("c", 40)];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.escalate, false);
  assertEquals(d.ignoredCount, 1);
});

Deno.test("filtro por janela ignora antigos", () => {
  const hist = [n("a", 100), n("b", 200), n("c", 300)];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.ignoredCount, 0);
  assertEquals(d.reason, "no_email_dispatched");
});

Deno.test("carrier __all__ inclui variantes null", () => {
  const hist = [
    n("a", 1, { carrier: null }),
    n("b", 5, { carrier: "__all__" }),
    n("c", 10, { carrier: null }),
  ];
  const d = decideEscalation(hist, "__all__", NOW);
  assertEquals(d.escalate, true);
  assertEquals(d.ignoredCount, 3);
});

Deno.test("carrier específico não contabiliza __all__", () => {
  const hist = [n("a", 1, { carrier: null }), n("b", 5, { carrier: "__all__" })];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.ignoredCount, 0);
});

Deno.test("requireEmailDispatched exige channels.email = ok", () => {
  const hist = [
    n("a", 1, { channels: { email: "error:x" } }),
    n("b", 5, { channels: {} }),
    n("c", 10, { channels: { email: "ok" } }),
  ];
  const d = decideEscalation(hist, "RTE", NOW);
  assertEquals(d.ignoredCount, 1);
});

Deno.test("config inválida retorna invalid_config", () => {
  const d = decideEscalation([], "RTE", NOW, { ...DEFAULT_ESCALATION, ignoredThreshold: 0 });
  assertEquals(d.escalate, false);
  assertEquals(d.reason, "invalid_config");
});

// ─── Fuzz: 500 cenários aleatórios ───
function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6D2B79F5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Deno.test("fuzz: 500 cenários preservam invariantes", () => {
  const rand = mulberry32(0xC0FFEE);
  let escalated = 0;
  for (let i = 0; i < 500; i++) {
    const size = Math.floor(rand() * 8);
    const carrier = rand() < 0.5 ? "RTE" : "__all__";
    const hist: HistoricalNotification[] = [];
    for (let j = 0; j < size; j++) {
      hist.push(
        n(`${i}-${j}`, rand() * 120, {
          read: rand() < 0.3,
          carrier: rand() < 0.5 ? carrier : (rand() < 0.5 ? null : "OTHER"),
          channels: rand() < 0.7 ? { email: "ok" } : { email: `error:${i}` },
        }),
      );
    }
    const d = decideEscalation(hist, carrier, NOW);
    // Invariantes
    if (d.escalate) {
      escalated++;
      if (d.ignoredCount < DEFAULT_ESCALATION.ignoredThreshold) {
        throw new Error("escalated abaixo do threshold");
      }
    }
    if (d.ignoredCount < 0 || d.ignoredCount > size) {
      throw new Error("ignoredCount fora de faixa");
    }
  }
  // Sanidade estatística: ao menos 1 escalonou no fuzz
  if (escalated === 0) throw new Error("fuzz não gerou nenhum escalonamento");
});
