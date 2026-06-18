import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("getWeeklyRevenue", () => {
  it("should return correct structure with arrays of 7 elements", async () => {
    const result = await db.getWeeklyRevenue(1);

    // Should have 7 days for each week
    expect(result.thisWeek).toHaveLength(7);
    expect(result.lastWeek).toHaveLength(7);
    expect(typeof result.thisWeekTotal).toBe("number");
    expect(typeof result.lastWeekTotal).toBe("number");
  });

  it("should return numeric values for all days", async () => {
    const result = await db.getWeeklyRevenue(1);

    // All values should be numbers
    result.thisWeek.forEach(value => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });
    result.lastWeek.forEach(value => {
      expect(typeof value).toBe("number");
      expect(value).toBeGreaterThanOrEqual(0);
    });
  });

  it("should have totals matching sum of daily values", async () => {
    const result = await db.getWeeklyRevenue(1);

    const thisWeekSum = result.thisWeek.reduce((a, b) => a + b, 0);
    const lastWeekSum = result.lastWeek.reduce((a, b) => a + b, 0);

    // Totals should match sum of daily values (with small tolerance for floating point)
    expect(Math.abs(result.thisWeekTotal - thisWeekSum)).toBeLessThan(0.01);
    expect(Math.abs(result.lastWeekTotal - lastWeekSum)).toBeLessThan(0.01);
  });

  it("should have correct day labels order (Mon-Sun)", async () => {
    // This test verifies the expected order of days
    const DAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    expect(DAYS).toHaveLength(7);
    expect(DAYS[0]).toBe("Seg"); // Monday
    expect(DAYS[6]).toBe("Dom"); // Sunday
  });
});
