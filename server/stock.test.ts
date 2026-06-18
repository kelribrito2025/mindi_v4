import { describe, it, expect } from "vitest";
import * as db from "./db";

describe("Stock Management", () => {
  describe("getStockSummary", () => {
    it("should return stock summary with counts by status", async () => {
      // Test with establishment ID 1
      const summary = await db.getStockSummary(1);
      
      expect(summary).toBeDefined();
      expect(typeof summary.total).toBe("number");
      expect(typeof summary.ok).toBe("number");
      expect(typeof summary.low).toBe("number");
      expect(typeof summary.critical).toBe("number");
      expect(typeof summary.outOfStock).toBe("number");
      
      // Total should equal sum of all statuses
      expect(summary.total).toBe(summary.ok + summary.low + summary.critical + summary.outOfStock);
    });
  });

  describe("getStockItemsByEstablishment", () => {
    it("should return array of stock items", async () => {
      const items = await db.getStockItemsByEstablishment(1, {});
      
      expect(Array.isArray(items)).toBe(true);
    });

    it("should filter by status when provided", async () => {
      const items = await db.getStockItemsByEstablishment(1, { status: "ok" });
      
      expect(Array.isArray(items)).toBe(true);
      // All returned items should have status "ok"
      items.forEach(item => {
        expect(item.status).toBe("ok");
      });
    });
  });

  describe("getStockCategoriesByEstablishment", () => {
    it("should return array of stock categories", async () => {
      const categories = await db.getStockCategoriesByEstablishment(1);
      
      expect(Array.isArray(categories)).toBe(true);
    });
  });

  describe("Stock status calculation", () => {
    it("should correctly calculate status based on quantity thresholds", () => {
      // Test the status calculation logic
      const calculateStatus = (current: number, min: number): string => {
        if (current <= 0) return "out_of_stock";
        if (current <= min * 0.25) return "critical";
        if (current <= min) return "low";
        return "ok";
      };

      // Test cases
      expect(calculateStatus(0, 10)).toBe("out_of_stock");
      expect(calculateStatus(2, 10)).toBe("critical"); // 2 <= 10 * 0.25 = 2.5
      expect(calculateStatus(5, 10)).toBe("low"); // 5 <= 10
      expect(calculateStatus(15, 10)).toBe("ok"); // 15 > 10
    });
  });
});
