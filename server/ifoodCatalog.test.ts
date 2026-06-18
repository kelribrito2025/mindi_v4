import { describe, it, expect, vi, beforeEach } from "vitest";
import { invalidateAllCatalogCache } from "./ifoodCatalogCache";

// Mock ifoodInfra
vi.mock("./ifoodInfra", () => ({
  ifoodApiCall: vi.fn(),
}));

// Mock ifood (getAccessTokenForEstablishment)
vi.mock("./ifood", () => ({
  getAccessTokenForEstablishment: vi.fn().mockResolvedValue("mock-token-123"),
}));

// Mock logger
vi.mock("./_core/logger", () => ({
  logger: { error: vi.fn(), info: vi.fn(), warn: vi.fn() },
}));

import { ifoodApiCall } from "./ifoodInfra";
import {
  getCatalogs,
  getCategories,
  getProducts,
  getProductDetails,
  updateProduct,
  updateProductStatus,
  updateProductPrice,
  updateCategoryStatus,
  updateCategory,
  getFullCatalog,
  syncLocalProductToIfood,
  bulkUpdateCategoryProductsStatus,
} from "./ifoodCatalog";

const mockedIfoodApiCall = vi.mocked(ifoodApiCall);

// ─── Helper ──────────────────────────────────────────────────────────

function mockResponse(data: any, ok = true, status = 200) {
  return {
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────

describe("iFood Catalog Module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear catalog cache between tests to prevent cache interference
    invalidateAllCatalogCache();
  });

  describe("getCatalogs", () => {
    it("should list all catalogs for a merchant", async () => {
      const mockCatalogs = [
        { catalogId: "cat-1", context: "DELIVERY", status: "ACTIVE" },
        { catalogId: "cat-2", context: "DIGITAL_MENU", status: "ACTIVE" },
      ];
      mockedIfoodApiCall.mockResolvedValue(mockResponse(mockCatalogs));

      const result = await getCatalogs(1, "merchant-uuid");

      expect(result).toEqual(mockCatalogs);
      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/merchants/merchant-uuid/catalogs"),
        expect.objectContaining({ method: "GET", token: "mock-token-123" }),
        expect.objectContaining({ maxRetries: 2 })
      );
    });

    it("should throw on API error", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse("Server error", false, 500));

      await expect(getCatalogs(1, "merchant-uuid")).rejects.toThrow("Falha ao listar catálogos: 500");
    });
  });

  describe("getCategories", () => {
    it("should list categories for a catalog", async () => {
      const mockCategories = [
        { id: "cat-id-1", name: "Pizzas", status: "AVAILABLE", order: 1 },
        { id: "cat-id-2", name: "Bebidas", status: "AVAILABLE", order: 2 },
      ];
      mockedIfoodApiCall.mockResolvedValue(mockResponse(mockCategories));

      const result = await getCategories(1, "merchant-uuid", "catalog-1");

      expect(result).toEqual(mockCategories);
      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/catalogs/catalog-1/categories"),
        expect.objectContaining({ method: "GET" }),
        expect.any(Object)
      );
    });

    it("should throw on API error", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse("Not found", false, 404));

      await expect(getCategories(1, "merchant-uuid", "catalog-1")).rejects.toThrow("Falha ao listar categorias: 404");
    });
  });

  describe("getProducts", () => {
    it("should map sellableItems response fields to IfoodCatalogProduct format", async () => {
      // sellableItems returns items with "item" prefix on field names
      const sellableItemsResponse = [
        {
          itemId: "item-1",
          categoryId: "cat-1",
          itemEan: "123",
          itemExternalCode: "BG-1",
          categoryName: "Burgers",
          categoryIndex: 0,
          itemName: "X-burger",
          itemDescription: "Bread, meat and cheese",
          logosUrls: ["https://example.com/image.jpg"],
          itemIndex: 0,
          itemPrice: { value: 20, originalValue: 30 },
          itemSchedules: [{ startTime: "00:00", endTime: "23:59" }],
          itemOptionGroups: [{ id: "og-1", name: "Extras", min: 0, max: 3 }],
        },
        {
          itemId: "item-2",
          categoryId: "cat-2",
          itemName: "Coca-Cola",
          itemDescription: "350ml",
          logosUrls: [],
          itemPrice: { value: 8 },
          itemSchedules: [],
          itemOptionGroups: [],
        },
      ];
      mockedIfoodApiCall.mockResolvedValue(mockResponse(sellableItemsResponse));

      const result = await getProducts(1, "merchant-uuid", "catalog-1");

      expect(result).toHaveLength(2);
      // Verify mapping of first product
      expect(result[0].id).toBe("item-1");
      expect(result[0].name).toBe("X-burger");
      expect(result[0].description).toBe("Bread, meat and cheese");
      expect(result[0].externalCode).toBe("BG-1");
      expect(result[0].image).toBe("https://example.com/image.jpg");
      expect(result[0].status).toBe("AVAILABLE");
      expect(result[0].price).toEqual({ value: 20, originalValue: 30 });
      expect(result[0].categoryId).toBe("cat-1");
      expect(result[0].ean).toBe("123");
      expect(result[0].shifts).toHaveLength(1);
      expect(result[0].optionGroups).toHaveLength(1);
      // Verify second product with empty logosUrls
      expect(result[1].id).toBe("item-2");
      expect(result[1].name).toBe("Coca-Cola");
      expect(result[1].image).toBeUndefined();
      expect(result[1].categoryId).toBe("cat-2");
    });

     it("should return empty array when sellableItems fails", async () => {
      // sellableItems fails - should return empty array (no fallback to /products)
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse("Not found", false, 404));

      const result = await getProducts(1, "merchant-uuid", "catalog-1");

      expect(result).toHaveLength(0);
      expect(mockedIfoodApiCall).toHaveBeenCalledTimes(1);
    });

    it("should handle standard field names from sellableItems", async () => {
      // sellableItems returns items with standard field names (id, name instead of itemId, itemName)
      const standardItems = [
        { id: "prod-1", name: "Standard", status: "AVAILABLE", price: { value: 15 }, categoryId: "cat-1" },
      ];
      mockedIfoodApiCall.mockResolvedValue(mockResponse(standardItems));
      const result = await getProducts(1, "merchant-uuid", "catalog-1");
      expect(result[0].id).toBe("prod-1");
      expect(result[0].name).toBe("Standard");
      expect(result[0].price).toEqual({ value: 15 });
      expect(result[0].categoryId).toBe("cat-1");
    });;
  });

  describe("getProductDetails", () => {
    it("should fetch details of a specific product", async () => {
      const mockProduct = {
        id: "prod-1",
        name: "Pizza Margherita",
        description: "Molho, mussarela e manjericão",
        status: "AVAILABLE",
        price: { value: 39.90 },
        image: "https://img.ifood.com/pizza.jpg",
      };
      mockedIfoodApiCall.mockResolvedValue(mockResponse(mockProduct));

      const result = await getProductDetails(1, "merchant-uuid", "catalog-1", "prod-1");

      expect(result).toEqual(mockProduct);
      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1"),
        expect.objectContaining({ method: "GET" }),
        expect.any(Object)
      );
    });
  });

  describe("updateProduct", () => {
    it("should update product data", async () => {
      const updateData = { name: "Pizza Margherita Especial", price: { value: 45.90 } };
      mockedIfoodApiCall.mockResolvedValue(mockResponse({ ...updateData, id: "prod-1" }));

      const result = await updateProduct(1, "merchant-uuid", "catalog-1", "prod-1", updateData);

      expect(result.name).toBe("Pizza Margherita Especial");
      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
          headers: { "Content-Type": "application/json" },
        }),
        expect.any(Object)
      );
    });

    it("should throw on API error", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse("Bad request", false, 400));

      await expect(
        updateProduct(1, "merchant-uuid", "catalog-1", "prod-1", { name: "" })
      ).rejects.toThrow("Falha ao atualizar produto: 400");
    });
  });

  describe("updateProductStatus", () => {
    it("should set product to AVAILABLE", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse(null, true, 200));

      await updateProductStatus(1, "merchant-uuid", "catalog-1", "prod-1", "AVAILABLE");

      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1/status"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "AVAILABLE" }),
        }),
        expect.any(Object)
      );
    });

    it("should set product to UNAVAILABLE", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse(null, true, 200));

      await updateProductStatus(1, "merchant-uuid", "catalog-1", "prod-1", "UNAVAILABLE");

      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1/status"),
        expect.objectContaining({
          body: JSON.stringify({ status: "UNAVAILABLE" }),
        }),
        expect.any(Object)
      );
    });

    it("should throw on API error", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse("Forbidden", false, 403));

      await expect(
        updateProductStatus(1, "merchant-uuid", "catalog-1", "prod-1", "AVAILABLE")
      ).rejects.toThrow("Falha ao atualizar status do produto: 403");
    });
  });

  describe("updateProductPrice", () => {
    it("should update product price", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse(null, true, 200));

      await updateProductPrice(1, "merchant-uuid", "catalog-1", "prod-1", 49.90);

      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ price: { value: 49.90 } }),
        }),
        expect.any(Object)
      );
    });

    it("should include originalPrice when provided", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse(null, true, 200));

      await updateProductPrice(1, "merchant-uuid", "catalog-1", "prod-1", 39.90, 49.90);

      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/products/prod-1"),
        expect.objectContaining({
          body: JSON.stringify({ price: { value: 39.90, originalValue: 49.90 } }),
        }),
        expect.any(Object)
      );
    });
  });

  describe("updateCategoryStatus", () => {
    it("should update category availability", async () => {
      mockedIfoodApiCall.mockResolvedValue(mockResponse(null, true, 200));

      await updateCategoryStatus(1, "merchant-uuid", "catalog-1", "cat-1", "UNAVAILABLE");

      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/categories/cat-1/status"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify({ status: "UNAVAILABLE" }),
        }),
        expect.any(Object)
      );
    });
  });

  describe("updateCategory", () => {
    it("should update category data", async () => {
      const updateData = { name: "Pizzas Especiais", order: 1 };
      mockedIfoodApiCall.mockResolvedValue(mockResponse({ id: "cat-1", ...updateData }));

      const result = await updateCategory(1, "merchant-uuid", "catalog-1", "cat-1", updateData);

      expect(result.name).toBe("Pizzas Especiais");
      expect(mockedIfoodApiCall).toHaveBeenCalledWith(
        expect.stringContaining("/categories/cat-1"),
        expect.objectContaining({
          method: "PATCH",
          body: JSON.stringify(updateData),
        }),
        expect.any(Object)
      );
    });
  });

  describe("getFullCatalog", () => {
    it("should return hierarchical catalog structure with sellableItems mapping", async () => {
      // First call: getCatalogs
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([{ catalogId: "cat-1", context: "DELIVERY", status: "ACTIVE" }])
      );
      // Second call: getCategories
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([
          { id: "categ-1", name: "Pizzas", status: "AVAILABLE" },
          { id: "categ-2", name: "Bebidas", status: "AVAILABLE" },
        ])
      );
      // Third call: getProducts (sellableItems format with item-prefixed fields)
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([
          { itemId: "prod-1", itemName: "Margherita", itemPrice: { value: 39.90 }, categoryId: "categ-1", logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
          { itemId: "prod-2", itemName: "Coca-Cola", itemPrice: { value: 8.00 }, categoryId: "categ-2", logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
        ])
      );

      const result = await getFullCatalog(1, "merchant-uuid");

      expect(result.catalogs).toHaveLength(1);
      expect(result.catalogs[0].categories).toHaveLength(2);
      expect(result.catalogs[0].categories[0].products).toHaveLength(1);
      expect(result.catalogs[0].categories[0].products[0].name).toBe("Margherita");
      expect(result.catalogs[0].categories[0].products[0].id).toBe("prod-1");
      expect(result.catalogs[0].categories[1].products[0].name).toBe("Coca-Cola");
      expect(result.catalogs[0].categories[1].products[0].id).toBe("prod-2");
    });

    it("should handle errors gracefully for individual catalogs", async () => {
      // Use a different establishmentId to avoid cache from previous test
      // First call: getCatalogs
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([{ catalogId: "cat-1", context: "DELIVERY", status: "ACTIVE" }])
      );
      // Second call: getCategories - fails
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse("Error", false, 500));
      const result = await getFullCatalog(99, "merchant-uuid");
      expect(result.catalogs).toHaveLength(1);
      expect(result.catalogs[0].categories).toEqual([]);
    });
  });

  describe("syncLocalProductToIfood", () => {
    it("should sync local product data and status to iFood", async () => {
      // First call: updateProduct
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse({ id: "prod-1" }));
      // Second call: updateProductStatus
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));

      const result = await syncLocalProductToIfood(1, "merchant-uuid", "catalog-1", "prod-1", {
        name: "Pizza Calabresa",
        description: "Calabresa com cebola",
        price: 42.90,
        status: "active",
        images: ["https://img.example.com/pizza.jpg"],
      });

      expect(result.updated).toBe(true);
      expect(result.statusSynced).toBe(true);
      expect(mockedIfoodApiCall).toHaveBeenCalledTimes(2);
    });

    it("should map paused status to UNAVAILABLE", async () => {
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse({ id: "prod-1" }));
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));

      await syncLocalProductToIfood(1, "merchant-uuid", "catalog-1", "prod-1", {
        name: "Item Pausado",
        price: 10.00,
        status: "paused",
      });

      // Second call should have UNAVAILABLE
      const secondCall = mockedIfoodApiCall.mock.calls[1];
      expect(secondCall[1].body).toContain("UNAVAILABLE");
    });

    it("should handle partial failures gracefully", async () => {
      // updateProduct fails
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse("Error", false, 500));
      // updateProductStatus succeeds
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));

      const result = await syncLocalProductToIfood(1, "merchant-uuid", "catalog-1", "prod-1", {
        name: "Test",
        price: 10.00,
        status: "active",
      });

      expect(result.updated).toBe(false);
      expect(result.statusSynced).toBe(true);
    });
  });

  describe("bulkUpdateCategoryProductsStatus", () => {
    it("should update all products in a category", async () => {
      // First call: getProducts (sellableItems format)
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([
          { itemId: "prod-1", itemName: "Item 1", categoryId: "cat-1", itemPrice: { value: 10 }, logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
          { itemId: "prod-2", itemName: "Item 2", categoryId: "cat-1", itemPrice: { value: 20 }, logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
          { itemId: "prod-3", itemName: "Item 3", categoryId: "cat-2", itemPrice: { value: 30 }, logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
        ])
      );
      // Two updateProductStatus calls (only cat-1 products)
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));

      const result = await bulkUpdateCategoryProductsStatus(1, "merchant-uuid", "catalog-1", "cat-1", "UNAVAILABLE");

      expect(result.total).toBe(2);
      expect(result.success).toBe(2);
      expect(result.failed).toBe(0);
    });

    it("should count failures separately", async () => {
      // getProducts (sellableItems format)
      mockedIfoodApiCall.mockResolvedValueOnce(
        mockResponse([
          { itemId: "prod-1", itemName: "Item 1", categoryId: "cat-1", itemPrice: { value: 10 }, logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
          { itemId: "prod-2", itemName: "Item 2", categoryId: "cat-1", itemPrice: { value: 20 }, logosUrls: [], itemSchedules: [], itemOptionGroups: [] },
        ])
      );
      // First update succeeds, second fails
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse(null, true, 200));
      mockedIfoodApiCall.mockResolvedValueOnce(mockResponse("Error", false, 500));

      const result = await bulkUpdateCategoryProductsStatus(1, "merchant-uuid", "catalog-1", "cat-1", "AVAILABLE");

      expect(result.total).toBe(2);
      expect(result.success).toBe(1);
      expect(result.failed).toBe(1);
    });
  });
});
