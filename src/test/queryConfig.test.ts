import { describe, it, expect } from "vitest";
import { QUERY_STALE_TIME, QUERY_REFETCH_INTERVAL } from "@/lib/queryConfig";

describe("Query Config", () => {
  it("has correct stale times hierarchy", () => {
    expect(QUERY_STALE_TIME.STATIC).toBeGreaterThan(QUERY_STALE_TIME.DASHBOARD);
    expect(QUERY_STALE_TIME.DASHBOARD).toBeGreaterThan(QUERY_STALE_TIME.DYNAMIC);
    expect(QUERY_STALE_TIME.DYNAMIC).toBeGreaterThan(QUERY_STALE_TIME.REALTIME);
  });

  it("has refetch intervals as positive numbers", () => {
    expect(QUERY_REFETCH_INTERVAL.DASHBOARD).toBeGreaterThan(0);
    expect(QUERY_REFETCH_INTERVAL.NOTIFICATIONS).toBeGreaterThan(0);
  });

  it("all values are positive numbers", () => {
    Object.values(QUERY_STALE_TIME).forEach((v) => {
      expect(v).toBeGreaterThan(0);
    });
    Object.values(QUERY_REFETCH_INTERVAL).forEach((v) => {
      expect(v).toBeGreaterThan(0);
    });
  });
});
