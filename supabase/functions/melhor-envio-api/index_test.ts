// P15: smoke test — melhor-envio-api public endpoint
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("melhor-envio-api: rejects invalid action without 5xx", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/melhor-envio-api`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ action: "__invalid__" }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY|MELHOR_ENVIO_TOKEN/i.test(body));
});
