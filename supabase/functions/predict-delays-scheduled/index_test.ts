// Smoke test — predict-delays-scheduled
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assert, assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("predict-delays-scheduled: never leaks secrets and never 5xx to anon", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/predict-delays-scheduled`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({}),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/LOVABLE_API_KEY|service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(body));
});
