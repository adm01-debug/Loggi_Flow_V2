import { assert, assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildDigest, DigestNotification, renderDigestEmail, WEEK_MS } from "./digest.ts";

const NOW = new Date("2026-07-23T12:00:00Z");

function n(id: string, ago_ms: number, meta: DigestNotification["metadata"]): DigestNotification {
  return {
    id,
    created_at: new Date(NOW.getTime() - ago_ms).toISOString(),
    metadata: { source: "accuracy-meta-monitor", ...meta },
  };
}

Deno.test("buildDigest: vazio quando sem notificações", () => {
  const r = buildDigest([], NOW);
  assertEquals(r.isEmpty, true);
  assertEquals(r.totalAlerts, 0);
  assertEquals(renderDigestEmail(r), null);
});

Deno.test("buildDigest: descarta fora da janela de 7d", () => {
  const r = buildDigest(
    [
      n("a", 2 * 86400000, { carrier: "Rodo", target_pct: 90, breach_days: 2, actual_pct: 80 }),
      n("b", WEEK_MS + 60000, { carrier: "Rodo", target_pct: 90 }),
    ],
    NOW,
  );
  assertEquals(r.totalAlerts, 1);
});

Deno.test("buildDigest: agrega por carrier, computa pior real e maior streak", () => {
  const r = buildDigest(
    [
      n("a", 86400000, { carrier: "Rodo", breach_days: 2, actual_pct: 82, target_pct: 90 }),
      n("b", 3600000, { carrier: "Rodo", breach_days: 4, actual_pct: 78, target_pct: 90 }),
      n("c", 3600000, { carrier: "ME", breach_days: 1, actual_pct: 88, target_pct: 92 }),
    ],
    NOW,
  );
  assertEquals(r.carriers.length, 2);
  const rodo = r.carriers.find((c) => c.carrier === "Rodo")!;
  assertEquals(rodo.breaches, 2);
  assertEquals(rodo.maxStreak, 4);
  assertEquals(rodo.worstActualPct, 78);
  // ordem: mais alertas primeiro
  assertEquals(r.carriers[0].carrier, "Rodo");
});

Deno.test("buildDigest: agrega canais externos por status", () => {
  const r = buildDigest(
    [
      n("a", 1000, { carrier: "X", channels: { email: "ok", whatsapp: "error:401" } }),
      n("b", 2000, { carrier: "X", channels: { email: "ok" } }),
      n("c", 3000, { carrier: "X", channels: { email: "throw:x", whatsapp: "ok" } }),
    ],
    NOW,
  );
  const email = r.channels.find((c) => c.channel === "email")!;
  assertEquals(email.total, 3);
  assertEquals(email.ok, 2);
  assertEquals(email.failed, 1);
});

Deno.test("renderDigestEmail: gera assunto + html com todas as linhas", () => {
  const r = buildDigest(
    [n("a", 3600000, { carrier: "Rodo", breach_days: 2, target_pct: 95, actual_pct: 80 })],
    NOW,
  );
  const out = renderDigestEmail(r)!;
  assert(out.subject.includes("1 alerta"));
  assert(out.html.includes("Rodo"));
  assert(out.html.includes("80.0%"));
});

Deno.test("renderDigestEmail: escapa HTML no nome do carrier", () => {
  const r = buildDigest(
    [n("a", 1000, { carrier: "<script>alert(1)</script>", breach_days: 1 })],
    NOW,
  );
  const out = renderDigestEmail(r)!;
  assert(!out.html.includes("<script>alert"));
  assert(out.html.includes("&lt;script&gt;"));
});

// Fuzz 500 cenários
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

Deno.test("buildDigest: fuzz 500 cenários — invariantes", () => {
  const rng = mulberry32(2026_11_11);
  const carriers = ["Rodo", "ME", "Lala", "", null] as const;
  for (let s = 0; s < 500; s++) {
    const size = Math.floor(rng() * 40);
    const notifs: DigestNotification[] = [];
    for (let i = 0; i < size; i++) {
      const inside = rng() < 0.85;
      const ago = inside ? Math.floor(rng() * WEEK_MS) : WEEK_MS + Math.floor(rng() * WEEK_MS);
      notifs.push(
        n(`${s}-${i}`, ago, {
          carrier: carriers[Math.floor(rng() * carriers.length)] as string | null,
          breach_days: Math.floor(rng() * 10),
          target_pct: 80 + Math.floor(rng() * 20),
          actual_pct: 60 + rng() * 40,
          channels:
            rng() < 0.5
              ? { email: rng() < 0.7 ? "ok" : "error:x" }
              : rng() < 0.5
                ? { whatsapp: rng() < 0.7 ? "ok" : "throw:y" }
                : undefined,
        }),
      );
    }
    const r = buildDigest(notifs, NOW);
    // invariantes
    const sumBreaches = r.carriers.reduce((acc, c) => acc + c.breaches, 0);
    assertEquals(sumBreaches, r.totalAlerts);
    assert(r.totalAlerts <= notifs.length);
    // ordem desc
    for (let i = 1; i < r.carriers.length; i++) {
      assert(r.carriers[i - 1].breaches >= r.carriers[i].breaches);
    }
    for (const ch of r.channels) {
      assertEquals(ch.ok + ch.failed, ch.total);
      assert(ch.successRate >= 0 && ch.successRate <= 1);
    }
    assertEquals(r.isEmpty, r.totalAlerts === 0);
  }
});
