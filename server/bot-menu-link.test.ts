import { describe, it, expect } from "vitest";

describe("Bot API - GET /api/bot/menu-link", () => {
  const BASE_URL = "http://localhost:3000";

  it("should return 401 without API key", async () => {
    const res = await fetch(`${BASE_URL}/api/bot/menu-link`);
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("should return 401 with invalid API key", async () => {
    const res = await fetch(`${BASE_URL}/api/bot/menu-link`, {
      headers: { Authorization: "Bearer invalid-key-12345" },
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBeDefined();
  });

  it("should return menu link with valid API key", async () => {
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

    const res = await fetch(`${BASE_URL}/api/bot/menu-link`, {
      headers: { Authorization: `Bearer ${key.apiKey}` },
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("menuUrl");
    expect(body).toHaveProperty("slug");
    expect(body).toHaveProperty("establishmentName");
    expect(body.menuUrl).toContain("https://v2.mindi.com.br/menu/");
    expect(typeof body.slug).toBe("string");
    expect(typeof body.establishmentName).toBe("string");
  });
});
