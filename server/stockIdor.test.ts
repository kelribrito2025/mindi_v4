import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getStockCategoryById: vi.fn(),
  getStockCategoriesByEstablishment: vi.fn(),
  createStockCategory: vi.fn(),
  updateStockCategory: vi.fn(),
  deleteStockCategory: vi.fn(),
  getStockItemById: vi.fn(),
  getStockItemsByEstablishment: vi.fn(),
  createStockItem: vi.fn(),
  updateStockItem: vi.fn(),
  deleteStockItem: vi.fn(),
  addStockMovement: vi.fn(),
  getStockMovementsByItem: vi.fn(),
  getOutOfStockCount: vi.fn(),
  getRecentStockMovements: vi.fn(),
  getStockSummary: vi.fn(),
  invalidatePublicMenuCache: vi.fn(),
}));

import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): TrpcContext {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `test-user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

const mockEstOwner = { id: 1, userId: 1, name: "Restaurante A" };
const mockStockCategory = { id: 2, establishmentId: 1, name: "Bebidas" };
const mockStockItem = { id: 5, establishmentId: 1, name: "Coca-Cola", currentQuantity: "10" };

describe("Stock IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CATEGORIES
  it("listCategories — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.listCategories({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  it("createCategory — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.createCategory({ establishmentId: 1, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.createStockCategory).not.toHaveBeenCalled();
  });

  it("updateCategory — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockCategoryById).mockResolvedValue(mockStockCategory as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.updateCategory({ id: 2, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.updateStockCategory).not.toHaveBeenCalled();
  });

  it("updateCategory — NOT_FOUND para categoria inexistente", async () => {
    vi.mocked(db.getStockCategoryById).mockResolvedValue(null);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.updateCategory({ id: 999, name: "X" })).rejects.toThrow("Categoria de estoque não encontrada");
  });

  it("deleteCategory — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockCategoryById).mockResolvedValue(mockStockCategory as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.deleteCategory({ id: 2 })).rejects.toThrow("Acesso negado");
    expect(db.deleteStockCategory).not.toHaveBeenCalled();
  });

  // ITEMS
  it("listItems — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.listItems({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  it("getItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.getItem({ id: 5 })).rejects.toThrow("Acesso negado");
  });

  it("createItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.createItem({ establishmentId: 1, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.createStockItem).not.toHaveBeenCalled();
  });

  it("updateItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.updateItem({ id: 5, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.updateStockItem).not.toHaveBeenCalled();
  });

  it("deleteItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.deleteItem({ id: 5 })).rejects.toThrow("Acesso negado");
    expect(db.deleteStockItem).not.toHaveBeenCalled();
  });

  it("markOutOfStock — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.markOutOfStock({ id: 5 })).rejects.toThrow("Acesso negado");
  });

  // MOVEMENTS
  it("addMovement — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.addMovement({ stockItemId: 5, type: "entry", quantity: "10" })).rejects.toThrow("Acesso negado");
    expect(db.addStockMovement).not.toHaveBeenCalled();
  });

  it("listMovements — bloqueia de outro dono", async () => {
    vi.mocked(db.getStockItemById).mockResolvedValue(mockStockItem as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.listMovements({ stockItemId: 5 })).rejects.toThrow("Acesso negado");
  });

  // QUERIES com establishmentId
  it("outOfStockCount — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.outOfStockCount({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  it("summary — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.stock.summary({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  // Permite acesso do dono
  it("createItem — permite do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.createStockItem).mockResolvedValue(5);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.stock.createItem({ establishmentId: 1, name: "Coca-Cola" });
    expect(result).toEqual({ id: 5 });
  });
});
