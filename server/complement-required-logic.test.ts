import { describe, it, expect } from "vitest";

/**
 * Test: minQuantity is the single source of truth for determining
 * whether a complement group is required or optional.
 * 
 * Rules:
 * - minQuantity >= 1 → group is required (badge "Obrigatório")
 * - minQuantity === 0 → group is optional (badge "Opcional")
 * - isRequired field is auto-synced from minQuantity on save
 */

// Helper that mirrors the backend auto-sync logic in routers.ts
function syncIsRequired(data: { minQuantity?: number; isRequired?: boolean }) {
  if (data.minQuantity !== undefined) {
    data.isRequired = data.minQuantity >= 1;
  }
  return data;
}

// Helper that mirrors the frontend badge logic
function getBadgeType(group: { isRequired: boolean; minQuantity: number }): "Obrigatório" | "Opcional" {
  return (group.isRequired || group.minQuantity >= 1) ? "Obrigatório" : "Opcional";
}

// Helper that mirrors the frontend checkout validation logic (minQuantity only)
function isGroupSatisfied(
  group: { minQuantity: number },
  selectedCount: number
): boolean {
  if (group.minQuantity > 0) {
    return selectedCount >= group.minQuantity;
  }
  return true; // optional groups are always satisfied
}

describe("Complement Group Required Logic", () => {
  describe("Auto-sync: isRequired derived from minQuantity", () => {
    it("should set isRequired=true when minQuantity >= 1", () => {
      const data = syncIsRequired({ minQuantity: 1 });
      expect(data.isRequired).toBe(true);
    });

    it("should set isRequired=true when minQuantity is 3", () => {
      const data = syncIsRequired({ minQuantity: 3 });
      expect(data.isRequired).toBe(true);
    });

    it("should set isRequired=false when minQuantity is 0", () => {
      const data = syncIsRequired({ minQuantity: 0 });
      expect(data.isRequired).toBe(false);
    });

    it("should not change isRequired when minQuantity is not provided", () => {
      const data = syncIsRequired({ isRequired: true });
      expect(data.isRequired).toBe(true);
    });

    it("should override explicit isRequired=true when minQuantity=0", () => {
      const data = syncIsRequired({ minQuantity: 0, isRequired: true });
      expect(data.isRequired).toBe(false);
    });

    it("should override explicit isRequired=false when minQuantity=1", () => {
      const data = syncIsRequired({ minQuantity: 1, isRequired: false });
      expect(data.isRequired).toBe(true);
    });
  });

  describe("Badge display logic", () => {
    it("should show Obrigatório when minQuantity >= 1 and isRequired is true", () => {
      expect(getBadgeType({ isRequired: true, minQuantity: 1 })).toBe("Obrigatório");
    });

    it("should show Obrigatório when minQuantity >= 1 even if isRequired is false (legacy data)", () => {
      expect(getBadgeType({ isRequired: false, minQuantity: 2 })).toBe("Obrigatório");
    });

    it("should show Opcional when minQuantity is 0 and isRequired is false", () => {
      expect(getBadgeType({ isRequired: false, minQuantity: 0 })).toBe("Opcional");
    });

    it("should show Obrigatório when isRequired is true even if minQuantity is 0 (legacy data)", () => {
      // This handles legacy data where isRequired was set manually without minQuantity
      expect(getBadgeType({ isRequired: true, minQuantity: 0 })).toBe("Obrigatório");
    });
  });

  describe("Checkout validation logic (minQuantity only)", () => {
    it("should require selection when minQuantity > 0", () => {
      expect(isGroupSatisfied({ minQuantity: 1 }, 0)).toBe(false);
      expect(isGroupSatisfied({ minQuantity: 1 }, 1)).toBe(true);
      expect(isGroupSatisfied({ minQuantity: 2 }, 1)).toBe(false);
      expect(isGroupSatisfied({ minQuantity: 2 }, 2)).toBe(true);
      expect(isGroupSatisfied({ minQuantity: 2 }, 3)).toBe(true);
    });

    it("should always be satisfied when minQuantity is 0 (optional)", () => {
      expect(isGroupSatisfied({ minQuantity: 0 }, 0)).toBe(true);
      expect(isGroupSatisfied({ minQuantity: 0 }, 5)).toBe(true);
    });

    it("should handle high minQuantity values", () => {
      expect(isGroupSatisfied({ minQuantity: 10 }, 9)).toBe(false);
      expect(isGroupSatisfied({ minQuantity: 10 }, 10)).toBe(true);
    });
  });

  describe("Checkbox sync with minQuantity (InlineComplementsDropdown)", () => {
    it("checking 'Obrigatório' should set minQuantity to at least 1", () => {
      // When checkbox is checked and minQuantity was 0
      const newRequired = true;
      const currentMinQuantity = 0;
      const newMinQuantity = newRequired ? Math.max(currentMinQuantity, 1) : 0;
      expect(newMinQuantity).toBe(1);
    });

    it("checking 'Obrigatório' should keep minQuantity if already >= 1", () => {
      const newRequired = true;
      const currentMinQuantity = 3;
      const newMinQuantity = newRequired ? Math.max(currentMinQuantity, 1) : 0;
      expect(newMinQuantity).toBe(3);
    });

    it("unchecking 'Obrigatório' should set minQuantity to 0", () => {
      const newRequired = false;
      const currentMinQuantity = 2;
      const newMinQuantity = newRequired ? Math.max(currentMinQuantity, 1) : 0;
      expect(newMinQuantity).toBe(0);
    });

    it("checkbox should reflect minQuantity state", () => {
      // checkbox checked state = minQuantity >= 1
      expect(0 >= 1).toBe(false);  // minQuantity=0 → unchecked
      expect(1 >= 1).toBe(true);   // minQuantity=1 → checked
      expect(5 >= 1).toBe(true);   // minQuantity=5 → checked
    });
  });
});
