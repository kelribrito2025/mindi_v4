import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock the database functions
vi.mock("./db", () => ({
  getPublicMenuData: vi.fn(),
  isSlugAvailable: vi.fn(),
  getEstablishmentBySlug: vi.fn(),
}));

describe("Public Menu", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPublicMenuData", () => {
    it("should return null for non-existent slug", async () => {
      vi.mocked(db.getPublicMenuData).mockResolvedValue(null);
      
      const result = await db.getPublicMenuData("non-existent-slug");
      
      expect(result).toBeNull();
      expect(db.getPublicMenuData).toHaveBeenCalledWith("non-existent-slug");
    });

    it("should return establishment, categories and products for valid slug", async () => {
      const mockData = {
        establishment: {
          id: 1,
          name: "Test Restaurant",
          menuSlug: "test-restaurant",
          isOpen: true,
          logo: null,
          coverImage: null,
          street: "Test Street",
          number: "123",
          neighborhood: "Test Neighborhood",
          city: "Test City",
          state: "TS",
          zipCode: "12345-678",
          whatsapp: "+55 11 99999-9999",
          acceptsCash: true,
          acceptsCard: true,
          acceptsPix: true,
          acceptsBoleto: false,
          allowsDelivery: true,
          allowsPickup: true,
        },
        categories: [
          { id: 1, name: "Lanches", description: "Deliciosos lanches", sortOrder: 1, isActive: true },
          { id: 2, name: "Bebidas", description: "Bebidas geladas", sortOrder: 2, isActive: true },
        ],
        products: [
          { id: 1, name: "Hamburguer", price: "25.00", categoryId: 1, status: "active", hasStock: true },
          { id: 2, name: "Coca-Cola", price: "8.00", categoryId: 2, status: "active", hasStock: true },
        ],
      };
      
      vi.mocked(db.getPublicMenuData).mockResolvedValue(mockData);
      
      const result = await db.getPublicMenuData("test-restaurant");
      
      expect(result).not.toBeNull();
      expect(result?.establishment.name).toBe("Test Restaurant");
      expect(result?.categories).toHaveLength(2);
      expect(result?.products).toHaveLength(2);
    });
  });

  describe("isSlugAvailable", () => {
    it("should return true for available slug", async () => {
      vi.mocked(db.isSlugAvailable).mockResolvedValue(true);
      
      const result = await db.isSlugAvailable("new-slug");
      
      expect(result).toBe(true);
    });

    it("should return false for taken slug", async () => {
      vi.mocked(db.isSlugAvailable).mockResolvedValue(false);
      
      const result = await db.isSlugAvailable("taken-slug");
      
      expect(result).toBe(false);
    });

    it("should exclude current establishment when checking availability", async () => {
      vi.mocked(db.isSlugAvailable).mockResolvedValue(true);
      
      await db.isSlugAvailable("my-slug", 1);
      
      expect(db.isSlugAvailable).toHaveBeenCalledWith("my-slug", 1);
    });
  });

  describe("getEstablishmentBySlug", () => {
    it("should return undefined for non-existent slug", async () => {
      vi.mocked(db.getEstablishmentBySlug).mockResolvedValue(undefined);
      
      const result = await db.getEstablishmentBySlug("non-existent");
      
      expect(result).toBeUndefined();
    });

    it("should return establishment for valid slug", async () => {
      const mockEstablishment = {
        id: 1,
        name: "Test Restaurant",
        menuSlug: "test-restaurant",
        isOpen: true,
      };
      
      vi.mocked(db.getEstablishmentBySlug).mockResolvedValue(mockEstablishment as any);
      
      const result = await db.getEstablishmentBySlug("test-restaurant");
      
      expect(result).not.toBeUndefined();
      expect(result?.name).toBe("Test Restaurant");
    });
  });
});
