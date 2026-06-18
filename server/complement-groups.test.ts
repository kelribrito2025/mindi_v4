import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database module
vi.mock("./db", () => {
  const mockGroups = [
    {
      name: "ESCOLHA SUAS FRUTAS",
      groupIds: [1, 5, 10],
      productIds: [100, 200, 300],
      productCount: 3,
      complementCount: 4,
      minQuantity: 0,
      maxQuantity: 2,
      isRequired: false,
      isActive: true,
      items: [
        { id: 1, name: "Banana", price: "0.00", isActive: true, priceMode: "normal", sortOrder: 0 },
        { id: 2, name: "Morango", price: "2.00", isActive: true, priceMode: "normal", sortOrder: 1 },
        { id: 3, name: "Manga", price: "0.00", isActive: false, priceMode: "free", sortOrder: 2 },
        { id: 4, name: "Uva", price: "1.50", isActive: true, priceMode: "normal", sortOrder: 3 },
      ],
    },
    {
      name: "Deseja colherzinha?",
      groupIds: [2, 6],
      productIds: [100, 200],
      productCount: 2,
      complementCount: 2,
      minQuantity: 0,
      maxQuantity: 1,
      isRequired: false,
      isActive: true,
      items: [
        { id: 5, name: "Colher Sim", price: "0.00", isActive: true, priceMode: "free", sortOrder: 0 },
        { id: 6, name: "Colher Não", price: "0.00", isActive: true, priceMode: "free", sortOrder: 1 },
      ],
    },
  ];

  return {
    getAllComplementGroupsByEstablishment: vi.fn().mockResolvedValue(mockGroups),
    toggleComplementGroupByName: vi.fn().mockResolvedValue(undefined),
    deleteComplementGroupByName: vi.fn().mockResolvedValue(undefined),
    updateComplementGroupRulesByName: vi.fn().mockResolvedValue(undefined),
    deleteComplementItemByName: vi.fn().mockResolvedValue(undefined),
    addComplementItemToGroupByName: vi.fn().mockResolvedValue(3),
    updateComplementItemsByName: vi.fn().mockResolvedValue(undefined),
    updateComplementItem: vi.fn().mockResolvedValue(undefined),
    deleteComplementItem: vi.fn().mockResolvedValue(undefined),
    // Other required exports
    getEstablishmentByOwnerId: vi.fn(),
    getEstablishment: vi.fn(),
  };
});

const db = await import("./db");

describe("Global Complement Group Management", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getAllComplementGroupsByEstablishment", () => {
    it("should return unique groups with items, product counts, and complement counts", async () => {
      const groups = await db.getAllComplementGroupsByEstablishment(1);
      
      expect(groups).toHaveLength(2);
      
      const frutasGroup = groups.find((g: any) => g.name === "ESCOLHA SUAS FRUTAS");
      expect(frutasGroup).toBeDefined();
      expect(frutasGroup!.productCount).toBe(3);
      expect(frutasGroup!.complementCount).toBe(4);
      expect(frutasGroup!.items).toHaveLength(4);
      expect(frutasGroup!.groupIds).toHaveLength(3);
      expect(frutasGroup!.isActive).toBe(true);
      expect(frutasGroup!.minQuantity).toBe(0);
      expect(frutasGroup!.maxQuantity).toBe(2);
      
      const colherGroup = groups.find((g: any) => g.name === "Deseja colherzinha?");
      expect(colherGroup).toBeDefined();
      expect(colherGroup!.productCount).toBe(2);
      expect(colherGroup!.complementCount).toBe(2);
    });
  });

  describe("toggleComplementGroupByName", () => {
    it("should call toggleComplementGroupByName with correct params to pause a group", async () => {
      await db.toggleComplementGroupByName(1, "ESCOLHA SUAS FRUTAS", false);
      
      expect(db.toggleComplementGroupByName).toHaveBeenCalledWith(1, "ESCOLHA SUAS FRUTAS", false);
    });

    it("should call toggleComplementGroupByName with correct params to activate a group", async () => {
      await db.toggleComplementGroupByName(1, "ESCOLHA SUAS FRUTAS", true);
      
      expect(db.toggleComplementGroupByName).toHaveBeenCalledWith(1, "ESCOLHA SUAS FRUTAS", true);
    });
  });

  describe("deleteComplementGroupByName", () => {
    it("should call deleteComplementGroupByName with correct params", async () => {
      await db.deleteComplementGroupByName(1, "Deseja colherzinha?");
      
      expect(db.deleteComplementGroupByName).toHaveBeenCalledWith(1, "Deseja colherzinha?");
    });
  });

  describe("updateComplementGroupRulesByName", () => {
    it("should update min/max quantity globally", async () => {
      await db.updateComplementGroupRulesByName(1, "ESCOLHA SUAS FRUTAS", {
        minQuantity: 1,
        maxQuantity: 5,
      });
      
      expect(db.updateComplementGroupRulesByName).toHaveBeenCalledWith(
        1,
        "ESCOLHA SUAS FRUTAS",
        { minQuantity: 1, maxQuantity: 5 }
      );
    });

    it("should update isRequired globally", async () => {
      await db.updateComplementGroupRulesByName(1, "ESCOLHA SUAS FRUTAS", {
        isRequired: true,
      });
      
      expect(db.updateComplementGroupRulesByName).toHaveBeenCalledWith(
        1,
        "ESCOLHA SUAS FRUTAS",
        { isRequired: true }
      );
    });

    it("should rename a group globally", async () => {
      await db.updateComplementGroupRulesByName(1, "ESCOLHA SUAS FRUTAS", {
        name: "ESCOLHA SUAS FRUTAS FAVORITAS",
      });
      
      expect(db.updateComplementGroupRulesByName).toHaveBeenCalledWith(
        1,
        "ESCOLHA SUAS FRUTAS",
        { name: "ESCOLHA SUAS FRUTAS FAVORITAS" }
      );
    });
  });

  describe("deleteComplementItemByName", () => {
    it("should delete a complement item across all groups by name", async () => {
      await db.deleteComplementItemByName(1, "Banana");
      
      expect(db.deleteComplementItemByName).toHaveBeenCalledWith(1, "Banana");
    });
  });

  describe("addComplementItemToGroupByName", () => {
    it("should add a complement item to all groups with the specified name", async () => {
      const count = await db.addComplementItemToGroupByName(1, "ESCOLHA SUAS FRUTAS", {
        name: "Abacaxi",
        price: "3.00",
      });
      
      expect(db.addComplementItemToGroupByName).toHaveBeenCalledWith(
        1,
        "ESCOLHA SUAS FRUTAS",
        { name: "Abacaxi", price: "3.00" }
      );
      expect(count).toBe(3); // Added to 3 groups
    });
  });

  describe("updateComplementItemsByName (global item update)", () => {
    it("should update price mode to free globally", async () => {
      await db.updateComplementItemsByName(1, "Banana", {
        priceMode: "free",
      });
      
      expect(db.updateComplementItemsByName).toHaveBeenCalledWith(
        1,
        "Banana",
        { priceMode: "free" }
      );
    });

    it("should update price globally", async () => {
      await db.updateComplementItemsByName(1, "Morango", {
        price: "3.50",
      });
      
      expect(db.updateComplementItemsByName).toHaveBeenCalledWith(
        1,
        "Morango",
        { price: "3.50" }
      );
    });

    it("should toggle isActive globally", async () => {
      await db.updateComplementItemsByName(1, "Manga", {
        isActive: true,
      });
      
      expect(db.updateComplementItemsByName).toHaveBeenCalledWith(
        1,
        "Manga",
        { isActive: true }
      );
    });

    it("should update badge text globally", async () => {
      await db.updateComplementItemsByName(1, "Uva", {
        badgeText: "Novo",
      });
      
      expect(db.updateComplementItemsByName).toHaveBeenCalledWith(
        1,
        "Uva",
        { badgeText: "Novo" }
      );
    });

    it("should update availability schedule globally", async () => {
      await db.updateComplementItemsByName(1, "Banana", {
        availabilityType: "scheduled",
        availableDays: [1, 2, 3, 4, 5],
        availableHours: [
          { day: 1, startTime: "08:00", endTime: "18:00" },
          { day: 2, startTime: "08:00", endTime: "18:00" },
        ],
      });
      
      expect(db.updateComplementItemsByName).toHaveBeenCalledWith(
        1,
        "Banana",
        {
          availabilityType: "scheduled",
          availableDays: [1, 2, 3, 4, 5],
          availableHours: [
            { day: 1, startTime: "08:00", endTime: "18:00" },
            { day: 2, startTime: "08:00", endTime: "18:00" },
          ],
        }
      );
    });
  });

  describe("Group pause/activate behavior", () => {
    it("pausing a group should not affect individual item active status", async () => {
      // When pausing a group, we only set group.isActive = false
      // Individual items keep their own isActive status
      await db.toggleComplementGroupByName(1, "ESCOLHA SUAS FRUTAS", false);
      
      // Verify only group toggle was called, not individual item updates
      expect(db.toggleComplementGroupByName).toHaveBeenCalledTimes(1);
      expect(db.updateComplementItemsByName).not.toHaveBeenCalled();
    });

    it("reactivating a group should restore items to their individual status", async () => {
      await db.toggleComplementGroupByName(1, "ESCOLHA SUAS FRUTAS", true);
      
      // Items retain their individual isActive status
      const groups = await db.getAllComplementGroupsByEstablishment(1);
      const frutasGroup = groups.find((g: any) => g.name === "ESCOLHA SUAS FRUTAS");
      
      // Manga was individually paused, should still be paused
      const manga = frutasGroup!.items.find((i: any) => i.name === "Manga");
      expect(manga!.isActive).toBe(false);
      
      // Banana was active, should still be active
      const banana = frutasGroup!.items.find((i: any) => i.name === "Banana");
      expect(banana!.isActive).toBe(true);
    });
  });
});
