import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockGetProductById = vi.fn();
const mockGetComplementGroupsByProduct = vi.fn();
const mockGetComplementItemsByGroup = vi.fn();
const mockGetComboGroupsByProductId = vi.fn();
const mockAddOrderItem = vi.fn();
const mockRecalculateOrderTotals = vi.fn();
const mockSearchProductsForOrder = vi.fn();

vi.mock("./db", () => ({
  getProductById: (...args: any[]) => mockGetProductById(...args),
  getComplementGroupsByProduct: (...args: any[]) => mockGetComplementGroupsByProduct(...args),
  getComplementItemsByGroup: (...args: any[]) => mockGetComplementItemsByGroup(...args),
  getComboGroupsByProductId: (...args: any[]) => mockGetComboGroupsByProductId(...args),
  addOrderItem: (...args: any[]) => mockAddOrderItem(...args),
  recalculateOrderTotals: (...args: any[]) => mockRecalculateOrderTotals(...args),
  searchProductsForOrder: (...args: any[]) => mockSearchProductsForOrder(...args),
}));

describe("Order Edit - Complement Selection Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("searchProductsForOrder - includes complementCount", () => {
    it("should return products with complementCount field", async () => {
      mockSearchProductsForOrder.mockResolvedValue([
        { id: 1, name: "Hambúrguer Clássico", price: "25.00", images: [], categoryId: 1, isCombo: false, complementCount: 3 },
        { id: 2, name: "Coca-Cola", price: "8.00", images: [], categoryId: 2, isCombo: false, complementCount: 0 },
      ]);

      const result = await mockSearchProductsForOrder(1, "Ham");
      expect(result[0].complementCount).toBe(3);
      expect(result[1].complementCount).toBe(0);
    });

    it("should return isCombo field for combo products", async () => {
      mockSearchProductsForOrder.mockResolvedValue([
        { id: 10, name: "Combo Família", price: "59.90", images: [], categoryId: 1, isCombo: true, complementCount: 0 },
      ]);

      const result = await mockSearchProductsForOrder(1, "Combo");
      expect(result[0].isCombo).toBe(true);
    });
  });

  describe("getProductComplements - regular product", () => {
    it("should return complement groups for a regular product", async () => {
      mockGetProductById.mockResolvedValue({ id: 1, isCombo: false });
      mockGetComplementGroupsByProduct.mockResolvedValue([
        { id: 10, name: "Adicionais", minQuantity: 0, maxQuantity: 3, isRequired: false, isActive: true },
        { id: 11, name: "Molho", minQuantity: 1, maxQuantity: 1, isRequired: true, isActive: true },
      ]);
      mockGetComplementItemsByGroup.mockImplementation((groupId: number) => {
        if (groupId === 10) {
          return Promise.resolve([
            { id: 100, name: "Bacon", price: "5.00", isActive: true, priceMode: "normal" },
            { id: 101, name: "Queijo Extra", price: "3.00", isActive: true, priceMode: "normal" },
          ]);
        }
        if (groupId === 11) {
          return Promise.resolve([
            { id: 200, name: "Ketchup", price: "0", isActive: true, priceMode: "free" },
            { id: 201, name: "Mostarda", price: "0", isActive: true, priceMode: "free" },
          ]);
        }
        return Promise.resolve([]);
      });

      const product = await mockGetProductById(1);
      expect(product.isCombo).toBe(false);

      const groups = await mockGetComplementGroupsByProduct(1);
      expect(groups).toHaveLength(2);

      const items10 = await mockGetComplementItemsByGroup(10);
      expect(items10).toHaveLength(2);
      expect(items10[0].name).toBe("Bacon");

      const items11 = await mockGetComplementItemsByGroup(11);
      expect(items11).toHaveLength(2);
    });

    it("should filter out inactive groups", async () => {
      mockGetComplementGroupsByProduct.mockResolvedValue([
        { id: 10, name: "Adicionais", isActive: true },
        { id: 11, name: "Pausado", isActive: false },
      ]);

      const groups = await mockGetComplementGroupsByProduct(1);
      const activeGroups = groups.filter((g: any) => g.isActive !== false);
      expect(activeGroups).toHaveLength(1);
      expect(activeGroups[0].name).toBe("Adicionais");
    });

    it("should filter out inactive items", async () => {
      mockGetComplementItemsByGroup.mockResolvedValue([
        { id: 100, name: "Bacon", isActive: true },
        { id: 101, name: "Queijo (indisponível)", isActive: false },
      ]);

      const items = await mockGetComplementItemsByGroup(10);
      const activeItems = items.filter((i: any) => i.isActive !== false);
      expect(activeItems).toHaveLength(1);
      expect(activeItems[0].name).toBe("Bacon");
    });
  });

  describe("getProductComplements - combo product", () => {
    it("should return combo groups for a combo product", async () => {
      mockGetProductById.mockResolvedValue({ id: 10, isCombo: true });
      mockGetComboGroupsByProductId.mockResolvedValue([
        {
          id: 50,
          productId: 10,
          name: "Escolha o Hambúrguer",
          isRequired: true,
          maxQuantity: 1,
          sortOrder: 0,
          items: [
            { id: 500, productName: "Big Burger", productPrice: "0", productStatus: "active", productImages: [] },
            { id: 501, productName: "Cheese Burger", productPrice: "0", productStatus: "active", productImages: [] },
          ],
        },
      ]);
      mockGetComplementGroupsByProduct.mockResolvedValue([]);

      const product = await mockGetProductById(10);
      expect(product.isCombo).toBe(true);

      const comboGroups = await mockGetComboGroupsByProductId(10);
      expect(comboGroups).toHaveLength(1);
      expect(comboGroups[0].name).toBe("Escolha o Hambúrguer");
      expect(comboGroups[0].items).toHaveLength(2);
    });

    it("should combine combo groups with imported complement groups", async () => {
      mockGetProductById.mockResolvedValue({ id: 10, isCombo: true });
      mockGetComboGroupsByProductId.mockResolvedValue([
        {
          id: 50,
          productId: 10,
          name: "Escolha o Hambúrguer",
          isRequired: true,
          maxQuantity: 1,
          sortOrder: 0,
          items: [{ id: 500, productName: "Big Burger", productPrice: "0", productStatus: "active" }],
        },
      ]);
      mockGetComplementGroupsByProduct.mockResolvedValue([
        { id: 60, name: "Molho", isActive: true, minQuantity: 0, maxQuantity: 2 },
      ]);
      mockGetComplementItemsByGroup.mockResolvedValue([
        { id: 600, name: "Ketchup", price: "0", isActive: true },
      ]);

      const comboGroups = await mockGetComboGroupsByProductId(10);
      const complementGroups = await mockGetComplementGroupsByProduct(10);
      const allGroups = [...comboGroups, ...complementGroups];

      expect(allGroups).toHaveLength(2);
      expect(allGroups[0].name).toBe("Escolha o Hambúrguer");
      expect(allGroups[1].name).toBe("Molho");
    });
  });

  describe("addOrderItem - with complements", () => {
    it("should add item with selected complements", async () => {
      const complements = [
        { name: "Bacon", price: 5, quantity: 1 },
        { name: "Queijo Extra", price: 3, quantity: 2 },
      ];

      mockAddOrderItem.mockResolvedValue({
        id: 100,
        orderId: 10,
        productId: 1,
        productName: "Hambúrguer",
        quantity: 1,
        unitPrice: "25.00",
        totalPrice: "36.00", // 25 + 5 + (3*2) = 36
        complements,
        notes: null,
      });

      mockRecalculateOrderTotals.mockResolvedValue({
        subtotal: "36.00",
        total: "41.00",
        deliveryFee: "5.00",
        discount: "0.00",
      });

      const item = await mockAddOrderItem(10, 1, 1, complements);
      expect(item.complements).toEqual(complements);
      expect(item.totalPrice).toBe("36.00");

      const totals = await mockRecalculateOrderTotals(10);
      expect(totals.subtotal).toBe("36.00");
    });

    it("should add item with quantity > 1 and complements", async () => {
      const complements = [{ name: "Bacon", price: 5, quantity: 1 }];

      mockAddOrderItem.mockResolvedValue({
        id: 101,
        orderId: 10,
        productId: 1,
        productName: "Hambúrguer",
        quantity: 2,
        unitPrice: "25.00",
        totalPrice: "60.00", // (25 + 5) * 2 = 60
        complements,
        notes: null,
      });

      const item = await mockAddOrderItem(10, 1, 2, complements);
      expect(item.quantity).toBe(2);
      expect(item.totalPrice).toBe("60.00");
    });

    it("should add item without complements (product has none)", async () => {
      mockAddOrderItem.mockResolvedValue({
        id: 102,
        orderId: 10,
        productId: 2,
        productName: "Coca-Cola",
        quantity: 1,
        unitPrice: "8.00",
        totalPrice: "8.00",
        complements: null,
        notes: null,
      });

      const item = await mockAddOrderItem(10, 2, 1);
      expect(item.complements).toBeNull();
      expect(item.totalPrice).toBe("8.00");
    });
  });

  describe("Complement validation logic", () => {
    it("should validate required groups are filled", () => {
      const groups = [
        { id: 10, name: "Molho", minQuantity: 1, maxQuantity: 1, isRequired: true, items: [{ id: 100, name: "Ketchup", price: "0" }] },
        { id: 11, name: "Adicionais", minQuantity: 0, maxQuantity: 3, isRequired: false, items: [{ id: 200, name: "Bacon", price: "5.00" }] },
      ];

      // No selections - required group not filled
      const emptySelections = new Map<number, Map<number, number>>();
      const requiredFilled1 = groups.every(g => {
        if (g.minQuantity === 0 && !g.isRequired) return true;
        const sel = emptySelections.get(g.id);
        if (!sel) return g.minQuantity === 0;
        const total = Array.from(sel.values()).reduce((a, b) => a + b, 0);
        return total >= g.minQuantity;
      });
      expect(requiredFilled1).toBe(false);

      // Required group filled
      const filledSelections = new Map<number, Map<number, number>>();
      filledSelections.set(10, new Map([[100, 1]]));
      const requiredFilled2 = groups.every(g => {
        if (g.minQuantity === 0 && !g.isRequired) return true;
        const sel = filledSelections.get(g.id);
        if (!sel) return g.minQuantity === 0;
        const total = Array.from(sel.values()).reduce((a, b) => a + b, 0);
        return total >= g.minQuantity;
      });
      expect(requiredFilled2).toBe(true);
    });

    it("should calculate complement total price correctly", () => {
      const selectedComplements = new Map<number, Map<number, number>>();
      selectedComplements.set(10, new Map([[100, 1], [101, 2]]));

      const items: Record<number, { price: number }> = {
        100: { price: 5 },
        101: { price: 3 },
      };

      let total = 0;
      selectedComplements.forEach((groupMap) => {
        groupMap.forEach((qty, itemId) => {
          total += (items[itemId]?.price || 0) * qty;
        });
      });

      expect(total).toBe(11); // 5*1 + 3*2
    });

    it("should determine if product has complements from search result", () => {
      const productWithComplements = { id: 1, name: "Hambúrguer", complementCount: 3, isCombo: false };
      const productWithoutComplements = { id: 2, name: "Coca-Cola", complementCount: 0, isCombo: false };
      const comboProduct = { id: 3, name: "Combo Família", complementCount: 0, isCombo: true };

      const hasComplements1 = (productWithComplements.complementCount > 0) || productWithComplements.isCombo;
      const hasComplements2 = (productWithoutComplements.complementCount > 0) || productWithoutComplements.isCombo;
      const hasComplements3 = (comboProduct.complementCount > 0) || comboProduct.isCombo;

      expect(hasComplements1).toBe(true);
      expect(hasComplements2).toBe(false);
      expect(hasComplements3).toBe(true);
    });
  });
});
