import { describe, it, expect } from "vitest";

/**
 * Test the global search filtering logic used across pages.
 * Each page applies the same pattern: filter items by searchQuery matching relevant fields.
 */

// Simulate the filtering logic used in each page
function filterBySearch<T extends Record<string, any>>(
  items: T[],
  searchQuery: string,
  fields: (keyof T)[]
): T[] {
  if (!searchQuery.trim()) return items;
  const term = searchQuery.toLowerCase().trim();
  return items.filter(item =>
    fields.some(field => {
      const value = item[field];
      if (typeof value === "string") return value.toLowerCase().includes(term);
      if (typeof value === "number") return value.toString().includes(term);
      return false;
    })
  );
}

describe("Global Search Filter Logic", () => {
  describe("Catálogo - filter products by name", () => {
    const products = [
      { id: 1, name: "Pizza Margherita", description: "Tomate e mozzarella", price: 35 },
      { id: 2, name: "Hambúrguer Artesanal", description: "Blend de carne", price: 28 },
      { id: 3, name: "Salada Caesar", description: "Alface, croutons, parmesão", price: 22 },
      { id: 4, name: "Salmão Grelhado", description: "Com legumes", price: 45 },
    ];

    it("should return all products when search is empty", () => {
      expect(filterBySearch(products, "", ["name"])).toHaveLength(4);
    });

    it("should filter products by name", () => {
      const result = filterBySearch(products, "pizza", ["name"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Pizza Margherita");
    });

    it("should be case insensitive", () => {
      const result = filterBySearch(products, "HAMBÚRGUER", ["name"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Hambúrguer Artesanal");
    });

    it("should return empty array when no match", () => {
      expect(filterBySearch(products, "sushi", ["name"])).toHaveLength(0);
    });
  });

  describe("Mesas - filter tables by number", () => {
    const tables = [
      { id: 1, number: 1, displayNumber: "1" },
      { id: 2, number: 2, displayNumber: "2" },
      { id: 3, number: 10, displayNumber: "10" },
      { id: 4, number: 11, displayNumber: "11" },
      { id: 5, number: 12, displayNumber: "12+13" },
    ];

    it("should filter tables by number", () => {
      const result = filterBySearch(tables, "1", ["displayNumber"]);
      expect(result.length).toBeGreaterThanOrEqual(1);
      expect(result.some(t => t.displayNumber === "1")).toBe(true);
    });

    it("should match combined table numbers", () => {
      const result = filterBySearch(tables, "12+13", ["displayNumber"]);
      expect(result).toHaveLength(1);
      expect(result[0].displayNumber).toBe("12+13");
    });

    it("should return all tables when search is empty", () => {
      expect(filterBySearch(tables, "", ["displayNumber"])).toHaveLength(5);
    });
  });

  describe("Categorias - filter categories by name", () => {
    const categories = [
      { id: 1, name: "Pizzas" },
      { id: 2, name: "Hambúrgueres" },
      { id: 3, name: "Bebidas" },
      { id: 4, name: "Sobremesas" },
    ];

    it("should filter categories by name", () => {
      const result = filterBySearch(categories, "pizza", ["name"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Pizzas");
    });

    it("should handle partial matches", () => {
      const result = filterBySearch(categories, "beb", ["name"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Bebidas");
    });
  });

  describe("Complementos - filter complements by name", () => {
    const complements = [
      { id: 1, name: "Queijo Extra" },
      { id: 2, name: "Bacon" },
      { id: 3, name: "Cebola Caramelizada" },
    ];

    it("should filter complements by name", () => {
      const result = filterBySearch(complements, "bacon", ["name"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Bacon");
    });
  });

  describe("Pedidos - filter orders by number, customer name, phone", () => {
    const orders = [
      { id: 1, orderNumber: "#P001", customerName: "João Silva", customerPhone: "88999990001", status: "new" },
      { id: 2, orderNumber: "#P002", customerName: "Maria Santos", customerPhone: "88999990002", status: "preparing" },
      { id: 3, orderNumber: "#P003", customerName: "Carlos Oliveira", customerPhone: "88999990003", status: "completed" },
    ];

    it("should filter by order number", () => {
      const result = filterBySearch(orders, "P001", ["orderNumber", "customerName", "customerPhone"]);
      expect(result).toHaveLength(1);
      expect(result[0].orderNumber).toBe("#P001");
    });

    it("should filter by customer name", () => {
      const result = filterBySearch(orders, "maria", ["orderNumber", "customerName", "customerPhone"]);
      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe("Maria Santos");
    });

    it("should filter by phone number", () => {
      const result = filterBySearch(orders, "88999990003", ["orderNumber", "customerName", "customerPhone"]);
      expect(result).toHaveLength(1);
      expect(result[0].customerName).toBe("Carlos Oliveira");
    });

    it("should return all orders when search is empty", () => {
      expect(filterBySearch(orders, "", ["orderNumber", "customerName", "customerPhone"])).toHaveLength(3);
    });
  });

  describe("Cupons - filter coupons by code", () => {
    const coupons = [
      { id: 1, code: "DESCONTO10" },
      { id: 2, code: "FRETE_GRATIS" },
      { id: 3, code: "PROMO2024" },
    ];

    it("should filter coupons by code", () => {
      const result = filterBySearch(coupons, "desconto", ["code"]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("DESCONTO10");
    });

    it("should handle partial code match", () => {
      const result = filterBySearch(coupons, "PROMO", ["code"]);
      expect(result).toHaveLength(1);
      expect(result[0].code).toBe("PROMO2024");
    });
  });

  describe("Campanhas - filter clients by name and phone", () => {
    const clients = [
      { id: 1, name: "João", phone: "88999990001" },
      { id: 2, name: "Maria", phone: "88999990002" },
      { id: 3, name: null, phone: "88999990003" },
    ];

    it("should filter clients by name", () => {
      const result = filterBySearch(clients, "joão", ["name", "phone"]);
      expect(result).toHaveLength(1);
    });

    it("should filter clients by phone", () => {
      const result = filterBySearch(clients, "88999990002", ["name", "phone"]);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Maria");
    });

    it("should handle null fields gracefully", () => {
      const result = filterBySearch(clients, "88999990003", ["name", "phone"]);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(3);
    });
  });

  describe("Edge cases", () => {
    it("should handle whitespace-only search", () => {
      const items = [{ id: 1, name: "Test" }];
      expect(filterBySearch(items, "   ", ["name"])).toHaveLength(1);
    });

    it("should handle empty items array", () => {
      expect(filterBySearch([], "test", ["name" as any])).toHaveLength(0);
    });

    it("should handle special characters in search", () => {
      const items = [{ id: 1, name: "Açaí Bowl" }];
      const result = filterBySearch(items, "açaí", ["name"]);
      expect(result).toHaveLength(1);
    });

    it("should trim search query", () => {
      const items = [{ id: 1, name: "Pizza" }];
      const result = filterBySearch(items, "  pizza  ", ["name"]);
      expect(result).toHaveLength(1);
    });
  });
});
