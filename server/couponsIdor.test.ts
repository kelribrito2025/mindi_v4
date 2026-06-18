import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

vi.mock("./db", () => ({
  getEstablishmentById: vi.fn(),
  getCouponsByEstablishment: vi.fn(),
  getCouponById: vi.fn(),
  getCouponByCode: vi.fn(),
  createCoupon: vi.fn(),
  updateCoupon: vi.fn(),
  deleteCoupon: vi.fn(),
  toggleCouponStatus: vi.fn(),
  validateCoupon: vi.fn(),
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
const mockCoupon = { id: 5, establishmentId: 1, code: "DESC10", type: "percentage", value: "10" };

describe("Coupons IDOR Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // LIST
  it("list — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.list({ establishmentId: 1 })).rejects.toThrow("Acesso negado");
  });

  it("list — permite acesso do dono", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.getCouponsByEstablishment).mockResolvedValue([mockCoupon] as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.coupon.list({ establishmentId: 1 });
    expect(result).toEqual([mockCoupon]);
  });

  // GET
  it("get — bloqueia acesso de outro dono", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(mockCoupon as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.get({ id: 5 })).rejects.toThrow("Acesso negado");
  });

  it("get — retorna NOT_FOUND para cupom inexistente", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(null as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.get({ id: 999 })).rejects.toThrow("Cupom não encontrado");
  });

  // CREATE
  it("create — bloqueia criação em outro estabelecimento", async () => {
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.create({ establishmentId: 1, code: "HACK", type: "percentage", value: "50" })).rejects.toThrow("Acesso negado");
    expect(db.createCoupon).not.toHaveBeenCalled();
  });

  // UPDATE
  it("update — bloqueia atualização de cupom de outro dono", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(mockCoupon as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.update({ id: 5, value: "99" })).rejects.toThrow("Acesso negado");
    expect(db.updateCoupon).not.toHaveBeenCalled();
  });

  it("update — retorna NOT_FOUND para cupom inexistente", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(null as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.update({ id: 999, value: "10" })).rejects.toThrow("Cupom não encontrado");
  });

  // DELETE
  it("delete — bloqueia exclusão de cupom de outro dono", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(mockCoupon as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.delete({ id: 5 })).rejects.toThrow("Acesso negado");
    expect(db.deleteCoupon).not.toHaveBeenCalled();
  });

  // TOGGLE STATUS
  it("toggleStatus — bloqueia de outro dono", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(mockCoupon as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    const ctx = createAuthContext(99);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.coupon.toggleStatus({ id: 5, status: "inactive" })).rejects.toThrow("Acesso negado");
    expect(db.toggleCouponStatus).not.toHaveBeenCalled();
  });

  it("toggleStatus — permite do dono", async () => {
    vi.mocked(db.getCouponById).mockResolvedValue(mockCoupon as any);
    vi.mocked(db.getEstablishmentById).mockResolvedValue(mockEstOwner as any);
    vi.mocked(db.toggleCouponStatus).mockResolvedValue(undefined as any);
    const ctx = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.coupon.toggleStatus({ id: 5, status: "inactive" });
    expect(result).toEqual({ success: true });
  });
});
