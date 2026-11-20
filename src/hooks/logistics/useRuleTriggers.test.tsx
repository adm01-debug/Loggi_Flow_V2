import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRuleTriggers } from "./useRuleTriggers";

const evaluateRulesMock = vi.fn();

vi.mock("@/hooks/logistics/useBusinessRuleEngine", () => ({
  useBusinessRuleEngine: () => ({
    evaluateRules: evaluateRulesMock,
  }),
}));

beforeEach(() => {
  evaluateRulesMock.mockReset();
  evaluateRulesMock.mockResolvedValue(undefined);
});

describe("useRuleTriggers", () => {
  it("dispara a engine apenas para o trigger on_status_change", async () => {
    const { result } = renderHook(() => useRuleTriggers());
    const ctx = {
      entityType: "entrega" as const,
      entityId: "ENT-1",
      status: "entregue",
    };

    await result.current.onStatusChange(ctx.entityType, ctx.entityId, {
      status: ctx.status,
      cliente_id: "c1",
    });

    expect(evaluateRulesMock).toHaveBeenCalledTimes(1);
    expect(evaluateRulesMock).toHaveBeenCalledWith(
      "entrega",
      "on_status_change",
      "ENT-1",
      expect.objectContaining({ status: "entregue" }),
    );
  });

  it("engole falhas da engine sem quebrar o fluxo operacional", async () => {
    evaluateRulesMock.mockRejectedValueOnce(new Error("supabase down"));
    const { result } = renderHook(() => useRuleTriggers());

    await expect(
      result.current.onStatusChange("coleta", "COL-1", {
        status: "em_transito",
      }),
    ).resolves.toBeUndefined();
  });
});
