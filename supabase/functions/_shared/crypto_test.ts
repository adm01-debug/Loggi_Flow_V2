// P11: AES-GCM crypto-at-rest roundtrip
import { assertEquals, assertNotEquals, assertRejects } from "https://deno.land/std@0.208.0/assert/mod.ts";
import { encryptField, decryptField } from "./crypto.ts";

Deno.env.set("FIELD_ENCRYPTION_KEY", "x".repeat(64));

Deno.test("crypto: roundtrip preserves plaintext", async () => {
  const pt = "sensitive-payload:1234@example.com";
  const ct = await encryptField(pt);
  assertNotEquals(ct, pt);
  const back = await decryptField(ct);
  assertEquals(back, pt);
});

Deno.test("crypto: two encryptions produce distinct ciphertexts (random IV)", async () => {
  const a = await encryptField("same");
  const b = await encryptField("same");
  assertNotEquals(a, b);
});

Deno.test("crypto: fail-closed when key missing", async () => {
  const saved = Deno.env.get("FIELD_ENCRYPTION_KEY");
  Deno.env.delete("FIELD_ENCRYPTION_KEY");
  await assertRejects(() => encryptField("x"), Error, "FIELD_ENCRYPTION_KEY");
  if (saved) Deno.env.set("FIELD_ENCRYPTION_KEY", saved);
});
