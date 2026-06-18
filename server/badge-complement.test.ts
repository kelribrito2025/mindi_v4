import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "sample-user",
    email: "sample@example.com",
    name: "Sample User",
    loginMethod: "manus",
    role: "user",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("complement badge", () => {
  it("updateGlobal procedure accepts badgeText parameter", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // The procedure should accept badgeText in its input schema
    // We test that the input validation passes (even if DB operation fails)
    try {
      await caller.complement.updateGlobal({
        establishmentId: 999999,
        complementName: "Test Complement",
        badgeText: "Novo",
      });
    } catch (e: any) {
      // Expected: DB error because establishment doesn't exist
      // But input validation should pass (no ZodError)
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateGlobal procedure accepts null badgeText to remove badge", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.complement.updateGlobal({
        establishmentId: 999999,
        complementName: "Test Complement",
        badgeText: null,
      });
    } catch (e: any) {
      // Input validation should pass
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateGlobal procedure works without badgeText (backward compatible)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.complement.updateGlobal({
        establishmentId: 999999,
        complementName: "Test Complement",
        isActive: true,
      });
    } catch (e: any) {
      // Input validation should pass without badgeText
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateGlobal procedure accepts newName parameter for renaming", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.complement.updateGlobal({
        establishmentId: 999999,
        complementName: "Old Name",
        newName: "New Name",
      });
    } catch (e: any) {
      // Input validation should pass (ZodError would be BAD_REQUEST)
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });

  it("updateGlobal procedure accepts newName with other fields", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.complement.updateGlobal({
        establishmentId: 999999,
        complementName: "Old Name",
        newName: "New Name",
        badgeText: "Novo",
        isActive: true,
      });
    } catch (e: any) {
      // Input validation should pass
      expect(e.code).not.toBe("BAD_REQUEST");
    }
  });
});
