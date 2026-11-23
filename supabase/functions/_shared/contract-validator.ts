import { ValidationError } from "./validate.ts";
import { log } from "../_shared/logger.ts";

/**
 * Enhanced contract validator for Edge Functions and Webhooks.
 * Logs validation attempts to the database for auditing and monitoring.
 */
export async function validateContract(
  supabaseClient: any,
  entityName: string,
  payload: any,
  validator: (payload: any) => void
): Promise<{ isValid: boolean; errors?: string[] }> {
  const startTime = Date.now();
  let isValid = true;
  let errors: string[] = [];

  try {
    validator(payload);
  } catch (err) {
    isValid = false;
    if (err instanceof ValidationError) {
      errors.push(`${err.field}: ${err.message}`);
    } else if (err instanceof Error) {
      errors.push(err.message);
    } else {
      errors.push(String(err));
    }
  }

  const latencyMs = Date.now() - startTime;

  // Etapa 015: gravar hash do payload em vez do corpo bruto (LGPD/privacidade)
  let payloadHash: string | null = null;
  try {
    const raw = JSON.stringify(payload);
    const digest = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(raw),
    );
    payloadHash = Array.from(new Uint8Array(digest))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  } catch {
    // best-effort — não bloqueia o fluxo principal
  }

  // Fire and forget logging (don't block the main flow if logging fails)
  supabaseClient
    .from("contract_test_logs")
    .insert({
      entity_name: entityName,
      payload_hash: payloadHash,
      // payload propositalmente omitido — coluna mantida por compatibilidade mas não populada
      is_valid: isValid,
      errors: errors.length > 0 ? errors : null,
      latency_ms: latencyMs
    })
    .then(({ error }: any) => {
      if (error) log.error("Failed to log contract test:", error);
    });

  return { isValid, errors };
}
