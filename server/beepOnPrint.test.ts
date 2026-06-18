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

describe("beepOnPrint in printer status endpoint", () => {
  it("returns beepOnPrint field in /api/printer/status response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate an API key first
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    // Call the status endpoint
    const response = await fetch(
      `http://localhost:${process.env.PORT || 3000}/api/printer/status?key=${apiKey}`
    );
    expect(response.status).toBe(200);
    const body = await response.json();

    // Verify beepOnPrint is present in the response
    expect(body).toHaveProperty("beepOnPrint");
    expect(typeof body.beepOnPrint).toBe("boolean");
  });
});

describe("beepOnPrint in printer settings", () => {
  it("returns beepOnPrint in getSettings response", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    
    // beepOnPrint should be available in settings
    expect(settings).toHaveProperty("beepOnPrint");
    expect(typeof settings.beepOnPrint).toBe("boolean");
  });

  it("can save and retrieve beepOnPrint setting", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save settings with beepOnPrint enabled
    await caller.printer.saveSettings({
      establishmentId: 1,
      beepOnPrint: true,
    });

    // Retrieve and verify
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.beepOnPrint).toBe(true);

    // Save settings with beepOnPrint disabled
    await caller.printer.saveSettings({
      establishmentId: 1,
      beepOnPrint: false,
    });

    // Retrieve and verify
    const settingsAfter = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settingsAfter.beepOnPrint).toBe(false);
  });
});
