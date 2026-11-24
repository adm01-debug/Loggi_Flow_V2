// Etapa 279 — trava o fail-closed da assinatura de webhook (achados S-01 e S-05).
// Roda com: deno test -A supabase/functions/_shared/webhookSignature.test.ts
import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";
import { verifyWebhookHmac } from "./webhookSignature.ts";

const SECRET_VAR = "TEST_HMAC_SECRET";
const PAYLOAD = '{"event_id":"evt_1","status":"delivered"}';

async function hmacHex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const buf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

Deno.test(
  "segredo ausente recusa o webhook (fail-closed), mesmo com assinatura plausível",
  async () => {
    Deno.env.delete(SECRET_VAR);
    assertEquals(
      await verifyWebhookHmac(
        PAYLOAD,
        await hmacHex("qualquer", PAYLOAD),
        SECRET_VAR,
      ),
      false,
    );
  },
);

Deno.test("assinatura errada recusa o webhook", async () => {
  Deno.env.set(SECRET_VAR, "segredo-de-teste");
  const valida = await hmacHex("segredo-de-teste", PAYLOAD);
  assertEquals(
    await verifyWebhookHmac(
      PAYLOAD,
      valida.slice(0, -1) + (valida.endsWith("0") ? "1" : "0"),
      SECRET_VAR,
    ),
    false,
  );
  assertEquals(
    await verifyWebhookHmac(
      PAYLOAD,
      await hmacHex("outro-segredo", PAYLOAD),
      SECRET_VAR,
    ),
    false,
  );
  assertEquals(
    await verifyWebhookHmac(`${PAYLOAD} `, valida, SECRET_VAR),
    false,
    "payload alterado não passa",
  );
});

Deno.test(
  "assinatura ausente ou de tamanho diferente recusa o webhook",
  async () => {
    Deno.env.set(SECRET_VAR, "segredo-de-teste");
    assertEquals(await verifyWebhookHmac(PAYLOAD, "", SECRET_VAR), false);
    assertEquals(await verifyWebhookHmac(PAYLOAD, "abc", SECRET_VAR), false);
  },
);

Deno.test("assinatura correta aceita o webhook", async () => {
  Deno.env.set(SECRET_VAR, "segredo-de-teste");
  assertEquals(
    await verifyWebhookHmac(
      PAYLOAD,
      await hmacHex("segredo-de-teste", PAYLOAD),
      SECRET_VAR,
    ),
    true,
  );
});

// A verificação é chamada sem `if (Deno.env.get(...))` em volta: sem esse guarda, o receptor
// aceitava tudo quando o segredo não estava configurado (S-01).
Deno.test(
  "receptores chamam verifyWebhookHmac sem condicionar à existência do segredo",
  async () => {
    const receptores = [
      "nexus-webhook-receiver",
      "lalamove-webhook",
      "rodonaves-webhook",
      "carrier-webhook-receiver",
    ];
    for (const nome of receptores) {
      const src = await Deno.readTextFile(
        new URL(`../${nome}/index.ts`, import.meta.url),
      );
      if (!src.includes("verifyWebhookHmac(")) continue;
      const linhaGuarda = src
        .split("\n")
        .find(
          (l) =>
            l.includes("verifyWebhookHmac(") && l.includes("if (Deno.env.get("),
        );
      assertEquals(
        linhaGuarda,
        undefined,
        `${nome}: verificação condicionada ao segredo existir`,
      );
    }
  },
);

// S-05: o bypass de test-mode exige a variável de servidor, nunca só o header.
Deno.test(
  "bypass de test-mode exige ALLOW_TEST_MODE=true no servidor",
  async () => {
    for (const nome of ["lalamove-webhook", "rodonaves-webhook"]) {
      const src = await Deno.readTextFile(
        new URL(`../${nome}/index.ts`, import.meta.url),
      );
      if (!src.includes("x-test-mode")) continue;
      assertEquals(
        /ALLOW_TEST_MODE['"]\)\s*===\s*['"]true['"]/.test(src),
        true,
        `${nome}: test-mode sem exigir ALLOW_TEST_MODE=true`,
      );
    }
  },
);
