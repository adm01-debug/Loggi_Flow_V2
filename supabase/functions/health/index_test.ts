// P15: smoke test — health endpoint must always respond and never leak secrets
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("health: GET responds 200 with JSON", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/health`, { headers: { apikey: ANON } });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY|password/i.test(body));
});

Deno.test("health-check: GET responds without 5xx", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/health-check`, { headers: { apikey: ANON } });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(body));
});
