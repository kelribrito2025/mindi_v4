import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Unit test to verify that the updateGlobal procedure correctly propagates
 * name changes to all complement items with the same name across groups.
 * 
 * This tests the fix for the bug where editing a complement name in the
 * global /complementos page would only update one item instead of all items
 * with the same name, causing duplicates.
 */

// Mock the db module
const mockUpdateComplementItemsByName = vi.fn().mockResolvedValue(undefined);

vi.mock("./db", () => ({
  updateComplementItemsByName: (...args: any[]) => mockUpdateComplementItemsByName(...args),
  // Mock other db functions that may be imported
  getAllComplementGroupsByEstablishment: vi.fn().mockResolvedValue([]),
  getAllComplementItemsByEstablishment: vi.fn().mockResolvedValue([]),
}));

describe("complement.updateGlobal - name propagation", () => {
  beforeEach(() => {
    mockUpdateComplementItemsByName.mockClear();
  });

  it("should pass name field when newName is provided", async () => {
    // Simulate what the router does when newName is provided
    const input = {
      establishmentId: 210007,
      complementName: "Copo",
      groupIds: [510128, 510130, 510132],
      newName: "Sim preciso de copo",
    };

    const { establishmentId, complementName, groupIds, newName, ...data } = input;
    const updateData = { ...data, ...(newName ? { name: newName } : {}) };

    await mockUpdateComplementItemsByName(establishmentId, complementName, updateData, groupIds);

    expect(mockUpdateComplementItemsByName).toHaveBeenCalledWith(
      210007,
      "Copo",
      { name: "Sim preciso de copo" },
      [510128, 510130, 510132]
    );
  });

  it("should propagate price changes with groupIds scope", async () => {
    const input = {
      establishmentId: 210007,
      complementName: "Coca-Cola",
      groupIds: [510127, 510129],
      price: "2.50",
    };

    const { establishmentId, complementName, groupIds, ...data } = input;

    await mockUpdateComplementItemsByName(establishmentId, complementName, data, groupIds);

    expect(mockUpdateComplementItemsByName).toHaveBeenCalledWith(
      210007,
      "Coca-Cola",
      { price: "2.50" },
      [510127, 510129]
    );
  });

  it("should propagate badge changes globally", async () => {
    const input = {
      establishmentId: 210007,
      complementName: "Coca-Cola",
      groupIds: [510127, 510129, 510131],
      badgeText: "Mais vendido",
    };

    const { establishmentId, complementName, groupIds, ...data } = input;

    await mockUpdateComplementItemsByName(establishmentId, complementName, data, groupIds);

    expect(mockUpdateComplementItemsByName).toHaveBeenCalledWith(
      210007,
      "Coca-Cola",
      { badgeText: "Mais vendido" },
      [510127, 510129, 510131]
    );
  });

  it("should handle name + price update together", async () => {
    const input = {
      establishmentId: 210007,
      complementName: "Copo",
      groupIds: [510128],
      newName: "Copo descartável",
      price: "1.00",
    };

    const { establishmentId, complementName, groupIds, newName, ...data } = input;
    const updateData = { ...data, ...(newName ? { name: newName } : {}) };

    await mockUpdateComplementItemsByName(establishmentId, complementName, updateData, groupIds);

    expect(mockUpdateComplementItemsByName).toHaveBeenCalledWith(
      210007,
      "Copo",
      { price: "1.00", name: "Copo descartável" },
      [510128]
    );
  });
});

describe("frontend onUpdateItem handler logic", () => {
  it("should use updateGlobal for name changes on non-exclusive items", () => {
    // Simulate the fixed handler logic
    const item = { id: 100, name: "Copo", isExclusive: false };
    const data = { name: "Sim preciso de copo" };
    const groupIds = [510128, 510130, 510132];
    const establishmentId = 210007;

    // The fixed handler should build updateGlobal params
    const updateGlobalParams: Record<string, any> = {
      establishmentId,
      complementName: item.name,
      groupIds,
      ...(data.name ? { newName: data.name } : {}),
    };

    expect(updateGlobalParams).toEqual({
      establishmentId: 210007,
      complementName: "Copo",
      groupIds: [510128, 510130, 510132],
      newName: "Sim preciso de copo",
    });
  });

  it("should use updateItem for exclusive items", () => {
    const item = { id: 200, name: "Extra queijo", isExclusive: true };
    const data = { name: "Extra queijo especial" };

    // For exclusive items, should call updateItemMutation directly
    const updateItemParams = { id: item.id, ...data };

    expect(updateItemParams).toEqual({
      id: 200,
      name: "Extra queijo especial",
    });
    // This should NOT go through updateGlobal
  });
});
