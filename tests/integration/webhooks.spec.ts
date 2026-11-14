import { describe, it, expect } from "vitest";
import {
  requireString,
  requireEnum,
  ValidationError,
} from "../../supabase/functions/_shared/validate";

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

const ALLOWED_EVENTS = ["tracking.update", "tracking.created"] as const;

describe("Webhook Simulation Suite (real _shared logic)", () => {
  it("should validate carrier status updates through the production contract", async () => {
    const payload = simulateWebhookPayload("tracking.update", {
      tracking_number: "BR123456789",
      status: "DELIVERED",
      location: "Sao Paulo, SP",
    });

    const body = {
      tracking_number: String(payload.payload.tracking_number),
      event_type: payload.type,
      carrier_id: "RODONAVES",
    };

    expect(payload.type).toBe("tracking.update");
    expect(() => {
      requireString(body, "tracking_number", {
        minLength: 9,
        pattern: /^BR\d+$/,
      });
      requireString(body, "carrier_id", { minLength: 2 });
      requireEnum(body, "event_type", ALLOWED_EVENTS);
    }).not.toThrow();
  });

  it("should refuse events outside the contract", () => {
    expect(() =>
      requireEnum(
        { event_type: "tracking.undefined" },
        "event_type",
        ALLOWED_EVENTS,
      ),
    ).toThrow(ValidationError);
  });

  it("should reject missing required fields (production fail-closed)", () => {
    expect(() =>
      requireString({ tracking_number: "" }, "tracking_number", {
        minLength: 9,
      }),
    ).toThrow(ValidationError);
    expect(() => requireString({}, "carrier_id")).toThrow(ValidationError);
  });
});
