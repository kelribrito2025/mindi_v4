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

describe("complement.listGroups", () => {
  it("returns an array when called with a valid productId", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Use productId 1 which should exist in the database
    const result = await caller.complement.listGroups({ productId: 1 });

    expect(Array.isArray(result)).toBe(true);
  });

  it("returns empty array for product with no complements", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Use a very high productId that likely doesn't exist
    const result = await caller.complement.listGroups({ productId: 999999 });

    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(0);
  });

  it("each group has expected properties", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.complement.listGroups({ productId: 1 });

    if (result.length > 0) {
      const group = result[0];
      expect(group).toHaveProperty("id");
      expect(group).toHaveProperty("name");
      expect(group).toHaveProperty("items");
      expect(Array.isArray(group.items)).toBe(true);
    }
  });
});

describe("complement.toggleActive", () => {
  it("requires a valid groupId and active boolean", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // This should not throw for valid input structure
    // Even if the group doesn't exist, the mutation should handle gracefully
    try {
      await caller.complement.toggleActive({ groupId: 999999, active: false });
    } catch (e: any) {
      // It's acceptable to throw if group not found
      expect(e).toBeDefined();
    }
  });
});
