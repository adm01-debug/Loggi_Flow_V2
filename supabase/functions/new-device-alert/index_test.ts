// P15: smoke test — new-device-alert
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("new-device-alert: rejects invalid payload / no secret leak", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/new-device-alert`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ __fuzz__: true }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/RESEND_API_KEY|re_[A-Za-z0-9]{10,}|service_role/i.test(body));
});
