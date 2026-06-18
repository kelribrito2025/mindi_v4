import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * Test the stable-ID publish strategy:
 * - Published product IDs should NOT change after re-publish
 * - New products should get new IDs
 * - Deleted products should be removed
 */

// We'll test by calling the actual tRPC procedure against the real DB
// using establishment 30001 which has both draft and published versions

import { categories, products, complementGroups, complementItems } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

// Mock auth
vi.mock("./routers/helpers", () => ({
  assertEstablishmentOwnership: vi.fn().mockResolvedValue(undefined),
}));

describe("catalogVersion.publish - Stable IDs", () => {
  it("should keep published product IDs stable after re-publish", async () => {
    // Import db after mocks
    const db = await import("./db");
    const dbInstance = await db.getDb();
    if (!dbInstance) throw new Error("DB unavailable");

    const estId = 30001;

    // Get current published product IDs
    const pubProductsBefore = await dbInstance.select({ id: products.id, name: products.name })
      .from(products)
      .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')));

    const pubCatsBefore = await dbInstance.select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')));

    // Import and call the publish procedure logic directly
    const { catalogVersionRouter } = await import("./routers/catalogVersion");
    
    // Create a mock caller
    const caller = catalogVersionRouter.createCaller({
      user: { id: "test-user", name: "Test", role: "admin" },
    } as any);

    // Execute publish
    const result = await caller.publish({ establishmentId: estId });
    expect(result.success).toBe(true);

    // Get published product IDs AFTER publish
    const pubProductsAfter = await dbInstance.select({ id: products.id, name: products.name })
      .from(products)
      .where(and(eq(products.establishmentId, estId), eq(products.version, 'published')));

    const pubCatsAfter = await dbInstance.select({ id: categories.id, name: categories.name })
      .from(categories)
      .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'published')));

    // CRITICAL: All published IDs that existed before should still exist after
    const beforeProdIds = new Set(pubProductsBefore.map(p => p.id));
    const afterProdIds = new Set(pubProductsAfter.map(p => p.id));
    const beforeCatIds = new Set(pubCatsBefore.map(c => c.id));
    const afterCatIds = new Set(pubCatsAfter.map(c => c.id));

    // Every product that existed before should still exist (assuming no products were deleted from draft)
    for (const beforeProd of pubProductsBefore) {
      // Check if this product still exists in draft (via publishedSourceId)
      const draftWithThisSource = await dbInstance.select({ id: products.id })
        .from(products)
        .where(and(
          eq(products.establishmentId, estId),
          eq(products.version, 'draft'),
          eq(products.publishedSourceId, beforeProd.id)
        ));
      
      if (draftWithThisSource.length > 0) {
        // This product should still exist with the same ID
        expect(afterProdIds.has(beforeProd.id)).toBe(true);
      }
    }

    // Same for categories
    for (const beforeCat of pubCatsBefore) {
      const draftWithThisSource = await dbInstance.select({ id: categories.id })
        .from(categories)
        .where(and(
          eq(categories.establishmentId, estId),
          eq(categories.version, 'draft'),
          eq(categories.publishedSourceId, beforeCat.id)
        ));
      
      if (draftWithThisSource.length > 0) {
        expect(afterCatIds.has(beforeCat.id)).toBe(true);
      }
    }

    // Product count should match draft count
    const draftProdsCount = await dbInstance.select({ id: products.id })
      .from(products)
      .where(and(eq(products.establishmentId, estId), eq(products.version, 'draft')));
    expect(pubProductsAfter.length).toBe(draftProdsCount.length);

    // Category count should match draft count
    const draftCatsCount = await dbInstance.select({ id: categories.id })
      .from(categories)
      .where(and(eq(categories.establishmentId, estId), eq(categories.version, 'draft')));
    expect(pubCatsAfter.length).toBe(draftCatsCount.length);

    console.log(`✅ Published products: ${pubProductsBefore.length} → ${pubProductsAfter.length} (IDs stable)`);
    console.log(`✅ Published categories: ${pubCatsBefore.length} → ${pubCatsAfter.length} (IDs stable)`);
  }, 30000);
});
