// Agregador puro para o digest semanal de metas de acurácia.
// Consome notificações do accuracy-meta-monitor e produz um resumo por
// transportadora + saúde dos canais externos, retornando payload pronto
// para envio (assunto + HTML).

export interface DigestNotification {
  id: string;
  created_at: string; // ISO
  metadata: {
    source?: string;
    carrier?: string | null;
    target_pct?: number;
    breach_days?: number;
    actual_pct?: number;
    channels?: Partial<Record<"email" | "whatsapp", string>>;
  };
}

export interface CarrierDigest {
  carrier: string;
  breaches: number;
  maxStreak: number;
  worstActualPct: number | null;
  target: number | null;
  lastAlertAt: string;
}

export interface ChannelDigest {
  channel: "email" | "whatsapp";
  total: number;
  ok: number;
  failed: number;
  successRate: number;
}

export interface DigestReport {
  windowStart: string;
  windowEnd: string;
  totalAlerts: number;
  carriers: CarrierDigest[]; // ordenado desc por breaches
  channels: ChannelDigest[];
  isEmpty: boolean;
}

export const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
export const CARRIER_ALL_LABEL = "Todas as transportadoras";

/** Constrói o relatório a partir de notificações e um `now` de referência. */
export function buildDigest(notifs: DigestNotification[], now: Date): DigestReport {
  const end = now.getTime();
  const start = end - WEEK_MS;
  const inWindow = notifs.filter((n) => {
    const t = Date.parse(n.created_at);
    return Number.isFinite(t) && t >= start && t <= end;
  });

  const byCarrier = new Map<string, CarrierDigest>();
  const channelStats: Record<"email" | "whatsapp", ChannelDigest> = {
    email: { channel: "email", total: 0, ok: 0, failed: 0, successRate: 0 },
    whatsapp: { channel: "whatsapp", total: 0, ok: 0, failed: 0, successRate: 0 },
  };

  for (const n of inWindow) {
    const m = n.metadata ?? {};
    const carrier = (m.carrier ?? "").trim() || CARRIER_ALL_LABEL;
    const existing = byCarrier.get(carrier);
    const streak = typeof m.breach_days === "number" ? m.breach_days : 0;
    const actual = typeof m.actual_pct === "number" ? m.actual_pct : null;
    const target = typeof m.target_pct === "number" ? m.target_pct : null;

    if (!existing) {
      byCarrier.set(carrier, {
        carrier,
        breaches: 1,
        maxStreak: streak,
        worstActualPct: actual,
        target,
        lastAlertAt: n.created_at,
      });
    } else {
      existing.breaches++;
      existing.maxStreak = Math.max(existing.maxStreak, streak);
      if (actual !== null) {
        existing.worstActualPct =
          existing.worstActualPct === null ? actual : Math.min(existing.worstActualPct, actual);
      }
      if (target !== null && existing.target === null) existing.target = target;
      if (Date.parse(n.created_at) > Date.parse(existing.lastAlertAt)) {
        existing.lastAlertAt = n.created_at;
      }
    }

    const ch = m.channels ?? {};
    for (const key of ["email", "whatsapp"] as const) {
      const raw = ch[key];
      if (raw === undefined) continue;
      const s = channelStats[key];
      s.total++;
      if (raw === "ok") s.ok++;
      else s.failed++;
    }
  }

  for (const s of Object.values(channelStats)) {
    s.successRate = s.total === 0 ? 0 : s.ok / s.total;
  }

  const carriers = [...byCarrier.values()].sort((a, b) => b.breaches - a.breaches);

  return {
    windowStart: new Date(start).toISOString(),
    windowEnd: new Date(end).toISOString(),
    totalAlerts: inWindow.length,
    carriers,
    channels: [channelStats.email, channelStats.whatsapp],
    isEmpty: inWindow.length === 0,
  };
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });

const pct = (v: number | null) => (v === null ? "—" : `${v.toFixed(1)}%`);

/** Gera assunto + HTML para o digest. Vazio quando `isEmpty`. */
export function renderDigestEmail(report: DigestReport): { subject: string; html: string } | null {
  if (report.isEmpty) return null;
  const subject = `Digest semanal · ${report.totalAlerts} alerta(s) de meta de acurácia`;

  const rows = report.carriers
    .map(
      (c) => `
      <tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee">${escapeHtml(c.carrier)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${c.breaches}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${c.maxStreak}d</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${pct(c.target)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${pct(c.worstActualPct)}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center">${fmtDate(c.lastAlertAt)}</td>
      </tr>`,
    )
    .join("");

  const channelsRows = report.channels
    .filter((c) => c.total > 0)
    .map(
      (c) => `
      <li>
        <strong>${c.channel === "email" ? "E-mail" : "WhatsApp"}:</strong>
        ${c.ok}/${c.total} entregues (${(c.successRate * 100).toFixed(1)}%)
      </li>`,
    )
    .join("");

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:640px;margin:auto;color:#111">
      <h2 style="margin:0 0 8px">Resumo semanal de metas de acurácia</h2>
      <p style="color:#555;margin:0 0 16px">
        Período: ${fmtDate(report.windowStart)} — ${fmtDate(report.windowEnd)}
      </p>
      <p style="margin:0 0 12px"><strong>${report.totalAlerts}</strong> alerta(s) registrado(s) nos últimos 7 dias.</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin-bottom:20px">
        <thead>
          <tr style="background:#f5f5f5;text-align:left">
            <th style="padding:6px 8px">Transportadora</th>
            <th style="padding:6px 8px;text-align:center">Alertas</th>
            <th style="padding:6px 8px;text-align:center">Máx. streak</th>
            <th style="padding:6px 8px;text-align:center">Meta</th>
            <th style="padding:6px 8px;text-align:center">Pior real</th>
            <th style="padding:6px 8px;text-align:center">Último</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      ${
        channelsRows
          ? `<h3 style="margin:0 0 8px">Saúde dos canais</h3><ul>${channelsRows}</ul>`
          : ""
      }
    </div>`;

  return { subject, html };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
