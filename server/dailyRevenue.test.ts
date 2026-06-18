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

describe("listDailyRevenue", () => {
  const { ctx } = createAuthContext();
  const caller = appRouter.createCaller(ctx);
  const testEstablishmentId = 99999;

  it("returns paginated daily revenue data with expected structure", async () => {
    const result = await caller.finance.listDailyRevenue({
      establishmentId: testEstablishmentId,
      limit: 15,
      offset: 0,
    });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
  });

  it("returns empty items for establishment with no orders", async () => {
    const result = await caller.finance.listDailyRevenue({
      establishmentId: testEstablishmentId,
      limit: 15,
      offset: 0,
    });
    // Test establishment has no orders, so items should be empty
    expect(result.items.length).toBe(0);
    expect(result.total).toBe(0);
  });

  it("returns empty for high offset", async () => {
    const result = await caller.finance.listDailyRevenue({
      establishmentId: testEstablishmentId,
      limit: 5,
      offset: 10000,
    });
    expect(result.items.length).toBe(0);
  });

  // Test with a real establishment that has data
  const realEstablishmentId = 30001;

  it("returns daily revenue items with correct fields for real data", async () => {
    const result = await caller.finance.listDailyRevenue({
      establishmentId: realEstablishmentId,
      page: 1,
      pageSize: 5,
    });
    expect(result).toHaveProperty("items");
    expect(result).toHaveProperty("total");

    if (result.items.length > 0) {
      const item = result.items[0];
      expect(item).toHaveProperty("date");
      expect(item).toHaveProperty("orderCount");
      expect(item).toHaveProperty("total");
      expect(item).toHaveProperty("sources");
      expect(item).toHaveProperty("paymentMethods");
      expect(typeof item.orderCount).toBe("number");
      expect(typeof item.total).toBe("number");
      expect(typeof item.sources).toBe("string");
      expect(typeof item.paymentMethods).toBe("string");
      expect(item.orderCount).toBeGreaterThan(0);
      expect(item.total).toBeGreaterThan(0);
    }
  });

  it("returns items sorted by date descending", async () => {
    const result = await caller.finance.listDailyRevenue({
      establishmentId: realEstablishmentId,
      page: 1,
      pageSize: 10,
    });

    if (result.items.length > 1) {
      for (let i = 0; i < result.items.length - 1; i++) {
        const currentDate = new Date(result.items[i].date).getTime();
        const nextDate = new Date(result.items[i + 1].date).getTime();
        expect(currentDate).toBeGreaterThanOrEqual(nextDate);
      }
    }
  });

  it("pagination works correctly", async () => {
    const page1 = await caller.finance.listDailyRevenue({
      establishmentId: realEstablishmentId,
      limit: 3,
      offset: 0,
    });
    const page2 = await caller.finance.listDailyRevenue({
      establishmentId: realEstablishmentId,
      limit: 3,
      offset: 3,
    });

    // page1 should have exactly 3 items if total > 3
    if (page1.total > 3) {
      expect(page1.items.length).toBe(3);
      expect(page2.items.length).toBeGreaterThan(0);
    }
  });
});
