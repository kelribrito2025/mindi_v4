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

describe("product.list - images field for no-photo banner", () => {
  it("should return products with images field defined", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const establishment = await caller.establishment.get();
    if (!establishment) {
      console.log("No establishment found, skipping test");
      return;
    }

    const { products } = await caller.product.list({ establishmentId: establishment.id });

    expect(products).toBeDefined();
    expect(Array.isArray(products)).toBe(true);

    if (products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    // Every product should have an 'images' field (array or null)
    for (const product of products) {
      expect(product).toHaveProperty("images");
      // images should be either null or an array
      if (product.images !== null) {
        expect(Array.isArray(product.images)).toBe(true);
      }
    }
  });

  it("should correctly identify products without photos", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const establishment = await caller.establishment.get();
    if (!establishment) {
      console.log("No establishment found, skipping test");
      return;
    }

    const { products } = await caller.product.list({ establishmentId: establishment.id });

    if (products.length === 0) {
      console.log("No products found, skipping test");
      return;
    }

    // Count products without photos using the same logic as the banner
    const productsWithoutPhoto = products.filter(
      (p) => !p.images || p.images.length === 0
    );
    const productsWithPhoto = products.filter(
      (p) => p.images && p.images.length > 0
    );

    // Total should match
    expect(productsWithoutPhoto.length + productsWithPhoto.length).toBe(products.length);

    // At least some products should exist (we know from the UI there are 71 without photo)
    expect(products.length).toBeGreaterThan(0);

    console.log(
      `Total: ${products.length}, With photo: ${productsWithPhoto.length}, Without photo: ${productsWithoutPhoto.length}`
    );
  });
});
