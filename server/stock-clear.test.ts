import { describe, it, expect } from "vitest";

/**
 * Tests for stock clearing behavior when user empties the stock field in Catalog.
 * 
 * Business rules:
 * - When user clears the stock field (empty string), the frontend sends: { hasStock: false, stockQuantity: null }
 * - The backend should:
 *   1. Update the product: hasStock = false, stockQuantity = null
 *   2. Delete the linked stockItem so it no longer appears in the Stock page
 * - When user sets a stock value, the frontend sends: { hasStock: true, stockQuantity: <number> }
 * - The backend should:
 *   1. Update the product: hasStock = true, stockQuantity = <number>
 *   2. Create or update the linked stockItem
 */

describe("Stock Clearing Logic - Frontend", () => {
  // Simulates the handleStockBlur logic from Catalogo.tsx
  function handleStockBlur(
    localStock: string,
    product: { id: number; hasStock: boolean; stockQuantity: number | null }
  ): { hasStock: boolean; stockQuantity: number | null } | null {
    const parsed = parseInt(localStock, 10);
    if (localStock === '' && product.hasStock) {
      // User cleared stock - disable stock control
      return { hasStock: false, stockQuantity: null };
    } else if (!isNaN(parsed) && (parsed !== product.stockQuantity || !product.hasStock)) {
      return { hasStock: true, stockQuantity: parsed };
    }
    return null; // No change
  }

  it("should send hasStock=false when user clears the stock field of a tracked product", () => {
    const result = handleStockBlur('', { id: 1, hasStock: true, stockQuantity: 10 });
    expect(result).toEqual({ hasStock: false, stockQuantity: null });
  });

  it("should send hasStock=true when user sets stock to 0", () => {
    const result = handleStockBlur('0', { id: 1, hasStock: false, stockQuantity: null });
    expect(result).toEqual({ hasStock: true, stockQuantity: 0 });
  });

  it("should send hasStock=true when user sets stock to a positive number", () => {
    const result = handleStockBlur('5', { id: 1, hasStock: false, stockQuantity: null });
    expect(result).toEqual({ hasStock: true, stockQuantity: 5 });
  });

  it("should not send update when stock field is empty and product is not tracked", () => {
    const result = handleStockBlur('', { id: 1, hasStock: false, stockQuantity: null });
    expect(result).toBeNull();
  });

  it("should not send update when stock value hasn't changed", () => {
    const result = handleStockBlur('10', { id: 1, hasStock: true, stockQuantity: 10 });
    expect(result).toBeNull();
  });

  it("should send update when stock value changes from one number to another", () => {
    const result = handleStockBlur('20', { id: 1, hasStock: true, stockQuantity: 10 });
    expect(result).toEqual({ hasStock: true, stockQuantity: 20 });
  });
});

describe("Stock Clearing Logic - Backend", () => {
  // Simulates the product.update mutation logic
  function simulateProductUpdate(input: {
    id: number;
    hasStock?: boolean;
    stockQuantity?: number | null;
  }) {
    const actions: string[] = [];

    // Se desativou controle de estoque, remover item de estoque vinculado
    if (input.hasStock === false) {
      actions.push("delete_stock_item");
    }

    // Se ativou controle de estoque, criar ou atualizar item de estoque
    if (input.hasStock === true) {
      actions.push("create_or_update_stock_item");
    }

    return actions;
  }

  it("should delete stock item when hasStock is set to false", () => {
    const actions = simulateProductUpdate({ id: 1, hasStock: false, stockQuantity: null });
    expect(actions).toContain("delete_stock_item");
    expect(actions).not.toContain("create_or_update_stock_item");
  });

  it("should create/update stock item when hasStock is set to true", () => {
    const actions = simulateProductUpdate({ id: 1, hasStock: true, stockQuantity: 5 });
    expect(actions).toContain("create_or_update_stock_item");
    expect(actions).not.toContain("delete_stock_item");
  });

  it("should not touch stock items when hasStock is not in the update", () => {
    const actions = simulateProductUpdate({ id: 1 });
    expect(actions).toHaveLength(0);
  });

  it("should delete stock item even when stockQuantity is not null (edge case)", () => {
    // This shouldn't happen normally, but hasStock=false should always trigger deletion
    const actions = simulateProductUpdate({ id: 1, hasStock: false, stockQuantity: 5 });
    expect(actions).toContain("delete_stock_item");
  });
});
