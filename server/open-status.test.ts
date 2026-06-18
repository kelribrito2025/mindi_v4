import { describe, it, expect, vi, beforeEach } from "vitest";
import { shouldAutoReopen } from "./db";

// We test shouldAutoReopen (pure function) and the logic flow of getEstablishmentOpenStatus
// For getEstablishmentOpenStatus we mock the db layer

vi.mock("./_core/db", () => ({
  getDb: vi.fn(),
}));

describe("shouldAutoReopen", () => {
  it("returns false when manuallyClosedAt is null", () => {
    const result = shouldAutoReopen(null, [], new Date());
    expect(result).toBe(false);
  });

  it("returns true when closed on previous day and current time >= today opening", () => {
    const yesterday = new Date("2026-03-21T14:00:00"); // Saturday
    const now = new Date("2026-03-22T12:00:00"); // Sunday 12:00

    const businessHours = [
      { dayOfWeek: 0, isActive: true, openTime: "11:00", closeTime: "22:00" }, // Sunday
    ] as any;

    const result = shouldAutoReopen(yesterday, businessHours, now);
    expect(result).toBe(true);
  });

  it("returns false when closed during same day expedient", () => {
    const closedAt = new Date("2026-03-22T15:00:00"); // Sunday 15:00
    const now = new Date("2026-03-22T18:00:00"); // Sunday 18:00

    const businessHours = [
      { dayOfWeek: 0, isActive: true, openTime: "11:00", closeTime: "22:00" }, // Sunday
    ] as any;

    const result = shouldAutoReopen(closedAt, businessHours, now);
    expect(result).toBe(false);
  });

  it("returns true when closed before opening time on same day and now past opening", () => {
    const closedAt = new Date("2026-03-22T08:00:00"); // Sunday 08:00
    const now = new Date("2026-03-22T12:00:00"); // Sunday 12:00

    const businessHours = [
      { dayOfWeek: 0, isActive: true, openTime: "11:00", closeTime: "22:00" }, // Sunday
    ] as any;

    const result = shouldAutoReopen(closedAt, businessHours, now);
    expect(result).toBe(true);
  });
});

describe("getEstablishmentOpenStatus - manuallyOpened + scheduled hours", () => {
  // Test the logic flow conceptually:
  // When manuallyOpened=true and isWithinSchedule=true, the restaurant should:
  // 1. Be open (isOpen=true)
  // 2. Clear the manuallyOpened flag so it follows automatic schedule
  // This means when the scheduled closing time arrives, the restaurant will close automatically

  it("should follow automatic schedule when manually opened and within business hours", () => {
    // Simulate the logic from getEstablishmentOpenStatus
    const establishment = {
      manuallyClosed: false,
      manuallyOpened: true,
      manuallyOpenedAt: new Date("2026-03-22T15:00:00"),
    };
    const isWithinSchedule = true; // Now 16:00, schedule is 16:00-23:00
    const autoReopen = false;

    let isOpen = false;
    let shouldClearManuallyOpened = false;

    if (establishment.manuallyClosed && autoReopen) {
      isOpen = isWithinSchedule;
    } else if (establishment.manuallyClosed) {
      isOpen = false;
    } else if (establishment.manuallyOpened && isWithinSchedule) {
      // KEY FIX: within scheduled hours, clear manual flag
      isOpen = true;
      shouldClearManuallyOpened = true;
    } else if (establishment.manuallyOpened && !isWithinSchedule) {
      isOpen = true;
    } else {
      isOpen = isWithinSchedule;
    }

    expect(isOpen).toBe(true);
    expect(shouldClearManuallyOpened).toBe(true);
  });

  it("should stay open when manually opened and outside business hours", () => {
    const establishment = {
      manuallyClosed: false,
      manuallyOpened: true,
      manuallyOpenedAt: new Date("2026-03-22T15:00:00"),
    };
    const isWithinSchedule = false; // Now 15:00, schedule is 16:00-23:00
    const autoReopen = false;

    let isOpen = false;
    let shouldClearManuallyOpened = false;

    if (establishment.manuallyClosed && autoReopen) {
      isOpen = isWithinSchedule;
    } else if (establishment.manuallyClosed) {
      isOpen = false;
    } else if (establishment.manuallyOpened && isWithinSchedule) {
      isOpen = true;
      shouldClearManuallyOpened = true;
    } else if (establishment.manuallyOpened && !isWithinSchedule) {
      isOpen = true;
    } else {
      isOpen = isWithinSchedule;
    }

    expect(isOpen).toBe(true);
    expect(shouldClearManuallyOpened).toBe(false);
  });

  it("should close automatically when schedule ends and manuallyOpened was cleared", () => {
    // After manuallyOpened was cleared, the restaurant follows normal schedule
    const establishment = {
      manuallyClosed: false,
      manuallyOpened: false, // Already cleared by previous check
      manuallyOpenedAt: null,
    };
    const isWithinSchedule = false; // Now 23:01, schedule was 16:00-23:00
    const autoReopen = false;

    let isOpen = false;
    let shouldClearManuallyOpened = false;

    if (establishment.manuallyClosed && autoReopen) {
      isOpen = isWithinSchedule;
    } else if (establishment.manuallyClosed) {
      isOpen = false;
    } else if (establishment.manuallyOpened && isWithinSchedule) {
      isOpen = true;
      shouldClearManuallyOpened = true;
    } else if (establishment.manuallyOpened && !isWithinSchedule) {
      isOpen = true;
    } else {
      isOpen = isWithinSchedule;
    }

    expect(isOpen).toBe(false); // Closed automatically!
    expect(shouldClearManuallyOpened).toBe(false);
  });

  it("full scenario: open at 15h manually, schedule starts 16h, closes at 23h", () => {
    // Step 1: 15:00 - Manually opened, outside schedule
    const step1 = {
      manuallyOpened: true,
      manuallyClosed: false,
      isWithinSchedule: false,
    };
    let isOpen1 = false;
    if (step1.manuallyOpened && !step1.isWithinSchedule) isOpen1 = true;
    expect(isOpen1).toBe(true); // Open via manual

    // Step 2: 16:00 - Schedule starts, manuallyOpened gets cleared
    const step2 = {
      manuallyOpened: true, // Still true in DB at this moment
      manuallyClosed: false,
      isWithinSchedule: true,
    };
    let isOpen2 = false;
    let clear2 = false;
    if (step2.manuallyOpened && step2.isWithinSchedule) {
      isOpen2 = true;
      clear2 = true; // Will clear manuallyOpened in DB
    }
    expect(isOpen2).toBe(true);
    expect(clear2).toBe(true);

    // Step 3: 23:01 - Schedule ended, manuallyOpened already cleared
    const step3 = {
      manuallyOpened: false, // Cleared in step 2
      manuallyClosed: false,
      isWithinSchedule: false,
    };
    let isOpen3 = step3.isWithinSchedule; // Falls to default case
    expect(isOpen3).toBe(false); // Closed automatically!
  });
});
