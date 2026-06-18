import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock uuid - return incrementing UUIDs so each call gets a unique value
let uuidCounter = 0;
vi.mock("uuid", () => ({
  v4: () => `test-uuid-${++uuidCounter}`,
}));

// Mock ifoodInfra
vi.mock("./ifoodInfra", () => ({
  ifoodApiCall: vi.fn(),
}));

// Mock ifood (getAccessTokenForEstablishment)
vi.mock("./ifood", () => ({
  getAccessTokenForEstablishment: vi.fn().mockResolvedValue("test-token-123"),
}));

// Mock logger
vi.mock("./_core/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

// Mock cache invalidation
vi.mock("./ifoodCatalogCache", () => ({
  invalidateCatalogCache: vi.fn(),
}));

// Mock db
const mockSelect = vi.fn();
const mockInsert = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();
const mockValues = vi.fn();
const mockSet = vi.fn();
const mockOnDuplicateKeyUpdate = vi.fn();

vi.mock("./db", () => {
  const createChain = (result: any[] = []) => {
    const chain: any = {
      from: () => chain,
      where: () => chain,
      limit: () => Promise.resolve(result),
      then: (resolve: any) => resolve(result),
    };
    // Make the chain thenable so await works
    chain[Symbol.iterator] = function* () { yield* result; };
    return chain;
  };
  return {
    getDb: vi.fn().mockResolvedValue({
      select: () => createChain([]),
      insert: () => ({ values: () => ({ onDuplicateKeyUpdate: () => Promise.resolve() }) }),
      update: () => ({ set: () => ({ where: () => Promise.resolve() }) }),
      delete: () => ({ where: () => Promise.resolve() }),
    }),
    getProductById: vi.fn(),
    getComplementGroupsByProduct: vi.fn(),
    getCategoriesByEstablishment: vi.fn(),
    getProductsByEstablishment: vi.fn(),
    getIfoodConfig: vi.fn(),
  };
});

// Mock schema
vi.mock("../drizzle/schema", () => ({
  ifoodProductMapping: { establishmentId: "establishmentId", localProductId: "localProductId" },
  ifoodCategoryMapping: { establishmentId: "establishmentId", localCategoryId: "localCategoryId" },
  ifoodComplementMapping: {},
  products: {},
  complementGroups: {},
  complementItems: {},
  categories: {},
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a, b) => ({ field: a, value: b })),
  and: vi.fn((...args: any[]) => args),
}));

describe("ifoodSync module", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uuidCounter = 0;
  });

  describe("buildIfoodItemPayload", () => {
    it("should build a valid iFood item payload from local product data", async () => {
      const { buildIfoodItemPayload } = await import("./ifoodSync");
      const db = await import("./db");

      const localProduct = {
        id: 1,
        name: "Açaí 300ml",
        description: "Açaí com granola e banana",
        price: "18.00",
        promotionalPrice: null,
        status: "active",
        images: ["https://example.com/acai.jpg"],
        categoryId: 1,
        sortOrder: 0,
      };

      // Mock complement groups
      (db.getComplementGroupsByProduct as any).mockResolvedValue([
        {
          id: 1,
          name: "Complementos",
          minQuantity: 0,
          maxQuantity: 4,
          isRequired: false,
          isActive: true,
          sortOrder: 0,
          items: [
            { id: 1, name: "Granola", price: "2.00", isActive: true, sortOrder: 0 },
            { id: 2, name: "Banana", price: "1.50", isActive: true, sortOrder: 1 },
          ],
        },
      ]);

      const payload = await buildIfoodItemPayload(localProduct, "cat-uuid-123");

      expect(payload).toBeDefined();
      // Main product is in the products array
      const mainProduct = payload!.products.find(p => p.id === payload!.item.productId);
      expect(mainProduct).toBeDefined();
      expect(mainProduct!.name).toBe("A\u00e7a\u00ed 300ml");
      expect(mainProduct!.description).toBe("A\u00e7a\u00ed com granola e banana");
      expect(payload!.item.price.value).toBe(18.00);
      expect(payload!.item.categoryId).toBe("cat-uuid-123");
      expect(payload!.item.status).toBe("AVAILABLE");
      // Option groups use optionIds format
      expect(payload!.optionGroups).toHaveLength(1);
      expect(payload!.optionGroups![0].name).toBe("Complementos");
      expect(payload!.optionGroups![0].optionIds).toHaveLength(2);
      expect(payload!.optionGroups![0].optionGroupType).toBe("DEFAULT");
      // Options are in separate top-level array
      expect(payload!.options).toHaveLength(2);
      expect(payload!.options![0].price.value).toBe(2.00);
      // Each option has its own product in the products array
      // products array: main product first, then option products
      // Find the option product by matching the option's productId
      const firstOptionProductId = payload!.options![0].productId;
      const optionProduct = payload!.products.find(p => p.id === firstOptionProductId);
      expect(optionProduct).toBeDefined();
      // Option products are created before main product is unshifted
      // First option product corresponds to first complement item "Granola"
      expect(optionProduct!.name).toBe("Granola");
    });

    it("should set UNAVAILABLE status for paused products", async () => {
      const { buildIfoodItemPayload } = await import("./ifoodSync");
      const db = await import("./db");

      const localProduct = {
        id: 2,
        name: "Pizza G",
        description: null,
        price: "5.55",
        promotionalPrice: null,
        status: "paused",
        images: null,
        categoryId: 1,
        sortOrder: 0,
      };

      (db.getComplementGroupsByProduct as any).mockResolvedValue([]);

      const payload = await buildIfoodItemPayload(localProduct, "cat-uuid-123");

      expect(payload).toBeDefined();
      expect(payload!.item.status).toBe("UNAVAILABLE");
    });

    it("should use promotional price when available", async () => {
      const { buildIfoodItemPayload } = await import("./ifoodSync");
      const db = await import("./db");

      const localProduct = {
        id: 3,
        name: "Oiuouioiu",
        description: null,
        price: "70.00",
        promotionalPrice: "56.00",
        status: "active",
        images: null,
        categoryId: 1,
        sortOrder: 0,
      };

      (db.getComplementGroupsByProduct as any).mockResolvedValue([]);

      const payload = await buildIfoodItemPayload(localProduct, "cat-uuid-123");

      expect(payload).toBeDefined();
      expect(payload!.item.price.value).toBe(56.00);
      expect(payload!.item.price.originalValue).toBe(70.00);
    });
  });

  describe("getProductMapping", () => {
    it("should return null when no mapping exists", async () => {
      const { getProductMapping } = await import("./ifoodSync");
      const result = await getProductMapping(1, 999);
      expect(result).toBeNull();
    });
  });

  describe("getCategoryMapping", () => {
    it("should return null when no mapping exists", async () => {
      const { getCategoryMapping } = await import("./ifoodSync");
      const result = await getCategoryMapping(1, 999);
      expect(result).toBeNull();
    });
  });

  describe("getAllProductMappings", () => {
    it("should return empty array when no mappings exist", async () => {
      const { getAllProductMappings } = await import("./ifoodSync");
      const result = await getAllProductMappings(1);
      expect(result).toEqual([]);
    });
  });

  describe("getAllCategoryMappings", () => {
    it("should return empty array when no mappings exist", async () => {
      const { getAllCategoryMappings } = await import("./ifoodSync");
      const result = await getAllCategoryMappings(1);
      expect(result).toEqual([]);
    });
  });
});
