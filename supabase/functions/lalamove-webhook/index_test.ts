// P15: Deno test for lalamove-webhook — validates fail-closed HMAC behavior
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";
const FN_URL = `${SUPABASE_URL}/functions/v1/lalamove-webhook`;

Deno.test("lalamove-webhook: OPTIONS returns 200/204", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS", headers: { apikey: ANON } });
  await res.text();
  assertEquals(res.status === 200 || res.status === 204, true);
});

Deno.test("lalamove-webhook: rejects unsigned POST (fail-closed)", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ orderId: "abc", status: "COMPLETED" }),
  });
  await res.text();
  // Either 401 (invalid signature) or 429 (rate-limited) — both are safe outcomes.
  assertEquals([401, 429].includes(res.status), true);
});

Deno.test("lalamove-webhook: rejects wrong method", async () => {
  const res = await fetch(FN_URL, { method: "GET", headers: { apikey: ANON } });
  await res.text();
  assertEquals([401, 405, 429].includes(res.status), true);
});
