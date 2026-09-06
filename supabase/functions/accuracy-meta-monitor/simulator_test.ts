import {
  assert,
  assertEquals,
} from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  evaluate,
  nextCronRun,
  type NotificationRow,
  type SettingRow,
  WINDOW_MS,
} from "./simulator.ts";

// ---------------------------------------------------------------------------
// PRNG determinístico (LCG) — reprodutibilidade absoluta dos cenários gerados.
// ---------------------------------------------------------------------------
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function rand() {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const pick = <T>(rand: () => number, arr: T[]): T =>
  arr[Math.floor(rand() * arr.length)];

const CARRIERS: (string | null)[] = [
  "JADLOG",
  "CORREIOS",
  "AZUL",
  "TOTAL",
  null,
];
const USERS = ["u1", "u2", "u3", "u4", "u5"];

// ---------------------------------------------------------------------------
// Cron
// ---------------------------------------------------------------------------
Deno.test(
  "nextCronRun: horário antes das 08:15 UTC agenda no mesmo dia",
  () => {
    const now = new Date(Date.UTC(2026, 6, 20, 3, 0, 0));
    const next = nextCronRun(now);
    assertEquals(next.toISOString(), "2026-07-20T08:15:00.000Z");
  },
);

Deno.test("nextCronRun: exatamente 08:15 UTC avança para o próximo dia", () => {
  const now = new Date(Date.UTC(2026, 6, 20, 8, 15, 0));
  assertEquals(nextCronRun(now).toISOString(), "2026-07-21T08:15:00.000Z");
});

Deno.test("nextCronRun: depois de 08:15 UTC agenda amanhã", () => {
  const now = new Date(Date.UTC(2026, 6, 20, 23, 59, 0));
  assertEquals(nextCronRun(now).toISOString(), "2026-07-21T08:15:00.000Z");
});

Deno.test("nextCronRun: transição de mês", () => {
  const now = new Date(Date.UTC(2026, 6, 31, 12, 0, 0));
  assertEquals(nextCronRun(now).toISOString(), "2026-08-01T08:15:00.000Z");
});

Deno.test("nextCronRun: transição de ano (bissexto → não bissexto)", () => {
  const now = new Date(Date.UTC(2028, 11, 31, 12, 0, 0));
  assertEquals(nextCronRun(now).toISOString(), "2029-01-01T08:15:00.000Z");
});

Deno.test(
  "nextCronRun: 60 horários aleatórios sempre no futuro e dentro de 24h",
  () => {
    const rand = mulberry32(4242);
    for (let i = 0; i < 60; i++) {
      const now = new Date(Date.UTC(2026, 0, 1) + rand() * 365 * 86400_000);
      const next = nextCronRun(now);
      const delta = next.getTime() - now.getTime();
      assert(delta > 0, `next deve ser > now (i=${i})`);
      assert(
        delta <= 24 * 60 * 60 * 1000 + 1,
        `next deve estar dentro de 24h (i=${i})`,
      );
      assertEquals(next.getUTCHours(), 8);
      assertEquals(next.getUTCMinutes(), 15);
    }
  },
);

// ---------------------------------------------------------------------------
// Falhas de dados / higiene das settings
// ---------------------------------------------------------------------------
const T = new Date(Date.UTC(2026, 6, 20, 8, 15, 0));

Deno.test(
  "dados inválidos: skip de grupo quando target_pct fora de faixa",
  () => {
    const settings: SettingRow[] = [
      {
        user_id: "u1",
        transportadora: null,
        target_pct: 0,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u2",
        transportadora: "JADLOG",
        target_pct: 120,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u3",
        transportadora: null,
        target_pct: NaN,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u4",
        transportadora: null,
        target_pct: 80,
        consecutive_days_alert: 0,
      },
      {
        user_id: "",
        transportadora: null,
        target_pct: 80,
        consecutive_days_alert: 3,
      },
    ];
    const res = evaluate(settings, {
      now: T,
      existing: [],
      breachDaysFor: () => 10,
    });
    assertEquals(res.inserted, 0);
    assertEquals(res.updated, 0);
    assertEquals(res.skipped, 5);
    assert(res.actions.every((a) => a.kind === "skip_group"));
  },
);

Deno.test(
  "breach RPC devolve valores hostis (negativo, NaN, string) → tratado como 0",
  () => {
    const values: number[] = [-5, NaN, Infinity, 0.4, 2];
    for (const v of values) {
      const settings: SettingRow[] = [
        {
          user_id: "u1",
          transportadora: null,
          target_pct: 80,
          consecutive_days_alert: 3,
        },
      ];
      const res = evaluate(settings, {
        now: T,
        existing: [],
        breachDaysFor: () => v,
      });
      assertEquals(res.inserted, 0, `valor ${v} não deve gerar insert`);
      assertEquals(res.actions[0].kind, "skip_below_threshold");
    }
  },
);

// ---------------------------------------------------------------------------
// Consistência de streaks
// ---------------------------------------------------------------------------
Deno.test("streak igual à meta gera insert", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
  ];
  const res = evaluate(settings, {
    now: T,
    existing: [],
    breachDaysFor: () => 3,
  });
  assertEquals(res.inserted, 1);
});

Deno.test("streak menor que meta → skip_below_threshold", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 5,
    },
  ];
  const res = evaluate(settings, {
    now: T,
    existing: [],
    breachDaysFor: () => 2,
  });
  assertEquals(res.inserted, 0);
  assertEquals(res.actions[0].kind, "skip_below_threshold");
});

Deno.test("mesma assinatura na janela de 24h → skip_signature", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
  ];
  const existing: NotificationRow[] = [
    {
      id: "n-existing",
      user_id: "u1",
      created_at: new Date(T.getTime() - 3600_000).toISOString(),
      read: false,
      metadata: {
        source: "accuracy-meta-monitor",
        carrier: "JADLOG",
        target_pct: 80,
        breach_days: 4,
      },
    },
  ];
  const res = evaluate(settings, { now: T, existing, breachDaysFor: () => 4 });
  assertEquals(res.skipped, 1);
  assertEquals(res.actions[0].kind, "skip_signature");
});

Deno.test("streak evoluiu dentro de 24h → update do registro existente", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
  ];
  const existing: NotificationRow[] = [
    {
      id: "n-existing",
      user_id: "u1",
      created_at: new Date(T.getTime() - 5 * 3600_000).toISOString(),
      read: true,
      metadata: {
        source: "accuracy-meta-monitor",
        carrier: "JADLOG",
        target_pct: 80,
        breach_days: 4,
      },
    },
  ];
  const res = evaluate(settings, { now: T, existing, breachDaysFor: () => 6 });
  assertEquals(res.updated, 1);
  assertEquals(res.actions[0].kind, "update");
  assertEquals(res.actions[0].target_id, "n-existing");
});

Deno.test("registros com > 24h não interferem no dedup", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
  ];
  const existing: NotificationRow[] = [
    {
      id: "old",
      user_id: "u1",
      created_at: new Date(T.getTime() - WINDOW_MS - 60_000).toISOString(),
      read: true,
      metadata: {
        source: "accuracy-meta-monitor",
        carrier: "JADLOG",
        target_pct: 80,
        breach_days: 6,
      },
    },
  ];
  const res = evaluate(settings, { now: T, existing, breachDaysFor: () => 6 });
  assertEquals(res.inserted, 1);
});

Deno.test(
  "carrier null persistido tanto como null quanto __all__ é reconhecido",
  () => {
    const settings: SettingRow[] = [
      {
        user_id: "u1",
        transportadora: null,
        target_pct: 80,
        consecutive_days_alert: 3,
      },
    ];
    const existing: NotificationRow[] = [
      {
        id: "legado",
        user_id: "u1",
        created_at: new Date(T.getTime() - 3600_000).toISOString(),
        read: false,
        metadata: {
          source: "accuracy-meta-monitor",
          carrier: null,
          target_pct: 80,
          breach_days: 5,
        },
      },
    ];
    const res = evaluate(settings, {
      now: T,
      existing,
      breachDaysFor: () => 5,
    });
    assertEquals(res.skipped, 1);
    assertEquals(res.actions[0].kind, "skip_signature");
  },
);

Deno.test(
  "settings duplicadas do mesmo grupo → apenas primeira processa",
  () => {
    const settings: SettingRow[] = [
      {
        user_id: "u1",
        transportadora: "JADLOG",
        target_pct: 80,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u1",
        transportadora: "JADLOG",
        target_pct: 80,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u1",
        transportadora: "JADLOG",
        target_pct: 80,
        consecutive_days_alert: 3,
      },
    ];
    const res = evaluate(settings, {
      now: T,
      existing: [],
      breachDaysFor: () => 4,
    });
    assertEquals(res.groups, 1);
    assertEquals(res.inserted, 1);
    assertEquals(res.skipped, 2);
  },
);

Deno.test("isolamento entre usuários e transportadoras", () => {
  const settings: SettingRow[] = [
    {
      user_id: "u1",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
    {
      user_id: "u2",
      transportadora: "JADLOG",
      target_pct: 80,
      consecutive_days_alert: 3,
    },
    {
      user_id: "u1",
      transportadora: "AZUL",
      target_pct: 90,
      consecutive_days_alert: 3,
    },
  ];
  const existing: NotificationRow[] = [
    {
      id: "outro-user",
      user_id: "u2",
      created_at: new Date(T.getTime() - 3600_000).toISOString(),
      read: false,
      metadata: {
        source: "accuracy-meta-monitor",
        carrier: "JADLOG",
        target_pct: 80,
        breach_days: 5,
      },
    },
  ];
  const res = evaluate(settings, { now: T, existing, breachDaysFor: () => 5 });
  // u1/JADLOG insert, u2/JADLOG skip_signature, u1/AZUL insert
  assertEquals(res.inserted, 2);
  assertEquals(res.skipped, 1);
});

// ---------------------------------------------------------------------------
// Simulação em larga escala — 500 cenários aleatórios
// ---------------------------------------------------------------------------
Deno.test("500 cenários aleatórios preservam invariantes de dedup", () => {
  const rand = mulberry32(20260720);
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (let scenario = 0; scenario < 500; scenario++) {
    const settingsCount = 1 + Math.floor(rand() * 8);
    const settings: SettingRow[] = Array.from(
      { length: settingsCount },
      () => ({
        user_id: pick(rand, USERS),
        transportadora: pick(rand, CARRIERS),
        target_pct: 60 + Math.floor(rand() * 35),
        consecutive_days_alert: 1 + Math.floor(rand() * 5),
      }),
    );

    const existingCount = Math.floor(rand() * 6);
    const existing: NotificationRow[] = Array.from(
      { length: existingCount },
      (_, i) => {
        const carrier = pick(rand, CARRIERS);
        const ageHours = rand() * 48; // pode estar fora da janela
        return {
          id: `n-${scenario}-${i}`,
          user_id: pick(rand, USERS),
          created_at: new Date(T.getTime() - ageHours * 3600_000).toISOString(),
          read: rand() > 0.5,
          metadata: {
            source: "accuracy-meta-monitor",
            carrier: carrier ?? "__all__",
            target_pct: 60 + Math.floor(rand() * 35),
            breach_days: 1 + Math.floor(rand() * 10),
          },
        };
      },
    );

    const breachTable = new Map<string, number>();
    for (const s of settings) {
      const key = `${s.user_id}::${s.transportadora ?? "__all__"}::${s.target_pct}`;
      if (!breachTable.has(key)) {
        breachTable.set(key, Math.floor(rand() * 10));
      }
    }

    const res = evaluate(settings, {
      now: T,
      existing,
      breachDaysFor: (s) =>
        breachTable.get(
          `${s.user_id}::${s.transportadora ?? "__all__"}::${s.target_pct}`,
        ) ?? 0,
    });

    // Invariantes:
    // 1. Sem grupo processado mais de uma vez (insert + update) → conta bate.
    const insertUpdateGroups = new Set<string>();
    for (const a of res.actions) {
      if (a.kind === "insert" || a.kind === "update") {
        const key = `${a.user_id}::${a.carrier_tag}`;
        assert(
          !insertUpdateGroups.has(key),
          `duplicidade em cenário ${scenario} (${key})`,
        );
        insertUpdateGroups.add(key);
      }
    }
    assertEquals(insertUpdateGroups.size, res.inserted + res.updated);

    // 2. Groups >= inserted + updated e <= settings.length
    assert(res.groups >= res.inserted + res.updated);
    assert(res.groups <= settings.length);

    // 3. Soma das ações == total de settings
    assertEquals(res.actions.length, settings.length);

    totalInserted += res.inserted;
    totalUpdated += res.updated;
    totalSkipped += res.skipped;
  }

  // Sanity: em 500 cenários aleatórios ao menos algum insert e algum update devem ocorrer.
  assert(totalInserted > 0, "esperava ao menos 1 insert em 500 cenários");
  assert(totalSkipped > 0, "esperava ao menos 1 skip em 500 cenários");
});

Deno.test(
  "idempotência: rodar 2x com mesmas existing produz apenas skip_signature na 2ª",
  () => {
    const settings: SettingRow[] = [
      {
        user_id: "u1",
        transportadora: "JADLOG",
        target_pct: 80,
        consecutive_days_alert: 3,
      },
      {
        user_id: "u1",
        transportadora: null,
        target_pct: 90,
        consecutive_days_alert: 2,
      },
      {
        user_id: "u2",
        transportadora: "AZUL",
        target_pct: 75,
        consecutive_days_alert: 3,
      },
    ];
    const breach = (s: SettingRow) => (s.user_id === "u1" ? 5 : 4);

    const run1 = evaluate(settings, {
      now: T,
      existing: [],
      breachDaysFor: breach,
    });
    assertEquals(run1.inserted, 3);

    // Materializa notifications a partir das ações de insert.
    const materialized: NotificationRow[] = run1.actions
      .filter((a) => a.kind === "insert")
      .map((a, idx) => ({
        id: `run1-${idx}`,
        user_id: a.user_id,
        created_at: new Date(T.getTime() - 60_000).toISOString(),
        read: false,
        metadata: {
          source: "accuracy-meta-monitor",
          carrier: a.carrier_tag,
          target_pct: a.target_pct,
          breach_days: a.breach_days,
        },
      }));

    const run2 = evaluate(settings, {
      now: T,
      existing: materialized,
      breachDaysFor: breach,
    });
    assertEquals(run2.inserted, 0);
    assertEquals(run2.updated, 0);
    assertEquals(run2.skipped, 3);
  },
);

// ---------------------------------------------------------------------------
// Sprint P #10 — resolveChannels (email / WhatsApp)
// ---------------------------------------------------------------------------
import { resolveChannels } from "./simulator.ts";

const baseSetting = (over: Partial<SettingRow> = {}): SettingRow => ({
  user_id: "u1",
  transportadora: null,
  target_pct: 80,
  consecutive_days_alert: 3,
  notify_email: false,
  notify_whatsapp: false,
  email: null,
  whatsapp_phone: null,
  ...over,
});

Deno.test(
  "resolveChannels: toggles desligados retornam null mesmo com credenciais",
  () => {
    const r = resolveChannels(
      baseSetting({ email: "a@b.co", whatsapp_phone: "11999998888" }),
    );
    assertEquals(r, { email: null, whatsapp: null });
  },
);

Deno.test("resolveChannels: email inválido é rejeitado", () => {
  const r = resolveChannels(
    baseSetting({ notify_email: true, email: "sem-arroba" }),
  );
  assertEquals(r.email, null);
});

Deno.test("resolveChannels: email válido é normalizado (trim)", () => {
  const r = resolveChannels(
    baseSetting({ notify_email: true, email: "  ops@corp.io " }),
  );
  assertEquals(r.email, "ops@corp.io");
});

Deno.test("resolveChannels: telefone curto demais é rejeitado", () => {
  const r = resolveChannels(
    baseSetting({ notify_whatsapp: true, whatsapp_phone: "1199" }),
  );
  assertEquals(r.whatsapp, null);
});

Deno.test(
  "resolveChannels: telefone com máscara é normalizado para dígitos",
  () => {
    const r = resolveChannels(
      baseSetting({ notify_whatsapp: true, whatsapp_phone: "(11) 99999-8888" }),
    );
    assertEquals(r.whatsapp, "11999998888");
  },
);

Deno.test("resolveChannels: telefone > 15 dígitos é rejeitado", () => {
  const r = resolveChannels(
    baseSetting({ notify_whatsapp: true, whatsapp_phone: "1".repeat(16) }),
  );
  assertEquals(r.whatsapp, null);
});

Deno.test("resolveChannels: ambos canais habilitados retornam ambos", () => {
  const r = resolveChannels(
    baseSetting({
      notify_email: true,
      notify_whatsapp: true,
      email: "a@b.co",
      whatsapp_phone: "+55 11 99999-8888",
    }),
  );
  assert(r.email !== null);
  assert(r.whatsapp !== null);
});

Deno.test(
  "resolveChannels: fuzz 500 combinações — nunca lança e sempre respeita toggle",
  () => {
    const rand = mulberry32(0xc4a11e1);
    for (let i = 0; i < 500; i++) {
      const s = baseSetting({
        notify_email: rand() > 0.5,
        notify_whatsapp: rand() > 0.5,
        email:
          rand() > 0.3
            ? pick(rand, ["a@b.co", "x", "", "  y@z.io ", null])
            : null,
        whatsapp_phone:
          rand() > 0.3
            ? pick(rand, [
                "11999998888",
                "abc",
                "(11) 9 9999-8888",
                "1",
                "9".repeat(20),
                null,
              ])
            : null,
      });
      const r = resolveChannels(s);
      if (!s.notify_email) assertEquals(r.email, null);
      if (!s.notify_whatsapp) assertEquals(r.whatsapp, null);
      if (r.whatsapp) assert(/^\d{10,15}$/.test(r.whatsapp));
      if (r.email) assert(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email));
    }
  },
);
