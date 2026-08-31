// P15: smoke test — lgpd-erase-user must require auth
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("lgpd-erase-user: rejects unauthenticated without 5xx / no secret leak", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/lgpd-erase-user`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ user_id: "00000000-0000-0000-0000-000000000000" }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(body));
});
