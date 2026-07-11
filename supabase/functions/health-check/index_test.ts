// P15: smoke test — health-check
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("health-check: responds without 5xx / no secret leak", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, {
    method: "GET",
    headers: { apikey: ANON },
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(body));
});
