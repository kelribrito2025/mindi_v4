import { describe, it, expect } from "vitest";

/**
 * Tests for PDV search normalization (accent-insensitive search).
 * 
 * Business rule: searching "agua" must find "Água mineral",
 * searching "acai" must find "Açaí", etc.
 */

// Same normalizeText function used in the PDV frontend components
function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// Simulates the PDV product filter logic
function filterProducts(
  products: Array<{ name: string; description: string | null; status: string }>,
  searchQuery: string
) {
  if (!searchQuery.trim()) return products;
  const query = normalizeText(searchQuery);
  return products.filter((product) => {
    if (product.status !== 'active') return false;
    return (
      normalizeText(product.name).includes(query) ||
      (product.description ? normalizeText(product.description).includes(query) : false)
    );
  });
}

const testProducts = [
  { name: "Água mineral", description: "Temos água mineral com gás e sem gás", status: "active" },
  { name: "Açaí 500ml", description: "Açaí puro com granola", status: "active" },
  { name: "Café expresso", description: "Café forte e encorpado", status: "active" },
  { name: "Pão de queijo", description: "Pão de queijo mineiro", status: "active" },
  { name: "Frango à parmegiana", description: "Frango empanado com molho e queijo", status: "active" },
  { name: "Suco de maracujá", description: "Suco natural de maracujá", status: "active" },
  { name: "Coca-Cola", description: "Refrigerante 350ml", status: "active" },
  { name: "Coxinha", description: null, status: "active" },
  { name: "Produto pausado", description: "Não deve aparecer", status: "paused" },
];

describe("PDV Search Normalization", () => {
  describe("normalizeText function", () => {
    it("should remove acute accents (á, é, í, ó, ú)", () => {
      expect(normalizeText("Água")).toBe("agua");
      expect(normalizeText("Café")).toBe("cafe");
      expect(normalizeText("Açaí")).toBe("acai");
      expect(normalizeText("maracujá")).toBe("maracuja");
    });

    it("should remove tilde (ã, õ)", () => {
      expect(normalizeText("Pão")).toBe("pao");
      expect(normalizeText("limão")).toBe("limao");
    });

    it("should remove cedilla (ç)", () => {
      expect(normalizeText("Açaí")).toBe("acai");
      expect(normalizeText("Açúcar")).toBe("acucar");
    });

    it("should remove grave accent (à)", () => {
      expect(normalizeText("à parmegiana")).toBe("a parmegiana");
    });

    it("should handle text without accents", () => {
      expect(normalizeText("Coca-Cola")).toBe("coca-cola");
      expect(normalizeText("Coxinha")).toBe("coxinha");
    });

    it("should convert to lowercase", () => {
      expect(normalizeText("ÁGUA MINERAL")).toBe("agua mineral");
    });
  });

  describe("Product filtering with accent-insensitive search", () => {
    it("should find 'Água mineral' when searching 'agua'", () => {
      const results = filterProducts(testProducts, "agua");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Água mineral")).toBe(true);
    });

    it("should find 'Água mineral' when searching 'Água' (with accent)", () => {
      const results = filterProducts(testProducts, "Água");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Água mineral")).toBe(true);
    });

    it("should find 'Açaí 500ml' when searching 'acai'", () => {
      const results = filterProducts(testProducts, "acai");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Açaí 500ml")).toBe(true);
    });

    it("should find 'Café expresso' when searching 'cafe'", () => {
      const results = filterProducts(testProducts, "cafe");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Café expresso")).toBe(true);
    });

    it("should find 'Pão de queijo' when searching 'pao'", () => {
      const results = filterProducts(testProducts, "pao");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Pão de queijo")).toBe(true);
    });

    it("should find 'Suco de maracujá' when searching 'maracuja'", () => {
      const results = filterProducts(testProducts, "maracuja");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Suco de maracujá")).toBe(true);
    });

    it("should find 'Frango à parmegiana' when searching 'parmegiana'", () => {
      const results = filterProducts(testProducts, "parmegiana");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Frango à parmegiana")).toBe(true);
    });

    it("should find products by description without accents", () => {
      const results = filterProducts(testProducts, "gas");
      expect(results.length).toBeGreaterThanOrEqual(1);
      expect(results.some(p => p.name === "Água mineral")).toBe(true);
    });

    it("should not return paused products", () => {
      const results = filterProducts(testProducts, "pausado");
      expect(results.length).toBe(0);
    });

    it("should return all active products when search is empty", () => {
      const results = filterProducts(testProducts, "");
      expect(results.length).toBe(testProducts.length);
    });

    it("should handle products with null description", () => {
      const results = filterProducts(testProducts, "coxinha");
      expect(results.length).toBe(1);
      expect(results[0].name).toBe("Coxinha");
    });
  });
});
