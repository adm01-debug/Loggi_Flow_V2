// P15: smoke test — geocode-address
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("geocode-address: rejects invalid payload without 5xx / no mapbox leak", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/geocode-address`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ __fuzz__: true }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/MAPBOX_PUBLIC_TOKEN|sk\.[A-Za-z0-9]+/i.test(body));
});
