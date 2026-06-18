import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getNeighborhoodFeeById: vi.fn(),
  getNeighborhoodFeesByEstablishment: vi.fn(),
  createNeighborhoodFee: vi.fn(),
  updateNeighborhoodFee: vi.fn(),
  deleteNeighborhoodFee: vi.fn(),
  deleteAllNeighborhoodFees: vi.fn(),
  syncNeighborhoodFees: vi.fn(),
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
const mockFee = { id: 3, establishmentId: 1, neighborhood: "Centro", fee: "5.00" };

describe("NeighborhoodFees IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // CREATE
  it("create — bloqueia criação em outro estabelecimento", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.create({ establishmentId: 1, neighborhood: "Hack", fee: "10" })).rejects.toThrow("Acesso negado");
    expect(db.createNeighborhoodFee).not.toHaveBeenCalled();
  });

  it("create — permite criação do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.createNeighborhoodFee).mockResolvedValue(3);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.neighborhoodFees.create({ establishmentId: 1, neighborhood: "Centro", fee: "5" });
    expect(result).toEqual({ id: 3 });
  });

  // UPDATE
  it("update — bloqueia atualização de taxa de outro dono", async () => {
    vi.mocked(db.getNeighborhoodFeeById).mockResolvedValue(mockFee as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.update({ id: 3, fee: "99" })).rejects.toThrow("Acesso negado");
    expect(db.updateNeighborhoodFee).not.toHaveBeenCalled();
  });

  it("update — retorna NOT_FOUND para taxa inexistente", async () => {
    vi.mocked(db.getNeighborhoodFeeById).mockResolvedValue(null);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.update({ id: 999, fee: "5" })).rejects.toThrow("Taxa não encontrada");
  });

  // DELETE
  it("delete — bloqueia exclusão de taxa de outro dono", async () => {
    vi.mocked(db.getNeighborhoodFeeById).mockResolvedValue(mockFee as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.delete({ id: 3 })).rejects.toThrow("Acesso negado");
    expect(db.deleteNeighborhoodFee).not.toHaveBeenCalled();
  });

  // DELETE ALL
  it("deleteAll — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.deleteAll({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
    expect(db.deleteAllNeighborhoodFees).not.toHaveBeenCalled();
  });

  // SYNC
  it("sync — bloqueia de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.neighborhoodFees.sync({ establishmentId: 1, fees: [{ neighborhood: "Hack", fee: "0" }] })).rejects.toThrow("Acesso negado");
    expect(db.syncNeighborhoodFees).not.toHaveBeenCalled();
  });

  it("sync — permite do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.syncNeighborhoodFees).mockResolvedValue([{ id: 1, neighborhood: "Centro", fee: "5" }] as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.neighborhoodFees.sync({ establishmentId: 1, fees: [{ neighborhood: "Centro", fee: "5" }] });
    expect(result).toBeDefined();
  });
});
