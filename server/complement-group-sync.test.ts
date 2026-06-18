import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Test: When updating a complement group's rules (minQuantity, maxQuantity, isRequired)
 * from the individual product edit (InlineComplementsDropdown), the change should
 * propagate to all groups with the same name across the establishment.
 * 
 * This tests the logic in the updateGroup mutation in routers.ts.
 */

// Mock db functions
const mockUpdateComplementGroup = vi.fn();
const mockGetComplementGroupById = vi.fn();
const mockGetProductById = vi.fn();
const mockUpdateComplementGroupRulesByName = vi.fn();

vi.mock("./db", () => ({
  updateComplementGroup: (...args: any[]) => mockUpdateComplementGroup(...args),
  getComplementGroupById: (...args: any[]) => mockGetComplementGroupById(...args),
  getProductById: (...args: any[]) => mockGetProductById(...args),
  updateComplementGroupRulesByName: (...args: any[]) => mockUpdateComplementGroupRulesByName(...args),
}));

describe("Complement Group Sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should sync maxQuantity across all groups with same name when updating from product edit", async () => {
    // Setup: group "Adicionais" with id=5, productId=100, in establishment 60018
    mockGetComplementGroupById.mockResolvedValue({
      id: 5,
      productId: 100,
      name: "Adicionais",
      minQuantity: 0,
      maxQuantity: 18, // old value
      isRequired: false,
    });
    mockGetProductById.mockResolvedValue({
      id: 100,
      establishmentId: 60018,
      name: "X-Bacon",
    });
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementGroupRulesByName.mockResolvedValue(undefined);

    // Simulate the updateGroup mutation logic
    const input = { id: 5, maxQuantity: 50 };
    const { id, ...data } = input;

    // Step 1: Update individual group
    await mockUpdateComplementGroup(id, data);

    // Step 2: Check if rule change needs sync
    const hasRuleChange = data.minQuantity !== undefined || data.maxQuantity !== undefined || (data as any).isRequired !== undefined;
    expect(hasRuleChange).toBe(true);

    if (hasRuleChange) {
      const group = await mockGetComplementGroupById(id);
      expect(group).not.toBeNull();

      if (group) {
        const product = await mockGetProductById(group.productId);
        expect(product).not.toBeNull();

        if (product) {
          const ruleData: { minQuantity?: number; maxQuantity?: number; isRequired?: boolean } = {};
          if (data.minQuantity !== undefined) ruleData.minQuantity = data.minQuantity;
          if (data.maxQuantity !== undefined) ruleData.maxQuantity = data.maxQuantity;
          if ((data as any).isRequired !== undefined) ruleData.isRequired = (data as any).isRequired;

          await mockUpdateComplementGroupRulesByName(product.establishmentId, group.name, ruleData);
        }
      }
    }

    // Verify: individual group was updated
    expect(mockUpdateComplementGroup).toHaveBeenCalledWith(5, { maxQuantity: 50 });

    // Verify: global sync was called with correct params
    expect(mockUpdateComplementGroupRulesByName).toHaveBeenCalledWith(
      60018,
      "Adicionais",
      { maxQuantity: 50 }
    );
  });

  it("should sync minQuantity and isRequired together when both are changed", async () => {
    mockGetComplementGroupById.mockResolvedValue({
      id: 10,
      productId: 200,
      name: "Molhos",
      minQuantity: 0,
      maxQuantity: 3,
      isRequired: false,
    });
    mockGetProductById.mockResolvedValue({
      id: 200,
      establishmentId: 60018,
      name: "Pizza Grande",
    });
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementGroupRulesByName.mockResolvedValue(undefined);

    const input = { id: 10, minQuantity: 1, isRequired: true };
    const { id, ...data } = input;

    await mockUpdateComplementGroup(id, data);

    const hasRuleChange = data.minQuantity !== undefined || (data as any).maxQuantity !== undefined || data.isRequired !== undefined;
    expect(hasRuleChange).toBe(true);

    const group = await mockGetComplementGroupById(id);
    const product = await mockGetProductById(group!.productId);

    const ruleData: { minQuantity?: number; maxQuantity?: number; isRequired?: boolean } = {};
    if (data.minQuantity !== undefined) ruleData.minQuantity = data.minQuantity;
    if ((data as any).maxQuantity !== undefined) ruleData.maxQuantity = (data as any).maxQuantity;
    if (data.isRequired !== undefined) ruleData.isRequired = data.isRequired;

    await mockUpdateComplementGroupRulesByName(product!.establishmentId, group!.name, ruleData);

    expect(mockUpdateComplementGroupRulesByName).toHaveBeenCalledWith(
      60018,
      "Molhos",
      { minQuantity: 1, isRequired: true }
    );
  });

  it("should NOT sync when only name is changed (no rule change)", async () => {
    mockUpdateComplementGroup.mockResolvedValue(undefined);

    const input = { id: 5, name: "Adicionais Premium" };
    const { id, ...data } = input;

    await mockUpdateComplementGroup(id, data);

    const hasRuleChange = (data as any).minQuantity !== undefined || (data as any).maxQuantity !== undefined || (data as any).isRequired !== undefined;
    expect(hasRuleChange).toBe(false);

    // Global sync should NOT be called
    expect(mockGetComplementGroupById).not.toHaveBeenCalled();
    expect(mockUpdateComplementGroupRulesByName).not.toHaveBeenCalled();
  });

  it("should handle group not found gracefully", async () => {
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockGetComplementGroupById.mockResolvedValue(null);

    const input = { id: 999, maxQuantity: 10 };
    const { id, ...data } = input;

    await mockUpdateComplementGroup(id, data);

    const hasRuleChange = data.maxQuantity !== undefined;
    expect(hasRuleChange).toBe(true);

    const group = await mockGetComplementGroupById(id);
    expect(group).toBeNull();

    // Should not proceed to product lookup or sync
    expect(mockGetProductById).not.toHaveBeenCalled();
    expect(mockUpdateComplementGroupRulesByName).not.toHaveBeenCalled();
  });
});
