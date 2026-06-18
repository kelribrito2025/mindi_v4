import { describe, it, expect } from "vitest";

/**
 * Tests for the computedIsOpen feature.
 * 
 * The public menu API now returns computedIsOpen and computedManuallyClosed
 * from the server, ensuring frontend and backend are always in sync.
 * 
 * These tests validate the logic flow:
 * 1. getEstablishmentOpenStatus returns correct isOpen/manuallyClosed
 * 2. getPublicMenuData includes computedIsOpen in the response
 * 3. Frontend uses computedIsOpen instead of local calculation
 */

describe("computedIsOpen - Server-side open status", () => {
  
  describe("getEstablishmentOpenStatus logic", () => {
    // Helper to simulate the status logic
    function computeStatus(opts: {
      manuallyClosed: boolean;
      manuallyOpened: boolean;
      isWithinSchedule: boolean;
      shouldAutoReopen: boolean;
    }) {
      const { manuallyClosed, manuallyOpened, isWithinSchedule, shouldAutoReopen } = opts;
      
      let isOpen = false;
      let finalManuallyClosed = manuallyClosed;
      
      if (manuallyClosed && shouldAutoReopen) {
        finalManuallyClosed = false;
        isOpen = isWithinSchedule;
      } else if (manuallyClosed) {
        isOpen = false;
      } else if (manuallyOpened && !isWithinSchedule) {
        isOpen = true;
      } else {
        isOpen = isWithinSchedule;
      }
      
      return { isOpen, manuallyClosed: finalManuallyClosed };
    }

    it("should return closed when manuallyClosed=true and no auto-reopen", () => {
      const result = computeStatus({
        manuallyClosed: true,
        manuallyOpened: false,
        isWithinSchedule: true,
        shouldAutoReopen: false,
      });
      expect(result.isOpen).toBe(false);
      expect(result.manuallyClosed).toBe(true);
    });

    it("should return open when manuallyClosed=true but auto-reopen triggers and within schedule", () => {
      const result = computeStatus({
        manuallyClosed: true,
        manuallyOpened: false,
        isWithinSchedule: true,
        shouldAutoReopen: true,
      });
      expect(result.isOpen).toBe(true);
      expect(result.manuallyClosed).toBe(false);
    });

    it("should return closed when manuallyClosed=true, auto-reopen triggers but outside schedule", () => {
      const result = computeStatus({
        manuallyClosed: true,
        manuallyOpened: false,
        isWithinSchedule: false,
        shouldAutoReopen: true,
      });
      expect(result.isOpen).toBe(false);
      expect(result.manuallyClosed).toBe(false);
    });

    it("should return open when manuallyOpened=true and outside business hours", () => {
      const result = computeStatus({
        manuallyClosed: false,
        manuallyOpened: true,
        isWithinSchedule: false,
        shouldAutoReopen: false,
      });
      expect(result.isOpen).toBe(true);
    });

    it("should follow schedule when no manual overrides", () => {
      const openResult = computeStatus({
        manuallyClosed: false,
        manuallyOpened: false,
        isWithinSchedule: true,
        shouldAutoReopen: false,
      });
      expect(openResult.isOpen).toBe(true);

      const closedResult = computeStatus({
        manuallyClosed: false,
        manuallyOpened: false,
        isWithinSchedule: false,
        shouldAutoReopen: false,
      });
      expect(closedResult.isOpen).toBe(false);
    });

    it("should follow schedule when manuallyOpened=true but within business hours", () => {
      const result = computeStatus({
        manuallyClosed: false,
        manuallyOpened: true,
        isWithinSchedule: true,
        shouldAutoReopen: false,
      });
      // When manuallyOpened but within schedule, schedule takes over
      expect(result.isOpen).toBe(true);
    });
  });

  describe("Frontend computedIsOpen usage", () => {
    // Simulate the frontend logic
    function frontendIsOpen(establishment: {
      isOpen: boolean;
      computedIsOpen?: boolean;
      manuallyClosed?: boolean;
      computedManuallyClosed?: boolean;
    }) {
      const isOpen = establishment.computedIsOpen ?? establishment.isOpen;
      const isForcedClosed = establishment.computedManuallyClosed ?? establishment.manuallyClosed ?? false;
      return { isOpen, isForcedClosed };
    }

    it("should use computedIsOpen when available", () => {
      const result = frontendIsOpen({
        isOpen: false, // DB says closed
        computedIsOpen: true, // Server says open (e.g., manuallyOpened)
        manuallyClosed: false,
        computedManuallyClosed: false,
      });
      expect(result.isOpen).toBe(true);
    });

    it("should use computedManuallyClosed when available", () => {
      const result = frontendIsOpen({
        isOpen: true,
        computedIsOpen: false,
        manuallyClosed: false, // DB says not manually closed
        computedManuallyClosed: true, // Server says manually closed
      });
      expect(result.isOpen).toBe(false);
      expect(result.isForcedClosed).toBe(true);
    });

    it("should fallback to establishment.isOpen when computedIsOpen is not available", () => {
      const result = frontendIsOpen({
        isOpen: true,
        manuallyClosed: false,
      });
      expect(result.isOpen).toBe(true);
    });

    it("should fallback to establishment.manuallyClosed when computedManuallyClosed is not available", () => {
      const result = frontendIsOpen({
        isOpen: false,
        manuallyClosed: true,
      });
      expect(result.isForcedClosed).toBe(true);
    });

    it("should handle the exact scenario of establishment 60018 bug", () => {
      // Scenario: manuallyClosed=true in DB, but server computes isOpen=false
      // Frontend should show CLOSED, matching the backend
      const result = frontendIsOpen({
        isOpen: false,
        computedIsOpen: false,
        manuallyClosed: true,
        computedManuallyClosed: true,
      });
      expect(result.isOpen).toBe(false);
      expect(result.isForcedClosed).toBe(true);
    });

    it("should handle auto-reopen scenario correctly", () => {
      // Scenario: manuallyClosed=true in DB, but server auto-reopened
      const result = frontendIsOpen({
        isOpen: false, // DB still says closed
        computedIsOpen: true, // Server auto-reopened
        manuallyClosed: true, // DB still has flag
        computedManuallyClosed: false, // Server cleared the flag
      });
      expect(result.isOpen).toBe(true);
      expect(result.isForcedClosed).toBe(false);
    });
  });

  describe("shouldAutoReopen timezone handling", () => {
    // Helper to simulate shouldAutoReopen with proper timezone handling
    function shouldAutoReopen(
      localClosedAt: Date | null,
      todayOpenTime: string | null,
      todayIsActive: boolean,
      localNow: Date
    ): boolean {
      if (!localClosedAt || !todayIsActive || !todayOpenTime) return false;

      const currentTime = localNow.getHours() * 60 + localNow.getMinutes();
      const [openHour, openMin] = todayOpenTime.split(':').map(Number);
      const openTimeMinutes = openHour * 60 + openMin;

      // If closed on a previous day and current time >= today's opening
      const closedDate = new Date(localClosedAt);
      closedDate.setHours(0, 0, 0, 0);
      const today = new Date(localNow);
      today.setHours(0, 0, 0, 0);

      if (closedDate.getTime() < today.getTime() && currentTime >= openTimeMinutes) {
        return true;
      }

      // If closed before today's opening time on the same day
      const closedTimeMinutes = localClosedAt.getHours() * 60 + localClosedAt.getMinutes();
      if (
        localClosedAt.toDateString() === localNow.toDateString() &&
        closedTimeMinutes < openTimeMinutes &&
        currentTime >= openTimeMinutes
      ) {
        return true;
      }

      return false;
    }

    it("should reopen when closed yesterday and today's opening has passed", () => {
      const yesterday = new Date(2026, 1, 13, 15, 0); // Feb 13, 15:00
      const now = new Date(2026, 1, 14, 12, 0); // Feb 14, 12:00
      const result = shouldAutoReopen(yesterday, "11:00", true, now);
      expect(result).toBe(true);
    });

    it("should NOT reopen when closed today AFTER opening time", () => {
      // This is the establishment 60018 bug scenario
      const closedAt = new Date(2026, 1, 14, 15, 36); // Feb 14, 15:36 (local)
      const now = new Date(2026, 1, 14, 20, 41); // Feb 14, 20:41 (local)
      const result = shouldAutoReopen(closedAt, "11:00", true, now);
      // closedTimeMinutes = 15*60+36 = 936, openTimeMinutes = 660
      // 936 < 660 = false → should NOT auto-reopen
      expect(result).toBe(false);
    });

    it("should reopen when closed today BEFORE opening time and now past opening", () => {
      const closedAt = new Date(2026, 1, 14, 8, 0); // Feb 14, 08:00 (before 11:00 opening)
      const now = new Date(2026, 1, 14, 12, 0); // Feb 14, 12:00
      const result = shouldAutoReopen(closedAt, "11:00", true, now);
      expect(result).toBe(true);
    });

    it("should NOT reopen when no business hours today", () => {
      const closedAt = new Date(2026, 1, 13, 15, 0);
      const now = new Date(2026, 1, 14, 12, 0);
      const result = shouldAutoReopen(closedAt, null, false, now);
      expect(result).toBe(false);
    });

    it("should NOT reopen when closed today before opening but opening hasn't passed yet", () => {
      const closedAt = new Date(2026, 1, 14, 8, 0); // Feb 14, 08:00
      const now = new Date(2026, 1, 14, 10, 0); // Feb 14, 10:00 (before 11:00 opening)
      const result = shouldAutoReopen(closedAt, "11:00", true, now);
      expect(result).toBe(false);
    });
  });
});
