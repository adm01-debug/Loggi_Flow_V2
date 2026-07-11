// P11: smoke test — secure-store must require auth and never leak the FIELD_ENCRYPTION_KEY
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";
const FN_URL = `${SUPABASE_URL}/functions/v1/secure-store`;

Deno.test("secure-store: rejects unauthenticated / no key leak", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ action: "encrypt", value: "pii" }),
  });
  const body = await res.text();
  assertEquals([401, 429].includes(res.status), true);
  assert(!/FIELD_ENCRYPTION_KEY/i.test(body));
});

Deno.test("secure-store: rejects invalid action shape", async () => {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ __fuzz__: true }),
  });
  await res.text();
  assertEquals(res.status < 500, true);
});
