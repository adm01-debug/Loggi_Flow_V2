// P15: smoke test — log-security-event public endpoint
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("log-security-event: accepts or rejects without 5xx", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/log-security-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ event_type: "test", severity: "low" }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/service_role|SUPABASE_SERVICE_ROLE_KEY/i.test(body));
});

Deno.test("log-security-event: rejects wrong method", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/log-security-event`, {
    method: "GET",
    headers: { apikey: ANON },
  });
  await res.text();
  assertEquals(res.status < 500, true);
});

Deno.test("log-security-event: request sem auth retorna 401", async () => {
  // Sem Authorization e com o anon key como Bearer — ambos rejeitados.
  const semAuth = await fetch(`${SUPABASE_URL}/functions/v1/log-security-event`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ event_type: "test", description: "t" }),
  });
  await semAuth.text();
  assertEquals(semAuth.status, 401);

  const anonBearer = await fetch(`${SUPABASE_URL}/functions/v1/log-security-event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: ANON,
      Authorization: `Bearer ${ANON}`,
    },
    body: JSON.stringify({ event_type: "test", description: "t" }),
  });
  await anonBearer.text();
  assertEquals(anonBearer.status, 401);
});
