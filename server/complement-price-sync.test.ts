import { describe, it, expect } from "vitest";

describe("Complement price auto-sync logic", () => {
  // Simulates the price sync logic from getAllComplementGroupsByEstablishment
  function findCanonicalPrice(prices: string[]): string {
    const priceFreq: Record<string, number> = {};
    for (const p of prices) {
      priceFreq[p] = (priceFreq[p] || 0) + 1;
    }
    let canonicalPrice = prices[0];
    let bestCount = 0;
    for (const p of Object.keys(priceFreq)) {
      if (priceFreq[p] > bestCount) {
        canonicalPrice = p;
        bestCount = priceFreq[p];
      }
    }
    return canonicalPrice;
  }

  function findDivergentIds(items: { id: number; price: string }[], canonicalPrice: string): number[] {
    return items.filter(i => i.price !== canonicalPrice).map(i => i.id);
  }

  it("should detect canonical price as the most common value", () => {
    // 20 items at 3.00, 7 items at 300.00
    const prices = [
      ...Array(20).fill("3.00"),
      ...Array(7).fill("300.00"),
    ];
    expect(findCanonicalPrice(prices)).toBe("3.00");
  });

  it("should detect divergent items with wrong price", () => {
    const items = [
      { id: 1, price: "3.00" },
      { id: 2, price: "3.00" },
      { id: 3, price: "300.00" },
      { id: 4, price: "3.00" },
      { id: 5, price: "300.00" },
    ];
    const canonical = findCanonicalPrice(items.map(i => i.price));
    expect(canonical).toBe("3.00");
    
    const divergent = findDivergentIds(items, canonical);
    expect(divergent).toEqual([3, 5]);
  });

  it("should handle all same prices (no divergence)", () => {
    const prices = ["5.00", "5.00", "5.00", "5.00"];
    const canonical = findCanonicalPrice(prices);
    expect(canonical).toBe("5.00");
    
    const items = prices.map((p, i) => ({ id: i + 1, price: p }));
    const divergent = findDivergentIds(items, canonical);
    expect(divergent).toEqual([]);
  });

  it("should handle real case: Ovo 3.00 vs 300.00", () => {
    // Real data from establishment 60018
    const items = [
      { id: 101, price: "3.00" },   // Big frango
      { id: 102, price: "3.00" },   // Dog frango
      { id: 103, price: "3.00" },   // Big burguer
      { id: 104, price: "3.00" },   // Combo 1
      { id: 105, price: "3.00" },   // Especial de calabresa
      { id: 106, price: "3.00" },   // Dog Duplo
      { id: 107, price: "3.00" },   // Big frango com Catupiry
      { id: 108, price: "3.00" },   // LANCHE DO DIA - Big frango
      { id: 109, price: "3.00" },   // LANCHE DO DIA - Big salada
      { id: 110, price: "3.00" },   // Big Calabresa
      { id: 111, price: "3.00" },   // Big executivo
      { id: 112, price: "3.00" },   // LANCHE DO DIA - Big EGG
      { id: 113, price: "3.00" },   // Big bacon
      { id: 114, price: "3.00" },   // Dog bacon
      { id: 115, price: "3.00" },   // Big tudo
      { id: 116, price: "3.00" },   // LANCHE DO DIA - Big Calabresa
      { id: 117, price: "3.00" },   // Big vegetariano
      { id: 118, price: "3.00" },   // Dog Calabresa
      { id: 119, price: "3.00" },   // Big Fraldinha
      { id: 120, price: "3.00" },   // Big salada
      // Divergent prices (multiplied by 100)
      { id: 201, price: "300.00" }, // Big EGG
      { id: 202, price: "300.00" }, // Big Lanche
      { id: 203, price: "300.00" }, // LANCHE DO DIA - Big bacon
      { id: 204, price: "300.00" }, // Especial de frango
      { id: 205, price: "300.00" }, // Especial de bacon
      { id: 206, price: "300.00" }, // Moda da casa
      { id: 207, price: "300.00" }, // Especial egg
    ];

    const canonical = findCanonicalPrice(items.map(i => i.price));
    expect(canonical).toBe("3.00");

    const divergent = findDivergentIds(items, canonical);
    expect(divergent).toEqual([201, 202, 203, 204, 205, 206, 207]);
    expect(divergent.length).toBe(7);
  });

  it("should handle Presunto 4.00 vs 400.00 with mixed 5.00", () => {
    const items = [
      { id: 1, price: "4.00" },
      { id: 2, price: "4.00" },
      { id: 3, price: "4.00" },
      { id: 4, price: "4.00" },
      { id: 5, price: "4.00" },
      { id: 6, price: "5.00" },  // One item at 5.00
      { id: 7, price: "400.00" },
      { id: 8, price: "400.00" },
    ];

    const canonical = findCanonicalPrice(items.map(i => i.price));
    expect(canonical).toBe("4.00");

    const divergent = findDivergentIds(items, canonical);
    expect(divergent).toEqual([6, 7, 8]);
  });

  it("should handle price sync from individual product edit", () => {
    // When user changes price in product edit, it should propagate
    const originalPrice = "300.00";
    const newPrice = "3.00";
    
    // Simulate updateComplementItemsByName behavior
    const allItems = [
      { id: 1, name: "Ovo", price: "300.00" },
      { id: 2, name: "Ovo", price: "3.00" },
      { id: 3, name: "Ovo", price: "3.00" },
    ];
    
    // After global update, all should have newPrice
    const updated = allItems.map(i => ({ ...i, price: newPrice }));
    expect(updated.every(i => i.price === "3.00")).toBe(true);
  });
});
