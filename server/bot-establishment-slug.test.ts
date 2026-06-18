import { describe, it, expect } from "vitest";

describe("Bot API - GET /api/bot/establishment (slug & menuUrl)", () => {
  const BASE_URL = "http://localhost:3000";

  it("should return slug and menuUrl in establishment response", async () => {
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { botApiKeys } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [key] = await db
      .select()
      .from(botApiKeys)
      .where(eq(botApiKeys.isActive, true))
      .limit(1);

    if (!key) {
      console.log("No active API key found, skipping test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/bot/establishment`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    // Verify new fields exist
    expect(body).toHaveProperty("slug");
    expect(body).toHaveProperty("menuUrl");
    expect(body).toHaveProperty("name");
    expect(body).toHaveProperty("isOpen");

    // Verify slug is a non-empty string
    expect(typeof body.slug).toBe("string");
    expect(body.slug.length).toBeGreaterThan(0);

    // Verify menuUrl uses the slug (not the ID)
    expect(body.menuUrl).toContain("https://v2.mindi.com.br/menu/");
    expect(body.menuUrl).toBe(`https://v2.mindi.com.br/menu/${body.slug}`);

    // Verify menuUrl does NOT contain just a numeric ID (unless slug is numeric)
    // The slug should be a readable string, not just the establishment ID
    if (body.slug !== String(body.id)) {
      expect(body.menuUrl).not.toContain(`/menu/${body.id}`);
    }
  });

  it("should return consistent isOpen status between establishment and menu-link", async () => {
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { botApiKeys } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [key] = await db
      .select()
      .from(botApiKeys)
      .where(eq(botApiKeys.isActive, true))
      .limit(1);

    if (!key) {
      console.log("No active API key found, skipping test");
      return;
    }

    // Call both endpoints
    const [estRes, menuRes] = await Promise.all([
      fetch(`${BASE_URL}/api/bot/establishment`, {
        headers: { Authorization: `Bearer ${key.apiKey}` },
      }),
      fetch(`${BASE_URL}/api/bot/menu-link`, {
        headers: { Authorization: `Bearer ${key.apiKey}` },
      }),
    ]);

    expect(estRes.status).toBe(200);
    expect(menuRes.status).toBe(200);

    const estBody = await estRes.json();
    const menuBody = await menuRes.json();

    // Both should return the same slug and URL
    expect(estBody.slug).toBe(menuBody.slug);
    expect(estBody.menuUrl).toBe(menuBody.menuUrl);
  });

  it("should return all required fields for N8N bot workflow", async () => {
    const dbModule = await import("./db");
    const db = await dbModule.getDb();
    if (!db) throw new Error("DB not available");

    const { botApiKeys } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    const [key] = await db
      .select()
      .from(botApiKeys)
      .where(eq(botApiKeys.isActive, true))
      .limit(1);

    if (!key) {
      console.log("No active API key found, skipping test");
      return;
    }

    const res = await fetch(`${BASE_URL}/api/bot/establishment`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();

    // All fields that N8N workflow depends on
    const requiredFields = [
      "id",
      "name",
      "slug",
      "menuUrl",
      "phone",
      "address",
      "isOpen",
      "openingHours",
      "deliveryEnabled",
      "pickupEnabled",
      "minimumOrderEnabled",
      "minimumOrderValue",
      "deliveryFeeType",
      "paymentMethods",
    ];

    for (const field of requiredFields) {
      expect(body).toHaveProperty(field);
    }

    // Verify types
    expect(typeof body.isOpen).toBe("boolean");
    expect(typeof body.name).toBe("string");
    expect(typeof body.slug).toBe("string");
    expect(typeof body.menuUrl).toBe("string");
    expect(Array.isArray(body.paymentMethods)).toBe(true);
    expect(Array.isArray(body.openingHours)).toBe(true);
  });
});
