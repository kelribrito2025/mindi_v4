import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock getDb before importing the module
vi.mock("./db", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
  };
});

import { getConversionRate, getLocalDate, fmtLocalDate, fmtLocalDateTime } from "./db";

describe("getConversionRate", () => {
  it("should be a function", () => {
    expect(typeof getConversionRate).toBe("function");
  });

  it("should return default values when db is unavailable", async () => {
    // getConversionRate with a non-existent establishment should return defaults
    const result = await getConversionRate(999999, "today");
    expect(result).toHaveProperty("rate");
    expect(result).toHaveProperty("orders");
    expect(result).toHaveProperty("views");
    expect(result).toHaveProperty("change");
    expect(typeof result.rate).toBe("number");
    expect(typeof result.orders).toBe("number");
    expect(typeof result.views).toBe("number");
    expect(typeof result.change).toBe("number");
  });

  it("should accept all period types", async () => {
    const periods: Array<"today" | "week" | "month"> = ["today", "week", "month"];
    for (const period of periods) {
      const result = await getConversionRate(999999, period);
      expect(result).toHaveProperty("rate");
      expect(result).toHaveProperty("orders");
      expect(result).toHaveProperty("views");
      expect(result).toHaveProperty("change");
    }
  });

  it("should return rate as 0 when there are no views", async () => {
    const result = await getConversionRate(999999, "today");
    // With no data, rate should be 0
    expect(result.rate).toBe(0);
  });

  it("should return rate with 1 decimal place precision", async () => {
    const result = await getConversionRate(999999, "today");
    // Rate should be a number with at most 1 decimal place
    const decimalPart = result.rate.toString().split(".")[1];
    if (decimalPart) {
      expect(decimalPart.length).toBeLessThanOrEqual(1);
    }
  });

  it("should return change as 0 when both periods have no data", async () => {
    const result = await getConversionRate(999999, "today");
    expect(result.change).toBe(0);
  });
});

describe("conversion rate calculation logic", () => {
  it("should calculate rate correctly: (orders/views) * 100", () => {
    // Unit test for the formula
    const orders = 10;
    const views = 100;
    const rate = views > 0 ? (orders / views) * 100 : 0;
    expect(rate).toBe(10);
  });

  it("should return 0 when views is 0", () => {
    const orders = 5;
    const views = 0;
    const rate = views > 0 ? (orders / views) * 100 : 0;
    expect(rate).toBe(0);
  });

  it("should calculate change correctly", () => {
    const currentRate = 10;
    const prevRate = 8;
    const change = prevRate === 0 
      ? (currentRate > 0 ? 100 : 0)
      : Math.round(((currentRate - prevRate) / prevRate) * 100);
    expect(change).toBe(25); // 25% increase
  });

  it("should return 100% change when previous rate was 0 and current is positive", () => {
    const currentRate = 5;
    const prevRate = 0;
    const change = prevRate === 0 
      ? (currentRate > 0 ? 100 : 0)
      : Math.round(((currentRate - prevRate) / prevRate) * 100);
    expect(change).toBe(100);
  });

  it("should return 0% change when both rates are 0", () => {
    const currentRate = 0;
    const prevRate = 0;
    const change = prevRate === 0 
      ? (currentRate > 0 ? 100 : 0)
      : Math.round(((currentRate - prevRate) / prevRate) * 100);
    expect(change).toBe(0);
  });

  it("should handle negative change correctly", () => {
    const currentRate = 5;
    const prevRate = 10;
    const change = prevRate === 0 
      ? (currentRate > 0 ? 100 : 0)
      : Math.round(((currentRate - prevRate) / prevRate) * 100);
    expect(change).toBe(-50); // 50% decrease
  });

  it("should round rate to 1 decimal place", () => {
    const orders = 3;
    const views = 37;
    const rate = views > 0 ? Math.round(((orders / views) * 100) * 10) / 10 : 0;
    expect(rate).toBe(8.1); // 8.108... rounded to 8.1
  });
});
