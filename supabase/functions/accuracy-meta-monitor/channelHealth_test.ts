import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  aggregateChannelHealth,
  ChannelName,
  ChannelRecord,
  classifyChannelValue,
} from "./channelHealth.ts";

Deno.test("classifyChannelValue: reconhece ok/error/throw/unknown", () => {
  assertEquals(classifyChannelValue("ok").status, "ok");
  assertEquals(classifyChannelValue("error:timeout").status, "error");
  assertEquals(classifyChannelValue("error:timeout").detail, "timeout");
  assertEquals(classifyChannelValue("throw:boom").status, "throw");
  assertEquals(classifyChannelValue("").status, "unknown");
  assertEquals(classifyChannelValue(null).status, "unknown");
  assertEquals(classifyChannelValue(42).status, "unknown");
});

Deno.test("aggregateChannelHealth: agrega vazio sem quebrar", () => {
  const r = aggregateChannelHealth([]);
  assertEquals(r.channels.email.total, 0);
  assertEquals(r.channels.whatsapp.total, 0);
  assertEquals(r.windowStart, null);
});

Deno.test("aggregateChannelHealth: taxa de sucesso e último disparo", () => {
  const recs: ChannelRecord[] = [
    { id: "a", created_at: "2026-07-01T10:00:00Z", channels: { email: "ok", whatsapp: "error:401" } },
    { id: "b", created_at: "2026-07-01T11:00:00Z", channels: { email: "ok" } },
    { id: "c", created_at: "2026-07-01T12:00:00Z", channels: { email: "error:500", whatsapp: "ok" } },
  ];
  const r = aggregateChannelHealth(recs);
  assertEquals(r.channels.email.total, 3);
  assertEquals(r.channels.email.ok, 2);
  assertEquals(r.channels.email.error, 1);
  assertEquals(r.channels.email.successRate, 2 / 3);
  assertEquals(r.channels.email.lastDispatchAt, "2026-07-01T12:00:00Z");
  assertEquals(r.channels.email.lastFailureReason, "500");
  assertEquals(r.channels.whatsapp.total, 2);
  assertEquals(r.channels.whatsapp.ok, 1);
  assertEquals(r.channels.whatsapp.lastFailureReason, "401");
});

Deno.test("aggregateChannelHealth: ignora timestamps inválidos", () => {
  const recs: ChannelRecord[] = [
    { id: "x", created_at: "not-a-date", channels: { email: "ok" } },
    { id: "y", created_at: "2026-07-01T00:00:00Z", channels: { email: "ok" } },
  ];
  const r = aggregateChannelHealth(recs);
  assertEquals(r.channels.email.total, 1);
});

Deno.test("aggregateChannelHealth: samples limitados e ordenados desc", () => {
  const recs: ChannelRecord[] = Array.from({ length: 30 }).map((_, i) => ({
    id: `n${i}`,
    created_at: new Date(Date.UTC(2026, 6, 1, 0, i, 0)).toISOString(),
    channels: { email: i % 2 === 0 ? "ok" : "error:x" },
  }));
  const r = aggregateChannelHealth(recs, { sampleLimit: 5 });
  assertEquals(r.channels.email.samples.length, 5);
  const times = r.channels.email.samples.map((s) => s.created_at);
  const sorted = [...times].sort((a, b) => Date.parse(b) - Date.parse(a));
  assertEquals(times, sorted);
});

// Fuzz: 500 cenários aleatórios preservando invariantes
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

Deno.test("aggregateChannelHealth: fuzz 500 cenários preserva invariantes", () => {
  const rng = mulberry32(2026_07_23);
  for (let scenario = 0; scenario < 500; scenario++) {
    const n = Math.floor(rng() * 40);
    const recs: ChannelRecord[] = [];
    for (let i = 0; i < n; i++) {
      const channels: Partial<Record<ChannelName, string>> = {};
      const pickEmail = rng() < 0.7;
      const pickWa = rng() < 0.5;
      const pool = ["ok", "ok", "ok", "error:timeout", "error:401", "throw:boom", ""];
      if (pickEmail) channels.email = pool[Math.floor(rng() * pool.length)];
      if (pickWa) channels.whatsapp = pool[Math.floor(rng() * pool.length)];
      const ts = Date.UTC(2026, 6, 1) + Math.floor(rng() * 86400000 * 30);
      recs.push({ id: `s${scenario}-${i}`, created_at: new Date(ts).toISOString(), channels });
    }
    const r = aggregateChannelHealth(recs);
    for (const ch of ["email", "whatsapp"] as const) {
      const s = r.channels[ch];
      assertEquals(s.ok + s.error + s.thrown <= s.total, true, "buckets <= total");
      assert(s.successRate >= 0 && s.successRate <= 1, "rate ∈ [0,1]");
      if (s.total === 0) {
        assertEquals(s.lastDispatchAt, null);
        assertEquals(s.lastFailureAt, null);
      }
      if (s.ok === s.total && s.total > 0) {
        assertEquals(s.lastFailureAt, null);
      }
    }
  }
});
