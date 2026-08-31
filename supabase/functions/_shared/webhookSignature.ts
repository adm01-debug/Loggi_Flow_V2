// Verifies an HMAC-SHA256 (hex) signature of the raw request payload.
// FAIL-CLOSED: if the secret env var is not configured, verification returns
// false so no unauthenticated write is ever accepted in production.
// Test-mode bypass requires the SERVER-SIDE env var ALLOW_TEST_MODE=true
// combined with the header `x-test-mode: true`. Header alone is NOT enough.
import { log } from "./logger.ts";

export async function verifyWebhookHmac(
  payload: string,
  signature: string,
  secretEnvVar: string,
): Promise<boolean> {
  const secret = Deno.env.get(secretEnvVar);
  if (!secret) {
    log.error(`${secretEnvVar} missing — refusing webhook (fail-closed)`);
    return false;
  }
  if (!signature) {
    log.warn(`Missing signature header for ${secretEnvVar}`);
    return false;
  }

  try {
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const computed = Array.from(new Uint8Array(sigBuf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Constant-time comparison
    if (computed.length !== signature.length) return false;
    let diff = 0;
    for (let i = 0; i < computed.length; i++) {
      diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
    }
    return diff === 0;
  } catch (e) {
    log.error("Signature verification error", { error: (e as Error).message });
    return false;
  }
}
