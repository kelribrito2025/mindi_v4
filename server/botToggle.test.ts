import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

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
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };

  return { ctx };
}

describe("whatsappBotEnabled toggle", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("establishment.update accepts whatsappBotEnabled field", async () => {
    const { ctx } = createAuthContext();
    
    // Mock the db.updateEstablishment to verify it receives the correct data
    const updateSpy = vi.spyOn(db, "updateEstablishment").mockResolvedValue(undefined as any);
    
    const caller = appRouter.createCaller(ctx);

    const result = await caller.establishment.update({
      id: 1,
      whatsappBotEnabled: true,
    });

    expect(result).toEqual({ success: true });
    expect(updateSpy).toHaveBeenCalledWith(1, { whatsappBotEnabled: true });
  });

  it("establishment.update can disable bot", async () => {
    const { ctx } = createAuthContext();
    
    const updateSpy = vi.spyOn(db, "updateEstablishment").mockResolvedValue(undefined as any);
    
    const caller = appRouter.createCaller(ctx);

    const result = await caller.establishment.update({
      id: 1,
      whatsappBotEnabled: false,
    });

    expect(result).toEqual({ success: true });
    expect(updateSpy).toHaveBeenCalledWith(1, { whatsappBotEnabled: false });
  });

  it("establishment.update works without whatsappBotEnabled (backward compat)", async () => {
    const { ctx } = createAuthContext();
    
    const updateSpy = vi.spyOn(db, "updateEstablishment").mockResolvedValue(undefined as any);
    
    const caller = appRouter.createCaller(ctx);

    const result = await caller.establishment.update({
      id: 1,
      name: "Test Restaurant",
    });

    expect(result).toEqual({ success: true });
    expect(updateSpy).toHaveBeenCalledWith(1, { name: "Test Restaurant" });
  });
});
