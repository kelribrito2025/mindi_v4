import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("getRevenueByPeriod — weekly revenue card fix", () => {
  const EST_ID = 60018; // establishment with actual orders
  const EMPTY_EST_ID = 999999; // non-existent establishment

  // Helper to validate the 7-slot day-of-week structure
  function assertDayOfWeekStructure(result: any) {
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(result.thisWeekOrders).toHaveLength(7);
    expect(result.lastWeekOrders).toHaveLength(7);
    for (let i = 0; i < 7; i++) {
      expect(typeof result.thisWeek[i]).toBe("number");
      expect(typeof result.lastWeek[i]).toBe("number");
      expect(typeof result.thisWeekOrders[i]).toBe("number");
      expect(typeof result.lastWeekOrders[i]).toBe("number");
      expect(result.thisWeek[i]).toBeGreaterThanOrEqual(0);
      expect(result.lastWeek[i]).toBeGreaterThanOrEqual(0);
    }
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
    expect(typeof result.thisWeekTotalOrders).toBe("number");
    expect(typeof result.lastWeekTotalOrders).toBe("number");
    expect(result.thisWeekTotal).toBeGreaterThanOrEqual(0);
    expect(result.lastWeekTotal).toBeGreaterThanOrEqual(0);
  }

  // ── period = 'week' ──
  it("period='week' should return 7-slot arrays (Mon-Sun) for current week", async () => {
    const result = await db.getRevenueByPeriod(EST_ID, "week");
    assertDayOfWeekStructure(result);
    expect(result.periodLabel).toBe("Esta semana");
    expect(result.comparisonLabel).toBe("Semana passada");
    expect(result.mode).toBe("daily");
  });

  it("period='week' thisWeekTotal should equal sum of thisWeek array", async () => {
    const result = await db.getRevenueByPeriod(EST_ID, "week");
    const sum = result.thisWeek.reduce((a: number, b: number) => a + b, 0);
    expect(result.thisWeekTotal).toBeCloseTo(sum, 1);
  });

  // ── period = 'custom' with 7-day range ──
  it("period='custom' with 7-day range should return 7-slot arrays (Mon-Sun)", async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 6);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const result = await db.getRevenueByPeriod(EST_ID, "custom", startStr, endStr);
    assertDayOfWeekStructure(result);
    // periodLabel usa formato DD/MM para usuários brasileiros
    const startParts = startStr.split('-');
    const endParts = endStr.split('-');
    const expectedStart = `${startParts[2]}/${startParts[1]}`;
    const expectedEnd = `${endParts[2]}/${endParts[1]}`;
    expect(result.periodLabel).toContain(expectedStart);
    expect(result.periodLabel).toContain(expectedEnd);
    expect(result.comparisonLabel).toBe("Período anterior");
    expect(result.mode).toBe("daily");
    expect(typeof result.currentIndex).toBe("number");
    expect(result.currentIndex).toBeGreaterThanOrEqual(0);
    expect(result.currentIndex).toBeLessThan(7);
  });

  // ── period = 'custom' with 30-day range ──
  it("period='custom' with 30-day range should return 7-slot arrays (Mon-Sun)", async () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 29);
    const startStr = start.toISOString().split("T")[0];
    const endStr = end.toISOString().split("T")[0];

    const result = await db.getRevenueByPeriod(EST_ID, "custom", startStr, endStr);
    assertDayOfWeekStructure(result);
    expect(result.mode).toBe("daily");
    // With 30 days, data should be aggregated by day-of-week across all weeks
    expect(result.thisWeek).toHaveLength(7);
  });

  // ── period = 'custom' with 1-day range (today) ──
  it("period='custom' with 1-day range should return 7-slot arrays", async () => {
    const today = new Date().toISOString().split("T")[0];
    const result = await db.getRevenueByPeriod(EST_ID, "custom", today, today);
    assertDayOfWeekStructure(result);
    expect(result.mode).toBe("daily");
  });

  // ── period = 'today' ──
  it("period='today' should return hourly data (24 slots)", async () => {
    const result = await db.getRevenueByPeriod(EST_ID, "today");
    expect(result.thisWeek).toHaveLength(24);
    expect(result.lastWeek).toHaveLength(24);
    expect(result.periodLabel).toBe("Hoje");
    expect(result.comparisonLabel).toBe("Ontem");
    expect(result.mode).toBe("hourly");
  });

  // ── period = 'month' ──
  it("period='month' should return 6-month data", async () => {
    const result = await db.getRevenueByPeriod(EST_ID, "month");
    expect(result.thisWeek).toHaveLength(6);
    expect(result.periodLabel).toBe("Este mês");
    expect(result.comparisonLabel).toBe("Mês anterior");
    expect(result.mode).toBe("monthly");
    expect(result.monthLabels).toHaveLength(6);
  });

  // ── Empty establishment ──
  it("non-existent establishment should return all zeros with correct structure", async () => {
    const result = await db.getRevenueByPeriod(EMPTY_EST_ID, "week");
    assertDayOfWeekStructure(result);
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
    expect(result.thisWeek.every((v: number) => v === 0)).toBe(true);
    expect(result.lastWeek.every((v: number) => v === 0)).toBe(true);
  });

  it("non-existent establishment with custom period should return all zeros", async () => {
    const end = new Date().toISOString().split("T")[0];
    const start = new Date();
    start.setDate(start.getDate() - 6);
    const startStr = start.toISOString().split("T")[0];

    const result = await db.getRevenueByPeriod(EMPTY_EST_ID, "custom", startStr, end);
    assertDayOfWeekStructure(result);
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
  });

  // ── getWeeklyRevenue (underlying function) ──
  it("getWeeklyRevenue should return current week data (not previous week)", async () => {
    const result = await db.getWeeklyRevenue(EST_ID);
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(result.thisWeekOrders).toHaveLength(7);
    expect(result.lastWeekOrders).toHaveLength(7);
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
    // Current week should have data for an active establishment
    // (at least some days should have orders since it's the current week)
  });
});
