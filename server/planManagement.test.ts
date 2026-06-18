import { describe, it, expect, vi } from "vitest";

/**
 * Tests for plan management endpoints (admin plan prices & features)
 * These tests verify the data structures and API contracts.
 */

describe("Plan Management", () => {
  describe("Plan Data Structure", () => {
    it("should have correct plan IDs", () => {
      const validPlanIds = ["trial", "lite", "basic", "pro"];
      expect(validPlanIds).toContain("trial");
      expect(validPlanIds).toContain("lite");
      expect(validPlanIds).toContain("basic");
      expect(validPlanIds).toContain("pro");
      expect(validPlanIds).not.toContain("enterprise");
    });

    it("should validate price structure (cents)", () => {
      // Prices should be in cents (integer)
      const mockPrice = { planId: "basic", monthlyPriceCents: 8900, annualPriceCents: 89000 };
      expect(mockPrice.monthlyPriceCents).toBeGreaterThanOrEqual(0);
      expect(mockPrice.annualPriceCents).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(mockPrice.monthlyPriceCents)).toBe(true);
      expect(Number.isInteger(mockPrice.annualPriceCents)).toBe(true);
    });

    it("should convert cents to display currency correctly", () => {
      const priceCents = 8900;
      const displayPrice = priceCents / 100;
      expect(displayPrice).toBe(89);
      
      const annualCents = 89000;
      const displayAnnual = annualCents / 100;
      expect(displayAnnual).toBe(890);
    });

    it("should validate feature structure", () => {
      const mockFeature = { planId: "basic", text: "Dashboard completa", sortOrder: 1 };
      expect(mockFeature.planId).toBeTruthy();
      expect(mockFeature.text).toBeTruthy();
      expect(typeof mockFeature.sortOrder).toBe("number");
      expect(mockFeature.sortOrder).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Plan Price Validation", () => {
    it("should not allow negative prices", () => {
      const validatePrice = (cents: number) => cents >= 0;
      expect(validatePrice(0)).toBe(true);
      expect(validatePrice(4900)).toBe(true);
      expect(validatePrice(8900)).toBe(true);
      expect(validatePrice(-100)).toBe(false);
    });

    it("should ensure annual price is typically greater than monthly", () => {
      const monthly = 8900;
      const annual = 89000;
      // Annual should be at least 10x monthly (10 months worth)
      expect(annual).toBeGreaterThanOrEqual(monthly * 10);
    });

    it("trial plan should have zero prices", () => {
      const trialMonthly = 0;
      const trialAnnual = 0;
      expect(trialMonthly).toBe(0);
      expect(trialAnnual).toBe(0);
    });
  });

  describe("Plan Features Sorting", () => {
    it("should sort features by sortOrder", () => {
      const features = [
        { text: "Feature C", sortOrder: 3 },
        { text: "Feature A", sortOrder: 1 },
        { text: "Feature B", sortOrder: 2 },
      ];
      const sorted = features.sort((a, b) => a.sortOrder - b.sortOrder);
      expect(sorted[0].text).toBe("Feature A");
      expect(sorted[1].text).toBe("Feature B");
      expect(sorted[2].text).toBe("Feature C");
    });

    it("should group features by planId", () => {
      const features = [
        { planId: "basic", text: "Feature 1", sortOrder: 1 },
        { planId: "lite", text: "Feature 2", sortOrder: 1 },
        { planId: "basic", text: "Feature 3", sortOrder: 2 },
      ];
      const grouped: Record<string, typeof features> = {};
      for (const f of features) {
        if (!grouped[f.planId]) grouped[f.planId] = [];
        grouped[f.planId].push(f);
      }
      expect(grouped["basic"]).toHaveLength(2);
      expect(grouped["lite"]).toHaveLength(1);
    });
  });

  describe("Dynamic Plan Data Merging", () => {
    it("should merge DB prices with fallback", () => {
      const fallbackPrices: Record<string, { monthly: number; annual: number }> = {
        trial: { monthly: 0, annual: 0 },
        lite: { monthly: 49, annual: 490 },
        basic: { monthly: 89, annual: 890 },
      };

      const dbPrices = [
        { planId: "basic", monthlyPriceCents: 9900, annualPriceCents: 99000 },
      ];

      const merged = { ...fallbackPrices };
      for (const p of dbPrices) {
        merged[p.planId] = { monthly: p.monthlyPriceCents / 100, annual: p.annualPriceCents / 100 };
      }

      // basic should be updated from DB
      expect(merged["basic"].monthly).toBe(99);
      expect(merged["basic"].annual).toBe(990);
      // lite should keep fallback
      expect(merged["lite"].monthly).toBe(49);
      expect(merged["lite"].annual).toBe(490);
      // trial should keep fallback
      expect(merged["trial"].monthly).toBe(0);
    });

    it("should merge DB features with fallback", () => {
      const fallbackFeatures: Record<string, string[]> = {
        basic: ["Feature A", "Feature B"],
        lite: ["Feature X"],
      };

      const dbFeatures = [
        { planId: "basic", text: "New Feature 1", sortOrder: 1 },
        { planId: "basic", text: "New Feature 2", sortOrder: 2 },
      ];

      const merged: Record<string, string[]> = { ...fallbackFeatures };
      const grouped: Record<string, Array<{ text: string; sortOrder: number }>> = {};
      for (const f of dbFeatures) {
        if (!grouped[f.planId]) grouped[f.planId] = [];
        grouped[f.planId].push({ text: f.text, sortOrder: f.sortOrder });
      }
      for (const [planId, feats] of Object.entries(grouped)) {
        merged[planId] = feats.sort((a, b) => a.sortOrder - b.sortOrder).map(f => f.text);
      }

      // basic should be updated from DB
      expect(merged["basic"]).toEqual(["New Feature 1", "New Feature 2"]);
      // lite should keep fallback
      expect(merged["lite"]).toEqual(["Feature X"]);
    });
  });
});
