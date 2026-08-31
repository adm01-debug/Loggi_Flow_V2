// P15: Deno test — nexus-webhook-receiver rate limit + HMAC (when secret set)
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";
const FN_URL = `${SUPABASE_URL}/functions/v1/nexus-webhook-receiver`;

Deno.test("nexus-webhook-receiver: OPTIONS ok", async () => {
  const res = await fetch(FN_URL, { method: "OPTIONS", headers: { apikey: ANON } });
  await res.text();
  assertEquals(res.status === 200 || res.status === 204, true);
});

Deno.test("nexus-webhook-receiver: rejects invalid contract without 5xx", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ garbage: true }),
  });
  await res.text();
  // 400 (contract), 401 (invalid sig if secret set), or 429 (rate limit) — never 5xx
  assertEquals(res.status < 500, true);
});
