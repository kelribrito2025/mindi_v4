import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database module
vi.mock("./db", () => {
  // Track calls to verify no cross-group sync
  const updateComplementItemCalls: any[] = [];
  const updateComplementGroupCalls: any[] = [];

  return {
    updateComplementItem: vi.fn(async (id: number, data: any) => {
      updateComplementItemCalls.push({ id, data });
    }),
    updateComplementGroup: vi.fn(async (id: number, data: any) => {
      updateComplementGroupCalls.push({ id, data });
    }),
    updateComplementItemsByName: vi.fn(async () => {
      // This should NOT be called from catalog context
      throw new Error("updateComplementItemsByName should not be called - complements are independent per group");
    }),
    updateComplementGroupRulesByName: vi.fn(async () => {
      // This should NOT be called from catalog context
      throw new Error("updateComplementGroupRulesByName should not be called - groups are independent per product");
    }),
    getComplementItemById: vi.fn(async (id: number) => {
      if (id === 1) return { id: 1, groupId: 10, name: "Queijo extra", price: "3.00" };
      if (id === 2) return { id: 2, groupId: 20, name: "Queijo extra", price: "5.00" };
      return null;
    }),
    getComplementGroupById: vi.fn(async (id: number) => {
      if (id === 10) return { id: 10, productId: 100, name: "Adicionais", minQuantity: 0, maxQuantity: 3, isRequired: false };
      if (id === 20) return { id: 20, productId: 200, name: "Adicionais", minQuantity: 0, maxQuantity: 5, isRequired: false };
      return null;
    }),
    getProductById: vi.fn(async (id: number) => {
      if (id === 100) return { id: 100, establishmentId: 1, name: "Hambúrguer" };
      if (id === 200) return { id: 200, establishmentId: 1, name: "Pizza" };
      return null;
    }),
    getEstablishmentByOwnerId: vi.fn(),
    getEstablishment: vi.fn(),
    _updateComplementItemCalls: updateComplementItemCalls,
    _updateComplementGroupCalls: updateComplementGroupCalls,
  };
});

const db = await import("./db");

describe("Independent Complements Per Group", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (db as any)._updateComplementItemCalls.length = 0;
    (db as any)._updateComplementGroupCalls.length = 0;
  });

  describe("complement.updateItem - no global sync", () => {
    it("should update only the specific complement item without syncing globally", async () => {
      // Simulate what the router does now (no global sync)
      const itemId = 1;
      const data = { price: "4.50" };
      
      await db.updateComplementItem(itemId, data);
      
      // Should have called updateComplementItem once
      expect(db.updateComplementItem).toHaveBeenCalledTimes(1);
      expect(db.updateComplementItem).toHaveBeenCalledWith(1, { price: "4.50" });
      
      // Should NOT have called updateComplementItemsByName (global sync)
      expect(db.updateComplementItemsByName).not.toHaveBeenCalled();
    });

    it("should allow same-named complements to have different prices in different groups", async () => {
      // Update "Queijo extra" in Group 10 to 4.50
      await db.updateComplementItem(1, { price: "4.50" });
      
      // "Queijo extra" in Group 20 should remain unchanged (price: 5.00)
      const itemInOtherGroup = await db.getComplementItemById(2);
      expect(itemInOtherGroup!.price).toBe("5.00");
      
      // No global sync should have been triggered
      expect(db.updateComplementItemsByName).not.toHaveBeenCalled();
    });

    it("should allow same-named complements to have different names after rename", async () => {
      // Rename "Queijo extra" in Group 10 to "Queijo cheddar"
      await db.updateComplementItem(1, { name: "Queijo cheddar" });
      
      // Should only update the specific item
      expect(db.updateComplementItem).toHaveBeenCalledWith(1, { name: "Queijo cheddar" });
      
      // "Queijo extra" in Group 20 should remain unchanged
      const itemInOtherGroup = await db.getComplementItemById(2);
      expect(itemInOtherGroup!.name).toBe("Queijo extra");
      
      // No global sync
      expect(db.updateComplementItemsByName).not.toHaveBeenCalled();
    });
  });

  describe("complement.updateGroup - no global sync", () => {
    it("should update only the specific group without syncing globally", async () => {
      const groupId = 10;
      const data = { minQuantity: 1, maxQuantity: 5, isRequired: true };
      
      await db.updateComplementGroup(groupId, data);
      
      // Should have called updateComplementGroup once
      expect(db.updateComplementGroup).toHaveBeenCalledTimes(1);
      expect(db.updateComplementGroup).toHaveBeenCalledWith(10, data);
      
      // Should NOT have called updateComplementGroupRulesByName (global sync)
      expect(db.updateComplementGroupRulesByName).not.toHaveBeenCalled();
    });

    it("should allow same-named groups to have different rules in different products", async () => {
      // Update "Adicionais" in Product 100 to max 5
      await db.updateComplementGroup(10, { maxQuantity: 5 });
      
      // "Adicionais" in Product 200 should remain with max 5 (its own value)
      const groupInOtherProduct = await db.getComplementGroupById(20);
      expect(groupInOtherProduct!.maxQuantity).toBe(5);
      
      // No global sync
      expect(db.updateComplementGroupRulesByName).not.toHaveBeenCalled();
    });

    it("should allow renaming a group without affecting same-named groups in other products", async () => {
      // Rename "Adicionais" in Product 100 to "Extras"
      await db.updateComplementGroup(10, { name: "Extras" });
      
      // Should only update the specific group
      expect(db.updateComplementGroup).toHaveBeenCalledWith(10, { name: "Extras" });
      
      // "Adicionais" in Product 200 should remain unchanged
      const groupInOtherProduct = await db.getComplementGroupById(20);
      expect(groupInOtherProduct!.name).toBe("Adicionais");
      
      // No global sync
      expect(db.updateComplementGroupRulesByName).not.toHaveBeenCalled();
    });
  });

  describe("Independence verification", () => {
    it("should never call global sync functions from catalog context", async () => {
      // Simulate multiple updates from catalog (product-level editing)
      await db.updateComplementItem(1, { price: "10.00" });
      await db.updateComplementItem(2, { price: "20.00" });
      await db.updateComplementGroup(10, { maxQuantity: 10 });
      await db.updateComplementGroup(20, { isRequired: true });
      
      // Verify no global sync was triggered
      expect(db.updateComplementItemsByName).not.toHaveBeenCalled();
      expect(db.updateComplementGroupRulesByName).not.toHaveBeenCalled();
      
      // Verify each update was independent
      expect(db.updateComplementItem).toHaveBeenCalledTimes(2);
      expect(db.updateComplementGroup).toHaveBeenCalledTimes(2);
    });
  });
});
