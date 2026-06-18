import { describe, it, expect, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(userId = 1): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: userId,
    openId: `user-${userId}`,
    email: `user${userId}@example.com`,
    name: `User ${userId}`,
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("establishment.update ownership authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow owner to update their own establishment", async () => {
    // User 1 owns establishment 100
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
      id: 100,
      userId: 1,
    } as any);
    vi.spyOn(db, "updateEstablishment").mockResolvedValue(undefined as any);

    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.establishment.update({
      id: 100,
      name: "Meu Restaurante",
    });

    expect(result).toEqual({ success: true });
    expect(db.updateEstablishment).toHaveBeenCalledWith(100, { name: "Meu Restaurante" });
  });

  it("should reject non-owner from updating another establishment", async () => {
    // User 2 does NOT own establishment 100 (owned by user 1)
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
      id: 100,
      userId: 1,
    } as any);

    const { ctx } = createAuthContext(2); // User 2 trying to update
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.establishment.update({
        id: 100,
        name: "Hackeado",
      })
    ).rejects.toThrow("Acesso negado");
  });

  it("should reject update for non-existent establishment", async () => {
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue(null as any);

    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.establishment.update({
        id: 999999,
        name: "Inexistente",
      })
    ).rejects.toThrow("Acesso negado");
  });
});

describe("loyalty.saveSettings ownership authorization", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should allow owner to save loyalty settings", async () => {
    // User 1 owns establishment 100
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
      id: 100,
      userId: 1,
    } as any);
    vi.spyOn(db, "updateEstablishment").mockResolvedValue(undefined as any);

    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    const result = await caller.loyalty.saveSettings({
      establishmentId: 100,
      loyaltyEnabled: true,
      loyaltyStampsRequired: 10,
      loyaltyCouponType: "percentage",
      loyaltyCouponValue: "10",
      loyaltyMinOrderValue: "30",
    });

    expect(result).toEqual({ success: true });
  });

  it("should reject non-owner from saving loyalty settings", async () => {
    // User 2 does NOT own establishment 100 (owned by user 1)
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue({
      id: 100,
      userId: 1,
    } as any);

    const { ctx } = createAuthContext(2); // User 2 trying to modify
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.loyalty.saveSettings({
        establishmentId: 100,
        loyaltyEnabled: true,
        loyaltyStampsRequired: 10,
        loyaltyCouponType: "fixed",
        loyaltyCouponValue: "5",
        loyaltyMinOrderValue: "20",
      })
    ).rejects.toThrow("Acesso negado");
  });

  it("should reject for non-existent establishment", async () => {
    vi.spyOn(db, "getEstablishmentById").mockResolvedValue(null as any);

    const { ctx } = createAuthContext(1);
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.loyalty.saveSettings({
        establishmentId: 999999,
        loyaltyEnabled: false,
        loyaltyStampsRequired: 5,
        loyaltyCouponType: "free_delivery",
        loyaltyCouponValue: "0",
        loyaltyMinOrderValue: "0",
      })
    ).rejects.toThrow("Acesso negado");
  });
});
