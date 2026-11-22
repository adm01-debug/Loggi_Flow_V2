// P15: Deno test — carrier-webhook-receiver fail-closed HMAC
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { mapCarrierStatus } from "./index.ts";

const SUPABASE_URL =
  Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";
const FN_URL = `${SUPABASE_URL}/functions/v1/carrier-webhook-receiver`;

Deno.test("carrier-webhook-receiver: OPTIONS ok", async () => {
  const res = await fetch(FN_URL, {
    method: "OPTIONS",
    headers: { apikey: ANON },
  });
  await res.text();
  assertEquals(res.status === 200 || res.status === 204, true);
});

Deno.test("carrier-webhook-receiver: rejects unsigned POST", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ carrier_id: "x", event_type: "delivered" }),
  });
  await res.text();
  assertEquals([401, 429].includes(res.status), true);
});

Deno.test("carrier-webhook-receiver: rejects invalid signature", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      "x-webhook-signature": "deadbeef",
    },
    body: JSON.stringify({ carrier_id: "x", event_type: "delivered" }),
  });
  await res.text();
  assertEquals([401, 429].includes(res.status), true);
});

// P24: mapeamento de status do webhook genérico → enum entrega_status (sem rede)
Deno.test(
  "mapCarrierStatus: mapeia status genéricos para o enum entrega_status",
  () => {
    assertEquals(mapCarrierStatus("DELIVERED"), "entregue");
    assertEquals(mapCarrierStatus("entregue"), "entregue");
    assertEquals(mapCarrierStatus("em transito"), "em_transito");
    assertEquals(mapCarrierStatus("out_for_delivery"), "saiu_entrega");
    assertEquals(mapCarrierStatus("despachado"), "despachado");
    assertEquals(mapCarrierStatus("finalizada"), "finalizado");
    assertEquals(mapCarrierStatus("ocorrencia registrada"), "ocorrencia");
    assertEquals(
      mapCarrierStatus("aguardando_producao"),
      "aguardando_producao",
    );
    assertEquals(mapCarrierStatus("algo-desconhecido"), null);
  },
);
