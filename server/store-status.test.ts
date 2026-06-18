import { describe, expect, it } from "vitest";
import * as db from "./db";
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

describe("Store Status Dynamic Calculation", () => {
  it("getEstablishmentOpenStatus should return a valid status object", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    // Get the establishment
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Call the dynamic status function
    const status = await db.getEstablishmentOpenStatus(estab.id);
    
    // Verify the structure of the returned object
    expect(status).toHaveProperty("isOpen");
    expect(status).toHaveProperty("manuallyClosed");
    expect(status).toHaveProperty("nextOpeningTime");
    expect(status).toHaveProperty("shouldAutoReopen");
    expect(typeof status.isOpen).toBe("boolean");
    expect(typeof status.manuallyClosed).toBe("boolean");
    expect(typeof status.shouldAutoReopen).toBe("boolean");
  });

  it("getEstablishmentOpenStatus should return closed for non-existent establishment", async () => {
    const status = await db.getEstablishmentOpenStatus(999999);
    expect(status.isOpen).toBe(false);
    expect(status.manuallyClosed).toBe(false);
  });

  it("manually closed store should show as closed in dynamic status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Close the store manually
    await caller.establishment.setManualClose({ id: estab.id, close: true });
    
    // Check dynamic status
    const status = await db.getEstablishmentOpenStatus(estab.id);
    expect(status.isOpen).toBe(false);
    expect(status.manuallyClosed).toBe(true);
  });

  it("manually opened store should show as open in dynamic status", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Open the store manually
    await caller.establishment.setManualClose({ id: estab.id, close: false });
    
    // Check dynamic status
    const status = await db.getEstablishmentOpenStatus(estab.id);
    expect(status.isOpen).toBe(true);
    expect(status.manuallyClosed).toBe(false);
  });

  it("store status should be consistent between frontend and backend logic", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    
    const estab = await caller.establishment.get();
    if (!estab) {
      console.log("No establishment found, skipping test");
      return;
    }
    
    // Get business hours
    const hours = await db.getBusinessHoursByEstablishment(estab.id);
    
    // Get dynamic status from the function
    const dynamicStatus = await db.getEstablishmentOpenStatus(estab.id);
    
    // Simulate the frontend logic
    const tz = estab.timezone || 'America/Sao_Paulo';
    const localDate = db.getLocalDate(tz);
    const currentDayOfWeek = localDate.getDay();
    const currentTime = localDate.toTimeString().slice(0, 5);
    
    const todayHours = hours.find(h => h.dayOfWeek === currentDayOfWeek);
    const yesterdayDayOfWeek = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1;
    const yesterdayHours = hours.find(h => h.dayOfWeek === yesterdayDayOfWeek);
    
    let frontendIsWithinSchedule = false;
    
    if (todayHours?.isActive && todayHours.openTime && todayHours.closeTime) {
      if (todayHours.closeTime < todayHours.openTime) {
        // Crosses midnight
        frontendIsWithinSchedule = currentTime >= todayHours.openTime;
      } else {
        frontendIsWithinSchedule = currentTime >= todayHours.openTime && currentTime < todayHours.closeTime;
      }
    }
    
    if (!frontendIsWithinSchedule && yesterdayHours?.isActive && yesterdayHours.openTime && yesterdayHours.closeTime) {
      if (yesterdayHours.closeTime < yesterdayHours.openTime) {
        frontendIsWithinSchedule = currentTime < yesterdayHours.closeTime;
      }
    }
    
    // If not manually closed/opened, the status should match schedule
    if (!estab.manuallyClosed && !estab.manuallyOpened) {
      expect(dynamicStatus.isOpen).toBe(frontendIsWithinSchedule);
    }
    
    // If manually opened, should be open
    if (estab.manuallyOpened) {
      expect(dynamicStatus.isOpen).toBe(true);
    }
    
    // If manually closed (and no auto-reopen), should be closed
    if (estab.manuallyClosed && !dynamicStatus.shouldAutoReopen) {
      expect(dynamicStatus.isOpen).toBe(false);
    }
  });
});
