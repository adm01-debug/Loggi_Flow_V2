// P11: Secure store — AES-GCM encrypt/decrypt endpoint for PII at rest (LGPD).
// Requires authenticated user; never logs plaintext.
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { encryptField, decryptField } from "../_shared/crypto.ts";
import { checkRateLimit } from "../_shared/rateLimiter.ts";
import { log } from "../_shared/logger.ts";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const headers = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }
  try {
    const rl = await checkRateLimit(req, "secure-store", {
      maxRequests: 60,
      windowMs: 60_000,
    });
    if (!rl.allowed) {
      return new Response(JSON.stringify({ error: "rate_limited" }), {
        status: 429,
        headers: {
          ...headers,
          "Content-Type": "application/json",
          "Retry-After": String(rl.retryAfter ?? 60),
        },
      });
    }

    const authHeader = req.headers.get("Authorization") || "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: claims, error: authErr } = await supabase.auth.getClaims(
      authHeader.replace("Bearer ", ""),
    );
    if (authErr || !claims?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { action, value } = body ?? {};
    if (typeof value !== "string" || value.length === 0 || value.length > 8192) {
      return new Response(JSON.stringify({ error: "invalid_value" }), {
        status: 400,
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }

    if (action === "encrypt") {
      const ciphertext = await encryptField(value);
      return new Response(JSON.stringify({ ciphertext }), {
        headers: { ...headers, "Content-Type": "application/json" },
      });
    }
    if (action === "decrypt") {
      try {
        const plaintext = await decryptField(value);
        return new Response(JSON.stringify({ plaintext }), {
          headers: { ...headers, "Content-Type": "application/json" },
        });
      } catch {
        return new Response(JSON.stringify({ error: "decrypt_failed" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }
    }
    return new Response(JSON.stringify({ error: "invalid_action" }), {
      status: 400,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  } catch (e) {
    log.error("secure-store error", { error: (e as Error).message });
    return new Response(JSON.stringify({ error: "internal_error" }), {
      status: 500,
      headers: { ...headers, "Content-Type": "application/json" },
    });
  }
});
