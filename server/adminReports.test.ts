import { describe, it, expect } from "vitest";

describe("Admin Reports Data", () => {
  it("should return all required report fields", async () => {
    // Import the function
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();

    expect(data).not.toBeNull();
    if (!data) return;

    // Check all required fields exist
    expect(data).toHaveProperty("totalRestaurants");
    expect(data).toHaveProperty("monthlyRevenue");
    expect(data).toHaveProperty("conversionRate");
    expect(data).toHaveProperty("activeRestaurants");
    expect(data).toHaveProperty("annualRevenue");
    expect(data).toHaveProperty("ticketMedio");
    expect(data).toHaveProperty("churnRate");
    expect(data).toHaveProperty("statusDistribution");
    expect(data).toHaveProperty("planDistribution");
    expect(data).toHaveProperty("activeTrials");
    expect(data).toHaveProperty("expiredTrials");
  });

  it("should return numeric values for all metrics", async () => {
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();
    if (!data) return;

    expect(typeof data.totalRestaurants).toBe("number");
    expect(typeof data.monthlyRevenue).toBe("number");
    expect(typeof data.conversionRate).toBe("number");
    expect(typeof data.activeRestaurants).toBe("number");
    expect(typeof data.annualRevenue).toBe("number");
    expect(typeof data.ticketMedio).toBe("number");
    expect(typeof data.churnRate).toBe("number");
  });

  it("should have consistent status distribution", async () => {
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();
    if (!data) return;

    const { statusDistribution } = data;
    expect(statusDistribution).toHaveProperty("ativos");
    expect(statusDistribution).toHaveProperty("emTeste");
    expect(statusDistribution).toHaveProperty("expirados");

    // Total should be >= sum of parts (some may overlap)
    expect(data.totalRestaurants).toBeGreaterThanOrEqual(0);
    expect(statusDistribution.ativos).toBeGreaterThanOrEqual(0);
    expect(statusDistribution.emTeste).toBeGreaterThanOrEqual(0);
    expect(statusDistribution.expirados).toBeGreaterThanOrEqual(0);
  });

  it("should calculate annual revenue as 12x monthly", async () => {
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();
    if (!data) return;

    expect(data.annualRevenue).toBe(data.monthlyRevenue * 12);
  });

  it("should have conversion rate between 0 and 100", async () => {
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();
    if (!data) return;

    expect(data.conversionRate).toBeGreaterThanOrEqual(0);
    expect(data.conversionRate).toBeLessThanOrEqual(100);
  });

  it("should have churn rate between 0 and 100", async () => {
    const { getAdminReportsData } = await import("./adminDb");

    const data = await getAdminReportsData();
    if (!data) return;

    expect(data.churnRate).toBeGreaterThanOrEqual(0);
    expect(data.churnRate).toBeLessThanOrEqual(100);
  });
});
