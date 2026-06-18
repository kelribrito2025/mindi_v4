import { describe, it, expect } from "vitest";

/**
 * Tests for PDV product availability logic.
 * 
 * Business rules:
 * - hasStock = false → product is ALWAYS available (no stock control)
 * - hasStock = true, stockQuantity > 0 → product is available
 * - hasStock = true, stockQuantity = 0 → product is UNAVAILABLE
 * - hasStock = true, stockQuantity = null → product is UNAVAILABLE (no stock set)
 */

// Helper function that mirrors the PDV frontend logic for determining if a product is unavailable
function isProductUnavailable(product: { hasStock: boolean; stockQuantity: number | null }): boolean {
  return product.hasStock && (product.stockQuantity === null || product.stockQuantity === undefined || product.stockQuantity <= 0);
}

describe("PDV Product Availability", () => {
  describe("Products WITHOUT stock control (hasStock = false)", () => {
    it("should be available when hasStock is false and stockQuantity is null", () => {
      expect(isProductUnavailable({ hasStock: false, stockQuantity: null })).toBe(false);
    });

    it("should be available when hasStock is false and stockQuantity is 0", () => {
      expect(isProductUnavailable({ hasStock: false, stockQuantity: 0 })).toBe(false);
    });

    it("should be available when hasStock is false and stockQuantity is positive", () => {
      expect(isProductUnavailable({ hasStock: false, stockQuantity: 10 })).toBe(false);
    });
  });

  describe("Products WITH stock control (hasStock = true)", () => {
    it("should be unavailable when hasStock is true and stockQuantity is 0", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: 0 })).toBe(true);
    });

    it("should be unavailable when hasStock is true and stockQuantity is null", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: null })).toBe(true);
    });

    it("should be unavailable when hasStock is true and stockQuantity is negative", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: -1 })).toBe(true);
    });

    it("should be available when hasStock is true and stockQuantity is positive", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: 5 })).toBe(false);
    });

    it("should be available when hasStock is true and stockQuantity is 1", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: 1 })).toBe(false);
    });
  });

  describe("Edge cases", () => {
    it("should handle large stock quantities", () => {
      expect(isProductUnavailable({ hasStock: true, stockQuantity: 99999 })).toBe(false);
    });

    it("should handle hasStock false regardless of any stock value", () => {
      // When stock control is disabled, the product should ALWAYS be available
      const stockValues = [null, 0, -5, 1, 100, 99999];
      for (const qty of stockValues) {
        expect(isProductUnavailable({ hasStock: false, stockQuantity: qty })).toBe(false);
      }
    });
  });
});
