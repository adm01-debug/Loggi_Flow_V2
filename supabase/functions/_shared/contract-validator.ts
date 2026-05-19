import { ValidationError } from "./validate.ts";

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

  // Fire and forget logging (don't block the main flow if logging fails)
  supabaseClient
    .from("contract_test_logs")
    .insert({
      entity_name: entityName,
      payload: payload,
      is_valid: isValid,
      errors: errors.length > 0 ? errors : null,
      latency_ms: latencyMs
    })
    .then(({ error }: any) => {
      if (error) console.error("Failed to log contract test:", error);
    });

  return { isValid, errors };
}
