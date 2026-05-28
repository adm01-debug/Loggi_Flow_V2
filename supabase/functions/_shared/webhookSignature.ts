// Verifies an HMAC-SHA256 (hex) signature of the raw request payload.
// Safe rollout: when the secret env var is not configured, verification is
// skipped (returns true) so the integration is not broken before the secret is
// set. Once the secret is configured, a valid signature is required.
export async function verifyWebhookHmac(
  payload: string,
  signature: string,
  secretEnvVar: string,
): Promise<boolean> {
  const secret = Deno.env.get(secretEnvVar);
  if (!secret) {
    console.warn(
      `${secretEnvVar} não configurado, pulando verificação de assinatura`,
    );
    return true;
  }
  if (!signature) return false;

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
    console.error("Signature verification error:", e);
    return false;
  }
}
