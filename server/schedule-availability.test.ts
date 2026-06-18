import { describe, expect, it } from "vitest";
import { isScheduleAvailable } from "./db";

describe("isScheduleAvailable", () => {
  // ============ ALWAYS AVAILABLE ============
  describe("always available", () => {
    it("returns true when availabilityType is 'always'", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "always", availableDays: null, availableHours: null },
          1, // Monday
          "12:00"
        )
      ).toBe(true);
    });

    it("returns true when availabilityType is null", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: null, availableDays: null, availableHours: null },
          3, // Wednesday
          "08:00"
        )
      ).toBe(true);
    });
  });

  // ============ SCHEDULED - DAY ONLY ============
  describe("scheduled with days only (no hours)", () => {
    it("returns true when current day is in availableDays", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "scheduled", availableDays: [1, 3, 5], availableHours: null },
          1, // Monday
          "14:00"
        )
      ).toBe(true);
    });

    it("returns false when current day is NOT in availableDays", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "scheduled", availableDays: [1, 3, 5], availableHours: null },
          2, // Tuesday
          "14:00"
        )
      ).toBe(false);
    });

    it("returns false when availableDays is empty", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "scheduled", availableDays: [], availableHours: null },
          1,
          "12:00"
        )
      ).toBe(false);
    });

    it("returns false when availableDays is null", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "scheduled", availableDays: null, availableHours: null },
          1,
          "12:00"
        )
      ).toBe(false);
    });
  });

  // ============ SCHEDULED - NORMAL HOURS (same day) ============
  describe("scheduled with normal hours (same day)", () => {
    const item = {
      availabilityType: "scheduled" as const,
      availableDays: [1, 2, 3, 4, 5], // Mon-Fri
      availableHours: [
        { day: 1, startTime: "08:00", endTime: "18:00" },
        { day: 2, startTime: "08:00", endTime: "18:00" },
        { day: 3, startTime: "08:00", endTime: "18:00" },
        { day: 4, startTime: "08:00", endTime: "18:00" },
        { day: 5, startTime: "08:00", endTime: "18:00" },
      ],
    };

    it("returns true when within time range", () => {
      expect(isScheduleAvailable(item, 1, "12:00")).toBe(true);
    });

    it("returns true at exact start time", () => {
      expect(isScheduleAvailable(item, 1, "08:00")).toBe(true);
    });

    it("returns true at exact end time", () => {
      expect(isScheduleAvailable(item, 1, "18:00")).toBe(true);
    });

    it("returns false before start time", () => {
      expect(isScheduleAvailable(item, 1, "07:59")).toBe(false);
    });

    it("returns false after end time", () => {
      expect(isScheduleAvailable(item, 1, "18:01")).toBe(false);
    });

    it("returns false on weekend (day not in availableDays)", () => {
      expect(isScheduleAvailable(item, 0, "12:00")).toBe(false); // Sunday
      expect(isScheduleAvailable(item, 6, "12:00")).toBe(false); // Saturday
    });
  });

  // ============ SCHEDULED - MIDNIGHT CROSSING ============
  describe("scheduled with midnight-crossing hours", () => {
    const item = {
      availabilityType: "scheduled" as const,
      availableDays: [5, 6], // Friday and Saturday
      availableHours: [
        { day: 5, startTime: "22:00", endTime: "02:00" }, // Fri 22:00 -> Sat 02:00
        { day: 6, startTime: "20:00", endTime: "03:00" }, // Sat 20:00 -> Sun 03:00
      ],
    };

    it("returns true on Friday at 23:00 (after start, before midnight)", () => {
      expect(isScheduleAvailable(item, 5, "23:00")).toBe(true);
    });

    it("returns true on Friday at 22:00 (exact start)", () => {
      expect(isScheduleAvailable(item, 5, "22:00")).toBe(true);
    });

    it("returns false on Friday at 21:59 (before start)", () => {
      expect(isScheduleAvailable(item, 5, "21:59")).toBe(false);
    });

    it("returns true on Saturday at 01:00 (after midnight, from Friday's schedule)", () => {
      // Saturday (day 6) at 01:00 should be available because Friday's schedule crosses midnight
      expect(isScheduleAvailable(item, 6, "01:00")).toBe(true);
    });

    it("returns true on Saturday at 01:59 (still within Friday's midnight-crossing range)", () => {
      expect(isScheduleAvailable(item, 6, "01:59")).toBe(true);
    });

    it("returns false on Saturday at 02:00 (at end of Friday's midnight-crossing range)", () => {
      // endTime "02:00", condition is currentTime < endTime, so 02:00 is NOT < 02:00
      expect(isScheduleAvailable(item, 6, "02:00")).toBe(false);
    });

    it("returns true on Saturday at 20:00 (Saturday's own schedule starts)", () => {
      expect(isScheduleAvailable(item, 6, "20:00")).toBe(true);
    });

    it("returns true on Sunday at 01:00 (from Saturday's midnight-crossing schedule)", () => {
      // Sunday (day 0), Saturday's schedule crosses midnight to 03:00
      expect(isScheduleAvailable(item, 0, "01:00")).toBe(true);
    });

    it("returns true on Sunday at 02:59 (still within Saturday's midnight-crossing range)", () => {
      expect(isScheduleAvailable(item, 0, "02:59")).toBe(true);
    });

    it("returns false on Sunday at 03:00 (at end of Saturday's midnight-crossing range)", () => {
      expect(isScheduleAvailable(item, 0, "03:00")).toBe(false);
    });
  });

  // ============ EDGE CASES ============
  describe("edge cases", () => {
    it("handles day 0 (Sunday) correctly for yesterday check (wraps to Saturday=6)", () => {
      const item = {
        availabilityType: "scheduled" as const,
        availableDays: [6], // Saturday only
        availableHours: [
          { day: 6, startTime: "23:00", endTime: "01:00" }, // Sat 23:00 -> Sun 01:00
        ],
      };
      // Sunday at 00:30 should be available (from Saturday's midnight-crossing)
      expect(isScheduleAvailable(item, 0, "00:30")).toBe(true);
      // Sunday at 01:00 should NOT be available (endTime is exclusive)
      expect(isScheduleAvailable(item, 0, "01:00")).toBe(false);
    });

    it("handles multiple time ranges on the same day", () => {
      const item = {
        availabilityType: "scheduled" as const,
        availableDays: [1], // Monday
        availableHours: [
          { day: 1, startTime: "08:00", endTime: "12:00" }, // Morning
          { day: 1, startTime: "14:00", endTime: "18:00" }, // Afternoon
        ],
      };
      expect(isScheduleAvailable(item, 1, "10:00")).toBe(true);  // Morning
      expect(isScheduleAvailable(item, 1, "13:00")).toBe(false); // Lunch gap
      expect(isScheduleAvailable(item, 1, "16:00")).toBe(true);  // Afternoon
      expect(isScheduleAvailable(item, 1, "19:00")).toBe(false); // After hours
    });

    it("handles day in availableDays but no hours configured for that day", () => {
      const item = {
        availabilityType: "scheduled" as const,
        availableDays: [1, 2],
        availableHours: [
          { day: 1, startTime: "08:00", endTime: "18:00" }, // Only Monday has hours
        ],
      };
      // Tuesday is in availableDays but has no hours configured
      // Since availableHours array is not empty, it should check hours
      // No hours for Tuesday -> should return false
      expect(isScheduleAvailable(item, 2, "12:00")).toBe(false);
    });

    it("returns true for unknown availabilityType (fallback)", () => {
      expect(
        isScheduleAvailable(
          { availabilityType: "unknown_type", availableDays: null, availableHours: null },
          1,
          "12:00"
        )
      ).toBe(true);
    });
  });
});
