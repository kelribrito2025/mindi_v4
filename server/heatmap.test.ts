import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do drizzle
vi.mock("drizzle-orm/mysql2", () => ({
  drizzle: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([]))
        }))
      }))
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => Promise.resolve([{ insertId: 1 }]))
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => Promise.resolve([{ affectedRows: 1 }]))
      }))
    }))
  }))
}));

describe("Menu Views Heatmap", () => {
  describe("Heatmap Data Structure", () => {
    it("should have 7 days of week (0-6)", () => {
      const days = [0, 1, 2, 3, 4, 5, 6]; // Sunday to Saturday
      expect(days.length).toBe(7);
      expect(days[0]).toBe(0); // Sunday
      expect(days[6]).toBe(6); // Saturday
    });

    it("should have 24 hours (0-23)", () => {
      const hours = Array.from({ length: 24 }, (_, i) => i);
      expect(hours.length).toBe(24);
      expect(hours[0]).toBe(0);
      expect(hours[23]).toBe(23);
    });

    it("should create a 7x24 matrix for heatmap", () => {
      const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      expect(matrix.length).toBe(7);
      expect(matrix[0].length).toBe(24);
      expect(matrix[6][23]).toBe(0);
    });
  });

  describe("Color Scale", () => {
    const COLOR_SCALE = [
      "bg-blue-50",
      "bg-blue-100",
      "bg-blue-200",
      "bg-blue-300",
      "bg-blue-400",
      "bg-blue-500",
      "bg-blue-600",
      "bg-blue-700",
    ];

    function getColorClass(value: number, maxValue: number): string {
      if (value === 0 || maxValue === 0) return COLOR_SCALE[0];
      const ratio = value / maxValue;
      const index = Math.min(Math.floor(ratio * (COLOR_SCALE.length - 1)) + 1, COLOR_SCALE.length - 1);
      return COLOR_SCALE[index];
    }

    it("should return lightest color for zero value", () => {
      expect(getColorClass(0, 100)).toBe("bg-blue-50");
    });

    it("should return lightest color when maxValue is zero", () => {
      expect(getColorClass(10, 0)).toBe("bg-blue-50");
    });

    it("should return darkest color for max value", () => {
      expect(getColorClass(100, 100)).toBe("bg-blue-700");
    });

    it("should return intermediate color for half value", () => {
      const color = getColorClass(50, 100);
      expect(COLOR_SCALE.indexOf(color)).toBeGreaterThan(0);
      expect(COLOR_SCALE.indexOf(color)).toBeLessThan(COLOR_SCALE.length - 1);
    });

    it("should have 8 color levels", () => {
      expect(COLOR_SCALE.length).toBe(8);
    });
  });

  describe("Day of Week Calculation", () => {
    it("should correctly identify Sunday as 0", () => {
      const sunday = new Date("2026-02-01T12:00:00"); // Sunday
      expect(sunday.getDay()).toBe(0);
    });

    it("should correctly identify Saturday as 6", () => {
      const saturday = new Date("2026-01-31T12:00:00"); // Saturday
      expect(saturday.getDay()).toBe(6);
    });

    it("should correctly identify Monday as 1", () => {
      const monday = new Date("2026-02-02T12:00:00"); // Monday
      expect(monday.getDay()).toBe(1);
    });
  });

  describe("Hour Calculation", () => {
    it("should correctly get hour from date", () => {
      const noon = new Date("2026-02-02T12:00:00");
      expect(noon.getHours()).toBe(12);
    });

    it("should correctly get midnight hour", () => {
      const midnight = new Date("2026-02-02T00:00:00");
      expect(midnight.getHours()).toBe(0);
    });

    it("should correctly get last hour of day", () => {
      const lastHour = new Date("2026-02-02T23:59:59");
      expect(lastHour.getHours()).toBe(23);
    });
  });

  describe("Heatmap Stats Calculation", () => {
    it("should calculate total views correctly", () => {
      const data = [
        { dayOfWeek: 0, hour: 10, count: 5 },
        { dayOfWeek: 1, hour: 11, count: 10 },
        { dayOfWeek: 2, hour: 12, count: 15 },
      ];
      const totalViews = data.reduce((sum, d) => sum + d.count, 0);
      expect(totalViews).toBe(30);
    });

    it("should find max count correctly", () => {
      const data = [
        { dayOfWeek: 0, hour: 10, count: 5 },
        { dayOfWeek: 1, hour: 11, count: 10 },
        { dayOfWeek: 2, hour: 12, count: 15 },
      ];
      const maxCount = Math.max(...data.map(d => d.count));
      expect(maxCount).toBe(15);
    });

    it("should handle empty data", () => {
      const data: { dayOfWeek: number; hour: number; count: number }[] = [];
      const totalViews = data.reduce((sum, d) => sum + d.count, 0);
      const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0;
      expect(totalViews).toBe(0);
      expect(maxCount).toBe(0);
    });
  });

  describe("Matrix Population", () => {
    it("should populate matrix correctly from data", () => {
      const data = [
        { dayOfWeek: 0, hour: 10, count: 5 },
        { dayOfWeek: 1, hour: 11, count: 10 },
        { dayOfWeek: 6, hour: 23, count: 15 },
      ];
      
      const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      
      data.forEach(item => {
        if (item.dayOfWeek >= 0 && item.dayOfWeek < 7 && item.hour >= 0 && item.hour < 24) {
          matrix[item.dayOfWeek][item.hour] = item.count;
        }
      });
      
      expect(matrix[0][10]).toBe(5);
      expect(matrix[1][11]).toBe(10);
      expect(matrix[6][23]).toBe(15);
      expect(matrix[3][15]).toBe(0); // Not in data
    });

    it("should ignore invalid day/hour values", () => {
      const data = [
        { dayOfWeek: -1, hour: 10, count: 5 },
        { dayOfWeek: 7, hour: 11, count: 10 },
        { dayOfWeek: 0, hour: 24, count: 15 },
        { dayOfWeek: 0, hour: -1, count: 20 },
      ];
      
      const matrix: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0));
      
      data.forEach(item => {
        if (item.dayOfWeek >= 0 && item.dayOfWeek < 7 && item.hour >= 0 && item.hour < 24) {
          matrix[item.dayOfWeek][item.hour] = item.count;
        }
      });
      
      // All values should remain 0 since all data is invalid
      const totalInMatrix = matrix.flat().reduce((sum, val) => sum + val, 0);
      expect(totalInMatrix).toBe(0);
    });
  });
});
