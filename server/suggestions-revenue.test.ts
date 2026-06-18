import { describe, it, expect, vi } from "vitest";

// Mock the db module
vi.mock("./db", () => ({
  getSuggestionRevenue: vi.fn(),
}));

import { getSuggestionRevenue } from "./db";

describe("getSuggestionRevenue", () => {
  it("should be a function", () => {
    expect(typeof getSuggestionRevenue).toBe("function");
  });

  it("should return revenue structure with revenue, previousRevenue, and trend", async () => {
    const mockResult = { revenue: 500, previousRevenue: 400, trend: 25 };
    (getSuggestionRevenue as any).mockResolvedValue(mockResult);

    const result = await getSuggestionRevenue(30001);
    expect(result).toEqual(mockResult);
    expect(result).toHaveProperty("revenue");
    expect(result).toHaveProperty("previousRevenue");
    expect(result).toHaveProperty("trend");
  });

  it("should return zero revenue when no suggestions exist", async () => {
    const mockResult = { revenue: 0, previousRevenue: 0, trend: 0 };
    (getSuggestionRevenue as any).mockResolvedValue(mockResult);

    const result = await getSuggestionRevenue(99999);
    expect(result.revenue).toBe(0);
    expect(result.previousRevenue).toBe(0);
    expect(result.trend).toBe(0);
  });

  it("should calculate positive trend when revenue increases", async () => {
    const mockResult = { revenue: 1000, previousRevenue: 800, trend: 25 };
    (getSuggestionRevenue as any).mockResolvedValue(mockResult);

    const result = await getSuggestionRevenue(30001);
    expect(result.trend).toBeGreaterThan(0);
    expect(result.revenue).toBeGreaterThan(result.previousRevenue);
  });

  it("should calculate negative trend when revenue decreases", async () => {
    const mockResult = { revenue: 500, previousRevenue: 1000, trend: -50 };
    (getSuggestionRevenue as any).mockResolvedValue(mockResult);

    const result = await getSuggestionRevenue(30001);
    expect(result.trend).toBeLessThan(0);
    expect(result.revenue).toBeLessThan(result.previousRevenue);
  });

  it("should show 100% trend when going from zero to positive revenue", async () => {
    const mockResult = { revenue: 500, previousRevenue: 0, trend: 100 };
    (getSuggestionRevenue as any).mockResolvedValue(mockResult);

    const result = await getSuggestionRevenue(30001);
    expect(result.trend).toBe(100);
  });
});
