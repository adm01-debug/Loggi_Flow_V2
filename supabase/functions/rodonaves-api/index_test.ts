// Carrega o .env local quando existir: o smoke test do endpoint precisa das
// variaveis, mas a ausencia do arquivo nao deve derrubar os testes unitarios.
try {
  const { config } = await import(
    "https://deno.land/std@0.208.0/dotenv/mod.ts"
  );
  config({ export: true, allowEmptyValues: true });
} catch {
  // sem .env: vale o que ja estiver exportado no ambiente
}
import {
  assert,
  assertEquals,
  assertRejects,
} from "https://deno.land/std@0.208.0/assert/mod.ts";
import {
  blockedPayload,
  isScopeBlockedError,
  mapWithLimit,
  withFallback,
  withFallbackMeta,
} from "./fallback.ts";

const blocked = () =>
  Promise.reject(Object.assign(new Error("GET failed"), {
    code: "RTE_SCOPE_BLOCKED",
  }));

Deno.test("withFallback: 403 usa a rota alternativa e marca o payload", async () => {
  const result = await withFallback(blocked, {
    fallback: "delivery-proof",
    note: "sem compressão bloqueado",
  }, () => Promise.resolve({ Data: "ok" })) as Record<string, unknown>;

  assertEquals(result.Data, "ok");
  assertEquals(result._fallback, "delivery-proof");
  assertEquals(result._note, "sem compressão bloqueado");
});

Deno.test("withFallback: 403 sem alternativa devolve payload orientativo", async () => {
  const result = await withFallback(blocked, {
    fallback: "local",
    note: "exige liberação comercial",
  }) as Record<string, unknown>;

  assertEquals(result._status, 403);
  assertEquals(result._note, "exige liberação comercial");
});

Deno.test("withFallback: erro que não é 403 continua subindo", async () => {
  await assertRejects(
    () =>
      withFallback(
        () => Promise.reject(Object.assign(new Error("boom"), { code: "RTE_TIMEOUT" })),
        { fallback: "x", note: "y" },
        () => Promise.resolve(1),
      ),
    Error,
    "boom",
  );
});

Deno.test("withFallbackMeta: lista vai em data para não perder registros", () => {
  const payload = withFallbackMeta([{ id: 1 }], {
    fallback: "delivery-proof",
    note: "lote bloqueado",
  });
  assertEquals(payload.data, [{ id: 1 }]);
  assertEquals(payload._fallback, "delivery-proof");
});

Deno.test("mapWithLimit: respeita o limite e preserva a ordem", async () => {
  let running = 0;
  let peak = 0;
  const out = await mapWithLimit([1, 2, 3, 4, 5, 6], 2, async (n) => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, 5));
    running -= 1;
    return n * 2;
  });

  assertEquals(out, [2, 4, 6, 8, 10, 12]);
  assertEquals(peak <= 2, true);
});

Deno.test("blockedPayload e isScopeBlockedError", () => {
  assertEquals(blockedPayload({ fallback: "a", note: "b" })._status, 403);
  assertEquals(isScopeBlockedError({ code: "RTE_SCOPE_BLOCKED" }), true);
  assertEquals(isScopeBlockedError({ code: "RTE_TIMEOUT" }), false);
  assertEquals(isScopeBlockedError(null), false);
});

// ===== P15: smoke test do endpoint publicado (preservado) =====
const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("rodonaves-api: rejects invalid payload without 5xx / no secret leak", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/rodonaves-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ __fuzz__: true }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/RODONAVES_CNPJ_REMETENTE|service_role/i.test(body));
});
