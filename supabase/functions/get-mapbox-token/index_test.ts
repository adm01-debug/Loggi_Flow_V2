// P15: smoke test — get-mapbox-token must not leak secret token
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("get-mapbox-token: no secret sk.* token leak / no 5xx", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/get-mapbox-token`, {
    method: "GET",
    headers: { apikey: ANON },
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/sk\.[A-Za-z0-9]+/.test(body), "leaked secret mapbox token");
});
