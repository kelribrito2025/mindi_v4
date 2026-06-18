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

describe("printer.generateApiKey", () => {
  it("generates an API key with pk_ prefix", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.printer.generateApiKey({ establishmentId: 1 });

    expect(result).toBeDefined();
    expect(result.apiKey).toBeDefined();
    expect(typeof result.apiKey).toBe("string");
    expect(result.apiKey.startsWith("pk_")).toBe(true);
    expect(result.apiKey.length).toBe(35); // pk_ + 32 chars
  });

  it("generates different keys on subsequent calls", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result1 = await caller.printer.generateApiKey({ establishmentId: 1 });
    const result2 = await caller.printer.generateApiKey({ establishmentId: 1 });

    expect(result1.apiKey).not.toBe(result2.apiKey);
  });
});

describe("printer.revokeApiKey", () => {
  it("revokes the API key successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // First generate a key
    await caller.printer.generateApiKey({ establishmentId: 1 });

    // Then revoke it
    const result = await caller.printer.revokeApiKey({ establishmentId: 1 });
    expect(result).toEqual({ success: true });

    // Verify the key is gone
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBeNull();
  });
});

describe("printer receipt endpoint security", () => {
  it("rejects requests without API key", async () => {
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/printer/receipt/1`
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toContain("API key required");
  });

  it("rejects requests with invalid API key", async () => {
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/printer/receipt/1?key=invalid`
    );
    expect(response.status).toBe(401);
    const body = await response.json();
    expect(body.error).toBe("Invalid API key");
  });

  it("rejects requests with invalid order ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/printer/receipt/abc?key=${apiKey}`
    );
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error).toContain("inv\u00e1lido");
  });

  it("returns 404 for non-existent order", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/printer/receipt/999999999?key=${apiKey}`
    );
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body.error).toContain("n\u00e3o encontrado");
  });
});

describe("printer.getSettings includes printerApiKey", () => {
  it("returns printerApiKey in settings after generation", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate a key
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    // Get settings and verify key is included
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBe(apiKey);
  });
});
