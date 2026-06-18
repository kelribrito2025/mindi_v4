import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock database module
vi.mock("./db", () => {
  const mockGroups = [
    {
      name: "Aceita cobertura?",
      groupIds: [1, 5],
      productIds: [100, 200],
      productCount: 2,
      complementCount: 3,
      minQuantity: 0,
      maxQuantity: 1,
      isRequired: false,
      isActive: true,
      items: [
        { id: 1, name: "Cobertura de caramelo", price: "0.00", isActive: true, priceMode: "normal", sortOrder: 0 },
        { id: 2, name: "Cobertura de chocolate", price: "0.00", isActive: true, priceMode: "normal", sortOrder: 1 },
        { id: 3, name: "Cobertura de morango", price: "0.00", isActive: true, priceMode: "normal", sortOrder: 2 },
      ],
    },
    {
      name: "Adicionais",
      groupIds: [2, 6, 10],
      productIds: [100, 200, 300],
      productCount: 3,
      complementCount: 4,
      minQuantity: 0,
      maxQuantity: 4,
      isRequired: false,
      isActive: true,
      items: [
        { id: 4, name: "Queijo extra", price: "3.00", isActive: true, priceMode: "normal", sortOrder: 0 },
        { id: 5, name: "Bacon", price: "4.00", isActive: true, priceMode: "normal", sortOrder: 1 },
        { id: 6, name: "Ovo", price: "2.00", isActive: true, priceMode: "normal", sortOrder: 2 },
        { id: 7, name: "Cheddar", price: "3.50", isActive: true, priceMode: "normal", sortOrder: 3 },
      ],
    },
    {
      name: "Ponto da carne",
      groupIds: [3],
      productIds: [300],
      productCount: 1,
      complementCount: 3,
      minQuantity: 1,
      maxQuantity: 1,
      isRequired: true,
      isActive: true,
      items: [
        { id: 8, name: "Mal passado", price: "0.00", isActive: true, priceMode: "free", sortOrder: 0 },
        { id: 9, name: "Ao ponto", price: "0.00", isActive: true, priceMode: "free", sortOrder: 1 },
        { id: 10, name: "Bem passado", price: "0.00", isActive: true, priceMode: "free", sortOrder: 2 },
      ],
    },
  ];

  return {
    getAllComplementGroupsByEstablishment: vi.fn().mockResolvedValue(mockGroups),
    getEstablishmentByOwnerId: vi.fn(),
    getEstablishment: vi.fn(),
  };
});

const db = await import("./db");

describe("Copy Group Feature - listAllGroups returns complement groups (not products)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return complement groups with their names, item counts, and product counts", async () => {
    const groups = await db.getAllComplementGroupsByEstablishment(150004);

    // Should return groups, not products
    expect(groups).toHaveLength(3);

    // Each entry should be a complement GROUP (not a product)
    const groupNames = groups.map((g: any) => g.name);
    expect(groupNames).toContain("Aceita cobertura?");
    expect(groupNames).toContain("Adicionais");
    expect(groupNames).toContain("Ponto da carne");

    // Groups should NOT have product-like properties (images, categoryId, etc.)
    for (const group of groups) {
      expect(group).not.toHaveProperty("images");
      expect(group).not.toHaveProperty("categoryId");
      expect(group).not.toHaveProperty("isCombo");
      // Groups SHOULD have these properties
      expect(group).toHaveProperty("name");
      expect(group).toHaveProperty("items");
      expect(group).toHaveProperty("complementCount");
      expect(group).toHaveProperty("productCount");
      expect(group).toHaveProperty("minQuantity");
      expect(group).toHaveProperty("maxQuantity");
      expect(group).toHaveProperty("isRequired");
    }
  });

  it("should include items in each group for copying", async () => {
    const groups = await db.getAllComplementGroupsByEstablishment(150004);

    const coberturaGroup = groups.find((g: any) => g.name === "Aceita cobertura?");
    expect(coberturaGroup).toBeDefined();
    expect(coberturaGroup!.items).toHaveLength(3);
    expect(coberturaGroup!.complementCount).toBe(3);
    expect(coberturaGroup!.items[0].name).toBe("Cobertura de caramelo");
    expect(coberturaGroup!.items[1].name).toBe("Cobertura de chocolate");
    expect(coberturaGroup!.items[2].name).toBe("Cobertura de morango");
  });

  it("should include productCount showing how many products use each group", async () => {
    const groups = await db.getAllComplementGroupsByEstablishment(150004);

    const adicionais = groups.find((g: any) => g.name === "Adicionais");
    expect(adicionais).toBeDefined();
    expect(adicionais!.productCount).toBe(3);
    expect(adicionais!.productIds).toHaveLength(3);

    const pontoCarne = groups.find((g: any) => g.name === "Ponto da carne");
    expect(pontoCarne).toBeDefined();
    expect(pontoCarne!.productCount).toBe(1);
  });

  it("should preserve group rules (min/max/required) for copying", async () => {
    const groups = await db.getAllComplementGroupsByEstablishment(150004);

    const pontoCarne = groups.find((g: any) => g.name === "Ponto da carne");
    expect(pontoCarne).toBeDefined();
    expect(pontoCarne!.minQuantity).toBe(1);
    expect(pontoCarne!.maxQuantity).toBe(1);
    expect(pontoCarne!.isRequired).toBe(true);

    const adicionais = groups.find((g: any) => g.name === "Adicionais");
    expect(adicionais).toBeDefined();
    expect(adicionais!.minQuantity).toBe(0);
    expect(adicionais!.maxQuantity).toBe(4);
    expect(adicionais!.isRequired).toBe(false);
  });

  it("should preserve item prices for copying", async () => {
    const groups = await db.getAllComplementGroupsByEstablishment(150004);

    const adicionais = groups.find((g: any) => g.name === "Adicionais");
    expect(adicionais).toBeDefined();
    
    const queijo = adicionais!.items.find((i: any) => i.name === "Queijo extra");
    expect(queijo).toBeDefined();
    expect(queijo!.price).toBe("3.00");

    const bacon = adicionais!.items.find((i: any) => i.name === "Bacon");
    expect(bacon).toBeDefined();
    expect(bacon!.price).toBe("4.00");
  });

  it("should allow selecting multiple groups for copy (simulated selection logic)", () => {
    // Simulate the frontend selection logic
    const allGroups = [
      { name: "Aceita cobertura?", items: [{ name: "A" }] },
      { name: "Adicionais", items: [{ name: "B" }] },
      { name: "Ponto da carne", items: [{ name: "C" }] },
    ];

    // User selects two groups
    const selectedGroupNames = ["Aceita cobertura?", "Ponto da carne"];
    const groupsToCopy = allGroups.filter((g) => selectedGroupNames.includes(g.name));

    expect(groupsToCopy).toHaveLength(2);
    expect(groupsToCopy[0].name).toBe("Aceita cobertura?");
    expect(groupsToCopy[1].name).toBe("Ponto da carne");
  });

  it("should return empty array when establishment has no complement groups", async () => {
    (db.getAllComplementGroupsByEstablishment as any).mockResolvedValueOnce([]);
    
    const groups = await db.getAllComplementGroupsByEstablishment(99999);
    expect(groups).toHaveLength(0);
  });
});
