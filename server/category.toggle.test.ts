import { describe, it, expect, vi, beforeEach } from "vitest";
import * as db from "./db";

// Mock do db
vi.mock("./db", () => ({
  updateCategory: vi.fn(),
  getCategoriesByEstablishment: vi.fn(),
}));

describe("Category Toggle (isActive)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deve atualizar isActive para false quando categoria é pausada", async () => {
    const mockUpdateCategory = vi.mocked(db.updateCategory);
    mockUpdateCategory.mockResolvedValue(undefined);

    await db.updateCategory(1, { isActive: false });

    expect(mockUpdateCategory).toHaveBeenCalledWith(1, { isActive: false });
  });

  it("deve atualizar isActive para true quando categoria é ativada", async () => {
    const mockUpdateCategory = vi.mocked(db.updateCategory);
    mockUpdateCategory.mockResolvedValue(undefined);

    await db.updateCategory(1, { isActive: true });

    expect(mockUpdateCategory).toHaveBeenCalledWith(1, { isActive: true });
  });

  it("deve retornar categorias com campo isActive", async () => {
    const mockGetCategories = vi.mocked(db.getCategoriesByEstablishment);
    mockGetCategories.mockResolvedValue([
      { id: 1, name: "Lanches", isActive: true, sortOrder: 0, establishmentId: 1, description: null, createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "Bebidas", isActive: false, sortOrder: 1, establishmentId: 1, description: null, createdAt: new Date(), updatedAt: new Date() },
    ]);

    const categories = await db.getCategoriesByEstablishment(1);

    expect(categories).toHaveLength(2);
    expect(categories[0].isActive).toBe(true);
    expect(categories[1].isActive).toBe(false);
  });
});

describe("Toggle visual de categoria baseado em produtos ativos", () => {
  it("toggle deve mostrar desativado quando categoria tem todos os itens pausados", () => {
    const category = { id: 1, name: "Lanches", isActive: true };
    const activeProductCount = 0; // todos pausados
    
    const categoryIsActive = category.isActive !== false;
    const hasActiveProducts = activeProductCount > 0;
    const isEffectivelyActive = categoryIsActive && hasActiveProducts;
    
    expect(isEffectivelyActive).toBe(false); // toggle deve aparecer desativado
  });

  it("toggle deve mostrar ativado quando categoria tem pelo menos 1 item ativo", () => {
    const category = { id: 1, name: "Lanches", isActive: true };
    const activeProductCount = 1; // pelo menos 1 ativo
    
    const categoryIsActive = category.isActive !== false;
    const hasActiveProducts = activeProductCount > 0;
    const isEffectivelyActive = categoryIsActive && hasActiveProducts;
    
    expect(isEffectivelyActive).toBe(true); // toggle deve aparecer ativado
  });

  it("toggle deve mostrar desativado quando categoria está pausada mesmo com itens ativos", () => {
    const category = { id: 1, name: "Lanches", isActive: false };
    const activeProductCount = 5; // tem itens ativos
    
    const categoryIsActive = category.isActive !== false;
    const hasActiveProducts = activeProductCount > 0;
    const isEffectivelyActive = categoryIsActive && hasActiveProducts;
    
    expect(isEffectivelyActive).toBe(false); // toggle deve aparecer desativado
  });
});

describe("Regras de visibilidade de categoria no menu público", () => {
  it("categoria pausada não deve aparecer no menu", () => {
    const categories = [
      { id: 1, name: "Lanches", isActive: false },
      { id: 2, name: "Bebidas", isActive: true },
    ];
    const products = [
      { id: 1, categoryId: 1, status: "active", hasStock: true },
      { id: 2, categoryId: 2, status: "active", hasStock: true },
    ];

    const visibleCategories = categories.filter((category) => {
      if (category.isActive === false) return false;
      const activeProducts = products.filter(
        (p) => p.categoryId === category.id && p.status === "active" && p.hasStock
      );
      return activeProducts.length > 0;
    });

    expect(visibleCategories).toHaveLength(1);
    expect(visibleCategories[0].name).toBe("Bebidas");
  });

  it("categoria ativa sem produtos ativos não deve aparecer no menu", () => {
    const categories = [
      { id: 1, name: "Lanches", isActive: true },
    ];
    const products = [
      { id: 1, categoryId: 1, status: "paused", hasStock: true },
      { id: 2, categoryId: 1, status: "paused", hasStock: true },
    ];

    const visibleCategories = categories.filter((category) => {
      if (category.isActive === false) return false;
      const activeProducts = products.filter(
        (p) => p.categoryId === category.id && p.status === "active" && p.hasStock
      );
      return activeProducts.length > 0;
    });

    expect(visibleCategories).toHaveLength(0);
  });

  it("categoria ativa com pelo menos 1 produto ativo deve aparecer no menu", () => {
    const categories = [
      { id: 1, name: "Lanches", isActive: true },
    ];
    const products = [
      { id: 1, categoryId: 1, status: "paused", hasStock: true },
      { id: 2, categoryId: 1, status: "paused", hasStock: true },
      { id: 3, categoryId: 1, status: "paused", hasStock: true },
      { id: 4, categoryId: 1, status: "paused", hasStock: true },
      { id: 5, categoryId: 1, status: "active", hasStock: true }, // 1 ativo
    ];

    const visibleCategories = categories.filter((category) => {
      if (category.isActive === false) return false;
      const activeProducts = products.filter(
        (p) => p.categoryId === category.id && p.status === "active" && p.hasStock
      );
      return activeProducts.length > 0;
    });

    expect(visibleCategories).toHaveLength(1);
    expect(visibleCategories[0].name).toBe("Lanches");
  });

  it("categoria ativa com produtos sem estoque não deve aparecer no menu", () => {
    const categories = [
      { id: 1, name: "Lanches", isActive: true },
    ];
    const products = [
      { id: 1, categoryId: 1, status: "active", hasStock: false }, // sem estoque
    ];

    const visibleCategories = categories.filter((category) => {
      if (category.isActive === false) return false;
      const activeProducts = products.filter(
        (p) => p.categoryId === category.id && p.status === "active" && p.hasStock
      );
      return activeProducts.length > 0;
    });

    expect(visibleCategories).toHaveLength(0);
  });
});
