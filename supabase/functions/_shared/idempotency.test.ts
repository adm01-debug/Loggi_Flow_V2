// Etapa 280 — trava a idempotência atômica dos webhooks (achados B-01 e B-02).
// O helper grava primeiro e trata violação de unicidade (23505) — sem consulta antes.
// Roda com: deno test -A supabase/functions/_shared/idempotency.test.ts
import {
  assertEquals,
  assertNotEquals,
} from "https://deno.land/std@0.168.0/testing/asserts.ts";

type Modo = "ok" | "dup" | "boom";
let modo: Modo = "ok";
let ultimaRequisicao: { metodo: string; caminho: string } | null = null;

const servidor = Deno.serve({ port: 0, onListen: () => {} }, (req) => {
  const url = new URL(req.url);
  ultimaRequisicao = { metodo: req.method, caminho: url.pathname };
  if (modo === "ok") return new Response(null, { status: 201 });
  if (modo === "dup") {
    return new Response(
      JSON.stringify({
        code: "23505",
        message:
          'duplicate key value violates unique constraint "idempotency_keys_idempotency_key_key"',
        details: null,
        hint: null,
      }),
      { status: 409, headers: { "Content-Type": "application/json" } },
    );
  }
  return new Response(
    JSON.stringify({ code: "XX000", message: "banco indisponível" }),
    {
      status: 500,
      headers: { "Content-Type": "application/json" },
    },
  );
});

Deno.env.set("SUPABASE_URL", `http://127.0.0.1:${servidor.addr.port}`);
Deno.env.set("SUPABASE_SERVICE_ROLE_KEY", "test-key");

const { claimIdempotencyKey } = await import("./idempotency.ts");

Deno.test(
  "primeira entrega do evento é processada e grava a chave antes de tudo",
  async () => {
    modo = "ok";
    ultimaRequisicao = null;
    const r = await claimIdempotencyKey("stripe", "evt_1");
    assertEquals(r, { duplicate: false, key: "stripe:evt_1" });
    assertNotEquals(
      ultimaRequisicao,
      null,
      "o helper precisa gravar a chave (não só consultar)",
    );
    assertEquals(ultimaRequisicao!.metodo, "POST");
    assertEquals(ultimaRequisicao!.caminho.includes("idempotency_keys"), true);
  },
);

Deno.test(
  "violação de unicidade (23505) vira duplicata, sem erro",
  async () => {
    modo = "dup";
    const r = await claimIdempotencyKey("stripe", "evt_1");
    assertEquals(r, { duplicate: true, key: "stripe:evt_1" });
  },
);

Deno.test(
  "erro de infraestrutura não é confundido com duplicata (fail-open, sem lançar)",
  async () => {
    modo = "boom";
    const r = await claimIdempotencyKey("stripe", "evt_2");
    assertEquals(r, { duplicate: false, key: "stripe:evt_2" });
  },
);

Deno.test("helper não inventa identificador de reserva (B-02)", async () => {
  modo = "ok";
  const semId = await claimIdempotencyKey("stripe", "");
  assertEquals(
    semId.key,
    "stripe:",
    "fallback silencioso colapsaria todos os eventos sem id",
  );
  const comId = await claimIdempotencyKey("stripe", "evt_3");
  assertEquals(comId.key, "stripe:evt_3");
});

Deno.test("servidor de teste encerrado", async () => {
  await servidor.shutdown();
});
