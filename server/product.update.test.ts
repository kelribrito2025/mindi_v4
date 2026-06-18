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

describe("product.update", () => {
  it("should update a product's name successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First get the establishment
    const establishment = await caller.establishment.get();
    if (!establishment) {
      console.log("No establishment found, skipping test");
      return;
    }

    // Get products list - returns { products: [], total: number }
    const { products } = await caller.product.list({ establishmentId: establishment.id });
    
    if (!products || products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const firstProduct = products[0];
    const originalName = firstProduct.name;
    const testName = `Test Update ${Date.now()}`;

    // Update the product
    const result = await caller.product.update({
      id: firstProduct.id,
      name: testName,
    });

    expect(result).toEqual({ success: true });

    // Verify the update by getting the product
    const updatedProduct = await caller.product.get({ id: firstProduct.id });
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.name).toBe(testName);

    // Restore original name
    await caller.product.update({
      id: firstProduct.id,
      name: originalName,
    });
  });

  it("should update product status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const establishment = await caller.establishment.get();
    if (!establishment) {
      console.log("No establishment found, skipping test");
      return;
    }

    const { products } = await caller.product.list({ establishmentId: establishment.id });
    
    if (!products || products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const firstProduct = products[0];
    const originalStatus = firstProduct.status;
    const newStatus = originalStatus === "active" ? "paused" : "active";

    // Update status
    const result = await caller.product.update({
      id: firstProduct.id,
      status: newStatus as "active" | "paused" | "archived",
    });

    expect(result).toEqual({ success: true });

    // Verify
    const updatedProduct = await caller.product.get({ id: firstProduct.id });
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.status).toBe(newStatus);

    // Restore
    await caller.product.update({
      id: firstProduct.id,
      status: originalStatus as "active" | "paused" | "archived",
    });
  });

  it("should update product price", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const establishment = await caller.establishment.get();
    if (!establishment) {
      console.log("No establishment found, skipping test");
      return;
    }

    const { products } = await caller.product.list({ establishmentId: establishment.id });
    
    if (!products || products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    const firstProduct = products[0];
    const originalPrice = firstProduct.price;

    // Update price
    const result = await caller.product.update({
      id: firstProduct.id,
      price: "25.50",
    });

    expect(result).toEqual({ success: true });

    // Verify
    const updatedProduct = await caller.product.get({ id: firstProduct.id });
    expect(updatedProduct).toBeDefined();
    expect(updatedProduct?.price).toBe("25.50");

    // Restore
    await caller.product.update({
      id: firstProduct.id,
      price: originalPrice,
    });
  });
});
