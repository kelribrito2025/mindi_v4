import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("auto-accept orders", () => {
  it("establishment.update accepts autoAcceptOrders boolean field", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Test that the mutation accepts autoAcceptOrders as a valid field
    // This verifies the tRPC input schema includes the field
    try {
      await caller.establishment.update({
        id: 999999, // Non-existent ID, but validates input schema
        autoAcceptOrders: true,
      });
    } catch (error: any) {
      // We expect a DB error (non-existent ID), not a validation error
      // If it were a validation error, it would be a TRPCError with code 'BAD_REQUEST'
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("establishment.update accepts autoAcceptOrders as false", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.establishment.update({
        id: 999999,
        autoAcceptOrders: false,
      });
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("establishment.update accepts autoAcceptOrders as optional (undefined)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    // Should not throw a validation error when autoAcceptOrders is omitted
    try {
      await caller.establishment.update({
        id: 999999,
        // autoAcceptOrders not included - should be valid
      });
    } catch (error: any) {
      expect(error.code).not.toBe("BAD_REQUEST");
    }
  });

  it("rejects invalid autoAcceptOrders value (non-boolean)", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    try {
      await caller.establishment.update({
        id: 999999,
        autoAcceptOrders: "yes" as any, // Invalid type
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error: any) {
      // Should be a validation error
      expect(error.code).toBe("BAD_REQUEST");
    }
  });
});
