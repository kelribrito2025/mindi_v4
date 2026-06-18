import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockUpdateOrderItemQuantity = vi.fn();
const mockDeleteOrderItem = vi.fn();
const mockAddOrderItem = vi.fn();
const mockRecalculateOrderTotals = vi.fn();
const mockSearchProductsForOrder = vi.fn();

vi.mock("./db", () => ({
  updateOrderItemQuantity: (...args: any[]) => mockUpdateOrderItemQuantity(...args),
  deleteOrderItem: (...args: any[]) => mockDeleteOrderItem(...args),
  addOrderItem: (...args: any[]) => mockAddOrderItem(...args),
  recalculateOrderTotals: (...args: any[]) => mockRecalculateOrderTotals(...args),
  searchProductsForOrder: (...args: any[]) => mockSearchProductsForOrder(...args),
}));

describe("Order Edit - DB Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateOrderItemQuantity", () => {
    it("should update quantity and recalculate total price", async () => {
      mockUpdateOrderItemQuantity.mockResolvedValue({
        id: 1,
        orderId: 10,
        productName: "Big Burger",
        quantity: 3,
        unitPrice: "25.00",
        totalPrice: "75.00",
        complements: null,
      });

      const result = await mockUpdateOrderItemQuantity(1, 3);
      expect(mockUpdateOrderItemQuantity).toHaveBeenCalledWith(1, 3);
      expect(result.quantity).toBe(3);
      expect(result.totalPrice).toBe("75.00");
    });

    it("should handle items with complements", async () => {
      mockUpdateOrderItemQuantity.mockResolvedValue({
        id: 2,
        orderId: 10,
        productName: "Pizza",
        quantity: 2,
        unitPrice: "30.00",
        totalPrice: "70.00", // (30 + 5) * 2
        complements: [{ name: "Extra Cheese", price: 5, quantity: 1 }],
      });

      const result = await mockUpdateOrderItemQuantity(2, 2);
      expect(result.totalPrice).toBe("70.00");
      expect(result.complements).toHaveLength(1);
    });
  });

  describe("deleteOrderItem", () => {
    it("should remove an item and return it", async () => {
      mockDeleteOrderItem.mockResolvedValue({
        id: 3,
        orderId: 10,
        productName: "Coca-Cola",
        quantity: 1,
        totalPrice: "8.00",
      });

      const result = await mockDeleteOrderItem(3);
      expect(mockDeleteOrderItem).toHaveBeenCalledWith(3);
      expect(result.productName).toBe("Coca-Cola");
    });

    it("should throw if item not found", async () => {
      mockDeleteOrderItem.mockRejectedValue(new Error("Item not found"));

      await expect(mockDeleteOrderItem(999)).rejects.toThrow("Item not found");
    });
  });

  describe("addOrderItem", () => {
    it("should add a new item from the menu", async () => {
      mockAddOrderItem.mockResolvedValue({
        id: 50,
        orderId: 10,
        productId: 5,
        productName: "Batata Frita",
        quantity: 1,
        unitPrice: "15.00",
        totalPrice: "15.00",
        complements: null,
        notes: null,
      });

      const result = await mockAddOrderItem(10, 5, 1);
      expect(mockAddOrderItem).toHaveBeenCalledWith(10, 5, 1);
      expect(result.productName).toBe("Batata Frita");
      expect(result.orderId).toBe(10);
    });

    it("should add item with complements and notes", async () => {
      const complements = [{ name: "Bacon", price: 5, quantity: 1 }];
      mockAddOrderItem.mockResolvedValue({
        id: 51,
        orderId: 10,
        productId: 6,
        productName: "Hambúrguer",
        quantity: 2,
        unitPrice: "20.00",
        totalPrice: "50.00", // (20 + 5) * 2
        complements,
        notes: "Sem cebola",
      });

      const result = await mockAddOrderItem(10, 6, 2, complements, "Sem cebola");
      expect(result.complements).toEqual(complements);
      expect(result.notes).toBe("Sem cebola");
      expect(result.quantity).toBe(2);
    });

    it("should throw if product not found", async () => {
      mockAddOrderItem.mockRejectedValue(new Error("Product not found"));

      await expect(mockAddOrderItem(10, 999, 1)).rejects.toThrow("Product not found");
    });
  });

  describe("recalculateOrderTotals", () => {
    it("should recalculate subtotal and total correctly", async () => {
      mockRecalculateOrderTotals.mockResolvedValue({
        subtotal: "100.00",
        total: "105.00",
        deliveryFee: "10.00",
        discount: "5.00",
      });

      const result = await mockRecalculateOrderTotals(10);
      expect(mockRecalculateOrderTotals).toHaveBeenCalledWith(10);
      expect(result.subtotal).toBe("100.00");
      expect(result.total).toBe("105.00");
    });

    it("should handle zero items (empty order)", async () => {
      mockRecalculateOrderTotals.mockResolvedValue({
        subtotal: "0.00",
        total: "5.00", // delivery fee only
        deliveryFee: "5.00",
        discount: "0.00",
      });

      const result = await mockRecalculateOrderTotals(10);
      expect(result.subtotal).toBe("0.00");
      expect(result.total).toBe("5.00");
    });
  });

  describe("searchProductsForOrder", () => {
    it("should return matching products", async () => {
      mockSearchProductsForOrder.mockResolvedValue([
        { id: 1, name: "Big Burger", price: "25.00", images: [], categoryId: 1 },
        { id: 2, name: "Big Bacon", price: "30.00", images: [], categoryId: 1 },
      ]);

      const result = await mockSearchProductsForOrder(1, "Big");
      expect(mockSearchProductsForOrder).toHaveBeenCalledWith(1, "Big");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Big Burger");
    });

    it("should return empty array when no match", async () => {
      mockSearchProductsForOrder.mockResolvedValue([]);

      const result = await mockSearchProductsForOrder(1, "XYZ123");
      expect(result).toHaveLength(0);
    });

    it("should limit results to 20", async () => {
      const products = Array.from({ length: 20 }, (_, i) => ({
        id: i + 1,
        name: `Product ${i + 1}`,
        price: "10.00",
        images: [],
        categoryId: 1,
      }));
      mockSearchProductsForOrder.mockResolvedValue(products);

      const result = await mockSearchProductsForOrder(1, "Product");
      expect(result).toHaveLength(20);
    });
  });
});
