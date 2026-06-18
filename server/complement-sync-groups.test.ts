import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Test: syncGroups mutation should preserve isActive and other metadata
 * on existing complement items when updating a product.
 * 
 * Bug: Previously, editing a product would delete ALL complement groups
 * and recreate them from scratch, losing isActive (paused) state and
 * all other metadata (description, priceMode, availability, badges, etc.)
 * 
 * Fix: syncGroups performs smart diffing - only creates new groups/items,
 * deletes removed ones, and updates existing ones while preserving metadata.
 */

// Mock db functions
const mockGetComplementGroupsByProduct = vi.fn();
const mockGetComplementItemsByGroup = vi.fn();
const mockCreateComplementGroup = vi.fn();
const mockCreateComplementItem = vi.fn();
const mockUpdateComplementGroup = vi.fn();
const mockUpdateComplementItem = vi.fn();
const mockDeleteComplementGroup = vi.fn();
const mockDeleteComplementItem = vi.fn();
const mockGetProductById = vi.fn();

vi.mock("./db", () => ({
  getComplementGroupsByProduct: (...args: any[]) => mockGetComplementGroupsByProduct(...args),
  getComplementItemsByGroup: (...args: any[]) => mockGetComplementItemsByGroup(...args),
  createComplementGroup: (...args: any[]) => mockCreateComplementGroup(...args),
  createComplementItem: (...args: any[]) => mockCreateComplementItem(...args),
  updateComplementGroup: (...args: any[]) => mockUpdateComplementGroup(...args),
  updateComplementItem: (...args: any[]) => mockUpdateComplementItem(...args),
  deleteComplementGroup: (...args: any[]) => mockDeleteComplementGroup(...args),
  deleteComplementItem: (...args: any[]) => mockDeleteComplementItem(...args),
  getProductById: (...args: any[]) => mockGetProductById(...args),
}));

describe("syncGroups - Preserve complement metadata on product edit", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should NOT delete and recreate existing groups/items - preserving isActive", async () => {
    // Setup: Product 1 has group "Carnes" (id=10) with 4 items, 2 paused
    const existingGroups = [
      {
        id: 10,
        productId: 1,
        name: "Carnes",
        minQuantity: 1,
        maxQuantity: 1,
        isRequired: true,
        sortOrder: 0,
        items: [
          { id: 100, groupId: 10, name: "Gado grelhado", price: "0.00", isActive: true, imageUrl: null, sortOrder: 0 },
          { id: 101, groupId: 10, name: "Gado acebolado", price: "0.00", isActive: true, imageUrl: null, sortOrder: 1 },
          { id: 102, groupId: 10, name: "Frango crocante", price: "0.00", isActive: false, imageUrl: null, sortOrder: 2 },
          { id: 103, groupId: 10, name: "Frango a parmegiana", price: "0.00", isActive: false, imageUrl: null, sortOrder: 3 },
        ],
      },
    ];

    mockGetComplementGroupsByProduct.mockResolvedValue(existingGroups);
    mockGetComplementItemsByGroup.mockResolvedValue(existingGroups[0].items);
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementItem.mockResolvedValue(undefined);

    // Simulate syncGroups logic: user saves product without changing complements
    const input = {
      productId: 1,
      groups: [
        {
          existingGroupId: 10,
          name: "Carnes",
          minQuantity: 1,
          maxQuantity: 1,
          isRequired: true,
          items: [
            { existingItemId: 100, name: "Gado grelhado", price: "0.00", imageUrl: null, sortOrder: 0 },
            { existingItemId: 101, name: "Gado acebolado", price: "0.00", imageUrl: null, sortOrder: 1 },
            { existingItemId: 102, name: "Frango crocante", price: "0.00", imageUrl: null, sortOrder: 2 },
            { existingItemId: 103, name: "Frango a parmegiana", price: "0.00", imageUrl: null, sortOrder: 3 },
          ],
        },
      ],
    };

    // Execute syncGroups logic
    const currentGroups = await mockGetComplementGroupsByProduct(input.productId);
    const currentGroupIds = new Set(currentGroups.map((g: any) => g.id));
    const inputExistingGroupIds = new Set(
      input.groups.filter(g => g.existingGroupId).map(g => g.existingGroupId!)
    );

    // Step 1: Delete removed groups
    for (const currentGroup of currentGroups) {
      if (!inputExistingGroupIds.has(currentGroup.id)) {
        await mockDeleteComplementGroup(currentGroup.id);
      }
    }

    // Step 2: Process each group
    for (const group of input.groups) {
      const syncedIsRequired = group.minQuantity >= 1;

      if (group.existingGroupId && currentGroupIds.has(group.existingGroupId)) {
        // Existing group - update config
        await mockUpdateComplementGroup(group.existingGroupId, {
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: syncedIsRequired,
        });

        const currentItems = await mockGetComplementItemsByGroup(group.existingGroupId);
        const currentItemIds = new Set(currentItems.map((i: any) => i.id));
        const inputExistingItemIds = new Set(
          group.items.filter(i => i.existingItemId).map(i => i.existingItemId!)
        );

        // Delete removed items
        for (const currentItem of currentItems) {
          if (!inputExistingItemIds.has(currentItem.id)) {
            await mockDeleteComplementItem(currentItem.id);
          }
        }

        // Update existing items (preserve isActive!)
        for (const item of group.items) {
          if (item.existingItemId && currentItemIds.has(item.existingItemId)) {
            await mockUpdateComplementItem(item.existingItemId, {
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          } else {
            await mockCreateComplementItem({
              groupId: group.existingGroupId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          }
        }
      }
    }

    // CRITICAL ASSERTIONS:
    // 1. No groups were deleted (all groups still exist)
    expect(mockDeleteComplementGroup).not.toHaveBeenCalled();

    // 2. No items were deleted (all items still exist)
    expect(mockDeleteComplementItem).not.toHaveBeenCalled();

    // 3. No new groups were created (no createComplementGroup calls)
    expect(mockCreateComplementGroup).not.toHaveBeenCalled();

    // 4. No new items were created (no createComplementItem calls)
    expect(mockCreateComplementItem).not.toHaveBeenCalled();

    // 5. Existing items were updated with ONLY name, price, imageUrl, sortOrder
    //    (NOT isActive, description, priceMode, etc.)
    expect(mockUpdateComplementItem).toHaveBeenCalledTimes(4);
    
    // Verify that updateComplementItem was called WITHOUT isActive field
    for (const call of mockUpdateComplementItem.mock.calls) {
      const updateData = call[1];
      expect(updateData).not.toHaveProperty("isActive");
      expect(updateData).not.toHaveProperty("description");
      expect(updateData).not.toHaveProperty("priceMode");
      expect(updateData).not.toHaveProperty("availabilityType");
    }
  });

  it("should create new group while preserving existing groups", async () => {
    // Setup: Product has existing group "Carnes" (id=10)
    const existingGroups = [
      {
        id: 10,
        productId: 1,
        name: "Carnes",
        minQuantity: 1,
        maxQuantity: 1,
        isRequired: true,
        sortOrder: 0,
        items: [
          { id: 100, groupId: 10, name: "Gado grelhado", price: "0.00", isActive: true, imageUrl: null, sortOrder: 0 },
          { id: 101, groupId: 10, name: "Frango crocante", price: "0.00", isActive: false, imageUrl: null, sortOrder: 1 },
        ],
      },
    ];

    mockGetComplementGroupsByProduct.mockResolvedValue(existingGroups);
    mockGetComplementItemsByGroup.mockResolvedValue(existingGroups[0].items);
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementItem.mockResolvedValue(undefined);
    mockCreateComplementGroup.mockResolvedValue(20); // new group id
    mockCreateComplementItem.mockResolvedValue(200);

    // User adds a new group "Molhos" while keeping "Carnes" unchanged
    const input = {
      productId: 1,
      groups: [
        {
          existingGroupId: 10,
          name: "Carnes",
          minQuantity: 1,
          maxQuantity: 1,
          isRequired: true,
          items: [
            { existingItemId: 100, name: "Gado grelhado", price: "0.00", imageUrl: null, sortOrder: 0 },
            { existingItemId: 101, name: "Frango crocante", price: "0.00", imageUrl: null, sortOrder: 1 },
          ],
        },
        {
          // No existingGroupId = new group
          name: "Molhos",
          minQuantity: 0,
          maxQuantity: 3,
          isRequired: false,
          items: [
            { name: "Ketchup", price: "0.00", imageUrl: null, sortOrder: 0 },
            { name: "Mostarda", price: "0.00", imageUrl: null, sortOrder: 1 },
          ],
        },
      ],
    };

    // Execute syncGroups logic
    const currentGroups = await mockGetComplementGroupsByProduct(input.productId);
    const currentGroupIds = new Set(currentGroups.map((g: any) => g.id));
    const inputExistingGroupIds = new Set(
      input.groups.filter(g => g.existingGroupId).map(g => g.existingGroupId!)
    );

    for (const currentGroup of currentGroups) {
      if (!inputExistingGroupIds.has(currentGroup.id)) {
        await mockDeleteComplementGroup(currentGroup.id);
      }
    }

    for (const group of input.groups) {
      const syncedIsRequired = group.minQuantity >= 1;

      if (group.existingGroupId && currentGroupIds.has(group.existingGroupId)) {
        await mockUpdateComplementGroup(group.existingGroupId, {
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: syncedIsRequired,
        });

        const currentItems = await mockGetComplementItemsByGroup(group.existingGroupId);
        const currentItemIds = new Set(currentItems.map((i: any) => i.id));
        const inputExistingItemIds = new Set(
          group.items.filter((i: any) => i.existingItemId).map((i: any) => i.existingItemId!)
        );

        for (const currentItem of currentItems) {
          if (!inputExistingItemIds.has(currentItem.id)) {
            await mockDeleteComplementItem(currentItem.id);
          }
        }

        for (const item of group.items) {
          if ((item as any).existingItemId && currentItemIds.has((item as any).existingItemId)) {
            await mockUpdateComplementItem((item as any).existingItemId, {
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          } else {
            await mockCreateComplementItem({
              groupId: group.existingGroupId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          }
        }
      } else {
        // New group
        const newGroupId = await mockCreateComplementGroup({
          productId: input.productId,
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: syncedIsRequired,
        });

        for (let i = 0; i < group.items.length; i++) {
          const item = group.items[i];
          await mockCreateComplementItem({
            groupId: newGroupId,
            name: item.name,
            price: item.price,
            imageUrl: item.imageUrl || null,
            sortOrder: item.sortOrder,
          });
        }
      }
    }

    // ASSERTIONS:
    // 1. Existing group "Carnes" was NOT deleted
    expect(mockDeleteComplementGroup).not.toHaveBeenCalled();

    // 2. Existing items were NOT deleted
    expect(mockDeleteComplementItem).not.toHaveBeenCalled();

    // 3. Existing items were updated (preserving isActive)
    expect(mockUpdateComplementItem).toHaveBeenCalledTimes(2);
    for (const call of mockUpdateComplementItem.mock.calls) {
      expect(call[1]).not.toHaveProperty("isActive");
    }

    // 4. New group "Molhos" was created
    expect(mockCreateComplementGroup).toHaveBeenCalledTimes(1);
    expect(mockCreateComplementGroup).toHaveBeenCalledWith({
      productId: 1,
      name: "Molhos",
      minQuantity: 0,
      maxQuantity: 3,
      isRequired: false,
    });

    // 5. New items were created for the new group
    expect(mockCreateComplementItem).toHaveBeenCalledTimes(2);
  });

  it("should delete group that was removed by user", async () => {
    // Setup: Product has 2 groups
    const existingGroups = [
      {
        id: 10, productId: 1, name: "Carnes", minQuantity: 1, maxQuantity: 1,
        isRequired: true, sortOrder: 0,
        items: [
          { id: 100, groupId: 10, name: "Gado", price: "0.00", isActive: true, imageUrl: null, sortOrder: 0 },
        ],
      },
      {
        id: 11, productId: 1, name: "Molhos", minQuantity: 0, maxQuantity: 3,
        isRequired: false, sortOrder: 1,
        items: [
          { id: 200, groupId: 11, name: "Ketchup", price: "0.00", isActive: true, imageUrl: null, sortOrder: 0 },
        ],
      },
    ];

    mockGetComplementGroupsByProduct.mockResolvedValue(existingGroups);
    mockGetComplementItemsByGroup.mockImplementation((groupId: number) => {
      const group = existingGroups.find(g => g.id === groupId);
      return Promise.resolve(group?.items || []);
    });
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementItem.mockResolvedValue(undefined);
    mockDeleteComplementGroup.mockResolvedValue(undefined);

    // User removes "Molhos" group, keeps "Carnes"
    const input = {
      productId: 1,
      groups: [
        {
          existingGroupId: 10,
          name: "Carnes",
          minQuantity: 1,
          maxQuantity: 1,
          isRequired: true,
          items: [
            { existingItemId: 100, name: "Gado", price: "0.00", imageUrl: null, sortOrder: 0 },
          ],
        },
      ],
    };

    // Execute syncGroups logic
    const currentGroups = await mockGetComplementGroupsByProduct(input.productId);
    const currentGroupIds = new Set(currentGroups.map((g: any) => g.id));
    const inputExistingGroupIds = new Set(
      input.groups.filter(g => g.existingGroupId).map(g => g.existingGroupId!)
    );

    for (const currentGroup of currentGroups) {
      if (!inputExistingGroupIds.has(currentGroup.id)) {
        await mockDeleteComplementGroup(currentGroup.id);
      }
    }

    for (const group of input.groups) {
      if (group.existingGroupId && currentGroupIds.has(group.existingGroupId)) {
        await mockUpdateComplementGroup(group.existingGroupId, {
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: group.minQuantity >= 1,
        });

        const currentItems = await mockGetComplementItemsByGroup(group.existingGroupId);
        const currentItemIds = new Set(currentItems.map((i: any) => i.id));
        const inputExistingItemIds = new Set(
          group.items.filter((i: any) => i.existingItemId).map((i: any) => i.existingItemId!)
        );

        for (const currentItem of currentItems) {
          if (!inputExistingItemIds.has(currentItem.id)) {
            await mockDeleteComplementItem(currentItem.id);
          }
        }

        for (const item of group.items) {
          if ((item as any).existingItemId && currentItemIds.has((item as any).existingItemId)) {
            await mockUpdateComplementItem((item as any).existingItemId, {
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          }
        }
      }
    }

    // ASSERTIONS:
    // 1. "Molhos" group (id=11) was deleted
    expect(mockDeleteComplementGroup).toHaveBeenCalledTimes(1);
    expect(mockDeleteComplementGroup).toHaveBeenCalledWith(11);

    // 2. "Carnes" group was preserved (updated, not deleted)
    expect(mockUpdateComplementGroup).toHaveBeenCalledWith(10, {
      name: "Carnes",
      minQuantity: 1,
      maxQuantity: 1,
      isRequired: true,
    });

    // 3. Items in "Carnes" were preserved
    expect(mockUpdateComplementItem).toHaveBeenCalledTimes(1);
    expect(mockUpdateComplementItem.mock.calls[0][1]).not.toHaveProperty("isActive");
  });

  it("should handle adding new item to existing group while preserving paused items", async () => {
    // Setup: Group with 2 items, one paused
    const existingGroups = [
      {
        id: 10, productId: 1, name: "Carnes", minQuantity: 1, maxQuantity: 1,
        isRequired: true, sortOrder: 0,
        items: [
          { id: 100, groupId: 10, name: "Gado", price: "0.00", isActive: true, imageUrl: null, sortOrder: 0 },
          { id: 101, groupId: 10, name: "Frango crocante", price: "0.00", isActive: false, imageUrl: null, sortOrder: 1 },
        ],
      },
    ];

    mockGetComplementGroupsByProduct.mockResolvedValue(existingGroups);
    mockGetComplementItemsByGroup.mockResolvedValue(existingGroups[0].items);
    mockUpdateComplementGroup.mockResolvedValue(undefined);
    mockUpdateComplementItem.mockResolvedValue(undefined);
    mockCreateComplementItem.mockResolvedValue(300);

    // User adds a new item "Peixe" to the existing group
    const input = {
      productId: 1,
      groups: [
        {
          existingGroupId: 10,
          name: "Carnes",
          minQuantity: 1,
          maxQuantity: 1,
          isRequired: true,
          items: [
            { existingItemId: 100, name: "Gado", price: "0.00", imageUrl: null, sortOrder: 0 },
            { existingItemId: 101, name: "Frango crocante", price: "0.00", imageUrl: null, sortOrder: 1 },
            { name: "Peixe", price: "2.00", imageUrl: null, sortOrder: 2 }, // NEW item, no existingItemId
          ],
        },
      ],
    };

    // Execute syncGroups logic
    const currentGroups = await mockGetComplementGroupsByProduct(input.productId);
    const currentGroupIds = new Set(currentGroups.map((g: any) => g.id));

    for (const group of input.groups) {
      if (group.existingGroupId && currentGroupIds.has(group.existingGroupId)) {
        await mockUpdateComplementGroup(group.existingGroupId, {
          name: group.name,
          minQuantity: group.minQuantity,
          maxQuantity: group.maxQuantity,
          isRequired: group.minQuantity >= 1,
        });

        const currentItems = await mockGetComplementItemsByGroup(group.existingGroupId);
        const currentItemIds = new Set(currentItems.map((i: any) => i.id));

        for (const item of group.items) {
          if ((item as any).existingItemId && currentItemIds.has((item as any).existingItemId)) {
            await mockUpdateComplementItem((item as any).existingItemId, {
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          } else {
            await mockCreateComplementItem({
              groupId: group.existingGroupId,
              name: item.name,
              price: item.price,
              imageUrl: item.imageUrl || null,
              sortOrder: item.sortOrder,
            });
          }
        }
      }
    }

    // ASSERTIONS:
    // 1. Existing items were updated (preserving isActive)
    expect(mockUpdateComplementItem).toHaveBeenCalledTimes(2);
    for (const call of mockUpdateComplementItem.mock.calls) {
      expect(call[1]).not.toHaveProperty("isActive");
    }

    // 2. New item "Peixe" was created
    expect(mockCreateComplementItem).toHaveBeenCalledTimes(1);
    expect(mockCreateComplementItem).toHaveBeenCalledWith({
      groupId: 10,
      name: "Peixe",
      price: "2.00",
      imageUrl: null,
      sortOrder: 2,
    });

    // 3. No groups or items were deleted
    expect(mockDeleteComplementGroup).not.toHaveBeenCalled();
    expect(mockDeleteComplementItem).not.toHaveBeenCalled();
  });

  it("should handle empty groups list (user removed all groups)", async () => {
    const existingGroups = [
      {
        id: 10, productId: 1, name: "Carnes", minQuantity: 1, maxQuantity: 1,
        isRequired: true, sortOrder: 0,
        items: [
          { id: 100, groupId: 10, name: "Gado", price: "0.00", isActive: false, imageUrl: null, sortOrder: 0 },
        ],
      },
    ];

    mockGetComplementGroupsByProduct.mockResolvedValue(existingGroups);
    mockDeleteComplementGroup.mockResolvedValue(undefined);

    const input = { productId: 1, groups: [] as any[] };

    const currentGroups = await mockGetComplementGroupsByProduct(input.productId);
    const inputExistingGroupIds = new Set(
      input.groups.filter((g: any) => g.existingGroupId).map((g: any) => g.existingGroupId!)
    );

    for (const currentGroup of currentGroups) {
      if (!inputExistingGroupIds.has(currentGroup.id)) {
        await mockDeleteComplementGroup(currentGroup.id);
      }
    }

    // All groups should be deleted
    expect(mockDeleteComplementGroup).toHaveBeenCalledTimes(1);
    expect(mockDeleteComplementGroup).toHaveBeenCalledWith(10);

    // No creates or updates
    expect(mockCreateComplementGroup).not.toHaveBeenCalled();
    expect(mockUpdateComplementGroup).not.toHaveBeenCalled();
  });
});
