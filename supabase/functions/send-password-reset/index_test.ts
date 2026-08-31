// P15: smoke test — send-password-reset must not leak Resend API key
import "https://deno.land/std@0.208.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.208.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL") ?? "http://localhost:54321";
const ANON = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY") ?? "anon";

Deno.test("send-password-reset: rejects invalid payload without leaking secrets", async () => {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/send-password-reset`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: ANON },
    body: JSON.stringify({ email: "" }),
  });
  const body = await res.text();
  assertEquals(res.status < 500, true);
  assert(!/re_[A-Za-z0-9]{10,}/.test(body));
  assert(!/RESEND_API_KEY|service_role/i.test(body));
});
