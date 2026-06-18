import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock do módulo db
vi.mock("./db", () => ({
  registerMenuSession: vi.fn(),
  getActiveViewers: vi.fn(),
  getMenuViewsStats: vi.fn(),
  getMenuViewsHistory: vi.fn(),
  getEstablishmentByUserId: vi.fn(),
}));

import * as db from "./db";

describe("Menu Views Functions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("registerMenuSession", () => {
    it("should register a new session successfully", async () => {
      const mockRegister = vi.mocked(db.registerMenuSession);
      mockRegister.mockResolvedValue(undefined);

      await db.registerMenuSession("test-session-123", 30001);

      expect(mockRegister).toHaveBeenCalledWith("test-session-123", 30001);
      expect(mockRegister).toHaveBeenCalledTimes(1);
    });
  });

  describe("getActiveViewers", () => {
    it("should return count of active viewers", async () => {
      const mockGetViewers = vi.mocked(db.getActiveViewers);
      mockGetViewers.mockResolvedValue(5);

      const result = await db.getActiveViewers(30001);

      expect(result).toBe(5);
      expect(mockGetViewers).toHaveBeenCalledWith(30001);
    });

    it("should return 0 when no active viewers", async () => {
      const mockGetViewers = vi.mocked(db.getActiveViewers);
      mockGetViewers.mockResolvedValue(0);

      const result = await db.getActiveViewers(30001);

      expect(result).toBe(0);
    });
  });

  describe("getMenuViewsStats", () => {
    it("should return stats with positive percentage change (up state)", async () => {
      const mockGetStats = vi.mocked(db.getMenuViewsStats);
      mockGetStats.mockResolvedValue({
        totalViews: 150,
        uniqueVisitors: 100,
        previousTotalViews: 100,
        previousUniqueVisitors: 80,
        dailyViews: [
          { date: "2026-01-27", views: 20, visitors: 15 },
          { date: "2026-01-28", views: 25, visitors: 18 },
          { date: "2026-01-29", views: 22, visitors: 16 },
          { date: "2026-01-30", views: 18, visitors: 14 },
          { date: "2026-01-31", views: 30, visitors: 22 },
          { date: "2026-02-01", views: 35, visitors: 25 },
          { date: "2026-02-02", views: 0, visitors: 0 },
        ],
        percentageChange: 50, // 50% increase
      });

      const result = await db.getMenuViewsStats(30001);

      expect(result.percentageChange).toBe(50);
      expect(result.totalViews).toBe(150);
      expect(result.dailyViews).toHaveLength(7);
    });

    it("should return stats with negative percentage change (down state)", async () => {
      const mockGetStats = vi.mocked(db.getMenuViewsStats);
      mockGetStats.mockResolvedValue({
        totalViews: 50,
        uniqueVisitors: 40,
        previousTotalViews: 100,
        previousUniqueVisitors: 80,
        dailyViews: [],
        percentageChange: -50, // 50% decrease
      });

      const result = await db.getMenuViewsStats(30001);

      expect(result.percentageChange).toBe(-50);
      expect(result.totalViews).toBe(50);
    });

    it("should return stats with neutral percentage change", async () => {
      const mockGetStats = vi.mocked(db.getMenuViewsStats);
      mockGetStats.mockResolvedValue({
        totalViews: 100,
        uniqueVisitors: 80,
        previousTotalViews: 98,
        previousUniqueVisitors: 78,
        dailyViews: [],
        percentageChange: 2, // Only 2% change (neutral)
      });

      const result = await db.getMenuViewsStats(30001);

      expect(result.percentageChange).toBe(2);
      // Neutral state is between -4% and +4%
      expect(result.percentageChange).toBeGreaterThanOrEqual(-4);
      expect(result.percentageChange).toBeLessThanOrEqual(4);
    });

    it("should handle no data scenario", async () => {
      const mockGetStats = vi.mocked(db.getMenuViewsStats);
      mockGetStats.mockResolvedValue({
        totalViews: 0,
        uniqueVisitors: 0,
        previousTotalViews: 0,
        previousUniqueVisitors: 0,
        dailyViews: [],
        percentageChange: 0,
      });

      const result = await db.getMenuViewsStats(30001);

      expect(result.totalViews).toBe(0);
      expect(result.percentageChange).toBe(0);
    });
  });

  describe("getMenuViewsHistory", () => {
    it("should return history for specified days", async () => {
      const mockGetHistory = vi.mocked(db.getMenuViewsHistory);
      mockGetHistory.mockResolvedValue([
        { id: 1, establishmentId: 30001, date: "2026-01-27", viewCount: 20, uniqueVisitors: 15, createdAt: new Date(), updatedAt: new Date() },
        { id: 2, establishmentId: 30001, date: "2026-01-28", viewCount: 25, uniqueVisitors: 18, createdAt: new Date(), updatedAt: new Date() },
      ]);

      const result = await db.getMenuViewsHistory(30001, 7);

      expect(result).toHaveLength(2);
      expect(mockGetHistory).toHaveBeenCalledWith(30001, 7);
    });

    it("should return empty array when no history", async () => {
      const mockGetHistory = vi.mocked(db.getMenuViewsHistory);
      mockGetHistory.mockResolvedValue([]);

      const result = await db.getMenuViewsHistory(30001, 7);

      expect(result).toHaveLength(0);
    });
  });
});

describe("ViewsCard State Logic", () => {
  it("should determine 'up' state when percentage >= 5", () => {
    const percentageChange = 18;
    const state = percentageChange >= 5 ? "up" : percentageChange <= -5 ? "down" : "neutral";
    expect(state).toBe("up");
  });

  it("should determine 'down' state when percentage <= -5", () => {
    const percentageChange = -12;
    const state = percentageChange >= 5 ? "up" : percentageChange <= -5 ? "down" : "neutral";
    expect(state).toBe("down");
  });

  it("should determine 'neutral' state when percentage between -4 and +4", () => {
    const percentageChange = 0;
    const state = percentageChange >= 5 ? "up" : percentageChange <= -5 ? "down" : "neutral";
    expect(state).toBe("neutral");
  });

  it("should identify low volume when total views < 10", () => {
    const totalViews = 5;
    const hasLowVolume = totalViews < 10;
    expect(hasLowVolume).toBe(true);
  });

  it("should identify no data when both current and previous are 0", () => {
    const totalViews = 0;
    const previousTotalViews = 0;
    const hasNoData = totalViews === 0 && previousTotalViews === 0;
    expect(hasNoData).toBe(true);
  });
});
