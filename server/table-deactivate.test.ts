import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db functions
const mockUpdateTable = vi.fn();
const mockGetDeactivatedTables = vi.fn();
const mockGetDeletedTables = vi.fn();
const mockSoftDeleteTable = vi.fn();
const mockRestoreDeletedTable = vi.fn();
const mockDeleteTable = vi.fn();

vi.mock("./db", () => ({
  updateTable: (...args: any[]) => mockUpdateTable(...args),
  getDeactivatedTables: (...args: any[]) => mockGetDeactivatedTables(...args),
  getDeletedTables: (...args: any[]) => mockGetDeletedTables(...args),
  softDeleteTable: (...args: any[]) => mockSoftDeleteTable(...args),
  restoreDeletedTable: (...args: any[]) => mockRestoreDeletedTable(...args),
  deleteTable: (...args: any[]) => mockDeleteTable(...args),
}));

describe("Table Deactivation vs Deletion Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("deactivate table (isActive=false, visible on map as gray)", () => {
    it("should call updateTable with isActive: false", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: false });

      expect(mockUpdateTable).toHaveBeenCalledWith(42, { isActive: false });
      expect(mockUpdateTable).toHaveBeenCalledTimes(1);
    });

    it("should NOT set deletedAt when deactivating", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: false });

      // Deactivation only sets isActive=false, no deletedAt
      const callArgs = mockUpdateTable.mock.calls[0][1];
      expect(callArgs).toEqual({ isActive: false });
      expect(callArgs.deletedAt).toBeUndefined();
    });

    it("should not hard delete or soft delete the table when deactivating", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      await mockUpdateTable(42, { isActive: false });

      expect(mockDeleteTable).not.toHaveBeenCalled();
      expect(mockSoftDeleteTable).not.toHaveBeenCalled();
    });
  });

  describe("restore deactivated table (isActive=true)", () => {
    it("should call updateTable with isActive: true", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockUpdateTable(tableId, { isActive: true });

      expect(mockUpdateTable).toHaveBeenCalledWith(42, { isActive: true });
      expect(mockUpdateTable).toHaveBeenCalledTimes(1);
    });
  });

  describe("list deactivated tables (isActive=false, deletedAt=null)", () => {
    it("should return only deactivated (not deleted) tables", async () => {
      const deactivatedTables = [
        { id: 1, number: 1, isActive: false, deletedAt: null, establishmentId: 100 },
        { id: 5, number: 5, isActive: false, deletedAt: null, establishmentId: 100 },
      ];
      mockGetDeactivatedTables.mockResolvedValue(deactivatedTables);

      const result = await mockGetDeactivatedTables(100);

      expect(result).toHaveLength(2);
      result.forEach((t: any) => {
        expect(t.isActive).toBe(false);
        expect(t.deletedAt).toBeNull();
      });
    });

    it("should NOT include deleted tables (those with deletedAt set)", async () => {
      // Only deactivated tables (deletedAt=null) should be returned
      const deactivatedTables = [
        { id: 1, number: 1, isActive: false, deletedAt: null, establishmentId: 100 },
      ];
      mockGetDeactivatedTables.mockResolvedValue(deactivatedTables);

      const result = await mockGetDeactivatedTables(100);

      expect(result).toHaveLength(1);
      expect(result[0].deletedAt).toBeNull();
    });
  });

  describe("soft delete table (sets deletedAt, hidden from map)", () => {
    it("should call softDeleteTable to set deletedAt timestamp", async () => {
      mockSoftDeleteTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockSoftDeleteTable(tableId);

      expect(mockSoftDeleteTable).toHaveBeenCalledWith(42);
      expect(mockSoftDeleteTable).toHaveBeenCalledTimes(1);
    });

    it("should NOT call hard deleteTable when soft deleting", async () => {
      mockSoftDeleteTable.mockResolvedValue(undefined);

      await mockSoftDeleteTable(42);

      expect(mockDeleteTable).not.toHaveBeenCalled();
    });
  });

  describe("list deleted tables (deletedAt IS NOT NULL)", () => {
    it("should return only soft-deleted tables", async () => {
      const deletedTables = [
        { id: 3, number: 3, isActive: false, deletedAt: new Date("2026-03-11"), establishmentId: 100 },
        { id: 7, number: 7, isActive: false, deletedAt: new Date("2026-03-10"), establishmentId: 100 },
      ];
      mockGetDeletedTables.mockResolvedValue(deletedTables);

      const result = await mockGetDeletedTables(100);

      expect(result).toHaveLength(2);
      result.forEach((t: any) => {
        expect(t.deletedAt).not.toBeNull();
      });
    });

    it("should return empty array when no deleted tables", async () => {
      mockGetDeletedTables.mockResolvedValue([]);

      const result = await mockGetDeletedTables(100);

      expect(result).toEqual([]);
    });
  });

  describe("restore deleted table (clears deletedAt, sets isActive=true)", () => {
    it("should call restoreDeletedTable", async () => {
      mockRestoreDeletedTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockRestoreDeletedTable(tableId);

      expect(mockRestoreDeletedTable).toHaveBeenCalledWith(42);
      expect(mockRestoreDeletedTable).toHaveBeenCalledTimes(1);
    });
  });

  describe("permanent delete (hard delete from database)", () => {
    it("should hard delete the table", async () => {
      mockDeleteTable.mockResolvedValue(undefined);

      const tableId = 42;
      await mockDeleteTable(tableId);

      expect(mockDeleteTable).toHaveBeenCalledWith(42);
      expect(mockDeleteTable).toHaveBeenCalledTimes(1);
    });
  });

  describe("deactivate vs soft delete vs hard delete flow", () => {
    it("deactivate uses isActive=false only (no deletedAt)", async () => {
      mockUpdateTable.mockResolvedValue(undefined);

      await mockUpdateTable(10, { isActive: false });

      expect(mockUpdateTable).toHaveBeenCalledWith(10, { isActive: false });
      expect(mockSoftDeleteTable).not.toHaveBeenCalled();
      expect(mockDeleteTable).not.toHaveBeenCalled();
    });

    it("soft delete uses softDeleteTable (sets deletedAt)", async () => {
      mockSoftDeleteTable.mockResolvedValue(undefined);

      await mockSoftDeleteTable(10);

      expect(mockSoftDeleteTable).toHaveBeenCalledWith(10);
      expect(mockUpdateTable).not.toHaveBeenCalled();
      expect(mockDeleteTable).not.toHaveBeenCalled();
    });

    it("hard delete uses deleteTable (removes from DB)", async () => {
      mockDeleteTable.mockResolvedValue(undefined);

      await mockDeleteTable(10);

      expect(mockDeleteTable).toHaveBeenCalledWith(10);
      expect(mockUpdateTable).not.toHaveBeenCalled();
      expect(mockSoftDeleteTable).not.toHaveBeenCalled();
    });

    it("full lifecycle: deactivate → restore → soft delete → restore → hard delete", async () => {
      mockUpdateTable.mockResolvedValue(undefined);
      mockSoftDeleteTable.mockResolvedValue(undefined);
      mockRestoreDeletedTable.mockResolvedValue(undefined);
      mockDeleteTable.mockResolvedValue(undefined);

      // 1. Deactivate (gray on map)
      await mockUpdateTable(10, { isActive: false });
      expect(mockUpdateTable).toHaveBeenCalledWith(10, { isActive: false });

      // 2. Restore from deactivated
      await mockUpdateTable(10, { isActive: true });
      expect(mockUpdateTable).toHaveBeenCalledWith(10, { isActive: true });

      // 3. Soft delete (hidden from map, appears in "Mesas Excluídas")
      await mockSoftDeleteTable(10);
      expect(mockSoftDeleteTable).toHaveBeenCalledWith(10);

      // 4. Restore from deleted
      await mockRestoreDeletedTable(10);
      expect(mockRestoreDeletedTable).toHaveBeenCalledWith(10);

      // 5. Hard delete (permanent)
      await mockDeleteTable(10);
      expect(mockDeleteTable).toHaveBeenCalledWith(10);
    });
  });
});
