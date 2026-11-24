// Shared idempotency helper backed by public.idempotency_keys.
// Ensures webhook receivers process each (provider, event_id) exactly once.
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { log } from "./logger.ts";

let cached: SupabaseClient | null = null;
function getServiceClient(): SupabaseClient {
  if (cached) return cached;
  cached = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );
  return cached;
}

export interface IdempotencyResult {
  duplicate: boolean;
  key: string;
}

/**
 * Claim an idempotency key. Returns `{ duplicate: true }` if the same
 * (provider, event_id) was already processed. Fail-open on infra errors:
 * if the DB write fails we still let the caller process — safer to double-
 * process than to drop a webhook silently. Errors are logged.
 */
export async function claimIdempotencyKey(
  provider: string,
  eventId: string,
): Promise<IdempotencyResult> {
  const key = `${provider}:${eventId}`;
  try {
    const supabase = getServiceClient();
    const { error } = await supabase
      .from("idempotency_keys")
      .insert({ provider, idempotency_key: key });

    if (!error) return { duplicate: false, key };

    // 23505 = unique_violation → already processed
    // deno-lint-ignore no-explicit-any
    const code = (error as any).code;
    if (code === "23505") {
      log.info("idempotency: duplicate webhook", { provider, eventId });
      return { duplicate: true, key };
    }
    log.warn("idempotency: insert failed, proceeding", {
      provider,
      eventId,
      error: error.message,
    });
    return { duplicate: false, key };
  } catch (e) {
    log.warn("idempotency: exception, proceeding", {
      provider,
      eventId,
      error: (e as Error).message,
    });
    return { duplicate: false, key };
  }
}

// Etapa 138 - chave deterministica de evento, compartilhada pelos webhooks.
export { bodyHash, buildEventKey } from "./eventKey.ts";
export type { EventKey, EventKeyPart } from "./eventKey.ts";
