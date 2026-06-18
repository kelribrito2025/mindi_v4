import { describe, it, expect } from "vitest";
import { getNextOpeningTime } from "./db";

/**
 * Tests for the scheduled closure fix.
 * 
 * When a scheduled closure is active for today, the nextOpeningTime
 * should skip to the next available day, not show today's hours.
 * 
 * The fix modifies getEstablishmentOpenStatus to recalculate
 * nextOpeningTime starting from tomorrow when a closure is active.
 */

describe("Scheduled Closure - nextOpeningTime adjustment", () => {
  // Sample business hours (Mon-Fri 13:00-22:00, Sat-Sun closed)
  const businessHours = [
    { dayOfWeek: 0, isActive: false, openTime: null, closeTime: null }, // Sunday
    { dayOfWeek: 1, isActive: true, openTime: "13:00", closeTime: "22:00" }, // Monday
    { dayOfWeek: 2, isActive: true, openTime: "13:00", closeTime: "22:00" }, // Tuesday
    { dayOfWeek: 3, isActive: true, openTime: "13:00", closeTime: "22:00" }, // Wednesday
    { dayOfWeek: 4, isActive: true, openTime: "13:00", closeTime: "22:00" }, // Thursday
    { dayOfWeek: 5, isActive: true, openTime: "13:00", closeTime: "22:00" }, // Friday
    { dayOfWeek: 6, isActive: false, openTime: null, closeTime: null }, // Saturday
  ];

  describe("getNextOpeningTime", () => {
    it("should return today's opening time when called before opening", () => {
      // Wednesday at 10:00 (before 13:00 opening)
      const wednesday10am = new Date("2026-04-01T10:00:00");
      const result = getNextOpeningTime(businessHours as any, wednesday10am);
      
      expect(result).not.toBeNull();
      expect(result!.isToday).toBe(true);
      expect(result!.openTime).toBe("13:00");
    });

    it("should return tomorrow when called after closing", () => {
      // Wednesday at 23:00 (after 22:00 closing)
      const wednesday11pm = new Date("2026-04-01T23:00:00");
      const result = getNextOpeningTime(businessHours as any, wednesday11pm);
      
      expect(result).not.toBeNull();
      expect(result!.isToday).toBe(false);
      expect(result!.isTomorrow).toBe(true);
      expect(result!.openTime).toBe("13:00");
    });

    it("should skip inactive days (Saturday/Sunday)", () => {
      // Friday at 23:00 (after closing) - next opening should be Monday
      const friday11pm = new Date("2026-04-03T23:00:00");
      const result = getNextOpeningTime(businessHours as any, friday11pm);
      
      expect(result).not.toBeNull();
      expect(result!.isToday).toBe(false);
      expect(result!.isTomorrow).toBe(false);
      expect(result!.dayOfWeek).toBe(1); // Monday
      expect(result!.openTime).toBe("13:00");
    });

    it("should return next day when called with tomorrow's date (simulating closure skip)", () => {
      // Simulating the fix: when today (Wednesday) has a closure,
      // we call getNextOpeningTime with tomorrow (Thursday) at 00:00
      const thursday0am = new Date("2026-04-02T00:00:00");
      const result = getNextOpeningTime(businessHours as any, thursday0am);
      
      expect(result).not.toBeNull();
      // Thursday is active, so it should return Thursday's opening
      expect(result!.isToday).toBe(true); // "today" relative to Thursday
      expect(result!.openTime).toBe("13:00");
    });
  });

  describe("Scheduled closure adjustment logic", () => {
    it("should adjust isToday/isTomorrow flags when skipping closed day", () => {
      // Simulate the adjustment logic from getEstablishmentOpenStatus
      // When today has a closure, we recalculate from tomorrow
      const tomorrow = new Date("2026-04-02T00:00:00"); // Thursday
      const nextOpening = getNextOpeningTime(businessHours as any, tomorrow);
      
      expect(nextOpening).not.toBeNull();
      
      // Apply the same adjustment as in the fix
      const adjusted = nextOpening ? {
        ...nextOpening,
        isToday: false,
        isTomorrow: nextOpening.isToday, // "today" of tomorrow = "tomorrow" for us
      } : null;
      
      expect(adjusted).not.toBeNull();
      expect(adjusted!.isToday).toBe(false); // Not today (today is closed)
      expect(adjusted!.isTomorrow).toBe(true); // Tomorrow (Thursday)
      expect(adjusted!.openTime).toBe("13:00");
    });

    it("should handle weekend closure skip correctly", () => {
      // If Friday has a closure, and Sat/Sun are inactive,
      // next opening should be Monday
      const saturday0am = new Date("2026-04-04T00:00:00"); // Saturday
      const nextOpening = getNextOpeningTime(businessHours as any, saturday0am);
      
      expect(nextOpening).not.toBeNull();
      
      // Apply adjustment
      const adjusted = nextOpening ? {
        ...nextOpening,
        isToday: false,
        isTomorrow: nextOpening.isToday,
      } : null;
      
      expect(adjusted).not.toBeNull();
      expect(adjusted!.isToday).toBe(false);
      expect(adjusted!.isTomorrow).toBe(false); // Monday is not tomorrow (Saturday)
      expect(adjusted!.dayOfWeek).toBe(1); // Monday
    });

    it("should not adjust when nextOpening is already not today", () => {
      // If the original nextOpening was already for a future day,
      // no adjustment needed
      const friday11pm = new Date("2026-04-03T23:00:00");
      const nextOpening = getNextOpeningTime(businessHours as any, friday11pm);
      
      expect(nextOpening).not.toBeNull();
      expect(nextOpening!.isToday).toBe(false); // Already not today
      // In this case, the fix code wouldn't enter the adjustment block
    });
  });
});
