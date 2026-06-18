import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getProductById: vi.fn(),
  getComplementGroupById: vi.fn(),
  getComplementItemById: vi.fn(),
  getComplementGroupsByProduct: vi.fn(),
  getComplementItemsByGroup: vi.fn(),
  getComboGroupsByProductId: vi.fn(),
  createComplementGroup: vi.fn(),
  updateComplementGroup: vi.fn(),
  deleteComplementGroup: vi.fn(),
  createComplementItem: vi.fn(),
  updateComplementItem: vi.fn(),
  deleteComplementItem: vi.fn(),
  getAllComplementItemsByEstablishment: vi.fn(),
  getAllComplementGroupsByEstablishment: vi.fn(),
  toggleComplementGroupByName: vi.fn(),
  deleteComplementGroupByName: vi.fn(),
  updateComplementGroupRulesByName: vi.fn(),
  updateComplementItemsByName: vi.fn(),
  deleteComplementItemByName: vi.fn(),
  getGlobalTemplatePrices: vi.fn(),
  addComplementItemToGroupByName: vi.fn(),
  addExclusiveComplementItem: vi.fn(),
  removeExclusiveComplementItem: vi.fn(),
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
const mockProduct = { id: 10, establishmentId: 1, name: "Hambúrguer", isCombo: false };
const mockGroup = { id: 20, productId: 10, name: "Molhos", minQuantity: 0, maxQuantity: 3 };
const mockItem = { id: 30, groupId: 20, name: "Ketchup", price: "2.00" };

describe("Complement IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // listGroups — via productId → product.establishmentId
  it("listGroups — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.listGroups({ productId: 10 })).rejects.toThrow("Acesso negado");
  });

  // createGroup — via productId
  it("createGroup — bloqueia criação em produto de outro dono", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.createGroup({ productId: 10, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.createComplementGroup).not.toHaveBeenCalled();
  });

  it("createGroup — permite criação no próprio produto", async () => {
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.createComplementGroup).mockResolvedValue(20);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.complement.createGroup({ productId: 10, name: "Molhos" });
    expect(result).toEqual({ id: 20 });
  });

  // updateGroup — via groupId → productId → establishmentId
  it("updateGroup — bloqueia atualização de grupo de outro dono", async () => {
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.updateGroup({ id: 20, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.updateComplementGroup).not.toHaveBeenCalled();
  });

  // deleteGroup — via groupId
  it("deleteGroup — bloqueia exclusão de grupo de outro dono", async () => {
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.deleteGroup({ id: 20 })).rejects.toThrow("Acesso negado");
    expect(db.deleteComplementGroup).not.toHaveBeenCalled();
  });

  it("deleteGroup — retorna NOT_FOUND para grupo inexistente", async () => {
    vi.mocked(db.getComplementGroupById).mockResolvedValue(null);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.deleteGroup({ id: 999 })).rejects.toThrow("Grupo não encontrado");
  });

  // createItem — via groupId
  it("createItem — bloqueia criação em grupo de outro dono", async () => {
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.createItem({ groupId: 20, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.createComplementItem).not.toHaveBeenCalled();
  });

  // updateItem — via itemId → groupId → productId
  it("updateItem — bloqueia atualização de item de outro dono", async () => {
    vi.mocked(db.getComplementItemById).mockResolvedValue(mockItem as any);
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.updateItem({ id: 30, name: "Hack" })).rejects.toThrow("Acesso negado");
    expect(db.updateComplementItem).not.toHaveBeenCalled();
  });

  // deleteItem — via itemId
  it("deleteItem — bloqueia exclusão de item de outro dono", async () => {
    vi.mocked(db.getComplementItemById).mockResolvedValue(mockItem as any);
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.deleteItem({ id: 30 })).rejects.toThrow("Acesso negado");
    expect(db.deleteComplementItem).not.toHaveBeenCalled();
  });

  it("deleteItem — retorna NOT_FOUND para item inexistente", async () => {
    vi.mocked(db.getComplementItemById).mockResolvedValue(null);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.deleteItem({ id: 999 })).rejects.toThrow("Item não encontrado");
  });

  // listAllByEstablishment — via establishmentId
  it("listAllByEstablishment — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.listAllByEstablishment({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  // toggleActive — via itemId
  it("toggleActive — bloqueia de outro dono", async () => {
    vi.mocked(db.getComplementItemById).mockResolvedValue(mockItem as any);
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.toggleActive({ id: 30, isActive: false })).rejects.toThrow("Acesso negado");
  });

  // toggleGroupActive — via establishmentId
  it("toggleGroupActive — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.toggleGroupActive({ establishmentId: 1, groupName: "Molhos", isActive: false })).rejects.toThrow("Acesso negado");
  });

  // deleteGroupByName — via establishmentId
  it("deleteGroupByName — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.deleteGroupByName({ establishmentId: 1, groupName: "Molhos" })).rejects.toThrow("Acesso negado");
  });

  // removeExclusiveItem — via itemId
  it("removeExclusiveItem — bloqueia de outro dono", async () => {
    vi.mocked(db.getComplementItemById).mockResolvedValue(mockItem as any);
    vi.mocked(db.getComplementGroupById).mockResolvedValue(mockGroup as any);
    vi.mocked(db.getProductById).mockResolvedValue(mockProduct as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.complement.removeExclusiveItem({ itemId: 30 })).rejects.toThrow("Acesso negado");
  });
});
