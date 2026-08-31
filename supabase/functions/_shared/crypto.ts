// AES-GCM field-level encryption at rest.
// Uses FIELD_ENCRYPTION_KEY (>=32 chars) from env. Fail-closed if missing.
// Ciphertext format: base64(iv[12] || ciphertext || tag)

const ALG = { name: "AES-GCM", length: 256 } as const;

async function getKey(): Promise<CryptoKey> {
  const raw = Deno.env.get("FIELD_ENCRYPTION_KEY");
  if (!raw || raw.length < 32) {
    throw new Error("FIELD_ENCRYPTION_KEY missing or too short (fail-closed)");
  }
  const keyBytes = new TextEncoder().encode(raw).slice(0, 32);
  return crypto.subtle.importKey("raw", keyBytes, ALG, false, [
    "encrypt",
    "decrypt",
  ]);
}

function b64encode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin);
}

function b64decode(str: string): Uint8Array {
  const bin = atob(str);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptField(plaintext: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      new TextEncoder().encode(plaintext),
    ),
  );
  const buf = new Uint8Array(iv.length + ct.length);
  buf.set(iv, 0);
  buf.set(ct, iv.length);
  return b64encode(buf);
}

export async function decryptField(ciphertext: string): Promise<string> {
  const key = await getKey();
  const buf = b64decode(ciphertext);
  const iv = buf.slice(0, 12);
  const ct = buf.slice(12);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return new TextDecoder().decode(pt);
}
