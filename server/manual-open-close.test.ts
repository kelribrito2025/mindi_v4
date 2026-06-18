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
    role: "user",
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

describe("Manual Open/Close Store Logic", () => {
  it("setManualClose with close=true should close the store", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // First get the establishment
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Close manually
    const result = await caller.establishment.setManualClose({
      id: estab.id,
      close: true,
    });
    expect(result).toEqual({ success: true });
    
    // Verify the establishment is now closed
    const updated = await caller.establishment.get();
    expect(updated?.manuallyClosed).toBe(true);
    expect(updated?.manuallyClosedAt).toBeTruthy();
    expect(updated?.manuallyOpened).toBe(false);
    expect(updated?.isOpen).toBe(false);
  });

  it("setManualClose with close=false should open the store manually", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // First get the establishment
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Open manually
    const result = await caller.establishment.setManualClose({
      id: estab.id,
      close: false,
    });
    expect(result).toEqual({ success: true });
    
    // Verify the establishment is now open manually
    const updated = await caller.establishment.get();
    expect(updated?.manuallyClosed).toBe(false);
    expect(updated?.manuallyClosedAt).toBeNull();
    expect(updated?.manuallyOpened).toBe(true);
    expect(updated?.manuallyOpenedAt).toBeTruthy();
    expect(updated?.isOpen).toBe(true);
  });

  it("closing after manual open should clear manuallyOpened", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // First open manually
    await caller.establishment.setManualClose({
      id: estab.id,
      close: false,
    });
    
    // Verify it's open
    let updated = await caller.establishment.get();
    expect(updated?.manuallyOpened).toBe(true);
    
    // Now close manually
    await caller.establishment.setManualClose({
      id: estab.id,
      close: true,
    });
    
    // Verify manuallyOpened is cleared
    updated = await caller.establishment.get();
    expect(updated?.manuallyClosed).toBe(true);
    expect(updated?.manuallyOpened).toBe(false);
    expect(updated?.manuallyOpenedAt).toBeNull();
    expect(updated?.isOpen).toBe(false);
  });

  it("opening after manual close should clear manuallyClosed", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // First close manually
    await caller.establishment.setManualClose({
      id: estab.id,
      close: true,
    });
    
    // Verify it's closed
    let updated = await caller.establishment.get();
    expect(updated?.manuallyClosed).toBe(true);
    
    // Now open manually
    await caller.establishment.setManualClose({
      id: estab.id,
      close: false,
    });
    
    // Verify manuallyClosed is cleared
    updated = await caller.establishment.get();
    expect(updated?.manuallyClosed).toBe(false);
    expect(updated?.manuallyClosedAt).toBeNull();
    expect(updated?.manuallyOpened).toBe(true);
    expect(updated?.isOpen).toBe(true);
  });
});
