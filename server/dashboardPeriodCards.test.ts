import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("getRevenueByPeriod", () => {
  it("should return correct structure for 'week' period (daily mode)", async () => {
    const result = await db.getRevenueByPeriod(30001, "week");
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
    expect(result.mode).toBe("daily");
    expect(result.periodLabel).toBe("Esta semana");
    expect(result.comparisonLabel).toBe("Semana passada");
  });

  it("should return numeric values for all days in week mode", async () => {
    const result = await db.getRevenueByPeriod(30001, "week");
    result.thisWeek.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });
    result.lastWeek.forEach((value) => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it("should return correct structure for 'month' period (monthly mode with 6 months)", async () => {
    const result = await db.getRevenueByPeriod(30001, "month");
    expect(result.thisWeek).toHaveLength(6);
    expect(result.lastWeek).toHaveLength(6);
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
    expect(result.mode).toBe("monthly");
    expect(result.periodLabel).toBe("Este mês");
    expect(result.comparisonLabel).toBe("Mês anterior");
    expect(result.currentIndex).toBe(5);
  });

  it("should return month labels for monthly mode", async () => {
    const result = await db.getRevenueByPeriod(30001, "month");
    expect(result.monthLabels).toBeDefined();
    expect(result.monthLabels).toHaveLength(6);
    // Labels should be short month names (3 chars)
    const validMonths = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    result.monthLabels!.forEach((label) => {
      expect(validMonths).toContain(label);
    });
  });

  it("should default to 'week' when no period specified", async () => {
    const result = await db.getRevenueByPeriod(30001);
    expect(result.mode).toBe("daily");
    expect(result.thisWeek).toHaveLength(7);
  });

  it("should return zeros for non-existent establishment", async () => {
    const result = await db.getRevenueByPeriod(999999, "week");
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
  });

  it("should return zeros for non-existent establishment in month mode", async () => {
    const result = await db.getRevenueByPeriod(999999, "month");
    expect(result.thisWeekTotal).toBe(0);
    expect(result.lastWeekTotal).toBe(0);
    expect(result.monthLabels).toHaveLength(6);
  });

  it("'today' period should also return week data (daily mode)", async () => {
    const result = await db.getRevenueByPeriod(30001, "today");
    // 'today' returns hourly data (24 hours)
    expect(result.thisWeek).toHaveLength(24);
    expect(result.mode).toBe("hourly");
  });
});

describe("getMenuViewsHeatmapWithPeriod", () => {
  it("should return correct structure with period views for 'today'", async () => {
    const result = await db.getMenuViewsHeatmapWithPeriod(30001, "today");
    expect(result).toHaveProperty("data");
    expect(result).toHaveProperty("maxCount");
    expect(result).toHaveProperty("totalViews");
    expect(result).toHaveProperty("periodViews");
    expect(result).toHaveProperty("previousPeriodViews");
    expect(result).toHaveProperty("viewsChange");
    expect(typeof result.periodViews).toBe("number");
    expect(typeof result.previousPeriodViews).toBe("number");
    expect(typeof result.viewsChange).toBe("number");
    expect(result.periodViews).toBeGreaterThanOrEqual(0);
  });

  it("should return correct structure for 'week' period", async () => {
    const result = await db.getMenuViewsHeatmapWithPeriod(30001, "week");
    expect(typeof result.periodViews).toBe("number");
    expect(typeof result.viewsChange).toBe("number");
    expect(result.periodViews).toBeGreaterThanOrEqual(0);
  });

  it("should return correct structure for 'month' period", async () => {
    const result = await db.getMenuViewsHeatmapWithPeriod(30001, "month");
    expect(typeof result.periodViews).toBe("number");
    expect(typeof result.viewsChange).toBe("number");
    expect(result.periodViews).toBeGreaterThanOrEqual(0);
  });

  it("week period views should be >= today period views", async () => {
    const todayResult = await db.getMenuViewsHeatmapWithPeriod(30001, "today");
    const weekResult = await db.getMenuViewsHeatmapWithPeriod(30001, "week");
    expect(weekResult.periodViews).toBeGreaterThanOrEqual(todayResult.periodViews);
  });

  it("month period views should be >= week period views", async () => {
    const weekResult = await db.getMenuViewsHeatmapWithPeriod(30001, "week");
    const monthResult = await db.getMenuViewsHeatmapWithPeriod(30001, "month");
    expect(monthResult.periodViews).toBeGreaterThanOrEqual(weekResult.periodViews);
  });

  it("should return zeros for non-existent establishment", async () => {
    const result = await db.getMenuViewsHeatmapWithPeriod(999999, "today");
    expect(result.periodViews).toBe(0);
    expect(result.previousPeriodViews).toBe(0);
    expect(result.viewsChange).toBe(0);
    expect(result.totalViews).toBe(0);
  });

  it("heatmap data should always be present regardless of period", async () => {
    const todayResult = await db.getMenuViewsHeatmapWithPeriod(30001, "today");
    const weekResult = await db.getMenuViewsHeatmapWithPeriod(30001, "week");
    const monthResult = await db.getMenuViewsHeatmapWithPeriod(30001, "month");
    
    // Heatmap data is always the same (accumulated), only periodViews changes
    expect(todayResult.data).toEqual(weekResult.data);
    expect(weekResult.data).toEqual(monthResult.data);
    expect(todayResult.totalViews).toBe(weekResult.totalViews);
    expect(weekResult.totalViews).toBe(monthResult.totalViews);
  });
});
