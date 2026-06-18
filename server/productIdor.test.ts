import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
  getProductsByEstablishment: vi.fn(),
  getProductById: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  toggleProductStatus: vi.fn(),
  duplicateProduct: vi.fn(),
  reorderProducts: vi.fn(),
  createStockItem: vi.fn(),
  getStockItemByLinkedProductId: vi.fn(),
  deleteStockItem: vi.fn(),
  updateStockItem: vi.fn(),
  getAiImageCredits: vi.fn(),
  consumeAiImageCredit: vi.fn(),
  invalidatePublicMenuCache: vi.fn(),
}));

vi.mock("../_core/auditLog", () => ({ auditLog: vi.fn() }));

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
const mockProduct = { id: 10, establishmentId: 1, name: "Hambúrguer", price: "25.00", images: [], enhancedImages: null };

describe("Product IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // LIST
  it("list — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.list({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
    expect(db.getProductsByEstablishment).not.toHaveBeenCalled();
  });

  it("list — permite acesso do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.getProductsByEstablishment).mockResolvedValue([mockProduct] as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.list({ establishmentId: 1 });
    expect(result).toEqual([mockProduct]);
  });

  // GET
  it("get — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.get({ id: 10 })).rejects.toThrow("Acesso negado");
  });

  it("get — retorna NOT_FOUND para produto inexistente", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(undefined as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.get({ id: 999 })).rejects.toThrow("Produto não encontrado");
  });

  // UPDATE
  it("update — bloqueia atualização de produto de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.update({ id: 10, name: "Hackeado" })).rejects.toThrow("Acesso negado");
    expect(db.updateProduct).not.toHaveBeenCalled();
  });

  it("update — permite atualização do dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.updateProduct).mockResolvedValue(undefined as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.update({ id: 10, name: "Atualizado" });
    expect(result).toEqual({ success: true });
  });

  it("update — retorna NOT_FOUND para produto inexistente", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(undefined as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.update({ id: 999, name: "X" })).rejects.toThrow("Produto não encontrado");
  });

  // TOGGLE STATUS
  it("toggleStatus — bloqueia de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.toggleStatus({ id: 10, status: "paused" })).rejects.toThrow("Acesso negado");
    expect(db.toggleProductStatus).not.toHaveBeenCalled();
  });

  // DUPLICATE
  it("duplicate — bloqueia de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.duplicate({ id: 10 })).rejects.toThrow("Acesso negado");
    expect(db.duplicateProduct).not.toHaveBeenCalled();
  });

  // REORDER
  it("reorder — bloqueia de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.reorder([{ id: 10, sortOrder: 0 }])).rejects.toThrow("Acesso negado");
    expect(db.reorderProducts).not.toHaveBeenCalled();
  });

  it("reorder — retorna sucesso para array vazio", async () => {
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.product.reorder([]);
    expect(result).toEqual({ success: true });
  });

  // REVERT ENHANCED IMAGE
  it("revertEnhancedImage — bloqueia de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.product.revertEnhancedImage({ productId: 10, imageIndex: 0 })).rejects.toThrow("Acesso negado");
    expect(db.updateProduct).not.toHaveBeenCalled();
  });
});
