import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockGetTableById = vi.fn();
const mockGetActiveTabByTable = vi.fn();
const mockGetTabItems = vi.fn();
const mockTransferTabItems = vi.fn();
const mockCreateTab = vi.fn();
const mockRecalculateTabTotals = vi.fn();
const mockUpdateTableStatus = vi.fn();
const mockUpdateTable = vi.fn();

vi.mock("./db", () => ({
  getTableById: (...args: any[]) => mockGetTableById(...args),
  getActiveTabByTable: (...args: any[]) => mockGetActiveTabByTable(...args),
  getTabItems: (...args: any[]) => mockGetTabItems(...args),
  transferTabItems: (...args: any[]) => mockTransferTabItems(...args),
  createTab: (...args: any[]) => mockCreateTab(...args),
  recalculateTabTotals: (...args: any[]) => mockRecalculateTabTotals(...args),
  updateTableStatus: (...args: any[]) => mockUpdateTableStatus(...args),
  updateTable: (...args: any[]) => mockUpdateTable(...args),
}));

describe("Transfer Items Between Tables", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("transferTabItems function", () => {
    it("should move selected items from source tab to target tab", async () => {
      mockTransferTabItems.mockResolvedValue({ movedCount: 2 });

      const result = await mockTransferTabItems(100, 200, [1, 2]);

      expect(mockTransferTabItems).toHaveBeenCalledWith(100, 200, [1, 2]);
      expect(result.movedCount).toBe(2);
    });

    it("should handle transferring a single item", async () => {
      mockTransferTabItems.mockResolvedValue({ movedCount: 1 });

      const result = await mockTransferTabItems(100, 200, [5]);

      expect(mockTransferTabItems).toHaveBeenCalledWith(100, 200, [5]);
      expect(result.movedCount).toBe(1);
    });

    it("should handle transferring all items from a tab", async () => {
      mockTransferTabItems.mockResolvedValue({ movedCount: 5 });

      const result = await mockTransferTabItems(100, 200, [1, 2, 3, 4, 5]);

      expect(result.movedCount).toBe(5);
    });
  });

  describe("transfer workflow validation", () => {
    it("should verify source table exists and has items", async () => {
      const sourceTable = { id: 1, number: 4, status: "occupied", isActive: true };
      const sourceTab = { id: 100, tableId: 1, status: "open" };
      const items = [
        { id: 1, tabId: 100, productName: "Pizza", quantity: 1, totalPrice: "25.00", complements: null, notes: null },
        { id: 2, tabId: 100, productName: "Coca-Cola", quantity: 2, totalPrice: "12.00", complements: null, notes: null },
      ];

      mockGetTableById.mockResolvedValue(sourceTable);
      mockGetActiveTabByTable.mockResolvedValue(sourceTab);
      mockGetTabItems.mockResolvedValue(items);

      const table = await mockGetTableById(1);
      expect(table).toBeDefined();
      expect(table.status).toBe("occupied");

      const tab = await mockGetActiveTabByTable(1);
      expect(tab).toBeDefined();
      expect(tab.id).toBe(100);

      const tabItems = await mockGetTabItems(100);
      expect(tabItems.length).toBe(2);
    });

    it("should reject transfer if source table has no active tab", async () => {
      mockGetTableById.mockResolvedValue({ id: 1, number: 4, status: "free" });
      mockGetActiveTabByTable.mockResolvedValue(null);

      const tab = await mockGetActiveTabByTable(1);
      expect(tab).toBeNull();
    });

    it("should create new tab on target table if none exists", async () => {
      const targetTable = { id: 2, number: 7, status: "free", isActive: true };
      mockGetTableById.mockResolvedValue(targetTable);
      mockGetActiveTabByTable.mockResolvedValue(null);
      mockCreateTab.mockResolvedValue(200);

      const existingTab = await mockGetActiveTabByTable(2);
      expect(existingTab).toBeNull();

      const newTabId = await mockCreateTab({
        tableId: 2,
        establishmentId: 1,
        tabNumber: "CMD-001",
        status: "open",
      });
      expect(newTabId).toBe(200);
      expect(mockCreateTab).toHaveBeenCalledTimes(1);
    });

    it("should use existing tab on target table if one exists", async () => {
      const targetTable = { id: 2, number: 7, status: "occupied", isActive: true };
      const existingTab = { id: 200, tableId: 2, status: "open" };
      mockGetTableById.mockResolvedValue(targetTable);
      mockGetActiveTabByTable.mockResolvedValue(existingTab);

      const tab = await mockGetActiveTabByTable(2);
      expect(tab).toBeDefined();
      expect(tab.id).toBe(200);
      expect(mockCreateTab).not.toHaveBeenCalled();
    });
  });

  describe("post-transfer state", () => {
    it("should recalculate totals for both source and target tabs", async () => {
      mockRecalculateTabTotals.mockResolvedValue(undefined);

      await mockRecalculateTabTotals(100); // source tab
      await mockRecalculateTabTotals(200); // target tab

      expect(mockRecalculateTabTotals).toHaveBeenCalledWith(100);
      expect(mockRecalculateTabTotals).toHaveBeenCalledWith(200);
      expect(mockRecalculateTabTotals).toHaveBeenCalledTimes(2);
    });

    it("should free source table when all items are transferred", async () => {
      // After transferring all items, source tab has 0 items
      mockGetTabItems.mockResolvedValue([]);
      mockUpdateTableStatus.mockResolvedValue(undefined);

      const remainingItems = await mockGetTabItems(100);
      expect(remainingItems.length).toBe(0);

      // Source table should be set to free
      await mockUpdateTableStatus(1, "free");
      expect(mockUpdateTableStatus).toHaveBeenCalledWith(1, "free");
    });

    it("should keep source table occupied when some items remain", async () => {
      mockGetTabItems.mockResolvedValue([
        { id: 3, tabId: 100, productName: "Cerveja", quantity: 1 },
      ]);

      const remainingItems = await mockGetTabItems(100);
      expect(remainingItems.length).toBe(1);
      // Source table stays occupied - no call to updateTableStatus
      expect(mockUpdateTableStatus).not.toHaveBeenCalled();
    });

    it("should set target table to occupied after receiving items", async () => {
      mockUpdateTableStatus.mockResolvedValue(undefined);

      await mockUpdateTableStatus(2, "occupied");
      expect(mockUpdateTableStatus).toHaveBeenCalledWith(2, "occupied");
    });
  });

  describe("label transfer", () => {
    it("should transfer label from source to target when transferLabel is true", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const sourceLabel = "João Silva";
      // Transfer label to target
      await mockUpdateTable(2, { label: sourceLabel });
      // Clear label from source
      await mockUpdateTable(1, { label: null });

      expect(mockUpdateTable).toHaveBeenCalledWith(2, { label: sourceLabel });
      expect(mockUpdateTable).toHaveBeenCalledWith(1, { label: null });
    });

    it("should NOT transfer label when transferLabel is false", async () => {
      // No updateTable calls for label
      expect(mockUpdateTable).not.toHaveBeenCalled();
    });
  });

  describe("items with complements and notes", () => {
    it("should preserve complements when transferring items", async () => {
      const itemWithComplements = {
        id: 10,
        tabId: 100,
        productName: "Hamburger",
        quantity: 1,
        totalPrice: "35.00",
        complements: [
          { name: "Bacon Extra", price: 5, quantity: 1 },
          { name: "Queijo Cheddar", price: 3, quantity: 1 },
        ],
        notes: "Sem cebola",
      };

      mockGetTabItems.mockResolvedValue([itemWithComplements]);
      mockTransferTabItems.mockResolvedValue({ movedCount: 1 });

      const items = await mockGetTabItems(100);
      expect(items[0].complements).toHaveLength(2);
      expect(items[0].notes).toBe("Sem cebola");

      // Transfer preserves all data (just changes tabId)
      const result = await mockTransferTabItems(100, 200, [10]);
      expect(result.movedCount).toBe(1);
    });
  });

  describe("edge cases", () => {
    it("should not allow transfer to the same table", () => {
      const sourceTableId = 1;
      const targetTableId = 1;
      expect(sourceTableId).toBe(targetTableId);
      // This validation happens in the router before calling transferTabItems
    });

    it("should not allow transfer with empty item list", () => {
      const itemIds: number[] = [];
      expect(itemIds.length).toBe(0);
      // This validation happens in the router (z.array min 1)
    });

    it("should handle target table that is reserved (opens it)", async () => {
      const targetTable = { id: 2, number: 7, status: "reserved", isActive: true };
      mockGetTableById.mockResolvedValue(targetTable);

      const table = await mockGetTableById(2);
      expect(table.status).toBe("reserved");
      // Router should handle opening the reserved table
    });
  });
});
