import { describe, it, expect } from "vitest";

/**
 * Test the timezone-aware "today start" calculation logic
 * that is used in the frontend to filter completed orders.
 * 
 * This test validates the pure logic extracted from the Pedidos page.
 */

function getTodayStartInTimezone(tz: string, referenceDate?: Date): Date {
  const now = referenceDate || new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = formatter.format(now);
  const [year, month, day] = todayStr.split('-').map(Number);
  
  const utcFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZoneName: 'shortOffset',
  });
  const parts = utcFormatter.formatToParts(now);
  const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || '';
  const offsetMatch = tzOffset.match(/GMT([+-]?)(\d{1,2})(?::(\d{2}))?/);
  let offsetMinutes = 0;
  if (offsetMatch) {
    const sign = offsetMatch[1] === '-' ? -1 : 1;
    const hours = parseInt(offsetMatch[2] || '0');
    const mins = parseInt(offsetMatch[3] || '0');
    offsetMinutes = sign * (hours * 60 + mins);
  }
  const todayStart = new Date(Date.UTC(year, month - 1, day, 0, 0, 0) - offsetMinutes * 60 * 1000);
  return todayStart;
}

function isOrderFromToday(
  orderTimestamp: number | string | Date,
  timezone: string,
  referenceDate?: Date
): boolean {
  const todayStart = getTodayStartInTimezone(timezone, referenceDate);
  const orderDate = new Date(orderTimestamp);
  return orderDate >= todayStart;
}

describe("Orders today filter - timezone aware", () => {
  describe("getTodayStartInTimezone", () => {
    it("should return a Date object", () => {
      const result = getTodayStartInTimezone("America/Sao_Paulo");
      expect(result).toBeInstanceOf(Date);
    });

    it("should return midnight in the restaurant timezone (America/Sao_Paulo = UTC-3)", () => {
      // Reference: 2026-02-10 at 10:00 UTC = 07:00 in São Paulo
      const ref = new Date("2026-02-10T10:00:00Z");
      const todayStart = getTodayStartInTimezone("America/Sao_Paulo", ref);
      // Midnight in São Paulo (UTC-3) = 03:00 UTC
      expect(todayStart.toISOString()).toBe("2026-02-10T03:00:00.000Z");
    });

    it("should handle America/New_York timezone (UTC-5)", () => {
      // Reference: 2026-02-10 at 10:00 UTC = 05:00 in New York (EST)
      const ref = new Date("2026-02-10T10:00:00Z");
      const todayStart = getTodayStartInTimezone("America/New_York", ref);
      // Midnight in New York (UTC-5) = 05:00 UTC
      expect(todayStart.toISOString()).toBe("2026-02-10T05:00:00.000Z");
    });

    it("should handle UTC timezone", () => {
      const ref = new Date("2026-02-10T10:00:00Z");
      const todayStart = getTodayStartInTimezone("UTC", ref);
      expect(todayStart.toISOString()).toBe("2026-02-10T00:00:00.000Z");
    });

    it("should handle date boundary - just after midnight in restaurant timezone", () => {
      // 2026-02-10 at 03:30 UTC = 00:30 in São Paulo (new day started)
      const ref = new Date("2026-02-10T03:30:00Z");
      const todayStart = getTodayStartInTimezone("America/Sao_Paulo", ref);
      // Should be midnight Feb 10 in São Paulo = 03:00 UTC Feb 10
      expect(todayStart.toISOString()).toBe("2026-02-10T03:00:00.000Z");
    });

    it("should handle date boundary - just before midnight in restaurant timezone", () => {
      // 2026-02-10 at 02:30 UTC = 23:30 Feb 9 in São Paulo (still previous day)
      const ref = new Date("2026-02-10T02:30:00Z");
      const todayStart = getTodayStartInTimezone("America/Sao_Paulo", ref);
      // Should be midnight Feb 9 in São Paulo = 03:00 UTC Feb 9
      expect(todayStart.toISOString()).toBe("2026-02-09T03:00:00.000Z");
    });
  });

  describe("isOrderFromToday", () => {
    it("should return true for an order created today", () => {
      // Reference: 2026-02-10 at 15:00 UTC = 12:00 in São Paulo
      const ref = new Date("2026-02-10T15:00:00Z");
      // Order created at 10:00 UTC = 07:00 São Paulo (same day)
      const orderDate = new Date("2026-02-10T10:00:00Z");
      expect(isOrderFromToday(orderDate, "America/Sao_Paulo", ref)).toBe(true);
    });

    it("should return false for an order from yesterday", () => {
      // Reference: 2026-02-10 at 15:00 UTC = 12:00 in São Paulo
      const ref = new Date("2026-02-10T15:00:00Z");
      // Order created at 2026-02-09 at 10:00 UTC = 07:00 São Paulo (yesterday)
      const orderDate = new Date("2026-02-09T10:00:00Z");
      expect(isOrderFromToday(orderDate, "America/Sao_Paulo", ref)).toBe(false);
    });

    it("should return true for an order created exactly at midnight restaurant time", () => {
      // Reference: 2026-02-10 at 15:00 UTC
      const ref = new Date("2026-02-10T15:00:00Z");
      // Order at exactly midnight São Paulo = 03:00 UTC
      const orderDate = new Date("2026-02-10T03:00:00Z");
      expect(isOrderFromToday(orderDate, "America/Sao_Paulo", ref)).toBe(true);
    });

    it("should return false for an order created 1 second before midnight restaurant time", () => {
      // Reference: 2026-02-10 at 15:00 UTC
      const ref = new Date("2026-02-10T15:00:00Z");
      // Order at 23:59:59 Feb 9 São Paulo = 02:59:59 UTC Feb 10
      const orderDate = new Date("2026-02-10T02:59:59Z");
      expect(isOrderFromToday(orderDate, "America/Sao_Paulo", ref)).toBe(false);
    });

    it("should handle timestamp as number (Unix ms)", () => {
      const ref = new Date("2026-02-10T15:00:00Z");
      const orderTimestamp = new Date("2026-02-10T10:00:00Z").getTime();
      expect(isOrderFromToday(orderTimestamp, "America/Sao_Paulo", ref)).toBe(true);
    });

    it("should handle timestamp as ISO string", () => {
      const ref = new Date("2026-02-10T15:00:00Z");
      expect(isOrderFromToday("2026-02-10T10:00:00Z", "America/Sao_Paulo", ref)).toBe(true);
    });
  });
});
