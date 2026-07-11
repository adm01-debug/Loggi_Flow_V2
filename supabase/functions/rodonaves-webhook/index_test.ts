// P15: Deno test for rodonaves-webhook — validates fail-closed HMAC behavior
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";
const FN_URL = `${SUPABASE_URL}/functions/v1/rodonaves-webhook`;

Deno.test("rodonaves-webhook: rejects unsigned POST", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ nf_numero: "123", status_code: "1" }),
  });
  await res.text();
  assertEquals([401, 429].includes(res.status), true);
});
