// Simulador puro de cenários para accuracy-meta-monitor.
// Reproduz a lógica de dedup/streak da edge function sem depender do Supabase,
// permitindo executar centenas de cenários determinísticos em testes Deno.

export interface SettingRow {
  user_id: string;
  transportadora: string | null;
  target_pct: number;
  consecutive_days_alert: number;
  notify_email?: boolean;
  notify_whatsapp?: boolean;
  email?: string | null;
  whatsapp_phone?: string | null;
}

/** Canais externos habilitados para um alerta recém-inserido. */
export interface ExternalChannels {
  email: string | null;
  whatsapp: string | null;
}

/**
 * Resolve canais externos válidos para uma configuração.
 * - Retorna null quando o toggle está desligado, credencial ausente ou inválida.
 * - Email exige formato mínimo `x@y.z`.
 * - WhatsApp exige 10+ dígitos após remover não-numéricos.
 */
export function resolveChannels(s: SettingRow): ExternalChannels {
  const emailRaw = (s.email ?? "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailRaw);
  const phoneDigits = (s.whatsapp_phone ?? "").replace(/\D/g, "");
  const phoneOk = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  return {
    email: s.notify_email && emailOk ? emailRaw : null,
    whatsapp: s.notify_whatsapp && phoneOk ? phoneDigits : null,
  };
}

export interface NotificationRow {
  id: string;
  user_id: string;
  created_at: string; // ISO
  read: boolean;
  metadata: {
    source: string;
    carrier: string | null;
    target_pct: number;
    breach_days: number;
  };
}

export interface EvalContext {
  now: Date;
  breachDaysFor: (s: SettingRow) => number; // simula RPC
  existing: NotificationRow[];
}

export type ActionKind = "skip_group" | "skip_below_threshold" | "skip_signature" | "update" | "insert";

export interface Action {
  kind: ActionKind;
  user_id: string;
  carrier_tag: string;
  target_pct: number;
  breach_days: number;
  target_id?: string;
}

export interface EvalResult {
  groups: number;
  inserted: number;
  updated: number;
  skipped: number;
  actions: Action[];
}

export const WINDOW_MS = 24 * 60 * 60 * 1000;
export const CRON_HOUR_UTC = 8;
export const CRON_MINUTE_UTC = 15;

export function nextCronRun(now: Date): Date {
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    CRON_HOUR_UTC,
    CRON_MINUTE_UTC,
    0,
    0,
  ));
  if (next.getTime() <= now.getTime()) {
    next.setUTCDate(next.getUTCDate() + 1);
  }
  return next;
}

export function evaluate(settings: SettingRow[], ctx: EvalContext): EvalResult {
  const windowStart = ctx.now.getTime() - WINDOW_MS;
  const seen = new Set<string>();
  const actions: Action[] = [];
  let inserted = 0;
  let updated = 0;
  let skipped = 0;

  for (const s of settings) {
    // Sanidade: alvos absurdos → tratados como skip de grupo.
    if (
      !s.user_id ||
      !Number.isFinite(s.target_pct) ||
      s.target_pct <= 0 ||
      s.target_pct > 100 ||
      !Number.isFinite(s.consecutive_days_alert) ||
      s.consecutive_days_alert <= 0
    ) {
      actions.push({
        kind: "skip_group",
        user_id: s.user_id,
        carrier_tag: s.transportadora ?? "__all__",
        target_pct: s.target_pct,
        breach_days: 0,
      });
      skipped++;
      continue;
    }

    const carrierTag = s.transportadora ?? "__all__";
    const groupKey = `${s.user_id}::${carrierTag}`;
    if (seen.has(groupKey)) {
      actions.push({
        kind: "skip_group",
        user_id: s.user_id,
        carrier_tag: carrierTag,
        target_pct: s.target_pct,
        breach_days: 0,
      });
      skipped++;
      continue;
    }
    seen.add(groupKey);

    const rawDays = ctx.breachDaysFor(s);
    const days = Number.isFinite(rawDays) && rawDays > 0 ? Math.floor(rawDays) : 0;
    if (days < s.consecutive_days_alert) {
      actions.push({
        kind: "skip_below_threshold",
        user_id: s.user_id,
        carrier_tag: carrierTag,
        target_pct: s.target_pct,
        breach_days: days,
      });
      continue;
    }

    const carrierVariants: (string | null)[] =
      s.transportadora === null ? ["__all__", null] : [carrierTag];

    const matching = ctx.existing
      .filter((n) => n.user_id === s.user_id)
      .filter((n) => new Date(n.created_at).getTime() >= windowStart)
      .filter((n) => n.metadata.source === "accuracy-meta-monitor")
      .filter((n) => carrierVariants.includes(n.metadata.carrier))
      .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));

    const signatureHit = matching.find(
      (n) => n.metadata.breach_days === days && n.metadata.target_pct === s.target_pct,
    );
    if (signatureHit) {
      actions.push({
        kind: "skip_signature",
        user_id: s.user_id,
        carrier_tag: carrierTag,
        target_pct: s.target_pct,
        breach_days: days,
        target_id: signatureHit.id,
      });
      skipped++;
      continue;
    }

    if (matching.length > 0) {
      actions.push({
        kind: "update",
        user_id: s.user_id,
        carrier_tag: carrierTag,
        target_pct: s.target_pct,
        breach_days: days,
        target_id: matching[0].id,
      });
      updated++;
      continue;
    }

    actions.push({
      kind: "insert",
      user_id: s.user_id,
      carrier_tag: carrierTag,
      target_pct: s.target_pct,
      breach_days: days,
    });
    inserted++;
  }

  return { groups: seen.size, inserted, updated, skipped, actions };
}
