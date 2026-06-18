import { describe, it, expect } from "vitest";
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

describe("printer.saveSettings - defaultPrintMethod accepts 'automatic'", () => {
  it("saves 'automatic' as the default print method", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save settings with automatic print method
    const result = await caller.printer.saveSettings({
      establishmentId: 1,
      defaultPrintMethod: "automatic",
    });
    expect(result).toEqual({ success: true });

    // Verify the setting was saved
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.defaultPrintMethod).toBe("automatic");
  });

  it("saves 'normal' as the default print method", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Save settings with normal print method
    const result = await caller.printer.saveSettings({
      establishmentId: 1,
      defaultPrintMethod: "normal",
    });
    expect(result).toEqual({ success: true });

    // Verify the setting was saved
    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.defaultPrintMethod).toBe("normal");
  });

  it("can switch between normal and automatic", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Set to automatic
    await caller.printer.saveSettings({
      establishmentId: 1,
      defaultPrintMethod: "automatic",
    });
    let settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.defaultPrintMethod).toBe("automatic");

    // Switch back to normal
    await caller.printer.saveSettings({
      establishmentId: 1,
      defaultPrintMethod: "normal",
    });
    settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.defaultPrintMethod).toBe("normal");
  });
});

describe("printer API key determines automatic print availability", () => {
  it("returns null printerApiKey when no key is generated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Revoke any existing key first
    await caller.printer.revokeApiKey({ establishmentId: 1 });

    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBeNull();
  });

  it("returns printerApiKey after generation - enables automatic option", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate API key (simulates connecting Mindi Printer)
    const { apiKey } = await caller.printer.generateApiKey({ establishmentId: 1 });

    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBe(apiKey);
    // Frontend uses !!printerApiKey to show/hide automatic option
    expect(!!settings.printerApiKey).toBe(true);
  });

  it("returns null printerApiKey after revocation - hides automatic option", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Generate then revoke
    await caller.printer.generateApiKey({ establishmentId: 1 });
    await caller.printer.revokeApiKey({ establishmentId: 1 });

    const settings = await caller.printer.getSettings({ establishmentId: 1 });
    expect(settings.printerApiKey).toBeNull();
    // Frontend uses !!printerApiKey to show/hide automatic option
    expect(!!settings.printerApiKey).toBe(false);
  });
});
