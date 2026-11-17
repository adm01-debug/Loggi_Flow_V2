import { describe, it, expect } from "vitest";
import {
  requireString,
  requireEnum,
  requireNumber,
  ValidationError,
} from "../../supabase/functions/_shared/validate";
import { parseLocaleNumber } from "../../supabase/functions/_shared/number";

/**
 * Simulation real: exerce os validadores compartilhados que a Edge Function
 * `carrier-webhook-receiver` usa em producao (supabase/functions/_shared/validate.ts),
 * em vez de validar o proprio payload simulando a logica inline.
 */
export const simulateWebhookPayload = (
  type: string,
  data: Record<string, unknown>,
) => {
  return {
    type,
    payload: data,
    timestamp: new Date().toISOString(),
    event_id: crypto.randomUUID(),
  };
};

const ALLOWED_STATUSES = [
  "PENDING",
  "IN_TRANSIT",
  "DELIVERED",
  "CANCELLED",
  "RETURNED",
] as const;

describe("Massive Webhook & Edge Function Simulation (10,000 scenarios)", () => {
  it("should exercise the real production validators across 10,000 randomized scenarios", async () => {
    const scenarios = 10000;

    for (let i = 0; i < scenarios; i++) {
      const carrier = ["MELHOR_ENVIO", "RODONAVES", "LALAMOVE", "LOGGI"][i % 4];
      const status =
        ALLOWED_STATUSES[Math.floor(Math.random() * ALLOWED_STATUSES.length)];
      const trackingCode = `BR${Math.random().toString(36).substring(2, 11).toUpperCase()}`;

      const payload = simulateWebhookPayload(
        `${carrier.toLowerCase()}.status_update`,
        {
          tracking_code: trackingCode,
          status,
          retry_count: Math.floor(Math.random() * 3),
        },
      );

      // Mesmas regras da producao: aceita qualquer cenario valido gerado.
      const validBody = {
        tracking_code: trackingCode,
        status,
        retry_count: String(payload.payload.retry_count),
      };
      expect(() => {
        requireString(validBody, "tracking_code", {
          minLength: 9,
          maxLength: 20,
          pattern: /^BR[0-9A-Z]+$/,
        });
        requireEnum(validBody, "status", ALLOWED_STATUSES);
        const parsed = parseLocaleNumber(validBody.retry_count);
        expect(parsed).not.toBeNull();
        requireNumber(
          validBody as unknown as Record<string, unknown>,
          "retry_count",
          { min: 0, max: 5 },
        );
      }).not.toThrow();

      // Rejection path: status fora do contrato precisa ser recusado.
      expect(() =>
        requireEnum(
          { tracking_code: trackingCode, status: "NOT_A_REAL_STATUS" },
          "status",
          ALLOWED_STATUSES,
        ),
      ).toThrow(ValidationError);

      expect(payload.event_id).toHaveLength(36);
      expect(trackingCode.length).toBeGreaterThanOrEqual(9);
    }
  });

  it("should normalize BR and US numeric formats via the shared parser", () => {
    expect(parseLocaleNumber("R$ 1.250,00")).toBe(1250);
    expect(parseLocaleNumber("1,250.00")).toBe(1250);
    expect(parseLocaleNumber("1250")).toBe(1250);
    expect(parseLocaleNumber("")).toBeNull();
    expect(parseLocaleNumber("abc")).toBeNull();
    expect(parseLocaleNumber(null)).toBeNull();
  });
});
