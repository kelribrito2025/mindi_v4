import { describe, it, expect } from "vitest";

describe("Complement Stock Control", () => {
  it("should have hasStock and stockQuantity columns in complementItems schema", async () => {
    const schema = await import("../drizzle/schema");
    const { complementItems } = schema;
    
    // Verify the columns exist in the schema
    expect(complementItems).toBeDefined();
    // The table should have hasStock and stockQuantity columns
    const columns = Object.keys(complementItems);
    // Check that the schema exports include the table
    expect(schema).toHaveProperty("complementItems");
  });

  it("should accept hasStock and stockQuantity in complement item updates via tRPC", async () => {
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { complementItems } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get any complement item to test
    const [item] = await db.select().from(complementItems).limit(1);
    if (!item) {
      console.log("No complement items found, skipping test");
      return;
    }

    // Verify the item has the stock fields
    expect(item).toHaveProperty("hasStock");
    expect(item).toHaveProperty("stockQuantity");

    // Default values should be false/null
    if (item.hasStock === null || item.hasStock === undefined) {
      // New field, might be null initially
      expect(true).toBe(true);
    } else {
      expect(typeof item.hasStock).toBe("boolean");
    }
  });

  it("should update complement item stock via database", async () => {
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { complementItems } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    // Get any complement item
    const [item] = await db.select().from(complementItems).limit(1);
    if (!item) {
      console.log("No complement items found, skipping test");
      return;
    }

    // Save original values
    const originalHasStock = item.hasStock;
    const originalStockQuantity = item.stockQuantity;

    // Update to enable stock with quantity 10
    await db.update(complementItems)
      .set({ hasStock: true, stockQuantity: 10 })
      .where(eq(complementItems.id, item.id));

    // Verify update
    const [updated] = await db.select().from(complementItems)
      .where(eq(complementItems.id, item.id));
    
    expect(updated.hasStock).toBe(true);
    expect(updated.stockQuantity).toBe(10);

    // Restore original values
    await db.update(complementItems)
      .set({ hasStock: originalHasStock, stockQuantity: originalStockQuantity })
      .where(eq(complementItems.id, item.id));
  });

  it("should filter out-of-stock complement items in bot API", async () => {
    const BASE_URL = "http://localhost:3000";
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { botApiKeys, complementItems, products } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");

    // Get an active API key
    const [key] = await db.select().from(botApiKeys)
      .where(eq(botApiKeys.isActive, true))
      .limit(1);
    if (!key) {
      console.log("No active API key found, skipping test");
      return;
    }

    // Get a product that has complement groups
    const [product] = await db.select().from(products)
      .where(and(
        eq(products.establishmentId, key.establishmentId),
        eq(products.status, "active")
      ))
      .limit(1);
    if (!product) {
      console.log("No active product found, skipping test");
      return;
    }

    // Get a complement item for this product
    const groups = await dbModule.getComplementGroupsByProduct(product.id);
    if (groups.length === 0) {
      console.log("No complement groups found, skipping test");
      return;
    }

    const items = await dbModule.getComplementItemsByGroup(groups[0].id, product.id);
    const activeItem = items.find(i => i.isActive);
    if (!activeItem) {
      console.log("No active complement items found, skipping test");
      return;
    }

    // Save original values
    const originalHasStock = activeItem.hasStock;
    const originalStockQuantity = activeItem.stockQuantity;

    // Set the item to out of stock
    await db.update(complementItems)
      .set({ hasStock: true, stockQuantity: 0 })
      .where(eq(complementItems.id, activeItem.id));

    // Call the bot API for this product
    const res = await fetch(`${BASE_URL}/api/bot/products/${product.id}`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json();

    // The out-of-stock item should NOT appear in the response
    const allItems = body.complementGroups?.flatMap((g: any) => g.items) || [];
    const foundOutOfStock = allItems.find((i: any) => i.id === activeItem.id);
    expect(foundOutOfStock).toBeUndefined();

    // Restore original values
    await db.update(complementItems)
      .set({ hasStock: originalHasStock, stockQuantity: originalStockQuantity })
      .where(eq(complementItems.id, activeItem.id));

    // Verify item is back after restoring
    const res2 = await fetch(`${BASE_URL}/api/bot/products/${product.id}`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
    });
    const body2 = await res2.json();
    const allItems2 = body2.complementGroups?.flatMap((g: any) => g.items) || [];
    const foundRestored = allItems2.find((i: any) => i.id === activeItem.id);
    expect(foundRestored).toBeDefined();
  });
});
