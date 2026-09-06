// P15: smoke test — resend-email must never leak API key
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("resend-email: rejects invalid payload without leaking API key", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/resend-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ to: "x", subject: "", html: "" }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/re_[A-Za-z0-9]{10,}/.test(body), "response leaked Resend API key");
  assert(!/RESEND_API_KEY/.test(body));
});

Deno.test("resend-email: request sem auth retorna 401", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/resend-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ to: "x@example.com", subject: "t", html: "<p>t</p>" }),
  });
  await res.text();
  assertEquals(res.status, 401);
});
